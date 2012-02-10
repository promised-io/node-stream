if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "promised-io/test/stream-utils/makeStreamTest",
  "./utils/FakeStream",
  "../Stream",
  "../Producer"
], function(makeTest, FakeStream, Stream, Producer){
  return makeTest("node-stream/Stream with Producer", Stream, false, function(values, source){
    return {
      usesSource: true,
      instance: new Stream(new Producer(new FakeStream(source)))
    };
  });
});
