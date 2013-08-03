// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.define('cr.ui', function() {

  /**
   * Decorates elements as an instance of a class.
   * @param {string|!Element} source The way to find the element(s) to decorate.
   *     If this is a string then {@code querySeletorAll} is used to find the
   *     elements to decorate.
   * @param {!Function} constr The constructor to decorate with. The constr
   *     needs to have a {@code decorate} function.
   */
  function decorate(source, constr) {
    var elements;
    if (typeof source == 'string')
      elements = cr.doc.querySelectorAll(source);
    else
      elements = [source];

    for (var i = 0, el; el = elements[i]; i++) {
      if (!(el instanceof constr))
        constr.decorate(el);
    }
  }

  /**
   * Helper function for creating new element for define.
   */
  function createElementHelper(tagName, opt_bag) {
    // Allow passing in ownerDocument to create in a different document.
    var doc;
    if (opt_bag && opt_bag.ownerDocument)
      doc = opt_bag.ownerDocument;
    else
      doc = cr.doc;
    return doc.createElement(tagName);
  }

  /**
   * Creates the constructor for a UI element class.
   *
   * Usage:
   * <pre>
   * var List = cr.ui.define('list');
   * List.prototype = {
   *   __proto__: HTMLUListElement.prototype,
   *   decorate: function() {
   *     ...
   *   },
   *   ...
   * };
   * </pre>
   *
   * @param {string|Function} tagNameOrFunction The tagName or
   *     function to use for newly created elements. If this is a function it
   *     needs to return a new element when called.
   * @return {function(Object=):Element} The constructor function which takes
   *     an optional property bag. The function also has a static
   *     {@code decorate} method added to it.
   */
  function define(tagNameOrFunction) {
    var createFunction, tagName;
    if (typeof tagNameOrFunction == 'function') {
      createFunction = tagNameOrFunction;
      tagName = '';
    } else {
      createFunction = createElementHelper;
      tagName = tagNameOrFunction;
    }

    /**
     * Creates a new UI element constructor.
     * @param {Object=} opt_propertyBag Optional bag of properties to set on the
     *     object after created. The property {@code ownerDocument} is special
     *     cased and it allows you to create the element in a different
     *     document than the default.
     * @constructor
     */
    function f(opt_propertyBag) {
      var el = createFunction(tagName, opt_propertyBag);
      f.decorate(el);
      for (var propertyName in opt_propertyBag) {
        el[propertyName] = opt_propertyBag[propertyName];
      }
      return el;
    }

    /**
     * Decorates an element as a UI element class.
     * @param {!Element} el The element to decorate.
     */
    f.decorate = function(el) {
      el.__proto__ = f.prototype;
      el.decorate();
    };

    return f;
  }

  /**
   * Input elements do not grow and shrink with their content. This is a simple
   * (and not very efficient) way of handling shrinking to content with support
   * for min width and limited by the width of the parent element.
   * @param {HTMLElement} el The element to limit the width for.
   * @param {number} parentEl The parent element that should limit the size.
   * @param {number} min The minimum width.
   * @param {number} opt_scale Optional scale factor to apply to the width.
   */
  function limitInputWidth(el, parentEl, min, opt_scale) {
    // Needs a size larger than borders
    el.style.width = '10px';
    var doc = el.ownerDocument;
    var win = doc.defaultView;
    var computedStyle = win.getComputedStyle(el);
    var parentComputedStyle = win.getComputedStyle(parentEl);
    var rtl = computedStyle.direction == 'rtl';

    // To get the max width we get the width of the treeItem minus the position
    // of the input.
    var inputRect = el.getBoundingClientRect();  // box-sizing
    var parentRect = parentEl.getBoundingClientRect();
    var startPos = rtl ? parentRect.right - inputRect.right :
        inputRect.left - parentRect.left;

    // Add up border and padding of the input.
    var inner = parseInt(computedStyle.borderLeftWidth, 10) +
        parseInt(computedStyle.paddingLeft, 10) +
        parseInt(computedStyle.paddingRight, 10) +
        parseInt(computedStyle.borderRightWidth, 10);

    // We also need to subtract the padding of parent to prevent it to overflow.
    var parentPadding = rtl ? parseInt(parentComputedStyle.paddingLeft, 10) :
        parseInt(parentComputedStyle.paddingRight, 10);

    var max = parentEl.clientWidth - startPos - inner - parentPadding;
    if (opt_scale)
      max *= opt_scale;

    function limit() {
      if (el.scrollWidth > max) {
        el.style.width = max + 'px';
      } else {
        el.style.width = 0;
        var sw = el.scrollWidth;
        if (sw < min) {
          el.style.width = min + 'px';
        } else {
          el.style.width = sw + 'px';
        }
      }
    }

    el.addEventListener('input', limit);
    limit();
  }

  /**
   * Takes a number and spits out a value CSS will be happy with. To avoid
   * subpixel layout issues, the value is rounded to the nearest integral value.
   * @param {number} pixels The number of pixels.
   * @return {string} e.g. '16px'.
   */
  function toCssPx(pixels) {
    if (!window.isFinite(pixels))
      console.error('Pixel value is not a number: ' + pixels);
    return Math.round(pixels) + 'px';
  }

  /**
   * Users complain they occasionaly use doubleclicks instead of clicks
   * (http://crbug.com/140364). To fix it we freeze click handling for
   * the doubleclick time interval.
   * @param {MouseEvent} e Initial click event.
   */
  function swallowDoubleClick(e) {
    var doc = e.target.ownerDocument;
    var counter = Math.min(1, e.detail);
    function swallow(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    function onclick(e) {
      if (e.detail > counter) {
        counter = e.detail;
        // Swallow the click since it's a click inside the doubleclick timeout.
        swallow(e);
      } else {
        // Stop tracking clicks and let regular handling.
        doc.removeEventListener('dblclick', swallow, true);
        doc.removeEventListener('click', onclick, true);
      }
    }
    // The following 'click' event (if e.type == 'mouseup') mustn't be taken
    // into account (it mustn't stop tracking clicks). Start event listening
    // after zero timeout.
    setTimeout(function() {
      doc.addEventListener('click', onclick, true);
      doc.addEventListener('dblclick', swallow, true);
    }, 0);
  }

  return {
    decorate: decorate,
    define: define,
    limitInputWidth: limitInputWidth,
    toCssPx: toCssPx,
    swallowDoubleClick: swallowDoubleClick
  };
});



//Touch support
(function() {
  if ("ontouchstart" in document.documentElement) {
    document.addEventListener('touchstart', function(e) {
      var old = document.body.querySelectorAll('.hover');
      for (var i = 0; i < old.length; i++) {
        old[i].classList.remove('hover');
      }
      findAncestor(e.target, function(node) {
        if (node.classList)
          node.classList.add('hover');
        return !node.classList;
      });
    }, true);
    try {
      var ignore = /:hover/;
      for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        for (var j = 0; sheet.cssRules && j < sheet.cssRules.length; j++) {
          var rule = sheet.cssRules[j];
          if (rule.type === CSSRule.STYLE_RULE && ignore.test(rule.selectorText)) {
            var selectorSet = rule.selectorText.split(','),
                validSet = [];
            for (var k = 0; k < selectorSet.length; k++) {
              if (!ignore.test(selectorSet[k])) {
                validSet.push(selectorSet[k]);
              }
            }
            if (validSet.length === 0) {
              sheet.deleteRule(j);
            }
            else {
              rule.selectorText = validSet.join(',');
            }
          }
        }
      }
    }
    catch(e){
    }
  }
})();
