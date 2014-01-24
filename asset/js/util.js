// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//Modified by John Tan 2013, Film Society, HKUSTSU

//Timezone setting
var tz_info = "+08:00";

/**
 * @fileoverview Assertion support.
 */

/**
 * Simple common assertion API
 * @param {*} condition The condition to test.  Note that this may be used to
 *     test whether a value is defined or not, and we don't want to force a
 *     cast to Boolean.
 * @param {string=} opt_message A message to use in any error.
 */
function assert(condition, opt_message) {
  'use strict';
  if (!condition) {
    var msg = 'Assertion failed';
    if (opt_message)
      msg = msg + ': ' + opt_message;
    throw new Error(msg);
  }
}


/**
 * The global object.
 * @type {!Object}
 * @const
 */
var global = this;

/**
 * Alias for document.getElementById.
 * @param {string} id The ID of the element to find.
 * @return {HTMLElement} The found element or null if not found.
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Pad a number to fixed width.
 * @param {integer} n The number to pad.
 * @param {integer} width The width to pad to.
 * @param {char} z The padding character.
 * @return {string} The padded string.
 */
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/**
 * Generates a CSS url string.
 * @param {string} s The URL to generate the CSS url for.
 * @return {string} The CSS url string.
 */
function cssurl(s) {
  // http://www.w3.org/TR/css3-values/#uris
  // Parentheses, commas, whitespace characters, single quotes (') and double
  // quotes (") appearing in a URI must be escaped with a backslash
  var s2 = s.replace(/(\(|\)|\,|\s|\'|\"|\\)/g, '\\$1');
  // WebKit has a bug when it comes to URLs that end with \
  // https://bugs.webkit.org/show_bug.cgi?id=28885
  if (/\\\\$/.test(s2)) {
    // Add a space to work around the WebKit bug.
    s2 += ' ';
  }
  return 'url("' + s2 + '")';
}

/**
 * Parses query parameters from Location.
 * @param {string} location The location object.
 * @return {object} Dictionary containing name value pairs for URL
 */
function parseLocationParams(location) {
  var params = {};
  var query = unescape(location.search.substring(1));
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    params[pair[0]] = pair[1];
  }
  return params;
}

function findAncestorByClass(el, className) {
  return findAncestor(el, function(el) {
    if (el.classList)
      return el.classList.contains(className);
    return null;
  });
}

/**
 * Return the first ancestor for which the {@code predicate} returns true.
 * @param {Node} node The node to check.
 * @param {function(Node) : boolean} predicate The function that tests the
 *     nodes.
 * @return {Node} The found ancestor or null if not found.
 */
function findAncestor(node, predicate) {
  var last = false;
  while (node != null && !(last = predicate(node))) {
    node = node.parentNode;
  }
  return last ? node : null;
}

function swapDomNodes(a, b) {
  var afterA = a.nextSibling;
  if (afterA == b) {
    swapDomNodes(b, a);
    return;
  }
  var aParent = a.parentNode;
  b.parentNode.replaceChild(a, b);
  aParent.insertBefore(b, afterA);
}

/**
 * Disables text selection and dragging, with optional whitelist callbacks.
 * @param {function(Event):boolean=} opt_allowSelectStart Unless this function
 *    is defined and returns true, the onselectionstart event will be
 *    surpressed.
 * @param {function(Event):boolean=} opt_allowDragStart Unless this function
 *    is defined and returns true, the ondragstart event will be surpressed.
 */
function disableTextSelectAndDrag(opt_allowSelectStart, opt_allowDragStart) {
  // Disable text selection.
  document.onselectstart = function(e) {
    if (!(opt_allowSelectStart && opt_allowSelectStart.call(this, e)))
      e.preventDefault();
  };

  // Disable dragging.
  document.ondragstart = function(e) {
    if (!(opt_allowDragStart && opt_allowDragStart.call(this, e)))
      e.preventDefault();
  };
}

/**
 * Call this to stop clicks on <a href="#"> links from scrolling to the top of
 * the page (and possibly showing a # in the link).
 */
function preventDefaultOnPoundLinkClicks() {
  document.addEventListener('click', function(e) {
    var anchor = findAncestor(e.target, function(el) {
      return el.tagName == 'A';
    });
    // Use getAttribute() to prevent URL normalization.
    if (anchor && anchor.getAttribute('href') == '#')
      e.preventDefault();
  });
}

/**
 * Get an element that's known to exist by its ID. We use this instead of just
 * calling getElementById and not checking the result because this lets us
 * satisfy the JSCompiler type system.
 * @param {string} id The identifier name.
 * @return {!Element} the Element.
 */
function getRequiredElement(id) {
  var element = $(id);
  assert(element, 'Missing required element: ' + id);
  return element;
}

//W3C Selectors API Level 2
(function() {
  if (!Element.prototype.matches) {
    if (Element.prototype.webkitMatchesSelector) {
      Element.prototype.matches = Element.prototype.webkitMatchesSelector;
    }
    else if (Element.prototype.mozMatchesSelector) {
      Element.prototype.matches = Element.prototype.mozMatchesSelector;
    }
    else if (Element.prototype.oMatchesSelector) {
      Element.prototype.matches = Element.prototype.oMatchesSelector;
    }
    else if (Element.prototype.msMatchesSelector) {
      Element.prototype.matches = Element.prototype.msMatchesSelector;
    }
  }
  assert(Element.prototype.matches, "Unsupported Browser");
})();

/**
 * Creates an element of a specified type with a specified class name.
 * @param {string} type The node type.
 * @param {string} className The class name to use.
 * @return {Element} The created element.
 */
function createElementWithClassName(type, className) {
  var elm = document.createElement(type);
  elm.className = className;
  return elm;
}

/**
 * Extend child class as a subclass of given class.
 * @param {function} child The constructor of inherit class.
 * @param {function} parent The constructor of parent class.
 */
function extend(child, parent) {
  var F = function() {};
  F.prototype = parent.prototype;
  child.prototype = new F();
  child.prototype.constructor = child;
  child.prototype.extend = function(obj) {
    assert(this.hasOwnProperty('extend'), "Only prototype callable");
    for (var prop in obj) {
      if(obj.hasOwnProperty(prop)) {
        this[prop] = obj[prop];
      }
    }
  };
  child.uber = parent.prototype;
}

/**
 * Call a function in super class.
 * @param {function} instance The instance to bind to.
 * @param {string} func The function to call.
 * @return {function} The function ready to call.
 */
function superCall(instance, func) {
  assert(instance.uber, "Not a subclass of any class");
  assert(instance.uber[func] instanceof Function, "super class has no functin specified");
  return instance.uber[func].bind(instance);
}

/**
 * Convert a date string from server to ISO Specified format.
 * @param {string} dateString The date string from server.
 * @return {string} The ISO specified format string.
 */
function toISODate(dateString) {
  return dateString.replace(' ', 'T') + '.000' + tz_info;
}

/**
 * Stop a event from propagating.
 * @param {Event} e The event to stop.
 */
function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
}

