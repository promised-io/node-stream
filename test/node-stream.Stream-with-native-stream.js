if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./utils/makeTest",
  "promised-io/test/test-case/assert",
  "../Stream"
], function(makeTest, assert, Stream){
  return makeTest("node-stream/Stream with native stream", true, function(readStream){
    return new Stream(readStream);
  });
});
