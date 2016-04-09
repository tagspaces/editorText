/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

define(function(require, exports, module) {
  "use strict";
  
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
  var cmEditor;
  var extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + extensionID;
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

  function init(filePath, containerElementID, isViewerMode) {
    console.log("Initalization Text Editor...");
    contentLoaded = false;

    var fileExt = filePath.substring(filePath.lastIndexOf(".") + 1, filePath.length).toLowerCase();
    
    var $containerElement = $("#" + containerElementID); 

    $containerElement.append('<div id="code" style="width: 100%; height: 100%; z-index: 0;">');
    var mode = filetype[fileExt];
    var modePath;
    if (mode) {
      modePath = extensionDirectory + "/libs/codemirror/mode/" + mode + "/" + mode;
    }

    require([
      extensionDirectory + '/libs/codemirror/lib/codemirror',
      //extensionDirectory + '/libs/codemirror/addon/search/search',
      //extensionDirectory + '/libs/codemirror/addon/search/searchcursor',
      "marked",
      "text!" + extensionDirectory + '/toolbar.html',
      modePath,                   
      'css!' + extensionDirectory + '/libs/codemirror/lib/codemirror.css',      
      'css!' + extensionDirectory + '/extension.css',
      'css!' + extensionDirectory + '/../../assets/tagspaces.css'
    ], function(CodeMirror, marked, toolbarTPL) {
      var extUITmpl = Handlebars.compile(toolbarTPL);
      var extUI = extUITmpl({
        id: extensionID
      });
      $containerElement.append(extUI);      
      
      //platformTuning();
      if (isCordova) {
        TSCORE.reLayout();
      }
      try {
        $('#' + extensionID + 'Container [data-i18n]').i18n();
        $('#aboutExtensionModalEditorText').on('show.bs.modal', function() {
          console.warn('#aboutExtensionModalEditorText click');
          $.ajax({
            url: extensionDirectory + '/README.md',
            type: 'GET'
          })
          .done(function(mdData) {
            //console.log("DATA: " + mdData);
            if (marked) {
              var modalBody = $("#aboutExtensionModalEditorText .modal-body");
              modalBody.html(marked(mdData, { sanitize: true }));
              handleLinks(modalBody);
            } else {
              console.log("markdown to html transformer not found");
            }  
          })
          .fail(function(data) {
            console.warn("Loading file failed " + data);
          });
        }); 
        
        $("#printButton").on("click", function() {          
          $(".dropdown-menu").dropdown('toggle');
          //window.print();
          printContent();
        });
      
        if (isCordova) {
          $("#printButton").hide();
        }          
        
      } catch (err) {
        console.log("Failed translating extension");
      }      
      
      
      
      var cursorBlinkRate = isViewerMode ? -1 : 530; // disabling the blinking cursor in readonly mode
      var lineNumbers = !isViewerMode;
      //var saveKB = convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getSaveDocumentKeyBinding());
      var keys = {};

      keys[convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getSaveDocumentKeyBinding())] = function() {
        TSCORE.FileOpener.saveFile();
      };

      keys[convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getCloseViewerKeyBinding())] = function() {
        TSCORE.FileOpener.closeFile();
      };

      //console.warn("#aboutButton: " +document.getElementById("aboutButton"));
      //console.warn("#aboutButton: " +template);
       

      cmEditor = new CodeMirror(document.getElementById("code"), {
        fixedGutter: false,
        mode: mode,
        lineNumbers: lineNumbers,
        lineWrapping: true,
        tabSize: 2,
        //lineSeparator: isWin ? "\n\r" : null, // TODO check under windows if content contains \n\r -> set
        collapseRange: true,
        matchBrackets: true,
        cursorBlinkRate: cursorBlinkRate,
        readOnly: isViewerMode ? "nocursor" : isViewerMode,
        autofocus: true,
        //theme: "lesser-dark",
        //extraKeys: keys // workarrounded with bindGlobal plugin for mousetrap
      });

      cmEditor.on("change", function() {
        if (contentLoaded) {
          TSCORE.FileOpener.setFileChanged(true);
        }
      });

      cmEditor.setSize("100%", "100%");
      TSCORE.IO.loadTextFilePromise(filePath).then(function(content) {
        exports.setContent(content);
      }, 
      function(error) {
        TSCORE.hideLoadingAnimation();
        TSCORE.showAlertDialog("Loading " + filePath + " failed.");
        console.error("Loading file " + filePath + " failed " + error);
      });
    });
  }

  function handleLinks($element) {
    $element.find("a[href]").each(function() {
      var currentSrc = $(this).attr("href");
      $(this).bind('click', function(e) {
        e.preventDefault();
        var msg = {command: "openLinkExternally", link : currentSrc};
        window.parent.postMessage(JSON.stringify(msg), "*");
      });
    });
  }


 
  function printContent() {
    var extUITmpl = Handlebars.compile(
      '<iframe id="printerViewer" name="printerViewer" sandbox="allow-same-origin allow-scripts allow-modals" style="background-color: white; border: 0px;display:none;" class="flexMaxHeight" nwdisable="" src=""></iframe>'
    );
    var extUI = extUITmpl({});
    if (window.frames.printerViewer) {       
      document.getElementById("viewer").removeChild(document.getElementById("printerViewer"));
    }
    $("#viewer").append(extUI);  
    var prtContent = document.getElementById("code");
    var WinPrint =  window.frames.printerViewer;											
    WinPrint.document.write("<html><head><head><body>" + prtContent.innerHTML + "</body></html>");
    WinPrint.document.close();    
    WinPrint.focus();		
    WinPrint.print();		
    document.getElementById("viewer").removeChild(document.getElementById("printerViewer"));    
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

    cmEditor.readOnly = isViewerMode;
  }

  function setContent(content) {
    //console.log("Content: "+content);
    var UTF8_BOM = "\ufeff";
    if (content.indexOf(UTF8_BOM) === 0) {
      content = content.substring(1, content.length);
    }
    cmEditor.setValue(content);
    cmEditor.clearHistory();
    cmEditor.refresh();
    contentLoaded = true;
  }

  function getContent() {

    return cmEditor.getValue();
  }

  exports.init = init;
  exports.getContent = getContent;
  exports.setContent = setContent;
  exports.viewerMode = viewerMode;

});
