if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./utils/makeNativeTest",
  "../Producer"
], function(makeNativeTest, Producer){
  return makeNativeTest("node-stream/Producer with native stream", function(readStream){
    return new Producer(readStream);
  });
});
