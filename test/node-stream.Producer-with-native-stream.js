if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./utils/makeTest",
  "../Producer"
], function(makeTest, Producer){
  return makeTest("node-stream/Producer with native stream", true, function(readStream){
    return new Producer(readStream);
  });
});
