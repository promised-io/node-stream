if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* node-stream
*
* Provides an extended [[stream.Stream]] which works with Node.js streams.
**/
define([
  "./_errors",
  "./Stream",
  "./Producer"
], function(errors, Stream, Producer){
  "use strict";

  return {
    UnreadableStream: errors.UnreadableStream,
    UnwritableStream: errors.UnwritableStream,
    ExhaustionError: errors.ExhaustionError,
    StopConsumption: errors.StopConsumption,
    Stream: Stream,
    Producer: Producer
  };
});
