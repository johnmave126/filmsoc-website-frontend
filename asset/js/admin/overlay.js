// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Provides dialog-like behaviors for the tracing UI.
 */
cr.define('cr.ui.overlay', function() {

  /**
   * Gets the top, visible overlay. It makes the assumption that if multiple
   * overlays are visible, the last in the byte order is topmost.
   * TODO(estade): rely on aria-visibility instead?
   * @return {HTMLElement} The overlay.
   */
  function getTopOverlay() {
    var overlays = document.querySelectorAll('.overlay:not([hidden])');
    return overlays[overlays.length - 1];
  }

  /**
   * Returns a visible default button of the overlay, if it has one. If the
   * overlay has more than one, the first one will be returned.
   *
   * @param {HTMLElement} overlay The .overlay.
   * @return {HTMLElement} The default button.
   */
  function getDefaultButton(overlay) {
    function isHidden(node) { return node.hidden; }
    var defaultButtons =
        overlay.querySelectorAll('.page .button-strip > .default-button');
    for (var i = 0; i < defaultButtons.length; i++) {
      if (!findAncestor(defaultButtons[i], isHidden))
        return defaultButtons[i];
    }
    return null;
  }

  /**
   * Makes initializations which must hook at the document level.
   */
  function globalInitialization() {
    document.addEventListener('keydown', function(e) {
      var overlay = getTopOverlay();
      if (!overlay)
        return;

      // Close the overlay on escape.
      if (e.keyCode == 27)  // Escape
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');

      // Execute the overlay's default button on enter, unless focus is on an
      // element that has standard behavior for the enter key.
      var forbiddenTagNames = /^(A|BUTTON|SELECT|TEXTAREA)$/;
      if (e.keyIdentifier == 'Enter' &&
          !forbiddenTagNames.test(document.activeElement.tagName)) {
        var button = getDefaultButton(overlay);
        if (button)
          button.click();
      }
    });

    window.addEventListener('resize', setMaxHeightAllPages);

    setMaxHeightAllPages();
  }

  /**
   * Sets the max-height of all pages in all overlays, based on the window
   * height.
   */
  function setMaxHeightAllPages() {
    var pages = document.querySelectorAll('.overlay .page');

    var maxHeight = Math.min(0.9 * window.innerHeight, 640) + 'px';
    for (var i = 0; i < pages.length; i++)
      pages[i].style.maxHeight = maxHeight;
  }

  /**
   * Adds behavioral hooks for the given overlay.
   * @param {HTMLElement} overlay The .overlay.
   */
  function setupOverlay(overlay) {
    // Close the overlay on clicking any of the pages' close buttons.
    var closeButtons = overlay.querySelectorAll('.page > .close-button');
    for (var i = 0; i < closeButtons.length; i++) {
      closeButtons[i].addEventListener('click', function(e) {
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
      });
    }
    overlay.addEventListener('cancelOverlay', hideOverlay, true);

    var pages = overlay.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      // Remove the 'pulse' animation any time the overlay is hidden or shown.
      pages[i].__defineSetter__('hidden', function(value) {
        if (value)
          this.setAttribute('hidden', true);
        else
          this.removeAttribute('hidden');
      });
      pages[i].__defineGetter__('hidden', function() {
        return this.hasAttribute('hidden');
      });
    }

    // Remove the 'pulse' animation any time the overlay is hidden or shown.
    overlay.__defineSetter__('hidden', function(value) {
      this.classList.remove('pulse');
      if (value)
        this.setAttribute('hidden', true);
      else
        this.removeAttribute('hidden');
    });
    overlay.__defineGetter__('hidden', function() {
      return this.hasAttribute('hidden');
    });

    // Shake when the user clicks away.
    overlay.addEventListener('click', function(e) {
      // Only pulse if the overlay was the target of the click.
      if (this != e.target)
        return;

      // This may be null while the overlay is closing.
      var overlayPage = this.querySelector('.page:not([hidden])');
      if (overlayPage)
        overlayPage.classList.add('pulse');
    });
    overlay.addEventListener('webkitAnimationEnd', function(e) {
      e.target.classList.remove('pulse');
    });
    overlay.addEventListener('MSAnimationEnd', function(e) {
      e.target.classList.remove('pulse');
    });
    overlay.addEventListener('oAnimationEnd', function(e) {
      e.target.classList.remove('pulse');
    });
    overlay.addEventListener('animationend', function(e) {
      e.target.classList.remove('pulse');
    });
  }

  /**
   * Adds behavioral hooks for the given page.
   * @param {HTMLElement} page The .page.
   */
  function setupPage(page) {
    // Close the overlay on clicking any of the pages' close buttons.
    var closeButtons = page.querySelectorAll('.close-button');
    for (var i = 0; i < closeButtons.length; i++) {
      closeButtons[i].addEventListener('click', function(e) {
        cr.dispatchSimpleEvent(page.parentNode, 'cancelOverlay');
      });
    }

    // Remove the 'pulse' animation any time the overlay is hidden or shown.
    page.__defineSetter__('hidden', function(value) {
      if (value)
        this.setAttribute('hidden', true);
      else
        this.removeAttribute('hidden');
    });
    page.__defineGetter__('hidden', function() {
      return this.hasAttribute('hidden');
    });
  }

  /**
   * Show an overlay.
   * @param {HTMLElement} page The .page.
   */
  function showOverlay(page) {
    assert(page);
    // Close other page on the same overlay.
    var overlay = page.parentNode,
        showing = overlay.querySelector('.page:not([hidden])');
    if (showing === page) {
      return;
    }
    if (showing) {
      showing.hidden = true;
    }
    overlay.hidden = false;
    overlay.classList.remove('transparent');
    page.hidden = false;
    page.classList.add('pulse');
    document.body.classList.add('hideflow');
  }

  /**
   * Hide an overlay.
   */
  function hideOverlay(e) {
    assert(e.target);
    // Close other page on the same overlay.
    var overlay = findAncestor(e.target, function(elem) {return elem.classList.contains('overlay');});
    assert(overlay);
    var listener = function(ev) {
      if (!ev.target.classList.contains('overlay')) {
        //capture self only
        return;
      }
      if (e.target.classList.contains('page')) {
        e.target.hidden = true;
      }
      else {
        var visible_children = ev.target.querySelectorAll('.page:not([hidden])');
        for (var i = 0; i < visible_children.length; i++) {
          visible_children[i].hidden = true;
        }
      }
      if (!ev.target.querySelector('.page:not([hidden])')) {
        //Clear overlay
        ev.target.hidden = true;
        if (!document.body.querySelector('.overlay:not([hidden])')) {
          //No overlay now
          document.body.classList.remove('hideflow');
        }
      }
      ev.target.removeEventListener('webkitAnimationEnd', listener);
      ev.target.removeEventListener('MSAnimationEnd', listener);
      ev.target.removeEventListener('oAnimationEnd', listener);
      ev.target.removeEventListener('animationend', listener);
    };
    overlay.addEventListener('webkitAnimationEnd', listener, false);
    overlay.addEventListener('MSAnimationEnd', listener, false);
    overlay.addEventListener('oAnimationEnd', listener, false);
    overlay.addEventListener('animationend', listener, false);
    overlay.classList.remove('transparent');
    setTimeout(function() {
      overlay.classList.add('transparent')
    }, 0);
  }

  return {
    globalInitialization: globalInitialization,
    setupOverlay: setupOverlay,
    setupPage: setupPage,
    showOverlay: showOverlay,
    hideOverlay: hideOverlay,
  };
});

document.addEventListener('DOMContentLoaded',
                          cr.ui.overlay.globalInitialization);
