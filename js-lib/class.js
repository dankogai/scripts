/**
 * @fileoverview Create Function like Class
 * @author teramako teramako.at.gmail.com
 * @version 0.2
 * @license MIT
 * @requires ECMASCript 5th and object.__proto__ property
 */

/**
 * Create Function constructor
 * @constructor
 * @augments Object
 * @param {String} [name] class name
 * @param {Function} [base] base class
 * @param {Object} proto
 * @param {Function} [proto.init] called when the created constructor is called
 * @return {Function}
 * @example
 * // create Class Foo
 * const Foo = Class("Foo", {
 *   init: function (name) { this.name = name; },
 *   getName: function () { return this.name; }
 * });
 * // create Class Bar inherts Foo
 * const Bar = Class("Bar", Foo, {
 *   setName: function (name){ this.name = name; }
 * });
 * var b = Bar("bar");
 * b.getName(); // "bar"
 * b.toString(); // "[instance Bar inherits Foo]"
 */
function Class (name, base, proto) {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] == "string")
    var name = args.shift();

  var superClass = Class;
  if (typeof args[0] == "function")
    superClass = args.shift();

  proto = args[0];

  if (!name)
    name = Class.wm.get(superClass.prototype.constructor) || superClass.prototype.constructor.name || "Anonymous";

  proto.__proto__ = superClass.prototype;

  Class.setSuper(proto, superClass.prototype);

  var constructor = function () {
    var o = Object.create(proto);
    var res = o.init.apply(o, arguments);
    return res != undefined ? res : o;
  };
  Object.defineProperty(proto, "constructor", { value: constructor });
  Class.wm.set(constructor, name);
  constructor.prototype = proto;
  constructor.__proto__ = Class;
  /*
  var bound = constructor.bind(null);
  bound.prototype = proto;
  bound.__proto__ = Class;
  */
  return constructor;
}
Object.defineProperties(Class, {
  /**
   * stored class names
   * @type {WeakMap}
   * @name Class.wm
   */
  wm: {
    value: new WeakMap(),
  },
  /**
   * @name Class.getClasses
   * @function
   * @param {Object|Function} obj
   * @return {String[]}
   */
  getClasses: {
    value: function (obj) {
      var classes = [];
      if (typeof obj == "function") {
        classes.push(this.wm.get(obj) || obj.constructor.name);
        obj = obj.prototype;
      }
      while ((obj = Object.getPrototypeOf(obj)) !== Object.prototype) {
        classes.push(this.wm.get(obj.constructor) || obj.constructor.name);
      }
      return classes;
    },
  },
  /**
   * Show the first class name.
   * @name Class.toString
   * @function
   * @return {String}
   */
  toString: {
    value: function () {
      var classes = this.getClasses(this);
      return "[class " + classes.shift() + " inherits " + classes.toString() + "]";
    },
  },
  /**
   * set "super" property is references the same name property in super
   * to functions and gettter/setter properties in proto
   * @name Class.setSuper
   * @function
   * @constant
   * @param {Object} proto
   * @param {Object} super
   */
  setSuper: {
    value: function (proto, protoSuper) {
      var keys = Object.getOwnPropertyNames(proto);
      out:
      for (var i = 0, len = keys.length; i < len; ++i) {
        var key = keys[i];
        if (!(key in protoSuper))
          continue;

        var desc = Object.getOwnPropertyDescriptor(proto, key);
        if ("get" in desc) {
          var p = protoSuper;
          while (p !== null) {
            if (Object.prototype.hasOwnProperty.call(p, key)) {
              Object.defineProperty(proto[key], "super", desc);
              continue out;
            }
            p = Object.getPrototypeOf(p);
          }
        } else if (typeof proto[key] == "function") {
          Object.defineProperty(proto[key], "super", { value: protoSuper[key] });
        }
      }
    },
  },
  /**
   * marge properties of the second or later arguments
   * to the first arguments
   * @function
   * @name Class.update
   */
  update: {
    value: function () {
      var args = Array.prototype.slice.call(arguments);
      var base = args.shift();
      for (var i = 0; i < args.length; ++i) {
        var o = args[i];
        var keys = Object.getOwnPropertyNames(o);
        for (var k = 0, len = keys.length; k < len; ++k) {
          var key = keys[i];
          Object.defineProperty(base, key, Object.getOwnPropertyDescriptor(o, key));
        }
      }
    },
  },
  /**
   * evaluate argument and logging the result
   * @function
   * @name Class.evalog
   * @param {String} str
   */
  evalog: {
    value: function (str) {
      var res;
      try {
        res = eval(str);
        console.log(str + " =>", res);
      } catch (e) {
        console.error(str + " => " + e.name, e.message, e);
      }
    }
  },
});
Class.prototype = Object.create({}, {
  /**
   * do nothing
   * @methodof Class.prototype
   * @constructs
   */
  init: {
    value: function Class_init () {},
  },
  /**
   * Constructor
   * @methodof Class.prototype
   */
  constructor: {
    value: Class,
  },
  /**
   * Show the first class name of the instance.
   * @methodof Class.prototype
   * @return {String}
   */
  toString: {
    value: function Class_toString () {
      var classes = Class.getClasses(this);
      return "[instance " + classes.shift() + " inherits " + classes.toString() + "]";
    },
  },
  /**
   * log messages
   * @methodof Class.prototype
   * @param {Object} msg
   */
  log: {
    value: function console_log () {
      var args = Array.prototype.slice.call(arguments);
      console.log.apply(console, ["@" + Class.wm.get(this.constructor)].concat(args));
    },
  },
  /**
   * debug messages
   * @methodof Class.prototype
   * @param {Object} msg
   */
  debug: {
    value: function debug () {
      var args = Array.prototype.slice.call(arguments),
          caller = arguments.callee.caller,
          callerName = caller && caller.name || "",
          className = Class.wm.get(this.constructor);

      if (caller) {
        console.log(
          "@" + className + " => ",
          callerName + "(",
          Array.prototype.slice.call(caller.arguments),
          ")"
        );
        console.log.apply(console, args);
      } else {
        console.log.apply(console, ["@" + className].concat(args));
      }
    }
  },
});
Class.wm.set(Class, "Class");

// vim: sw=2 ts=2 et:
