if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* class node-stream.Producer < stream.Producer
*
* A producer for Node.js streams.
**/
define([
  "compose",
  "./_errors",
  "promised-io/stream/ExhaustiveDecorator",
  "promised-io/stream/Producer",
  "promised-io/promise/defer",
  "promised-io/promise/when",
  "promised-io/promise/isPromise",
  "promised-io/lib/adapters!lang",
  "promised-io/lib/adapters!timers"
], function(Compose, errors, Exhaustive, Producer, defer, when, isPromise, lang, timers){
  "use strict";

  /**
  * new node-stream.Producer(source)
  * - source (Stream): The Node.js source stream
  *
  * Construct a producer for a Node.js stream.
  **/
  return Producer.extend(function(source){
    this._source = source;
    this._buffer = [];
    this._handleRelief = lang.bind(this._handleRelief, this);
    this._resume = lang.bind(this._resume, this);
    this._resumePipe = lang.bind(this._resumePipe, this);

    this._pause();
    source.on("data", this._bufferDataListener = lang.bind(this._bufferPush, this));
    source.on("error", this._bufferErrorListener = lang.bind(this._handleSourceError, this));
    source.on("end", this._bufferEndListener = lang.bind(this._bufferFinished, this));
  }, {
    _index: 0,
    _paused: false,
    _stopped: false,
    _fullyBuffered: false,

    _source: null,
    _target: null,
    _buffer: null,

    isRepeatable: false,

    /**
    * node-stream.Producer#setEncoding(encoding)
    * - encoding (String): `utf8`, `ascii` or `base64`
    *
    * Change the encoding of the produced values.
    **/
    setEncoding: function(encoding){
      if(this._source){
        this._source.setEncoding(encoding);
        return true;
      }
      return false;
    },

    consume: new Exhaustive(function(callback){
      var error = this._error;
      if(!this._fullyBuffered && !this._source.readable){
        error = new errors.UnreadableStream();
      }

      if(error){
        this._removeBufferListeners();
        return defer().rejectLater(error);
      }

      this._callback = callback;
      this._deferred = defer(lang.bind(this._stop, this));

      if(!this._fullyBuffered){
        this._source.on("data", this._dataListener = lang.bind(this._notify, this));
        this._source.on("error", this._errorListener = lang.bind(this._stop, this));
        this._source.on("end", this._endListener = lang.bind(this._stop, this, null, true));
        this._removeBufferListeners();
      }

      timers.immediate(this._resume);
      return this._deferred.promise;
    }),

    /**
    * node-stream.Producer#pipe(stream) -> promise.Promise
    * - stream (Stream): Node.js stream
    *
    * Pipe from the underlying Node.js stream to the output stream.
    * Returns a promise for when piping has finished.
    **/
    pipe: new Exhaustive(function(stream){
      var error = this._error;
      if(!this._fullyBuffered && !this._source.readable){
        error = new errors.UnreadableStream();
      }else if(!stream.writable){
        error = new errors.UnwritableStream();
      }

      if(error){
        return defer().rejectLater(error);
      }

      this._target = stream;

      var deferred = defer();
      stream.on("end", deferred.resolve);
      stream.on("close", deferred.resolve);
      stream.on("error", deferred.reject);
      this._source.on("error", deferred.reject);

      deferred.promise.both(lang.bind(function(){
        stream.removeListener("end", deferred.resolve);
        stream.removeListener("close", deferred.resolve);
        stream.removeListener("error", deferred.reject);
        this._source.removeListener("error", deferred.reject);
        this._source = this._deferred = deferred = this._target = stream = null;
      }, this));

      timers.immediate(this._resumePipe);

      return deferred.promise;
    }),

    destroy: function(){
      if(this._source){
        this._source.destroy();
      }
    },

    _bufferPush: function(item){
      this._buffer.push(item);
    },

    _bufferFinished: function(){
      this._fullyBuffered = true;
      this._source = null;
    },

    _removeBufferListeners: function(){
      if(this._bufferDataListener){
        this._source.removeListener("data", this._bufferDataListener);
      }
      if(this._bufferErrorListener){
        this._source.removeListener("error", this._bufferErrorListener);
      }
      if(this._bufferEndListener){
        this._source.removeListener("end", this._bufferEndListener);
      }
    },

    _removeConsumptionListeners: function(){
      if(this._dataListener){
        this._source.removeListener("data", this._dataListener);
      }
      if(this._errorListener){
        this._source.removeListener("error", this._errorListener);
      }
      if(this._endListener){
        this._source.removeListener("end", this._endListener);
      }
    },

    _notify: function(item){
      if(this._paused){
        this._bufferPush(item);
        return;
      }

      try{
        var backpressure = this._callback.call(lang.undefinedThis, item, this._index++);
        if(isPromise(backpressure)){
          this._pause(backpressure);
        }
      }catch(error){
        if(error instanceof errors.StopConsumption){
          this._stop(null, false);
        }else{
          this._stop(error);
        }
      }
    },

    _stop: function(error, ok){
      if(this._paused && ok === true){
        this._bufferFinished();
        return;
      }

      this._stopped = true;

      this._removeConsumptionListeners();
      this._source = null;

      if(!this._buffer.length){
        this._finish(error, ok);
      }
    },

    _finish: function(error, ok){
      if(ok === true || ok === false){
        this._deferred.resolve(ok);
      }else{
        this._deferred.reject(error);
      }
      this._source = this._buffer = this._callback = this._deferred = null;
      this._endListener = this._errorListener = this._dataListener = null;
    },

    _handleSourceError: function(error){
      this._error = error;
    },

    _pause: function(backpressure){
      this._paused = true;
      this._source.pause();
      if(backpressure){
        when(backpressure).change(true).inflect(this._handleRelief);
      }
    },

    _handleRelief: function(error, ok){
      if(!this._deferred){
        return;
      }

      if(ok){
        timers.immediate(this._resume);
      }else if(error instanceof errors.StopConsumption){
        this._stop(null, false);
      }else{
        this._stop(error);
      }
    },

    _resume: function(){
      this._paused = false;

      var index = 0;
      while(!this._paused && !this._stopped && this._buffer && index < this._buffer.length){
        this._notify(this._buffer[index++]);
      }
      if(this._buffer){
        this._buffer.splice(0, index);
      }

      if(!this._paused){
        if(this._stopped || this._fullyBuffered){
          if(this._deferred){
            this._finish(null, true);
          }
        }else{
          this._source.resume();
        }
      }
    },

    _resumePipe: function(){
      if(!this._target){
        return;
      }

      for(var index = 0; this._target && index < this._buffer.length; index++){
        if(!this._target.write(this._buffer[index])){
          this._target.once("drain", this._resumePipe);
          this._buffer.splice(0, index + 1);
          return;
        }
      }

      if(this._target){
        if(this._fullyBuffered){
          this._target.end();
        }else{
          this._source.pipe(this._target);
          this._source.resume();
        }
      }

      this._removeBufferListeners();
    }
  });
});
