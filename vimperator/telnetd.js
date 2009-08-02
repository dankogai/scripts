//#!/usr/lib/xulrunner/xpcshell -f

/*
const Cc = Components.classes;
const Ci = Components.interfaces;
*/

liberator.plugins.telnetd = (function(){

const cs = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
function log(msg){
  cs.logStringMessage(msg);
}

// --------------------------------------------------------
// sessions
// -----------------------------------------------------{{{
let sessions = (function(){
  let list = [];
  let self = {
    add: function(session){
      list.push(session);
    },
    get: function(index){
      return list[index];
    },
    get count(){
      return list.length;
    },
    remove: function(index){
      if (typeof index == "number"){
        if (index in list){
          list[index].quit();
          list.splice(index, 1);
        } else {
          throw new ReferenceError();
        }
      } else if (typeof index == "undefined"){
        list = list.filter(function(session, i) !(session.quit() && delete list[i]));
        return !list.length;
      } else {
        throw new TypeError();
      }
    },
  };
  return self;
})();
// }}}

// --------------------------------------------------------
// daemon
// -----------------------------------------------------{{{
let daemon = {
  QueryInterface: function(iid){
    if (iid.equals(Ci.nsIObserver) || iid.equals(Ci.nsIServerSocketListener) || iid.equals(Ci.nsISupports))
      return this;

    Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
    return null;
  },
  socket: null,
  start: function(port){
    if (this.socket){
      throw Components.results.NS_ERROR_ALREADY_INITIALIZED;
    }
    var socket = Cc["@mozilla.org/network/server-socket;1"].createInstance(Ci.nsIServerSocket);
    socket.init(port, true, 5);
    log(">>> listenin on port " + socket.port + "\n");
    socket.asyncListen(this);
    this.socket = socket;
  },
  stop: function(){
    if (!this.socket)
      return;

    if (sessions.count > 0){
      let res = sessions.remove();
      log(">>> close all sessions ... " + res);
    }
    log(">>> stopping listening on port " + this.socket.port);
    this.socket.close();
    this.socket = null;
  },
  onSocketAccepted: function D_onSocketAccepted(serverSocket, clientSocket){
    log(">>> accepted connection on " + clientSocket.host + ":" + clientSocket.port);
    let oStream = clientSocket.openOutputStream(Ci.nsITransport.OPEN_BLOCKING, 0, 0);
    //let stream = clientSocket.openInputStream(0, 0, 0);
    let iStream = clientSocket.openInputStream(Ci.nsITransport.OPEN_UNBUFFERED, 0, 0);

    let session = new TelnetdSession(iStream, oStream);
    sessions.add(session);
  },
  onStopListening: function(serverSocket, status){
    log(">>> shutting down server socket");
  },
}; // }}}

// --------------------------------------------------------
// TelnetSession
// -----------------------------------------------------{{{
function TelnetdSession(is, os){
  this.init.apply(this, arguments);
};
TelnetdSession.prototype = {
  init: function TS_init(is, os){ /// {{{
    let self = this;
    // Setup input steram
    let iStream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
    iStream.init(is, "UTF-8", 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
    //iStream.init(is, "UTF-8", 1024, 0);
    let binInStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
    binInStream.setInputStream(is);
    let pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
    //        iStream, stremPos, stremLen, segSize, segCount, closeWhenDone
    pump.init(is , -1, -1, 0, 0, true);
    pump.asyncRead({
      onStartRequest: function(request, context) { },
      onStopRequest: function(request, context, status){ self.quit(); },
      onDataAvailable: function onPumpDataAvailable(request, context, inputStream, offset, count){
        let bytes = binInStream.readByteArray(count);
        //log("read binay as: " + bytes + " size:" + bytes.length);
        let strBytes = telnetOption.parse(bytes, self);
        self.onInput.call(self, strBytes);
      }
    }, null);
    this.inputStream = iStream;
    this.binIn = binInStream;

    function bytesToUTF8(bytes){
      let storage = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
      storage.init();
    }
    // Setup output steram
    let oStream = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
    oStream.init(os, "UTF-8", 1024, "?".charCodeAt(0));
    this.outputStream = oStream;

    let binOutStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
    binOutStream.setOutputStream(os);
    this.binOut = binOutStream;

    this.shell = new Shell(this);
    this.buffer = new Buffer();

    telnetOption.create(this, "WILL","SGA").send();
    telnetOption.create(this, "WILL","ECHO").send();
    telnetOption.create(this, "DONT","ECHO").send();
    telnetOption.create(this, "DO","LINEMODE").send();
  }, /// }}}
  option: {
    ECHO: false,
    SGA: false
  },
  code: [
    "NUL","SOH","STX","ETX","EOT","ENQ","ACK","BEL","BS", "HT",
    "LF", "VT", "NP", "CR", "SO", "SI", "DLE","DC1","DC2","DC3",
    "DC4","NAK","SYN","ETB","CAN","EM", "SUB","ESC","FS", "GS",
    "RS", "US"
  ],
  onInput :function TS_onInput(bytes){
    //let a = [("00" + i).slice(-2) for each(i in str.map(function($_) $_.toString(16).toUpperCase()))];
    let index = this.buffer.bytes.length;
    let mode = 0;
    let buf = [];
    for (let i=0, len=bytes.length; i < len; i++){
      let byte = bytes[i];
      if (byte < 32){
        if (buf.length > 0){
          this.buffer.add(buf.splice(0));
        }
        switch(this.code[byte]){
          case "ETX": // 0x03 ^C
          case "EOT": // 0x04 ^D
          case "HT": // 0x09 Tab
            if (this.shell.onKey(this.code[byte])) return;
            break;
          case "CR": // 0x0D
            if (bytes[i+1] == 0x00 || bytes[i+1] == 0x0A){
              i++;
              this.print("\r\n");
              if (this.buffer.bytes.length > 0){
                this.shell.exec(this.buffer.toString());
                //this.binPrint(this.buffer.bytes);
                this.print("\r\n");
              }
              this.prompt();
              this.buffer.clear();
            }
            break;
          case "ESC":
            if (bytes[i+1]== 0x5B /* [ */){
              i++;
              mode = 1;
            }
            break;
          case "BS":
            let delLen = this.buffer.back();
            if (delLen){
              this.buffer.delete();
              if (this.option.ECHO){
                this.print(this.VT100.delLine + "\r")
                this.prompt();
                this.binPrint(this.buffer.bytes);
              }
            }
            break;
        }
      } else if (mode){
        let char = String.fromCharCode(byte);
        switch(char){
          case "A": //up
            this.shell.onKey("KEY_UP");
            break;
          case "B": //down
            this.shell.onKey("KEY_DOWN");
            break;
          case "C": //right
            this.buffer.forward() && this.binPrint([0x1B,0x5B,0x43]);
            break;
          case "D": //left
            this.buffer.back() && this.binPrint([0x1B,0x5B,0x44]);
            break;
          case "3":
            if (bytes[i+1] == 0x7E /* ~ */){
              i++;
              this.print(this.VT100.delChar);
            }
        }
        mode = 0;
      } else if (byte == 127){
        if (buf.length > 0){
          this.buffer.add(buf.splice(0));
        }
        let delLen = this.buffer.back();
        if (delLen){
          this.buffer.delete();
          if (this.option.ECHO){
            this.print(this.VT100.delLine + "\r");
            this.prompt();
            this.binPrint(this.buffer.bytes);
          }
        }
      } else {
        buf.push(byte);
      }
    }
    if (buf.length > 0){
      this.buffer.add(buf);
    }
    if (this.buffer.bytes.length > index && this.option.ECHO){
      this.binPrint(this.buffer.bytes.slice(index));
    }
  },
  binPrint: function TS_binaryPrint(bytes){
    if (!(bytes instanceof Array)) return;
    try {
      this.binOut.writeByteArray(bytes, bytes.length);
    } catch(e){ }
  },
  print: function TS_out(str){
    try {
      this.outputStream.writeString(str);
    } catch(e){}
  },
  toUTF16: function(str, sep){
    return ["\\u"+("0000" + str.charCodeAt(i).toString(16)).slice(-4) for (i in str)].join(sep);
  },
  prompt:function TS_prompt(){
    this.shell.prompt(">>> ");
  },
  quit: function TS_quit(){
    log("session quiting...");
    this.binIn.close();
    this.inputStream.close();
    this.binOut.close();
    this.outputStream.close();
    return true;
  },
  VT100: {
    delChar: "\0330[P",
    delLine: "\33[M",
    clear: "\033[H\033[2J",
    newScreen: "\0337\033[?47h",
    exitScreen: "\033[?47l\0338",
    color: function(color, bgColor){ // {{{
      let c, bg;
      let str = "\033[";
      switch(color){
        case "black":   c = "30"; break;
        case "red":     c = "31"; break;
        case "green":   c = "32"; break;
        case "yellow":  c = "33"; break;
        case "blue":    c = "34"; break;
        case "magenta": c = "35"; break;
        case "cyan":    c = "36"; break;
        case "white":   c = "37"; break;
        case "reset":   c = "00"; break;
      }
      switch (bgColor){
        case "black":   bg = "40"; break;
        case "red":     bg = "41"; break;
        case "green":   bg = "42"; break;
        case "yellow":  bg = "43"; break;
        case "blue":    bg = "44"; break;
        case "magenta": bg = "45"; break;
        case "cyan":    bg = "46"; break;
        case "white":   bg = "47"; break;
        case "reset":   bg = "00"; break;
      }
      if (c && bg){
        str += c + ";" + bg;
      } else if (c){
        str += c;
      } else if (bg){
        str += bg;
      }
      return str + "m";
    }, // }}}
    cursor: function(x, y){
      return "\033[" + y + ";" + x + "H";
    },
    cursorX: function(x){
      return "\033[" + x + "G";
    }
  },
  clear: function TS_claer(){
    this.print("\033[H\033[2J");
  },
}; // }}}

// --------------------------------------------------------
// Buffer
// -----------------------------------------------------{{{
let Buffer = (function(){
  function L(string){
    return decodeURIComponent(escape(string));
  }
  function toByteArray(str){
    var a=[];
    for (var i=0, len=str.length; i<len; i++){
      a.push(str.charCodeAt(i));
    }
    return a;
  }
  function getByteLength(str){
    return encodeURI(str).replace(/%(..)/g, "@").length;
  }
  function B(){}
  B.prototype = {
    bytes: [],
    stringPosition: 0,
    clear: function(){
      this.bytes = [];
      this.stringPosition = 0;
    },
    get bytePosition(){
      var str = this.toString().slice(0,this.stringPosition);
      return getByteLength(str);
    },
    add: function(bytes){
      var str;
      if (typeof bytes == "string"){
        str = L(bytes);
        bytes= toByteArray(bytes);
      } else if (bytes instanceof Array){
        str = this.toString(bytes);
      }
      var buf = this.bytes.splice(this.bytePosition);
      this.stringPosition += str.length;
      this.bytes = this.bytes.concat(bytes, buf);
    },
    delete: function(){
      var strs = this.toString().split("")
      var pre = strs.splice(0, this.stringPosition);
      var delStr = strs.shift();
      var len = getByteLength(delStr[0]),
          start = getByteLength(pre.join(""));
      return this.bytes.splice(start, len);
    },
    back: function(){
      if (this.stringPosition > 0){
        let p = this.bytePosition;
        this.stringPosition--;
        return p - this.bytePosition;
      }
      return false;
    },
    forward: function(){
      if (this.stringPosition < this.bytes.length){
        let p = this.bytePosition;
        this.stringPosition++;
        return this.bytePosition - p;
      }
      return false;
    },
    toString: function(bytes){
      return L(unescape((bytes ? bytes : this.bytes).map(function(byte){
        return "%" + ("00" + byte.toString(16)).slice(-2);
      }).join("")));
    }
  };
  return B;
})()
// }}}

// --------------------------------------------------------
// TelnetOption
// -----------------------------------------------------{{{
let telnetOption = (function(){
  const TC = { // {{{
    SE:     {code: 0xF0, name: "SubnegotiationEnd"},
    NOP:    {code: 0xF1, name: "NOP"},
    DM:     {code: 0xF2, name: "DataMark"},
    BREAK:  {code: 0xF3, name: "BREAK"},
    IP:     {code: 0xF4, name: "InterruptProcess"},
    AO:     {code: 0xF5, name: "AbortOutput"},
    AYT:    {code: 0xF6, name: "AreYouThere", reveive: function(s){
     s.print("[YES]\r\n");
    }},
    EC:     {code: 0xF7, name: "EraseCharacter"},
    EL:     {code: 0xF8, name: "EraseLine"},
    GA:     {code: 0xF9, name: "GoAhead"},
    SB:     {code: 0xFA, name: "SubnegotiationBegin"},
    WILL:   {code: 0xFB, name: "WILL"},
    WONT:   {code: 0xFC, name: "WON'T"},
    DO:     {code: 0xFD, name: "DO"},
    DONT:   {code: 0xFE, name: "DON'T"},
    IAC:    {code: 0xFF, name: "IAC"},
  }; // }}}
  const TA = { // {{{
    BIN:    {code: 0x00, name: "Binary"},
    ECHO:   {
      code: 0x01,
      name: "ECHO",
      send: function(s, cmd){
        switch(cmd.code){
          case TC.WILL.code:
            s.option.ECHO = true;
            break;
          case TC.WONT.code:
            s.option.ECHO = false;
            break;
        }
      },
      receive: function(s, cmd){
        switch(cmd.code){
          case TC.DO.code:
            s.option.ECHO = true;
            break;
          case TC.DONT.code:
            s.option.ECHO = false;
            break;
        }
      }
    },
    SGA:    {code: 0x03, name: "SuppressGoAhead"},
    STATUS: {code: 0x05, name: "Status"},
    TIMING_MARK:   {code: 0x06, name: "TimingMark"},
    TERMINAL_TYPE: {code: 0x18, name: "TerminalType"},
    END_OF_RECODE: {code: 0x19, name: "EndOfRecode"},
    NAWS:   {code: 0x1F, name: "NegotiateAboutWindowSize"}, // http://www.faqs.org/rfcs/rfc1073.html
    LFLOW:   {code: 0x21, name: "ToggleFlowControl"},
    LINEMODE: {code: 0x22, name: "LineMode"},   // http://www.faqs.org/rfcs/rfc1184.html
    ENVIRON:  {code: 0x24, name: "Envirion"},
    NEW_ENVIRON:  {code: 0x27, name: "NewEnviron"},
    EXOPL:  {code: 0xFF, name: "ExtendedOoptionsList"},
  }; // }}}
  function getFromTable(code, table){
    for (var key in table){
      if (table[key].code == code)
        return table[key];
    }
    return null;
  }
  function getCmd(code){
    return getFromTable(code, TC);
  }
  function getAct(code){
    return getFromTable(code, TA);
  }
  function TelnetOption(){ this.init.apply(this, arguments); }
  TelnetOption.prototype = { // {{{
    init: function(session, cmd, act, option){
      this.session = session;
      this.cmd = null;
      this.act = null;
      this.option = null;
      if (typeof cmd == "number"){
        this.cmd = getCmd(cmd);
      } else if (typeof cmd == "string" && cmd in TC){
        this.cmd = TC[cmd];
      }
      if (typeof act == "number"){
        this.act = getAct(act);
      } else if (typeof act == "string" && act in TA){
        this.act = TA[act];
      }
      if (this.cmd.code == TC.SB.code && option){
        this.option = option;
      }
    },
    send: function(){
      log("SEND: " + this.toString());
      this.session.binPrint(this.toByteArray());
      if (this.act && this.act.send)
        this.act.send(this.session, this.cmd, this.option);
      else if (this.cmd && this.cmd.send)
        this.cmd.send(this.session);
    },
    receive: function(){
      log("RCVD: " + this.toString());
      let resBytes;
      if (this.act && this.act.receive)
        resBytes = this.act.receive(this.session, this.cmd, this.option);
      else if (this.cmd && this.cmd.receive)
        resBytes = this.cmd.receive(this.session);

      return resBytes;
    },
    toByteArray: function(){
      var bytes = [TC.IAC.code];
      bytes.push(this.cmd.code);
      if (this.act){
        bytes.push(this.act.code);
        // SubnegitionBeginだった場合はoptionとSubnegtiationEndを付加
        if (this.cmd.code == TC.SB.code && this.option){
          bytes = bytes.concat(this.option, [TC.IAC.code, TC.SE.code]);
        }
      }
      return bytes;
    },
    toString: function(){
      var str = ["IAC"];
      str.push(this.cmd.name);
      if (this.act){
        str.push(this.act.name);
        if (this.cmd.code == TC.SB.code && this.option){
          str.push(this.option.join(" "));
          str.push("IAC");
          str.push(TC.SE.name);
        }
      }
      return str.join(" ");
    },
  }; // }}}

  let self = {
    parse: function TO_parse(bytes, session){ // {{{
      var strBytes = [], telnetOptions = [];
      var mode = 0;
      var cmd = null, act = null, subnegoBytes = [];
      var byte;
      var i = 0, len = bytes.length;
      for (; i < len; i++){
        byte = bytes[i];
        switch (mode){
          case 1: // after IAC
            cmd = byte;
            switch (byte){
              case 0xFA: //TC.SB:
                mode = 3
                break;
              case 0xFB: //WILL:
              case 0xFC: //WONT:
              case 0xFD: //DO:
              case 0xFE: //DONT:
                mode = 2;
                break;
              case 0xF2:
              case 0xF3:
              case 0xF4:
              case 0xF5:
              case 0xF6:
              case 0xF7:
              case 0xF8:
              case 0xF9:
                opt = new TelnetOption(session, cmd);
                opt.receive();
                mode = 0;
                break;
              case 0xF1: //NOP
              defalt:
                mode = 0;
            }
            break;
          case 2: // after TELNET CMD
            opt = new TelnetOption(session, cmd, byte);
            opt.receive();
            //telnetOptions.push(opt);
            mode = 0;
            break;
          case 3: // Subnegotiation ACT
            act = byte;
            mode = 4;
            break;
          case 4: // Subnetotiation DATA
            if (byte == 0xFF && (bytes[i+1] && bytes[i+1] == 0xF0)){
              i++;
              opt = new TelnetOption(session, cmd, act, subnegoBytes);
              opt.receive();
              //telnetOptions.push(opt);
              mode = 0;
              subnegoBytes = [];
            } else {
              subnegoBytes.push(byte);
            }
            break;
          case 0:
          default:
            if (byte == 0xFF){
              mode = 1;
              continue;
            }
            strBytes.push(byte);
        }
      }
      //return [strBytes, telnetOptions];
      return strBytes;
    }, // }}}
    create: function(session, cmd, act, opt){
      return new TelnetOption(session, cmd,act,opt);
    }
  };
  return self;
})(); // }}}


// --------------------------------------------------------
// Shell
// -----------------------------------------------------{{{
let Shell = (function(){
  function ENV(){}
  ENV.prototype = {
    PWD: "/",
    PS1: "$ ",
    PS2: "> ",
    COLUMNS: 80,
    LINES: 40,
    option: {
      ignore_eof: false,
    }
  };
  function History(){} // {{{
  History.prototype = {
    list: [],
    index: 0,
    max: 20,
    add: function(line){
      if (this.list.length == this.max){
        this.list.shift();
      }
      this.index = this.list.push(line);
    },
    getPrev: function(){
      this.index = this.index > 1 ? this.index-1 : 0;
      return this.list[this.index];
    },
    getNext: function(){
      this.index = this.index < this.max ? this.index+1 : this.max;
      return this.list[this.index];
    }
  }; // }}}
  function SH(){ this.init.apply(this, arguments); }
  SH.prototype = {
    init: function(session){
      this.session = session;
      this.env = new ENV();
      this.history = new History();
      this.print();
      this.prompt();
    },
    exec: function(str){
      log("Excec: " + str);
      this.print(str);
    },
    onKey: function(evtName){
      switch(evtName){
        case "ETX":
          this.print("^C\r\n");
          this.session.buffer.clear();
          this.prompt();
          return true;
        case "EOT":
          this.print("^D\r\n");
          this.quit();
          return true;
        case "HT":
          this.print("^I");
          break;
        case "KEY_UP":
        case "KEY_DOWN":
          break;
      }
      return false;
    },
    prompt: function(){
      this.print(this.env.PS1);
    },
    quit: function(){
      this.print("\r\nbye ...\r\n");
      this.session.quit();
    },
    print: function(str){
      this.session.print(str);
    }
  };
  return SH;
})();
// }}}

let self = {
  start: function(port){
    if (!port) port = 4444;
    daemon.start(port);
  },
  stop: function(){
    daemon.stop();
  },
  get daemon(){
    return daemon;
  },
  get sessions(){
    return sessions;
  }
};
return self;

})();
function onUnload(){
	liberator.plugins.telnetd.stop();
}
liberator.plugins.telnetd.start();

// vim: sw=2 ts=2 et fdm=marker:
