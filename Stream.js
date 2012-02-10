if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* class node-stream.Stream < stream.Stream
*
* A Promised-IO stream for wrapping a Node.js stream.
**/
define([
  "promised-io/stream/Stream",
  "./Producer",
  "stream",
  "promised-io/stream/ExhaustiveDecorator"
], function(BaseStream, Producer, NativeStream, Exhaustive){
  "use strict";

  return BaseStream.extend(function(source){
    if(source instanceof NativeStream){
      this._producer = new Producer(source);
    }else if(source instanceof Producer){
      this._producer = source;
    }else{
      throw new TypeError("Expected source to be a native Node stream or a node-stream Producer");
    }
  }, {
    /**
    * node-stream.Stream#setEncoding(encoding)
    * - encoding (String): `utf8`, `ascii` or `base64`
    *
    * Change the encoding of the produced values.
    **/
    setEncoding: function(encoding){
      return this._producer.setEncoding(encoding);
    },

    /**
    * node-stream.Stream#pipe(stream) -> promise.Promise
    * - stream (Stream): Node.js stream
    *
    * Pipe from the underlying Node.js stream to the output stream.
    * Returns a promise for when piping has finished.
    **/
    pipe: Exhaustive(function(stream, options){
      return this._producer.pipe(stream, options);
    })
  });
});
