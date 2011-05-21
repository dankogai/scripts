js-lib
======
Experimental JavaScript libraries.

All scripts require [ECMAScript 5th][ES5].

[object.js]
-----------

Additional methods into __Object__.

 * __Object.getOwnProperties__(_obj_)
   * returns summarized _PropertyDescriptor_s
 * __Object.getPropertyDescriptor__(_obj_, _name_)
   * like _Object.getOwnPropertyDescripor_ but search in [[prototype]] of _obj_
 * __Object.getPropertyNames__(_obj_)
   * like _Object.getOwnPropertyNames_ but search in [[prototype]] of _obj_

[weakmap.js]
------------

[WeakMap](http://wiki.ecmascript.org/doku.php?id=harmony:weak_maps "harmny:weak_maps [ES Wiki]")
is defined on Firefox 6.0a1 or later.
But the other JavaScript engines is not. So defines `WeakMap` constructor has the same interfaces.

This is pseudo, so does'nt have _WeakReference_ :(

[class.js]
----------

Create a _function  constructor_ like _Class_

 * defines __Class__(_name_, _base_, _proto_)
   * returns `function constructor` inherits _base_

###requires

 * [weakmap.js]

[proxy.js]
----------

Additional method and function into __Proxy__ (ECMAScript Harmony)

 * __Proxy.make__(_target_, _proxyHandler_)
 * __Proxy.Handler__(_target_)

###requires

 * [object.js]

[namespace.js]
--------------

Create an Object can [[Get]]/[[Put]] a property within the namespace.

 * defines __Namespace__(_prefix_, _uri_) if not defined already.
   * Firefox already has.
 * defines __NS__(_uri_, _target_, _name_) function

###requires

 * [proxy.js]
   * [object.js]

###see

 * [ECMA-357 (E4X)][E4X]


[privateProperty.js]
---------------------

Create an object can only access a property named `_` at first from the internal methods of the object.

 * defines __PrivateClass__(_obj_) function
   * returns a converted object.

###requires

 * [proxy.js]
   * [object.js]


[object.js]: https://github.com/teramako/scripts/blob/master/js-lib/object.js
[weakmap.js]: https://github.com/teramako/scripts/blob/master/js-lib/weakmap.js
[class.js]: https://github.com/teramako/scripts/blob/master/js-lib/class.js
[proxy.js]: https://github.com/teramako/scripts/blob/master/js-lib/proxy.js
[namespace.js]: https://github.com/teramako/scripts/blob/master/js-lib/namespace.js
[privateProperty.js]: https://github.com/teramako/scripts/blob/master/js-lib/privateProperty.js
[ES5]: http://www.ecma-international.org/publications/standards/Ecma-262.htm "ECMAScript Language Specification"
[E4X]: http://www.ecma-international.org/publications/standards/Ecma-357.htm "ECMAScript For XML (E4X) Specification"


