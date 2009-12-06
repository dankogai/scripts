

let test = {
  io: function test_IO(){
    print("PWD   : " + io.PWD.path);
    print("./    : " + io.File("./").path);
    print("HOME  : " + io.HOME.path);
    print("~/abc : " + io.File("~/abc").path);
    print("../   : " + io.File("../../xulrunner").path);

    print("TMP   : " + io.getDirectory("TmpD").path);

    print("DireList PWD: " + [d.leafName for (d in io.readDirectory(io.PWD))]);
  },
  net: function test_NET(){
    print("URI     : " + net.newURI("http://www.example.com").spec);
    print("fileURI : "+ net.newFileURI("~/hoge").spec);
  }
};

(function init(){
  for (let k in test){
    print("==================================");
    print("Test " + k);
    print("==================================");
    test[k]();
  }
})();

// vim: sw=2 st=2 et:

