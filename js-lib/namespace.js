/**
 * @fileoverview NS proxy
 * @version 0.1
 * @author teramako teramako@gmail.com
 * @requires Firefox 4.0 or later
 * @requires proxy.js
 * @requires object.js
 */

if (typeof Namespace == "undefined") {
  /**
   * @constructor
   * @param {String} [name]
   * @param {String} url
   * @return {Object}
   */
  var Namespace = function Namespace (name, uri) {
    /**
     * namespace prefix
     * @type {string}
     * @fieldOf Namespace#
     */
    this.prefix = "";
    /**
     * namepsace uri
     * @type {string}
     * @fieldOf Namespace#
     */
    this.uri = "";
    if (arguments.length == 1) {
      this.uri = name;
    } else if (arguments.length > 1) {
      this.prefix = name;
      this.uri = uri;
    }
  }
  /**
   * returns uri string
   * @return {String}
   */
  Namespace.prototype.toString = function () {
    return this.uri;
  }
}

/**
 * Create Namespace proxy
 * @function
 * @param {String} uri a namespace string
 * @param {Object} [target] global object is used if ommited
 * @param {String} [name]
 * @return {Object} Proxy object
 * @example
 * var obj = {};
 * var namespace = "http://example.com/";
 * var n = NS(namespace, obj, "example"); // create namespace proxy
 * n.foo = "FOO";                         // equals obj["http://example.com/::foo"] = "FOO"
 * NS.example.foo;                        // "FOO": if specified the name, can access from `NS'
 * NS[namespace + "::foo"];               // "FOO"
 * NS.namespace::foo;                     // "FOO": it's only Gecko implemented E4X
 * obj;                                   // ({ "http://example.com/::foo": "FOO" })
 */
const NS = (function(global){ 
  var uris = {};
  var nss = {};
  var globalProxy = Proxy.createFunction(
    Object.create(new Proxy.Handler({}),
      Object.getOwnProperties({
        get: function (_, name) {
          console.log("NS.get:: ", name);
          var [, uri, prop] = name.match(/^(?:(.*|\*)::)?([a-zA-Z_$]\w*)$/);
          if (uri == "*") {
            var props = [];
            for (var n in nss) {
              var namespace = nss[n];
              if (prop in namespace.proxy) {
                props.push(namespace.proxy[prop]);
              }
            }
            return props;
          } else if (uri && uri in uris) {
            return nss[uris[uri]].proxy[prop];
          } else if (!uri && prop in nss) {
            return nss[prop].proxy || nss[prop];
          } else {
            return this.target[name];
          }
          return undefined;
        },
        set: function (_, name, value) {
          return false;
        },
        has: function (name) {
          var [, uri, prop] = name.match(/^(?:(.*|\*)::)?([a-zA-Z_$]\w*)$/);
          if (uri == "*") {
            for (var n in nss) {
              var namespace = nss[n];
              if (prop in namespace.proxy) {
                return true;
              }
            }
          } else if (uri && uri in uris) {
            return prop in nss[uris[uri]].proxy;
          } else if (!uri && prop in nss) {
            return true;
          }
          return false;
        },
        hasOwn: function (name) {
          return this.has(name);
        },
        enumerate: function () {
          var result = [];
          for (var name in nss) { result.push(name); }
          return result;
        }
      })
    ),
    /**
     * @private
     */
    function NSProxyCallTrap (uri, target, name) {
      if (!target)
        target = global;

      var ns = name ? new Namespace(name, uri) : new Namespace(uri);
      var prefix = uri + "::";

      var nsproxy = Proxy.make(target, {
        get: function (_, name) {
          var res = target[prefix + name];
          if (res === void(0) && typeof target[name] == "function")
            return target[name];

          return res;
        },
        set: function (_, name, value) {
          return Object.getPrototypeOf(this).set.call(this, _, prefix + name, value);
        },
        has: function (name) {
          return (prefix + name in target);
        },
        enumerate: function () {
          var result = [];
          for (var name in target) {
            if (name.indexOf(prefix) == 0)
              result.push(name.substr(prefix.length));
          }
          return result;
        },
        keys: function () {
          return Object.keys(target).reduce(function(keys, name){
            if (name.indexOf(prefix) == 0)
              keys.push(name.substr(prefix.length));

            return keys;
          }, []);
        },
      });

      if (name && !(name in nss)) {
        nss[name] = { ns: ns, proxy: nsproxy };
        console.log("nss: ", [k for (k in nss)]);
        if (!(uri in uris)) {
          uris[uri] = name;
          console.log("uris: ", [k for (k in uris)]);
        }
      }

      return nsproxy;
    });
  return globalProxy;
})(this);

// vim:sw=2 ts=2 et:
