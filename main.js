/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */
/* globals marked, Mousetrap */
"use strict";

var isCordova;
var isWin;
var isWeb;

$(document).ready(function() {
  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var locale = getParameterByName("locale");
  var $htmlContent;
  var extSettings;
  loadExtSettings();

  isCordova = parent.isCordova;
  isWin = parent.isWin;
  isWeb = parent.isWeb;

  $(document).on('drop dragend dragenter dragover', function(event) {
    event.preventDefault();
  });

  $('#aboutExtensionModal').on('show.bs.modal', function() {
    $.ajax({
      url: 'README.md',
      type: 'GET'
    }).done(function(editorTextData) {
      //console.log("DATA: " + editorTextData);
      if (marked) {
        var modalBody = $("#aboutExtensionModal .modal-body");
        modalBody.html(marked(editorTextData, {sanitize: true}));
        handleLinks(modalBody);
      } else {
        console.log("markdown to html transformer not found");
      }
    }).fail(function(data) {
      console.warn("Loading file failed " + data);
    });
  });

  function handleLinks($element) {
    $element.find("a[href]").each(function() {
      var currentSrc = $(this).attr("href");
      $(this).bind('click', function(e) {
        e.preventDefault();
        var msg = {command: "openLinkExternally", link: currentSrc};
        window.parent.postMessage(JSON.stringify(msg), "*");
      });
    });
  }

  $("#aboutButton").on("click", function(e) {
    $("#aboutExtensionModal").modal({show: true});
  });

  $("#printButton").on("click", function(e) {
    window.print();
  });

  if (isCordova) {
    $("#printButton").hide();
  }

  $('#saveEditorText').on('click', function(e) {
    saveEditorText();
  });

  // Init internationalization
  $.i18n.init({
    ns: {namespaces: ['ns.editorText']},
    debug: true,
    lng: locale,
    fallbackLng: 'en_US'
  }, function() {
    $('[data-i18n]').i18n();
  });

  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem("editorTextSettings"));
  }

  Mousetrap.bind(['command+s', 'ctrl+s'], function(e) {
    console.log('Content save');
    saveEditorText();
    //return false;
  });

  function saveEditorText() {
    var msg = {command: "saveDocument", filepath: filePath};
    window.parent.postMessage(JSON.stringify(msg), "*");
  }

  var filePath;

  //function contentChanged() {
  //  console.log('Content changed');
  //  var msg = {command: "contentChangedInEditor", filepath: filePath};
  //  window.parent.postMessage(JSON.stringify(msg), "*");
  //}
  //
  //document.querySelector('saveDocument').addEventListener('saveDocument', function(event) {
  //  contentChanged()
  //});
});

var editorText;
var cmEditor;
function setContent(content, filePath) {

  var $htmlContent = $("#editorText");
  $htmlContent.append('<div id="code" style="width: 100%; height: 100%; z-index: 0;">');

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
  filetype.txt = "txt";

  var fileExt = filePath.substring(filePath.lastIndexOf(".") + 1, filePath.length).toLowerCase();
  console.log("File Extension");
  console.debug(fileExt);
  console.log("--------------");

  //var extensionDirectory = filePath;
  var mode = filetype[fileExt];
  console.log("Mode is : " + mode);
  var modePath;
  if (mode) {
    modePath = extensionDirectory + "/libs/codemirror/mode/" + mode + "/" + mode;
    console.debug(modePath);
  }

  var cursorBlinkRate = isViewerMode ? -1 : 530; // disabling the blinking cursor in readonly mode
  var lineNumbers = !isViewerMode;
  console.log(isViewerMode);

  var place = document.getElementById("code");
  cmEditor = new CodeMirror(place, {
    fixedGutter: false,
    mode: mode,
    styleSelectedText: true,
    styleActiveLine: true,
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    //lineSeparator: isWin ? "\n\r" : null, // TODO check under windows if content contains \n\r -> set
    collapseRange: true,
    matchBrackets: true,
    //cursorBlinkRate: cursorBlinkRate,
    //readOnly: isViewerMode ? "nocursor" : isViewerMode,
    autofocus: true
    //theme: "lesser-dark",
    //extraKeys: keys // workarrounded with bindGlobal plugin for mousetrap
  });

  CodeMirror.modeURL = "libs/codemirror/mode/%N/%N.js";
  if (mode) {
    cmEditor.setOption("mode", mode);
    CodeMirror.autoLoadMode(cmEditor, mode);
  } else {
    console.log("Invalid mode !");
  }
  console.debug(cmEditor);

  //cmEditor.on("change", function() {
  //  if (contentLoaded) {
  //    //TSCORE.FileOpener.setFileChanged(true);
  //  }
  //});

  cmEditor.setSize("100%", "100%");

  var UTF8_BOM = "\ufeff";
  if (content.indexOf(UTF8_BOM) === 0) {
    content = content.substring(1, content.length);
  }
  cmEditor.setValue(content);
  cmEditor.clearHistory();
  cmEditor.refresh();
}

function viewerMode(isViewerMode) {
  console.log("isViewerMODE");
  console.debug(isViewerMode);
  cmEditor.readOnly = isViewerMode;
}