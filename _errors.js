if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "exports",
  "promised-io/lib/errorFactory",
  "promised-io/stream/_errors"
], function(exports, errorFactory, baseErrors){
  "use strict";

  /**
  * class node-stream.ExhaustionError
  *
  * See [[stream.ExhaustionError]]
  **/
  exports.ExhaustionError = baseErrors.ExhaustionError;

  /**
  * class node-stream.StopConsumption
  *
  * See [[stream.StopConsumption]]
  **/
  exports.StopConsumption = baseErrors.StopConsumption;

  /**
  * class node-stream.UnreadableStream
  *
  * Error value if consumption is started on an unreadable stream.
  **/
  exports.UnreadableStream = errorFactory("UnreadableStream", "The underlying Node stream is not readable.");

  /**
  * class node-stream.UnwritableStream
  *
  * Error value if we're trying to pipe to an unwritable stream.
  **/
  exports.UnwritableStream = errorFactory("UnwritableStream", "The underlying Node stream is not writable.");
});
