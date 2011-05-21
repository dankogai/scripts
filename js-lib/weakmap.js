/**
 * @fileoverview psesudo WeakMap for not implemented WeakMap
 * @author teramako teramako.at.gmail.com
 * @version 0.1
 * @license MIT
 */

/**
 * WeakMap
 * @name WeakMap
 * @constructor
 * @see <a href="http://wiki.ecmascript.org/doku.php?id=harmony:weak_maps">harmony:weak_map [ES Wiki]</a>
 */

/**
 * Get the value of key
 * @name get
 * @methodof WeakMap#
 * @param {Object} key not a non-null object
 * @return {Object}
 * @throws {TypeError} key is not a non-null object
 */

/**
 * Set a key and a value
 * @name set
 * @methodof WeakMap#
 * @param {Object} key not a non-null object
 * @param {object} value
 * @throws {TypeError} key is not a non-null object
 */

/**
 * Check the key is registered
 * @name has
 * @methodof WeakMap#
 * @param {Object} key not a non-null object
 * @return {Boolean}
 * @throws {TypeError} key is not a non-null object
 */

/**
 * Delete the key and the value
 * @name delete
 * @methodof WeakMap#
 * @param {Object} key not a non-null object
 * @return {Boolean}
 * @throws {TypeError} key is not a non-null object
 */

(function (global) {
  if (typeof global.WeakMap == "function")
    return;

  global.WeakMap = function WeakMap () {
    if (!(this instanceof WeakMap))
      return new WeakMap;

    this.keys = [];
    this.value = [];
  };
  global.WeakMap.prototype = {
    get: function WeakMap_get (key) {
      if (key !== Object(key))
        throw new TypeError("key is not a non-null object");

      var i = this.keys.indexOf(key);
      return i < 0 ? void(0) : this.value[i];
    },
    set: function WeakMap_set (key, value) {
      if (key !== Object(key))
        throw new TypeError("key is not a non-null object");

      var i = this.keys.indexOf(key);
      if (i < 0)
        i = this.keys.length;

      this.keys[i] = key;
      this.value[i] = value;
    },
    has: function WeakMap_has (key) {
      if (key !== Object(key))
        throw new TypeError("key is not a non-null object");

      return this.keys.indexOf(key) >= 0
    },
    delete: function WeakMap_delete (key) {
      if (key !== Object(key))
        throw new TypeError("key is not a non-null object");

      var i = this.keys.indexOf(key);
      if (i < 0)
        return false;

      this.keys.splice(i, 1);
      this.values.splice(i, 1);
      return true;
    }
  };
})(this);

