if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "promised-io/test/test-case",
  "promised-io/test/test-case/assert",
  "promised-io/test/test-case/refute",
  "fs",
  "path",
  "../../main",
  "promised-io/promise/delay",
  "promised-io/stream"
], function(testCase, assert, refute, fs, path, errors, delay, baseErrors){
  return function(name, usesNativeStream, init){
    return testCase(name, {
      before: function(){
        this.expected = fs.readFileSync(__filename, "utf8");
      },

      beforeEach: function(){
        this._stream = fs.createReadStream(__filename, { bufferSize: 512 });
        this.instance = init(this._stream);
      },

      "consume": {
        "as expected": function(){
          var lastIndex = -1;
          var received = [];
          var expected = this.expected;

          var promise = this.instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            received.push(value);
            lastIndex++;
          }).then(assert);

          refute(promise.isFulfilled());
          return promise.then(function(){
            assert(lastIndex > 2, "The stream should at least have generated 3 items, got " + lastIndex);
            received = received.join("");
            assert.same(expected.indexOf(received), 0);
            assert.same(received.length, expected.length);
            assert.same(received, expected);
          });
        },

        "backpressure is respected": function(){
          var lastIndex = -1;
          var received = [];
          var expected = this.expected;

          var backpressure = false;
          return this.instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            received.push(value);
            lastIndex++;

            refute(backpressure);
            backpressure = true;
            return delay().then(function(){
              backpressure = false;
            });
          }).then(assert).then(function(){
            assert(lastIndex > 2, "The stream should at least have generated 3 items, got " + lastIndex);
            received = received.join("");
            assert.same(expected.indexOf(received), 0);
            assert.same(received.length, expected.length);
            assert.same(received, expected);
          });
        },

        "and stop": function(){
          var lastIndex = -1;
          var received = [];
          var expected = this.expected;

          var stopped = false;
          return this.instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            received.push(value);
            lastIndex++;

            refute(stopped);
            if(index === 1){
              stopped = true;
              throw new baseErrors.StopConsumption;
            }
          }).then(refute).then(function(){
            assert.same(lastIndex, 1);
            assert.same(expected.indexOf(received.join("")), 0);
          });
        },

        "and fail if callback throws error": function(){
          var lastIndex = -1;
          var received = [];
          var expected = this.expected;

          var failed = false;
          var error = new Error;
          return this.instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            received.push(value);
            lastIndex++;

            refute(failed);
            if(index === 1){
              failed = true;
              throw error;
            }
          }).fail(function(result){
            assert.same(result, error);
            assert.same(lastIndex, 1);
            assert.same(expected.indexOf(received.join("")), 0);
          });
        },

        "and stop if canceled": function(){
          var lastIndex = -1;
          var received = [];
          var expected = this.expected;

          var canceled = false;
          var promise = this.instance.consume(function(value, index){
            assert.same(index - lastIndex, 1);
            received.push(value);
            lastIndex++;

            refute(canceled);
            if(index === 1){
              canceled = true;
              promise.cancel();
            }
          });
          return promise.fail(function(){
            assert(canceled);
            assert.same(lastIndex, 1);
            assert.same(expected.indexOf(received.join("")), 0);
          });
        },

        "unreadable streams": !usesNativeStream ? testCase.Skip : function(done){
          var instance = this.instance;

          this._stream.resume();
          this._stream.on("end", function(){
            process.nextTick(function(){
              var promise = instance.consume(function(){});
              refute(promise.isFulfilled());
              promise.fail(function(error){
                assert(error instanceof errors.UnreadableStream);
                done();
              });
            });
          });
        }
      },

      "pipe": {
        beforeEach: function(){
          this._tmpFile = path.join("/tmp", path.basename(__filename) + Date.now());
          this.writeStream = fs.createWriteStream(this._tmpFile);
        },

        afterEach: function(){
          try{
            fs.unlinkSync(this._tmpFile);
          }catch(e){}
        },

        // non-native streams may be repeatable, so skip this test
        "is exhausting": !usesNativeStream ? testCase.Skip : function(){
          var instance = this.instance;

          instance.pipe(this.writeStream);
          assert.exception(function(){
            instance.consume(function(){});
          }, baseErrors.ExhaustionError);

          this.writeStream.destroy();
        },

        "pipes correctly": function(){
          var tmpFile = this._tmpFile;
          var expected = this.expected;

          return this.instance.pipe(this.writeStream).then(function(){
            var written = fs.readFileSync(tmpFile, "utf8");
            assert.same(expected.indexOf(written), 0);
            assert.same(written.length, expected.length);
            assert.same(written, expected);
          });
        },

        "fails if write stream is not writable": function(){
          this.writeStream.destroy();
          return this.instance.pipe(this.writeStream).fail(function(error){
            assert(error instanceof errors.UnwritableStream);
          });
        }
      },

      "setEncoding": {
        "before consumption": function(){
          var expected = this.expected;
          var received = "";

          var didSet = this.instance.setEncoding("utf8");
          if(!didSet){
            if(!usesNativeStream){
              assert(true);
              return null;
            }else{
              assert.fail("Expected setEncoding to return `true`");
            }
          }

          return this.instance.consume(function(value){
            assert.same(typeof value, "string");
            received += value;
          }).then(assert).then(function(){
            assert.same(expected.indexOf(received), 0);
            assert.same(received.length, expected.length);
            assert.same(received, expected);
          });
        },

        "during consumption": function(){
          var instance = this.instance;
          var expected = this.expected;
          var received = [];

          var isString = false;
          return this.instance.consume(function(value, index){
            if(isString){
              assert.same(typeof value, "string");
            }else{
              assert(value instanceof Buffer);
            }
            if(index === 2){
              isString = instance.setEncoding("utf8");
            }
            received.push(value);
          }).then(assert).then(function(){
            received = received.join("");
            assert.same(expected.indexOf(received), 0);
            assert.same(received.length, expected.length);
            assert.same(received, expected);
          });
        }
      }
    });
  };
});
