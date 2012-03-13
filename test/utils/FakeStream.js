if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define([
  "compose",
  "events",
  "promised-io/promise/defer"
], function(Compose, events, defer){
  return Compose(events.EventEmitter, function(source){
    this._source = source;
  }, {
    _index: 0,
    _destroyed: false,
    _paused: false,
    _pauseNext: false,

    readable: true,

    on: Compose.after(function(type){
      if(type === "data" && !this._destroyed && !this._consumption){
        this._consumption = this._source.consume(this._produce.bind(this));
        this._consumption.change(true).inflect(function(error, ok){
          this.readable = false;
          if(ok){
            this.emit("end");
          }else{
            this.emit("error", error);
          }
        }.bind(this));
      }
    }),

    pause: function(){
      this._pauseNext = true;
    },

    resume: function(){
      this._paused = this._pauseNext = false;
      if(this._bufferedItem){
        var stayPaused = this._produce(this._bufferedItem);
        this._bufferedItem = null;
      }
      if(this._backpressure && !stayPaused){
        this._backpressure.resolve();
        this._backpressure = null;
      }
    },

    destroy: function(){
      this._destroyed = true;
      this._consumption && this._consumption.cancel();
    },

    _produce: function(item){
      if(this._destroyed){
        return null;
      }

      if(this._pauseNext){
        this._bufferedItem = item;
        this._pauseNext = false;
        this._paused = true;
        return (this._backpressure = this._backpressure || defer()).promise;
      }

      if(this._paused){
        throw new Error("Can't produce value if paused");
      }

      this.emit("data", item);

      if(this._pauseNext){
        this._pauseNext = false;
        this._paused = true;
        return (this._backpressure = this._backpressure || defer()).promise;
      }
    }
  });
});
