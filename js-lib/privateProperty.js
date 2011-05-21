/**
 * @fileoverview create function constructor can have private properties
 * @version 0.1
 * @author teramako teramako@gmail.com
 * @requires Firefox 4.0 or later
 * @requires proxy.js
 */

/**
 * create object can have private properties
 * @function
 * @param {Object} [self]
 * @return {Object} Proxy object
 */
const PrivateClass = (function() {
  const wm = WeakMap();
  var num = 0;
  const PrivateHandler = {
    get: function (_, name) {
      if (name[0] == "_" && name.length > 0) {
        var caller = arguments.callee.caller; //呼び出し元関数を得る
        if (!caller)
          return void(0);

        var id = wm.get(caller),
            targetMap = wm.get(this.target);
        if (targetMap._.indexOf(id) == -1)
          return void(0);

        return targetMap[name];
      }
      return this.target[name];
    },
    set: function (_, name, value) {
      console.info("[Proxy]Set: ", name.quote(), "<=", value);
      if (name[0] == "_" && name.length > 0) {
        var caller = arguments.callee.caller; //呼び出し元関数を得る
        if (!caller)
          return false;

        var id = wm.get(caller), // WeakMapから呼び出し元関数のid値を得る
            targetMap = wm.get(this.target);

        console.log("Caller: ", caller);
        console.log("CallerID: ", id.quote(), "TargetIDs: ", targetMap._);
        if (targetMap._.indexOf(id) == -1)
          return false;

        targetMap[name] = value;
        return true;
      }
      this.target[name] = value;
      return true;
    },
    // 他のハンドラは省略
    // ...
  };
  return function PrivateClass (self) {
    if (!self)
      self = this;

    var protos = [];
    var proto = self;
    do {
      var id = "ID_" + Date.now() + num++; // fixme: the best is uuid
      console.info("[Proxy]ID setting start", id);
      if (wm.has(proto)) {
        var w = wm.get(self);
        w._ = w._.concat(wm.get(proto)._);
        break;
      } else {
        protos.push(proto);
        wm.set(proto, { _: [] });
        var keys = Object.getOwnPropertyNames(proto);
        console.log(keys);
        for (var i = 0, len = keys.length; i < len; ++i) {
          var key = keys[i];
          var desc = Object.getOwnPropertyDescriptor(proto, key);
          if ("value" in desc) {
            if (typeof desc.value == "function")
              wm.set(desc.value, id);

            if (key[0] == "_" && key.length > 1)
              wm.get(proto)[key] = desc.value;

          } else if ("get" in desc) {
            wm.set(desc.get, id);
            if (desc.set)
              wm.set(desc.set, id);
          }
        }
        protos.forEach(function(p) { wm.get(p)._.push(id); });
      }
    } while ((proto = Object.getPrototypeOf(proto)) !== null)
    console.info("[Proxy]ID setting done:", wm.get(self)._);

    return Proxy.make(self, PrivateHandler);
  };
})();


