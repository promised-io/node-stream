if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "./utils/makeTest",
  "promised-io/test/test-case/assert",
  "../Stream",
  "fs"
], function(makeTest, assert, Stream, fs){
  return makeTest("node-stream/Stream with array", false, function(readStream){
    var buffer = fs.readFileSync(readStream.path);
    var array = [];
    for(var offset = 0; offset < buffer.length; offset += readStream.bufferSize){
      array.push(buffer.slice(offset, Math.min(buffer.length, offset + readStream.bufferSize)));
    }
    return new Stream(array);
  });
});
