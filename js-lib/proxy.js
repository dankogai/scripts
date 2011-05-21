/**
 * @fileoverview Generic Proxy creator
 * @version 0.1
 * @author teramako teramako@gmail.com
 * @requires Firefox 4.0 or later
 * @requires  object.js
 */


/**
 * ECMAScript Harmony Proxy
 * @name Proxy
 * @namespace
 * @see <a href="http://wiki.ecmascript.org/doku.php?id=harmony:proxies">harmony:proxies [ES Wiki]</a>
 */

/**
 * Creates a Proxy object
 * @name create
 * @methodOf Proxy
 * @param {object} handler expected that it has following properties
 * @param {function} [handler.get] traps [[Get]] of the internal method
 * @param {function} [handler.set] traps [[Set]] of the internal method
 * @param {function} [handler.has] traps [[HasProperty]] of the internal method which is used by 'in' operator
 * @param {function} [handler.hasOwn] traps when {@link Object.prototype.hasOwnProperty} is used
 * @param {function} [handler.enumerate] traps when for-in statement is used
 * @param {function} [handler.keys] traps when {@link Object.keys} is used
 * @param {function} [handler.getOwnPropertyDescriptor] traps when {@link Object.getOwnPropertyDescriptor} is used
 * @param {function} [handler.getPropertyDescriptor] traps when {@link Object.getPropertyDescriptor} is used (not ES5)
 * @param {function} [handler.getOwnPropertyNames] traps when {@link Object.getOwnPropertyNames} is used
 * @param {function} [handler.getPropertyNames] traps when {@link Object.getPropertyNames} is used
 * @param {function} [handler.defineProperty] traps when {@link Object.defineProperty} is used
 * @param {function} [handler.delete] traps when delete statement is used
 * @param {function} [handler.fix] traps when {@link Object.freeze} {@link Object.seel} {@link Object.preventExtensions} are used
 * @param {object} [proto]
 * @return {object}
 */

/**
 * Creates a Proxy function
 * @name createFunction
 * @methodOf Proxy
 * @param {object} handler expected that it has following properties
 * @param {function} [handler.get] traps [[Get]] of the internal method
 * @param {function} [handler.set] traps [[Set]] of the internal method
 * @param {function} [handler.has] traps [[HasProperty]] of the internal method which is used by 'in' operator
 * @param {function} [handler.hasOwn] traps when {@link Object.prototype.hasOwnProperty} is used
 * @param {function} [handler.enumerate] traps when for-in statement is used
 * @param {function} [handler.keys] traps when {@link Object.keys} is used
 * @param {function} [handler.getOwnPropertyDescriptor] traps when {@link Object.getOwnPropertyDescriptor} is used
 * @param {function} [handler.getPropertyDescriptor] traps when {@link Object.getPropertyDescriptor} is used (not ES5)
 * @param {function} [handler.getOwnPropertyNames] traps when {@link Object.getOwnPropertyNames} is used
 * @param {function} [handler.getPropertyNames] traps when {@link Object.getPropertyNames} is used
 * @param {function} [handler.defineProperty] traps when {@link Object.defineProperty} is used
 * @param {function} [handler.delete] traps when delete statement is used
 * @param {function} [handler.fix] traps when {@link Object.freeze} {@link Object.seel} {@link Object.preventExtensions} are used
 * @param {function} callTrap
 * @param {function} [constructTrap]
 * @return {function}
 */

/**
 * Proxyオブジェクトの作成
 * @methodOf Proxy
 * @public
 * @param {object} target
 * @param {object} proxy
 * @return {proxy}
 * @see Proxy.create
 * @see Proxy.Handler
 */
Proxy.make = function ProxyMake (target, proxy) {
  if (target === null)
    target = {};
  else if (typeof target != "object")
    throw new TypeError("arguments 0 must be a non-null object");

  var handler = new Proxy.Handler(target);
  var p = Object.create(
    handler,
    proxy && typeof proxy == "object" ? Object.getOwnProperties(proxy) : undefined
  );
  return Proxy.create(p, Object.getPrototypeOf(target));
}

/**
 * Generic Proxy handler
 * @constructor
 * @param {object} target an object handled from proxy
 * @public
 * @see http://wiki.ecmascript.org/doku.php?id=harmony:proxy_defaulthandler
 */
