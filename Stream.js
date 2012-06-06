if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* class node-stream.Stream < stream.Stream
*
* A Promised-IO stream for wrapping a Node.js stream.
**/
define([
  "promised-io/stream/Stream",
  "./_errors",
  "./Producer",
  "stream",
  "promised-io/promise/defer",
  "promised-io/stream/ExhaustiveDecorator",
  "promised-io/lib/adapters!lang"
], function(BaseStream, errors, Producer, NativeStream, defer, Exhaustive, lang){
  "use strict";

  return BaseStream.extend(function(source){
    if(source instanceof NativeStream){
      this._producer = new Producer(source);
    }
  }, {
    /**
    * node-stream.Stream#setEncoding(encoding) -> Boolean
    * - encoding (String): `utf8`, `ascii` or `base64`
    *
    * Change the encoding of the produced values, provided the producer
    * supports changing the encoding. Will return `true` if the encoding
    * could be changed, `false` otherwise.
    **/
    setEncoding: function(encoding){
      if(typeof this._producer.setEncoding === "function"){
        this._producer.setEncoding(encoding);
        return true;
      }
      return false;
    },

    /**
    * node-stream.Stream#pipe(stream) -> promise.Promise
    * - stream (Stream): Node.js stream
    *
    * Pipe to the output stream according to Node.js semantics.
    * Returns a promise for when piping has finished.
    * Throws [[node-stream.UnwritableStream]] if the stream could not be
    * written to.
    **/
    pipe: new Exhaustive(function(stream){
      if(typeof this._producer.pipe === "function"){
        return this._producer.pipe(stream);
      }

      return this.consume(function(value){
        if(!stream.writable){
          throw new errors.UnwritableStream();
        }

        var flushed = stream.write(value);
        if(!flushed){
          var deferred = defer();
          stream.once("drain", deferred.resolve);
          return deferred.promise;
        }
      }).then(function(){
        stream.end();
      });
    })
  });
});