/**
 * Deep copy an object.
 * @param {Object} obj The object to copy.
 * @return {Object} A new object copied.
 */
function deepCopy(src) {
  if(src == null || typeof(src) !== 'object'){
    return src;
  }

  //Honor native/custom clone methods
  if(typeof src.clone == 'function'){
    return src.clone(true);
  }

  //Special cases:
  //Date
  if (src instanceof Date){
    return new Date(src.getTime());
  }
  //RegExp
  if(src instanceof RegExp){
    return new RegExp(src);
  }
  //DOM Elements
  if(src.nodeType && typeof src.cloneNode == 'function'){
    return src.cloneNode(true);
  }
  //Array, Believe in shallow copy
  if (src instanceof Array){
    return src.slice(0);
  }

  //If we've reached here, we have a regular object, array, or function

  //make sure the returned object has the same prototype as the original
  var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src): src.__proto__);
  if (!proto) {
    proto = src.constructor.prototype; //this line would probably only be reached by very old browsers 
  }
  var ret = Object.create(proto);

  for(var key in src){
    //Note: this does NOT preserve ES5 property attributes like 'writable', 'enumerable', etc.
    //That could be achieved by using Object.getOwnPropertyNames and Object.defineProperty
    ret[key] = deepCopy(src[key]);
  }
  return ret;
}

//Function.prototype.bind support
(function() {
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5 internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }

      var aArgs = Array.prototype.slice.call(arguments, 1), 
          fToBind = this, 
          fNOP = function () {},
          fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis
                                   ? this
                                   : oThis,
                                 aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
})();

String.prototype.splice = function( idx, rem, s ) {
  return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};