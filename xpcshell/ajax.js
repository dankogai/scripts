/* 
 *  arguments: file.to.script url [url ...]
 */

/**
 * createDoc {{{
 */
function createDoc(str){
  let doc = DOM.createHTMLDocument();
  let html = doc.createElement("html");
  let body = doc.createElement("body");
  let head = doc.createElement("head");
  html.appendChild(head);
  html.appendChild(body);
  doc.appendChild(html);
  doc.documentElement.childNodes[0].innerHTML = str.replace(/^.*<head([^>]*)>|<\/head>.*$/ig,"");
  doc.documentElement.childNodes[1].innerHTML = str.replace(/^.*<body([^>]*)>|<\/body>.*$/ig,"");

  return doc;
}
// }}}

/**
 * createWindow {{{
 */
function createWindow(url, doc){
  let uri = net.newURI(url);
  let window = {
    document: doc,
    navigator: {
      userAgent: "Mozilla/5.0 (Windows; U; Windows NT 5.1; ja-JP; rv:1.9.1.5) Gecko/20091102 Firefox/3.5.5",
      platform: "Win32"
    },
    location: {
      toString: function(){ return this.href; },
      hash: "",
      host: uri.host,
      hostname: uri.host,
      href: uri.spec,
      pathname: uri.path,
      port: uri.hostPort,
      protocol: uri.scheme,
      search: ""
    },
    setTimeout: function(func, delay){
      let args = [func, delay, this].concat(Array.slice(arguments, 2));
      return ThreadManager.setTimeout.apply(this, args);
    },
    setInterval: function(func, delay){
      let args = [func, delay, this].concat(Array.slice(arguments, 2));
      return ThreadManager.setInterval.apply(this, args);
    },
    clearTimeout: function(id){
      ThreadManager.clearTimeout(id);
    },
    clearInterval: function(id){
      ThreadManager.clearInterval(id);
    }
  };
  window.window = window;
  return window;
}
// }}}

(function init(args){
  var userScript = args.shift();
  for (let i=0, len=args.length; i<len; i++){
    let url = args[i];
    net.httpGet(url, {
      callback: function(xhr){
        let doc = createDoc(xhr.responseText);
        let window = createWindow(url, doc);
        io.loadScript("jquery-1.3.2.js", window);
        io.loadScript(userScript, window);
      }
    });
    ThreadManager.wait();
  }
})(Array.slice(arguments));

// vim: sw=2 ts=2 et fdm=marker:
