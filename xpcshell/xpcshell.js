
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const ENV = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
const FILE = Components.Constructor("@mozilla.org/file/local;1","nsILocalFile", "initWithPath");
const IOS = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const XMLSerializer = Components.Constructor("@mozilla.org/xmlextras/xmlserializer;1", "nsIDOMSerializer");
const DOMParser = Components.Constructor("@mozilla.org/xmlextras/domparser;1", "nsIDOMParser");
const SubScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
const Process = Components.Constructor("@mozilla.org/process/util;1","nsIProcess", "init");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

// ByteString to Unicode
function UString(octets, charset){
  let c = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
  c.charset = charset || "UTF-8"; 
  return c.ConvertToUnicode(octets);
}
// Unicode to ByteString
function BString(str, charset){
  let c = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
  c.charset = charset || "UTF-8"; 
  return c.ConvertFromUnicode(str);
}

// --------------------------------------------------------
// io
// -----------------------------------------------------{{{
let io = (function(){
  let directoryService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
  let systemName = Cc["@mozilla.org/system-info;1"].getService(Ci.nsIPropertyBag2).getProperty("name");
  let pathDemiliter = systemName == "Windows_NT" ? "\\" : "/";
  let MODE = {
    MODE_RDONLY:   0x01,
    MODE_WRONLY:   0x02,
    MODE_RDWR:     0x04,
    MODE_CREATE:   0x08,
    MODE_APPEND:   0x10,
    MODE_TRUNCATE: 0x20,
    MODE_SYC:      0x40,
    MODE_EXCL:     0x80,
  };
  let self = {
    File: function io_FILE(path){
      if (!path){
        return this.PWD;
      } else if (path instanceof Ci.nsIFile){
        return path;
      } else if (typeof path != "string"){
        throw new SyntaxError("arguments[0] is not string");
      }
      function getRelativePath(path){
        return path.replace("/", pathDemiliter, "g");
      }
      let file;
      switch (path.charAt(0)){
        case "~":
          file = this.HOME;
          file.appendRelativePath(getRelativePath(path.substring(2)));
          break;
        case ".":
          file = this.PWD;
          let reg = /^\.\.\/?/;
          while (reg.test(path)){
            file = file.parent;
            path = path.replace(reg, "");
          }
          file.QueryInterface(Ci.nsILocalFile);
          file.appendRelativePath(getRelativePath(path));
          break;
        default:
          try {
            file = new FILE(path);
          } catch(e if e.result == Components.results.NS_ERROR_FILE_UNRECOGNIZED_PATH){
            file = this.PWD;
            file.appendRelativePath(getRelativePath(path));
          }
          break;
      }
      return file;
    },
    getDirectory: function io_getDirectory(name){
      if (!directoryService.has(name))
        return null;

      return directoryService.get(name, Ci.nsILocalFile);
    },
    get PWD(){
      return this.getDirectory("CurWorkD");
    },
    get HOME(){
      return this.getDirectory("Home");
    },
    readFile: function io_readFile(aFile, encoding){
      let file = this.File(aFile);
      if (!encoding)
        encoding = "UTF-8";

      let ifs = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
      let ics = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
      ifs.init(file, -1, 0, 0);
      ics.init(ifs, encoding, 4096, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

      let buffer = [];
      let str = {};
      while (ics.readString(4096, str) != 0)
        buffer.push(str.value);

      ics.close();
      ifs.close();
      return buffer.join("");
    },
    writeFile: function io_writeFile(aFile, buf, mode, perms, encoding) {
      let file = this.File(aFile);
      let ofstream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
      function getStream(defaultChar) {
        let stream = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
        stream.init(ofstream, encoding, 0, defaultChar);
        return stream;
      }

      if (!encoding)
        encoding = "UTF-8";

      if (mode == ">>")
        mode = MODE.MODE_WRONLY | MODE.MODE_CREATE | MODE.MODE_APPEND;
      else if (!mode || mode == ">")
        mode = MODE.MODE_WRONLY | MODE.MODE_CREATE | MODE.MODE_TRUNCATE;

      if (!perms)
        perms = 0644;

      ofstream.init(file, mode, perms, 0);
      let ocstream = getStream(0);
      try {
        ocstream.writeString(buf);
      } catch (e) {
        if (e.result == Cr.NS_ERROR_LOSS_OF_SIGNIFICANT_DATA) {
          ocstream = getStream("?".charCodeAt(0));
          ocstream.writeString(buf);
          return false;
        }
        else
          throw e;
      } finally {
        try {
          ocstream.close();
        }
        catch (e) {}
        ofstream.close();
      }
      return true;
    },
    readDirectory: function io_readDirectory(aFile){
      let dir = this.File(aFile);
      if (!dir.isDirectory())
        throw new Error("Not a directory");

      let entries = dir.directoryEntries;
      while (entries.hasMoreElements())
        yield entries.getNext().QueryInterface(Ci.nsIFile);
    },
    loadScript: function io_loadScript(path, context){
      let file = this.File(path);
      if (!file.exists())
        throw new Error(file.path + " is not found");
      else if (file.isDirectory())
        throw new Error(file.path + " is directory");
      else if (!file.isReadable())
        throw new Error(file.path + " is not readable");

      let uri = net.newFileURI(file);
      SubScriptLoader.loadSubScript(uri.spec, context);
    }
  };
  return self;
})();
// }}}
// --------------------------------------------------------
// net
// -----------------------------------------------------{{{
function XMLHttpRequest(){
  this.xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIJSXMLHttpRequest);
  for (var key in this.xhr){
    let k = key;
    switch(k){
      case "open":
      case "send":
      case "sendAsBinay":
        break;
      case "mozBackgroundRequest":
      case "onreadystatechange":
      case "onuploadprogress":
      case "onabort":
      case "onerror":
      case "onload":
      case "onloadstart":
        this.__defineSetter__(k, function(obj) this.xhr[k] = obj);
      default:
        this.__defineGetter__(k, function() this.xhr[k]);
    }
  }
}
XMLHttpRequest.prototype = {
  open: function open(method, url, async, user, password){
    this.isAsync = !!async;
    return this.xhr.open(method, url, async, user, password);
  },
  isAsync: false,
  get finished(){
    if (!this.isAsync || this.readyState == 4)
      return true;
    return false;
  },
  send: function send(data){
    if (this.isAsync)
      ThreadManager.pool.set(this);
    this.xhr.send(data);
  },
  sendAsBinay: function sendAsBinay(data){
    if (this.isAsync)
      ThreadManager.pool.set(this);
    this.xhr.sendAsBinary(data);
  }
}
let net = (function(){
  let self = {
    httpGet: function(url, option){
      if (!option) option = {};
      let xhr = new XMLHttpRequest();
      xhr.mozBackgroundRequest = true;
      if (option.callback){
        xhr.onreadystatechange = function(){
          if (xhr.readyState == 4){
            option.callback(xhr);
          }
        }
      }
      xhr.open("GET", url, !!option.callback, option.user, option.password);
      if (option.header){
        for (let k in option.header){
          xhr.setRequestHeader(k, option.header[k]);
        }
      }
      xhr.send(null);
      return xhr;
    },
    newChannel: function net_newChannel(url, encoding){
      if (!encoding) encoding = "UTF-8";

      return IOS.newChannel(url, encoding, null);
    },
    newURI: function net_newURI(url, encoding){
      if (!encoding) encoding = "UTF-8";
      return IOS.newURI(url, encoding, null);
    },
    newFileURI: function net_newFileURI(aFile){
      let file = io.File(aFile);
      return IOS.newFileURI(file);
    }
  };
  return self;
})();
// }}}
// --------------------------------------------------------
// DOM 
// -----------------------------------------------------{{{
let DOM = (function(){
  const NS_HTMLDOCUMENT_CID = '{5d0fcdd0-4daa-11d2-b328-00805f8a3859}';
  let self = {
    createHTMLDocument: function DOM_createHTMLDocument(){
      let doc = Components.classesByID[NS_HTMLDOCUMENT_CID].createInstance();
      return doc;
    }
  };
  return self;
})();
// }}}
// --------------------------------------------------------
// ThreadManager
// -----------------------------------------------------{{{
let ThreadManager = (function(){
  let tm = Cc["@mozilla.org/thread-manager;1"].getService(Ci.nsIThreadManager);
  /*
   * nsIRunnable {{{
   */
  function Runnable(self, func, args){
    this.finished = false;
    this.run = function RunnableRun(){
      try {
        func.apply(self, args);
      } finally {
        this.finished = true;
      }
    }
  }
  Runnable.prototype = {
    QueryInterfalce: XPCOMUtils.generateQI([Ci.nsIRunnable]),
  } // }}}
  const nsITimer               = Components.Constructor("@mozilla.org/timer;1", "nsITimer", "init"),
        TYPE_ONE_SHOT          = Ci.nsITimer.TYPE_ONE_SHOT,
        TYPE_REPEATING_PRECISE = Ci.nsITimer.TYPE_REPEATING_PRECISE;
  /*
   * Timer {{{
   * @see http://piro.sakura.ne.jp/latest/blosxom/mozilla/xul/2010-02-06_xpcshell-delayed.htm
   */
  function Timer(aType, aCallback, aDelay, aContext, aArgs){
    if (aType != TYPE_ONE_SHOT && aType != TYPE_REPEATING_PRECISE)
      throw new TypeError("aType is only `TYPE_ONE_SHOT' or `TYPE_REPEATING_PRECISE'");

    this.finished = false;
    this.type = aType;
    this.callback = aCallback;
    this.context = aContext;
    this.args = aArgs;
    this.timer = new nsITimer(this, aDelay, this.type);
  }
  Timer.prototype = {
    cancel: function (){
      try {
        this.timer.cancel();
      } catch(e) {
      }
      this.finished = true;
      delete this.timer;
      delete this.callback;
    },
    observe: function(aSubject, aTopic, aData){
      if (aTopic != "timer-callback") return;
      if (typeof this.callback == "function")
        this.callback.apply(this.context, this.args);
      else
        eval(this.calback);

      if (this.type == TYPE_ONE_SHOT){
        this.cancel();
      }
    }
  } // }}}
  /*
   * ThreadManager public properties {{{
   */
  let self = {
    pool: (function(){
      let p = {},
          cnt = 0;
      return {
        set: function PoolSet(obj){
          p[++cnt] = obj;
          return cnt;
        },
        get: function PoolGet(id){
          if (id in p)
            return p[id];
          return null;
        },
        isFinished: function PoolIsFinised(id){
          if (id in p){
            if (p[id].finished){
              delete p[id];
              return true;
            }
            return false;
          }
          return true;
        },
        remove: function PoolRemove(id){
          if (id in p)
            return delete p[id];
          return false;
        },
        __iterator__: function PoolIterator(){
          for (let id in p)
            yield [id, p[id]];
        }
      }
    })(),
    get mainThread() tm.mainThread,
    get newThread() tm.newThread(0),
    callAsync: function ThreadManagerCallAsync(thread, context, func){
      if (!thread) thread = this.newThread;
      let runner = new Runnable(context, func, Array.slice(arguments, 3));
      this.pool.set(runner);
      thread.dispatch(runner, thread.DISPATCH_NORMAL);
    },
    wait: function ThreadManagerWait(id){
      function isAllFinished(){
        let cnt = 0;
        for (let [id, obj] in ThreadManager.pool){
          if (obj.finished)
            ThreadManager.pool.remove(id);
          else
            cnt++;
        }
        return (cnt == 0);
      }
      if (id){
        while(!this.pool.isFinished(id)){
          this.mainThread.processNextEvent(true);
        }
      } else {
        while(!isAllFinished()){
          this.mainThread.processNextEvent(true);
        }
      }
    },
    setTimeout: function TimerSetTimeout(callback, delay, context){
      return this.pool.set(new Timer(TYPE_ONE_SHOT, callback, delay, context||this, Array.slice(arguments, 3)));
    },
    clearTimeout: function TimerClearTimeout(id){
      let timer = this.pool.get(id);
      if (timer && timer.type == TYPE_ONE_SHOT){
        timer.cancel();
      }
    },
    setInterval: function TimerSetInterval(callback, delay, context){
      return this.pool.set(new Timer(TYPE_REPEATING_PRECISE, callback, delay, context||this, Array.slice(arguments, 3)));
    },
    clearInterval: function TimerClearInterval(id){
      let timer = this.pool.get(id);
      if (timer && timer.type == TYPE_REPEATING_PRECISE){
        timer.cancel();
      }
    },
  };
  return self;
  // }}}
})();
// }}}
// vim: sw=2 ts=2 et fdm=marker:
