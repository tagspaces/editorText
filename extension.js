/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

define(function(require, exports, module) {
  "use strict";

  var extensionID = "editorText"; // ID should be equal to the directory name where the ext. is located
  console.log("Loading " + extensionID);

  var TSCORE = require("tscore");
  var containerElID;
  var currentFilePath;
  var $containerElement;
  var extensionsPath = TSCORE.Config.getExtensionPath();
  var extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + extensionID;
  var cmEditor;
  var contentLoaded = false;


  var filetype = [];
  filetype.h = "clike";
  filetype.c = "clike";
  filetype.clj = "clojure";
  filetype.coffee = "coffeescript";
  filetype.cpp = "clike";
  filetype.cs = "clike";
  filetype.css = "css";
  filetype.groovy = "groovy";
  filetype.haxe = "haxe";
  filetype.htm = "xml";
  filetype.html = "xml";
  filetype.java = "clike";
  filetype.js = "javascript";
  filetype.jsm = "javascript";
  filetype.json = "javascript";
  filetype.less = "less";
  filetype.lua = "lua";
  filetype.markdown = "markdown";
  filetype.md = "markdown";
  filetype.mdown = "markdown";
  filetype.mdwn = "markdown";
  filetype.mkd = "markdown";
  filetype.ml = "ocaml";
  filetype.mli = "ocaml";
  filetype.pl = "perl";
  filetype.php = "php";
  filetype.py = "python";
  filetype.rb = "ruby";
  filetype.sh = "shell";
  filetype.sql = "sql";
  filetype.svg = "xml";
  filetype.xml = "xml";

  function init(filePath, containerElementID, isViewer) {
    console.log("Initalization Text Editor...");
    containerElementID = containerElementID;
    $containerElement = $('#' + containerElementID);

    currentFilePath = filePath;
    $containerElement.empty();
    //$containerElement.css("background-color" , "white");
    $containerElement.append($('<iframe>', {
      sandbox: "allow-same-origin allow-scripts allow-modals",
      id: "iframeViewer",
      "nwdisable": "",
      //"nwfaketop": "",
      "src": extensionDirectory + "/index.html?&locale=" + TSCORE.currentLanguage,
    }));

    TSCORE.IO.loadTextFilePromise(filePath).then(function(content) {
      setContent(content);
      viewerMode(isViewer);
    }, function(error) {
      TSCORE.hideLoadingAnimation();
      TSCORE.showAlertDialog("Loading " + filePath + " failed.");
      console.error("Loading file " + filePath + " failed " + error);
    });

    //keys[convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getSaveDocumentKeyBinding())] = function() {
    //  TSCORE.FileOpener.saveFile();
    //};
    //
    //keys[convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getCloseViewerKeyBinding())] = function() {
    //  TSCORE.FileOpener.closeFile();
    //};

    //TSCORE.IO.loadTextFilePromise(filePath).then(function(content) {
    //  exports.setContent(content);
    //},
    //function(error) {
    //  TSCORE.hideLoadingAnimation();
    //  TSCORE.showAlertDialog("Loading " + filePath + " failed.");
    //  console.error("Loading file " + filePath + " failed " + error);
    //});
    //});
  }

  // Converts mod+s to Ctrl+S
  function convertMouseTrapToCodeMirrorKeyBindings(keyBinding) {
    if (keyBinding.indexOf("+") < 0) {
      return;
    }
    var key = keyBinding.split("+");
    if (key[0] === "mod") {
      isOSX ? key[0] = "cmd" : key[0] = "ctrl";
    }
    key[0] = key[0].charAt(0).toUpperCase() + key[0].slice(1);
    return key[0] + "-" + key[1].toUpperCase();
  }

  function viewerMode(isViewerMode) {
    var contentWindow = document.getElementById("iframeViewer").contentWindow;
    if (typeof contentWindow.viewerMode === "function") {
      contentWindow.viewerMode(isViewerMode);
    } else {
      window.setTimeout(function() {
        if (typeof contentWindow.viewerMode === "function") {
          contentWindow.viewerMode(isViewerMode);
        }
      } , 500);
    }
    //cmEditor.readOnly = isViewerMode;
  }

  function setContent(content, isViewerMode) {
    console.log("Extension content");
    console.debug(content);
    console.log("--------------");

    var UTF8_BOM = "\ufeff";
    if (content.indexOf(UTF8_BOM) === 0) {
      content = content.substring(1, content.length);
    }

    var contentWindow = document.getElementById("iframeViewer").contentWindow;
    if (typeof contentWindow.setContent === "function") {
      console.log(content);
      contentWindow.require = require;
      //contentWindow.keys = keys;
      contentWindow.isViewerMode = isViewerMode;
      contentWindow.extensionDirectory = extensionDirectory;
      contentWindow.setContent(content , currentFilePath);
    } else {
      window.setTimeout(function() {
        if (typeof contentWindow.setContent === "function") {
          contentWindow.setContent(content);
        }
      } , 500);
    }
    /*    cmEditor.setValue(content);
     cmEditor.clearHistory();
     cmEditor.refresh();
     contentLoaded = true;*/
  }

  function getContent() {

    return cmEditor.getValue();
  }

  exports.init = init;
  exports.getContent = getContent;
  exports.setContent = setContent;
  exports.viewerMode = viewerMode;

});

