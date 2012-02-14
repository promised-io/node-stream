if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* class node-stream.Producer < stream.Producer
*
* A producer for Node.js streams.
**/
define([
  "compose",
  "promised-io/stream",
  "./main",
  "promised-io/stream/ExhaustiveDecorator",
  "promised-io/stream/Producer",
  "promised-io/promise/defer",
  "promised-io/promise/when",
  "promised-io/promise/isPromise",
  "promised-io/lib/adapters!lang",
  "promised-io/lib/adapters!timers"
], function(Compose, baseErrors, errors, Exhaustive, Producer, defer, when, isPromise, lang, timers){
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

    source.pause();
  }, {
    _index: 0,
    _paused: false,
    _stopped: false,

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

    consume: Exhaustive(function(callback){
      if(!this._source.readable){
        return defer().rejectLater(new errors.UnreadableStream);
      }

      this._callback = callback;
      this._deferred = defer(lang.bind(this._stop, this));

      this._source.on("data", this._dataListener = lang.bind(this._notify, this));
      this._source.on("error", this._errorListener = lang.bind(this._stop, this));
      this._source.on("end", this._endListener = lang.bind(this._stop, this, null, true));
      this._source.resume();

      return this._deferred.promise;
    }),

    /**
    * node-stream.Producer#pipe(stream) -> promise.Promise
    * - stream (Stream): Node.js stream
    *
    * Pipe from the underlying Node.js stream to the output stream.
    * Returns a promise for when piping has finished.
    **/
    pipe: Exhaustive(function(stream){
      if(!stream.writable){
        return defer().rejectLater(new errors.UnwritableStream);
      }

      var deferred = defer();
      stream.on("end", deferred.resolve);
      stream.on("close", deferred.resolve);
      stream.on("error", deferred.reject);

      deferred.promise.both(lang.bind(function(){
        stream.removeListener("end", deferred.resolve);
        stream.removeListener("close", deferred.resolve);
        stream.removeListener("error", deferred.reject);
        this._source = deferred = stream = null;
      }, this));

      this._source.pipe(stream);
      this._source.resume();

      return deferred.promise;
    }),

    _notify: function(item){
      if(this._paused){
        this._buffer.push(item);
        return;
      }

      try{
        var backpressure = this._callback.call(lang.undefinedThis, item, this._index++);
        if(isPromise(backpressure)){
          this._pause(backpressure);
        }
      }catch(error){
        if(error instanceof baseErrors.StopConsumption){
          this._stop(null, false);
        }else{
          this._stop(error);
        }
      }
    },

    _stop: function(error, ok){
      this._stopped = true;

      this._source.removeListener("data", this._dataListener);
      this._source.removeListener("error", this._errorListener);
      this._source.removeListener("end", this._endListener);

      if(ok !== true){
        this._source.destroy();
      }
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

    _pause: function(backpressure){
      this._paused = true;
      this._source.pause();
      when(backpressure).change(true).inflect(this._handleRelief);
    },

    _handleRelief: function(error, ok){
      if(!this._deferred){
        return;
      }

      if(ok){
        timers.immediate(this._resume);
      }else if(error instanceof baseErrors.StopConsumption){
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
      this._buffer.splice(0, index);

      if(!this._paused){
        if(this._stopped){
          this._finish(null, true);
        }else{
          this._source.resume();
        }
      }
    }
  });
});
