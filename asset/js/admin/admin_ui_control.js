/**
 * @fileoverview Some utility of container.
 */

cr.define('cr.ui', function() {
  'use strict';
  /**
   * Replace the content of main container.
   * @param {Function|HTMLElement} repl The new content
   */
  function replaceContent(repl) {
    var container = $('main-container');
    container.classList.add('loading');
    if (repl instanceof HTMLElement || repl instanceof DocumentFragment) {
      setTimeout(function() {
        container.setAttribute("hidden", true);
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(repl);
        container.removeAttribute("hidden");
        container.classList.remove('loading');
      }, 180);
    }
    else if (repl instanceof Function) {
      setTimeout(function() {
        container.setAttribute("hidden", true);
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        repl(container);
        container.removeAttribute("hidden");
        container.classList.remove('loading');
      }, 180);
    }
    else {
      container.classList.remove('loading');
      assert(false, "Error processing content");
    }
  }

  /**
   * Handles page initialization.
   */
  function controlInitialization() {
    var navigationItems = document.querySelectorAll('li:not(.space)');

    for (var i = 0; i < navigationItems.length; ++i) {
      navigationItems[i].addEventListener('click', onNavItemClicked);
    }
  }

  /**
   * Handles clicks on the navigation controls (switches the page and updates
   * the URL).
   * @param {Event} e The click event.
   */
  function onNavItemClicked(e) {
    // If space skip
    if (e.currentTarget.classList.contains('space'))
      return;
    // Though pointer-event: none; is applied to the .selected nav item, users
    // can still tab to them and press enter/space which simulates a click.
    if (!e.currentTarget.classList.contains('selected'))
      setSelection(e.currentTarget);
    var control = e.currentTarget.getAttribute('controls');

    routerManager.pushState(control + '/', false, false);
  }

  /**
   * Changes the selected nav control.
   * @param {string} name Name of page to change.
   */
  function changeSelection(name) {
    var navItem =
        document.querySelector('li[controls="' + name + '"]');
    setSelection(navItem);
  }

  /**
   * Sets selection on the given nav item.
   * @param {HTMLElement} newSelection The item to be selected.
   */
  function setSelection(newSelection) {
    var lastSelectedNavItem = document.querySelector('li.selected');
    if (lastSelectedNavItem !== newSelection) {
      newSelection.classList.add('selected');
      if (lastSelectedNavItem)
        lastSelectedNavItem.classList.remove('selected');
    }
  }

  /**
   * Set a container to display loading
   * @param {HTMLElement} elem The element to display loading
   */
  function displayLoading(elem) {
    var chd = elem.querySelectorAll('.temp-loading'),
        d = createElementWithClassName('div', 'temp-loading');
    if (chd.length > 0) {
      return;
    }
    d.innerHTML = "<div class=\"throbber\"></div><span>Loading...</span>";
    elem.setAttribute("hidden", true);
    elem.appendChild(d);
    elem.removeAttribute("hidden");
  }

  /**
   * Remove loading pattern
   * @param {HTMLElement} elem The element to cancel loading
   */
  function removeLoading(elem) {
    var chd = elem.querySelectorAll('.temp-loading');
    elem.setAttribute("hidden", true);
    for (var i = 0; i < chd.length; i++) {
      elem.removeChild(chd[i]);
    }
    elem.removeAttribute("hidden");
  }


  /**
   * Handle keydown of Loading.
   */
  function loadingListener(e) {
    if (e.keyCode == 27) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
    }
    return false;
  }

  /**
   * Show Loading and swallow all escape key.
   */
  function showLoading() {
    cr.ui.overlay.showOverlay($('loadingOverlay'));
    window.addEventListener('keydown', loadingListener, true);
  }

  /**
   * Hide Loading and recover all escape key.
   */
  function hideLoading() {
    window.removeEventListener('keydown', loadingListener);
    cr.dispatchSimpleEvent($('loadingOverlay'), 'cancelOverlay');
  }

  /**
   * Reset multiuse overlay.
   */
  function resetMultiuse() {
    var overlay = $('multiuseOverlay');
    overlay.querySelector('h1').innerHTML = '&nbsp;';
    overlay.querySelector('.content-area').innerHTML = '';
    $('multiuse-button1').setAttribute('hidden', 'true');
    $('multiuse-button2').setAttribute('hidden', 'true');
    $('multiuse-button3').setAttribute('hidden', 'true');
    if (overlay.eventTracker) {
      overlay.eventTracker.removeAll();
    }
    else {
      overlay.eventTracker = new EventTracker;
    }
  }

  return {
    replaceContent: replaceContent,
    controlInitialization: controlInitialization,
    changeSelection: changeSelection,
    displayLoading: displayLoading,
    removeLoading: removeLoading,
    showLoading: showLoading,
    hideLoading: hideLoading,
    resetMultiuse: resetMultiuse,
  };
});

document.addEventListener('DOMContentLoaded',
                          cr.ui.controlInitialization);