Proxy.Handler = function ProxyHandler (target) {
  if (!(this instanceof ProxyHandler))
    return new ProxyHandler(target);

  this.target = target;
}
Proxy.Handler.prototype = (function() {
  /**#@+
     @function
     @private
     @memberOf Proxy.Handler-
   */

  /**
   * check the argument is a AccessorDescriptor or not
   * @param {object}
   * @return {boolean}
   */
  function isAccessorDescriptor (desc) {
    if (desc === undefined)
      return false;

    return ("get" in desc && "set" in desc);
  }
  /**
   * check the argument is a DataDescriptor or not
   * @param {object}
   * @return {boolean}
   */
  function isDataDescriptor (desc) {
    if (desc === undefined)
      return false;

    return ("value" in desc && "writable" in desc);
  }
  function trapCall(name, args) {
    /*
    liberator.log("called: " + name + "(" + args.map(function(v) typeof v == "string" ? v.quote() : Object.prototype.toString.call(v)).join(",") + ")", 0);
    */
    console.log("called: " + name + "(" + args.map(function(v) typeof v == "string" ? v.quote() : Object.prototype.toString.call(v)).join(",") + ")");
  }
 
  /**
   * emurate ES5 internal method [[CanPut]]
   * @param {object} obj
   * @param {string} name
   * @return {boolean}
   */
  function canPut (obj, name) {
    var desc = Object.getOwnPropertyDescriptor(obj, name);
    if (desc !== undefined) {
      if (isAccessorDescriptor(desc)) {
        return (desc.set === undefined) ? false : true;
      } else if (isDataDescriptor(desc)) {
        return desc.writable;
      }
    } else {
      var proto = Object.getPrototypeOf(obj);
      if (proto === null) {
        return Object.isExtensible(obj);
      }
      var inherited = Object.getPropertyDescriptor(obj, name);
      if (inherited === undefined) {
        return Object.isExtensible(obj);
      }
      if (isAccessorDescriptor(inherited)) {
        return (inherited.set === undefined) ? false : true;
      } else if (isDataDescriptor(inherited)) {
        return inherited.writable;
      }
    }
    throw new Error("???");
  }
  /**#@-*/

  return {
    /**
     * WeakMap object
     * @type WeakMap
     * @requires ES Harmony
     * @see <a href="http://wiki.ecmascript.org/doku.php?id=harmony:weak_maps">harmony:weak_maps [ES Wiki]</a>
     */
    vm: new WeakMap(),

    /**#@+
       @memberOf Proxy.Handler#
       @function
       @public
     */

    /**
     * internal method [[GetOwnProperty]]
     * @param {string} name Property name
     * @return {object}
     * @return {undefined}
     */
    getOwnPropertyDescriptor: function getOwnPropertyDescriptor (name) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      var desc = Object.getOwnPropertyDescriptor(this.target, name);
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    /**
     * internal method [[GetProperty]]
     * @param {string} name Property name
     * @return {object}
     * @return {undefined}
     * @see Object.getPropertyDescriptor
     */
    getPropertyDescriptor: function getPropertyDescriptor (name) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      var desc = Object.getPropertyDescriptor(this.target, name);
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    /**
     * @return {Array}
     */
    getOwnPropertyNames: function getOwnPropertyNames () {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return Object.getOwnPropertyNames(this.target);
    },
    /**
     * @return {Array}
     * @see Object.getPropertyNames
     */
    getPropertyNames: function getPropertyNames () {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return Object.getPropertyNames(this.target);
    },
    /**
     * internal method [[DefineOwnProperty]]
     * @param {string} name
     * @param {object} desc AccessorDescriptor または DataDescriptor
     */
    defineProperty: function defineProperty (name, desc) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return Object.defineProperty(this.target, name, desc);
    },
    /**
     * internal method [[Delete]]
     * used by 'delete' operator
     * @param {string} name
     * @return {boolean}
     */
    delete: function delete (name) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return delete this.target[name];
    },
    /**
     * @return {object}
     * @return {undefined}
     */
    fix: function fix () {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      if (!Object.isFrozen(this.target)) {
        return undefined;
      }
      var props = {};
      for (var name in this.target) {
        props[name] = Object.getOwnPropertyDescriptor(this.target, name);
      }
      return props;
    },
    /**
     * used by 'in' operator (internal method [[HasProperty]])
     * @param {string} name
     * @return {boolean}
     */
    has: function has (name) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return name in this.target;
     },
    /**
     * @param {string} name
     * @return {boolean}
     */
    hasOwn: function hasOwn (name) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return ({}).hasOwnProperty.call(this.target, name);
    },
    /**
     * internal method [[Get]]
     * @param {string} name
     * @return {object}
     */
    get: function get (receiver, name) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return this.target[name];
    },
    /**
     * internal method [[Set]]
     * @param {string} name
     * @param {object} value
     * @return {boolean}
     */
    set: function set (receiver, name, value) {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      if (canPut(this.target, name)) {
        this.target[name] = value;
        return true;
      }
      return false;
    },
    /**
     * used by for-in statement
     * @return {Array}
     */
    enumerate: function enumerate () {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      var result = [];
      for (var name in this.target) { result.push(name); };
      return result;
    },
    /*
    iterate: function iterate () {
      trapCall(arguments.callee.name, Array.slice(arguments));
      return Iterator(this.target);
    },
    */
    /**
     * @return {Array}
     */
    keys: function keys () {
      //trapCall(arguments.callee.name, Array.slice(arguments));
      return Object.keys(this.target);
    },

    /**#@-*/
  };
})();


// vim: sw=2 ts=2 et:
