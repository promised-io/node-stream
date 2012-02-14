if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

/**
* node-stream
*
* Provides an extended [[stream.Stream]] which works with Node.js streams.
**/
define([
  "exports",
  "promised-io/lib/errorFactory"
], function(exports, errorFactory){
  "use strict";

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
