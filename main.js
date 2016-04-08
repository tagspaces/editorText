/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */
 /* globals marked */

"use strict";

//var require;
var keys;
var isViewerMode;
var contentLoaded = false;
var extensionDirectory;
var extensionID;
var filePath;
var cmEditor;

function setContent(content, TSCORE, done) {
  //console.log("editorText Content: "+content);
  contentLoaded = false;
  
  var fileExt = filePath.substring(filePath.lastIndexOf(".") + 1, filePath.length).toLowerCase();
  
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
  
  
  var mode = filetype[fileExt];
  var modePath;
  if (mode) {
    modePath = extensionDirectory + "/libs/codemirror/mode/" + mode + "/" + mode;
  }    
  
  $('#aboutExtensionModal').on('show.bs.modal', function() {
    $.ajax({
      url: 'README.md',
      type: 'GET'
    })
    .done(function(mdData) {
      //console.log("DATA: " + mdData);
      if (marked) {
        var modalBody = $("#aboutExtensionModal .modal-body");
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


  function handleLinks($element) {
    $element.find("a[href]").each(function() {
      var currentSrc = $(this).attr("href");
      var path;
      $(this).bind('click', function(e) {
        e.preventDefault();
        if (path) {
          currentSrc = encodeURIComponent(path);
        }
        var msg = {command: "openLinkExternally", link : currentSrc};
        window.parent.postMessage(JSON.stringify(msg), "*");
      });
    });
  }   
  
  
  require([
    extensionDirectory + '/libs/codemirror/lib/codemirror',
    //extensionDirectory + '/libs/codemirror/addon/search/search',
    //extensionDirectory + '/libs/codemirror/addon/search/searchcursor',
    modePath,
    'css!' + extensionDirectory + '/libs/codemirror/lib/codemirror.css',
    'css!' + extensionDirectory + '/extension.css'
  ], function(CodeMirror) {
    var cursorBlinkRate = isViewerMode ? -1 : 530; // disabling the blinking cursor in readonly mode
    var lineNumbers = !isViewerMode;
    //var saveKB = convertMouseTrapToCodeMirrorKeyBindings(TSCORE.Config.getSaveDocumentKeyBinding());

    //cmEditor = new CodeMirror(document.getElementById("code"), {
    cmEditor = new CodeMirror(document.getElementById(extensionID), {  
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
    
    //console.log("Content: "+content);
    var UTF8_BOM = "\ufeff";
    if (content.indexOf(UTF8_BOM) === 0) {
      content = content.substring(1, content.length);
    }
    cmEditor.setValue(content);
    cmEditor.clearHistory();
    cmEditor.refresh();  
  });
  
  contentLoaded = true;
 
}


function Init() {
  var isCordova;
  var isWin;
  var isWeb;
  
  var $htmlContent;  
  
  //alert("document.ready");
  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(window.parent.location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var locale = getParameterByName("locale");

  var extSettings;
  loadExtSettings();

  isCordova = parent.isCordova;
  isWin = parent.isWin;
  isWeb = parent.isWeb;

  

  $('#aboutExtensionModal').on('show.bs.modal', function() {
    $.ajax({
      url: 'README.md',
      type: 'GET'
    })
    .done(function(mdData) {
      console.log("DATA: " + mdData);
      $("#aboutExtensionModal .modal-body").html(marked(mdData));
    })
    .fail(function(data) {
      console.warn("Loading file failed " + data);
    });
  });


  $htmlContent = $("#editorText");
  
  //alert("step-3-");
  //console.log("mhtmlViewer:" + (document.getElementById("mhtmlViewer")==null));

  //$htmlContent.removeClass();
  //$htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);

  $("#printButton").on("click", function() {
    $(".dropdown-menu").dropdown('toggle');
    try {
      console.log("#printButton click");
      window.print();
    } catch (exc) {
      console.log("Error: " + exc);
    }
  });

  if (isCordova) {
    $("#printButton").hide();
  }
  
  // Init internationalization
  $.i18n.init({
    ns: {namespaces: ['ns.editorText']},
    debug: true,
    lng: locale,
    fallbackLng: 'en_US'
  }, function() {
    $('[data-i18n]').i18n();
  });

  function saveExtSettings() {
    /*
    var settings = {
      "styleIndex": currentStyleIndex,
      "zoomState":  currentZoomState
    };
    localStorage.setItem('editorTextSettings', JSON.stringify(settings));
    */
  }

  function loadExtSettings() {
    /*
    extSettings = JSON.parse(localStorage.getItem("editorTextSettings"));
    */
  }
  

}