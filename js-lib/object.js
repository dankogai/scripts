/**
 * @fileoverview Additional methods in Object
 * @version 0.1
 * @author teramako teramako@gmail.com
 * @requires ECMAScript 5th
 */

Object.defineProperties(Object, {
  /**
   * obj が持つプロパティの PropertyDescriptor を集約して返す
   * @name getOwnProperties
   * @methodOf Object
   * @param {object} obj
   * @return {object} PropertyDescriptors
   * @throws {TypeError} If obj is not an object
   */
  getOwnProperties: {
    enumerable: false,
    writable: true,
    configurable: true,
    value: function getOwnProperties (obj) {
      if (obj !== this(obj))
        throw new TypeError(obj + " is not an object");

      var names = this.getOwnPropertyNames(obj);
      var objDesc = {};
      for (var i = 0, len = names.length; i < len; i++) {
        var name = names[i];
        var desc = this.getOwnPropertyDescriptor(obj, name);
        objDesc[name] = desc;
      }
      return objDesc;
    }.bind(Object),
  },
  /**
   * Object.getOwnPropertyDescriptor に似ているが、prototype内も探る
   * @name getPropertyDescriptor
   * @methodOf Object
   * @param {object} obj
   * @param {string} name Property name
   * @return {object} a PropertyDescriptor of the name in obj
   * @return {undefined} if the property is not in obj, returns undefined
   * @throws {TypeError} If obj is not an object
   */
  getPropertyDescriptor: {
    enumerable: false,
    writable: true,
    configurable: true,
    value: function getPropertyDescriptor (obj, name) {
      if (obj !== this(obj))
        throw new TypeError(obj + " is not an object");

      if (!(name in obj))
        return void(0);

      var desc;
      while ( (desc = this.getOwnPropertyDescriptor(obj, name)) === void(0)) {
        obj = this.getPrototypeOf(obj);
        if (obj === null)
          return void(0);
      }
      return desc;
    }.bind(Object),
  },
  /**
   * Object.getOwnPropertyNames に似ているが、prototype内も探る
   * @name getPropertyNames
   * @methodOf Object
   * @param {object} obj
   * @return {string[]}
   * @throws {TypeError} If obj is not an object
   */
  getPropertyNames: {
    enumerable: false,
    writable: true,
    configurable: true,
    value: function getPropertyNames (obj) {
      if (obj !== this(obj))
        throw new TypeError(obj + " is not an object");

      var names = [];
      do {
        var bufNames = this.getOwnPropertyNames(obj);
        for (var i = 0, len = bufNames.length; i < len; i++) {
          if (names.indexOf(bufNames[i]) === -1)
            names.push(bufNames[i]);
        }
      } while ((obj = this.getPrototypeOf(obj)) !== null)
      return names;
    }.bind(Object),
  },
});

// vim: sw=2 ts=2 et:
