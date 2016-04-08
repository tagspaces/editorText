/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

define(function(require, exports, module) {
  "use strict";

  var editorContentWindow;
  var extensionID = "editorText"; // ID should be equal to the directory name where the ext. is located
  var extensionSupportedFileTypes = [
    "h", "c", "clj", "coffee", "coldfusion", "cpp",
    "cs", "css", "groovy", "haxe", "htm", "html",
    "java", "js", "jsm", "json", "latex", "less",
    "ly", "ily", "lua", "markdown", "md", "mdown",
    "mdwn", "mkd", "ml", "mli", "pl", "php",
    "powershell", "py", "rb", "scad", "scala",
    "scss", "sh", "sql", "svg", "textile", "txt", "xml"
  ];

  console.log("Loading " + extensionID);

  var TSCORE = require("tscore");  
  var extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + extensionID;
  var contentLoaded = false;
  var cmEditor;


  function init(filePath, containerElementID, isViewerMode) {
    console.log("Initalization Text Editor..." + containerElementID);
    contentLoaded = false;
   
   

    //$("#" + containerElementID).append('<div id="code" style="width: 100%; height: 100%; z-index: 0;">');
    
    var $containerElement = $("#" + containerElementID);
    var extUITmpl = Handlebars.compile(
      '<div class="flexLayoutVertical" style="width: 100%;">' +
        '<iframe id="{{id}}Viewer" sandbox="allow-same-origin allow-scripts allow-modals" style="background-color: white; border: 0px;" class="flexMaxHeight" nwdisable="" src="ext/editorText/index.html"></iframe>' +
      '</div>'
      );

    var extUI = extUITmpl({
      id: extensionID
    });
    $containerElement.append(extUI);    
    

    TSCORE.IO.loadTextFilePromise(filePath).then(function(content) {
      exports.setContent(content, filePath, isViewerMode);
    }, 
    function(error) {
      TSCORE.hideLoadingAnimation();
      TSCORE.showAlertDialog("Loading " + filePath + " failed.");
      console.error("Loading file " + filePath + " failed " + error);
    });

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

    editorContentWindow.cmEditor.readOnly = isViewerMode;
  }

  function setContent(content, filePath, isViewerMode) {    
    var contentWindow = document.getElementById(extensionID + "Viewer").contentWindow;
    if (typeof contentWindow.setContent === "function") {
      
      editorContentWindow = contentWindow;
      var keys = {};
      keys[convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getSaveDocumentKeyBinding())] = function() {
        TSCORE.FileOpener.saveFile();
      };

      keys[convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getCloseViewerKeyBinding())] = function() {
        TSCORE.FileOpener.closeFile();
      };
      
      contentWindow.require = require;
      contentWindow.keys = keys;
      contentWindow.isViewerMode = isViewerMode;
      contentWindow.filePath  = filePath;
      contentWindow.extensionID = extensionID;
      contentWindow.extensionDirectory = extensionDirectory;
      contentWindow.setContent(content, TSCORE, function(obj) {
        //$("#" + extensionID + "Meta").append("saved on " + obj.headers.date);
        contentWindow.cmEditor;         
        contentWindow.Init(); 
      });
    }    

    contentLoaded = true;
  }

  function getContent() {

    return editorContentWindow.cmEditor.getValue();
  }

  exports.init = init;
  exports.getContent = getContent;
  exports.setContent = setContent;
  exports.viewerMode = viewerMode;

});
