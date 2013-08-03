/**
 * @fileoverview Some utility of ui.
 */

cr.define('cr.ui', function() {
  'use strict';

  /**
   * Replace the content of main container.
   * @param {Function|HTMLElement} repl The new content
   * @param {Function} callback The callback after replacement
   */
  function replaceContent(repl, callback) {
    var container = $('content-wrapper');
    container.classList.add('loading');
    if (repl instanceof HTMLElement || repl instanceof DocumentFragment) {
      setTimeout(function() {
        container.setAttribute("hidden", true);
        while (container.firstChild) {
        	container.removeChild(container.firstChild);
        }
        container.appendChild(repl);
        container.removeAttribute("hidden");
        //Force commit
        setTimeout(function() {
          container.classList.remove('loading');
        }, 0);
        if (callback) {
          callback();
        }
      }, cr.view.name ? 210 : 0);
    }
    else if (repl instanceof Function) {
      setTimeout(function() {
        container.setAttribute("hidden", true);
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        repl(container);
        container.removeAttribute("hidden");
        //Force commit
        setTimeout(function() {
          container.classList.remove('loading');
        }, 0);
        if (callback) {
          callback();
        }
      }, cr.view.name ? 210 : 0);
    }
    else {
      container.classList.remove('loading');
      assert(false, "Error processing content");
    }
  }

  /**
   * Changes the selected nav control.
   * @param {string} name Name of page to change.
   */
  function changeSelection(name) {
    var navItem =
        document.querySelector('#footer a[controls="' + name + '"]');
    setSelection(navItem);
  }

  /**
   * Sets selection on the given nav item.
   * @param {HTMLElement} newSelection The item to be selected.
   */
  function setSelection(newSelection) {
    var lastSelectedNavItem = document.querySelector('#footer a.selected');
    if (lastSelectedNavItem !== newSelection) {
      newSelection.classList.add('selected');
      if (lastSelectedNavItem)
        lastSelectedNavItem.classList.remove('selected');
    }
  }

  return {
    replaceContent: replaceContent,
    changeSelection: changeSelection,
    setSelection: setSelection,
  };
});
