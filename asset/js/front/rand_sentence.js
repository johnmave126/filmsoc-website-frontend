/**
 * @fileoverview Model used in front end.
 */

cr.define('OneSentence', function() {
  'use strict';

  /**
   * Load random one sentence and display it
   */
  function Initialization() {
    var r = new cr.APIRequest(cr.model.OneSentence, 'GET', '/rand/', true);
    r.onload = function(e) {
      var sentence_container = $('onesentence');
      sentence_container.querySelector('span').textContent = e.recObj.content;
      sentence_container.setAttribute('tooltip', 'From: ' + cr.ui.template.escapeAttr(e.recObj.film));
    };
    r.onerror = function(e) {/* Dismiss */};
    r.send();
  }

  return {
    Initialization: Initialization,
  }
});

document.addEventListener('DOMContentLoaded',
                          OneSentence.Initialization);