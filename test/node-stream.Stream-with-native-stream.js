if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./utils/makeNativeTest",
  "promised-io/test/test-case/assert",
  "../Stream",
  "../Producer"
], function(makeNativeTest, assert, Stream, Producer){
  var testCase = makeNativeTest("node-stream/Stream with native stream", function(readStream){
    return new Stream(readStream);
  });

  testCase["node-stream/Stream with native stream"]["new"] = {
    "fails without Producer or native stream": function(){
      assert.exception(function(){
        new Stream({});
      }, TypeError);
    }
  };

  return testCase;
});
