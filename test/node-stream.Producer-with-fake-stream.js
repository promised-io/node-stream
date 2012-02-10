if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "promised-io/test/stream-utils/makeProducerTest",
  "./utils/FakeStream",
  "../Producer"
], function(makeTest, FakeStream, Producer){
  return makeTest("node-stream/Producer with fake stream", Producer, function(values, source){
    return {
      usesSource: true,
      instance: new Producer(new FakeStream(source))
    };
  });
});
