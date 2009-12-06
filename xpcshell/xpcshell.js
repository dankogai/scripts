
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const ENV = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
const FILE = Components.Constructor("@mozilla.org/file/local;1","nsILocalFile", "initWithPath");
const IOS = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1","nsIJSXMLHttpRequest");
const XMLSerializer = Components.Constructor("@mozilla.org/xmlextras/xmlserializer;1", "nsIDOMSerializer");
const DOMParser = Components.Constructor("@mozilla.org/xmlextras/domparser;1", "nsIDOMParser");
const SubScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);

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
        liberator.dump(e);
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
      let uri = net.newFileURI(path);
      SubScriptLoader.loadSubScript(uri.spec, context);
    }
  };
  return self;
})();
// }}}
// --------------------------------------------------------
// net
// -----------------------------------------------------{{{
let net = (function(){
  let self = {
    httpGet: function(url, option){
      if (!option) option = {};
      let xhr = new XMLHttpRequest();
      xhr.open("GET", url, false, option.user, option.password);
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
// util
// -----------------------------------------------------{{{
let util = {
  toUTF8Octets: function util_toUTF8Octets(string){
    return unescape(encodeURIComponent(string));
  },
  fromUTF8Octets: function util_fromUTF8Octets(octets){
    return decodeURIComponent(escape(octets));
  }
};
// }}}

// vim: sw=2 ts=2 et fdm=marker:
