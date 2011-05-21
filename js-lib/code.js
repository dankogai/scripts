
window.addEventListener("DOMContentLoaded", function () {
  window.removeEventListener("DOMContentLoaded", arguments.callee, false);
  var scripts = document.body.getElementsByTagName("script");
  var pre = document.createElement("pre");
  var scriptText = "";
  for (var i = 0, len = scripts.length; i < len; ++i) {
    scriptText += scripts[0].text;
  }
  pre.textContent = scriptText;
  document.body.appendChild(pre);
}, false);

