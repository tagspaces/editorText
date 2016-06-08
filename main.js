/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */
/* globals JSONEditor */
/* globals marked */
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

  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem("editorTextSettings"));
  }

});

var editorText;
var isViewer = true;
var filePath;

function contentChanged() {
  //console.log('Content changed');
  var msg = {command: "contentChangedInEditor", filepath: filePath};
  window.parent.postMessage(JSON.stringify(msg), "*");
}

function setContent(content, filePath) {
  if (content !== undefined || content !== null) {
    console.log("Set Main Content");
    console.debug(content);
    console.log("--------------");
  } else {
    console.log("Undefined value");
  }

 // var cursorBlinkRate = isViewerMode ? -1 : 530; // disabling the blinking cursor in readonly mode
  //var lineNumbers = !isViewerMode;
  var contentLoaded = false;
  var $htmlContent = $("#editorText");

  var cmEditor = new CodeMirror(document.getElementById("editorText"), {
    fixedGutter: false,
    //mode: mode,
    //lineNumbers: lineNumbers,
    lineWrapping: true,
    tabSize: 2,
    //lineSeparator: isWin ? "\n\r" : null, // TODO check under windows if content contains \n\r -> set
    collapseRange: true,
    matchBrackets: true,
    //cursorBlinkRate: cursorBlinkRate,
    //readOnly: isViewerMode ? "nocursor" : isViewerMode,
    autofocus: true,
    //theme: "lesser-dark",
    //extraKeys: keys // workarrounded with bindGlobal plugin for mousetrap
  });

  console.debug(cmEditor);

  cmEditor.on("change", function() {
    if (contentLoaded) {
      //TSCORE.FileOpener.setFileChanged(true);
      console.log("cmEditor Content Changed");
    }
  });

  cmEditor.setSize("100%", "100%");

  cmEditor.setValue(content);
  cmEditor.clearHistory();
  cmEditor.refresh();

  $htmlContent.append(cmEditor);
}

//function viewerMode(isViewerMode) {
//
//  cmEditor.readOnly = isViewerMode;
//}