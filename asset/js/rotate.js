/**
 * @fileoverview Turns a background sprite image into a draggable and rotatable 3D model viewer.
 */

cr.define('cr.ui.rotator', function() {
  'use strict';

  var fwidth = 600, //Frame width
      fheight = 800, //Frame height
      fnum = 24, //Frame count
      velocity = 13, //Velocity to move
      isTouch = "ontouchstart" in document.documentElement, //is touch device?
      activeElem = null; //Active model element

  /**
   * Global Initialize
   */
  function Initialization() {
    document.addEventListener(isTouch ? 'touchend' : 'mouseup', handleUp);
    document.addEventListener(isTouch ? 'touchmove' : 'mousemove', handleMove);
  }

  /**
   * Initialize a wrapper to become a rotatable model
   * @param {HTMLElement} elem The node to transform
   */
  function init(elem) {
    //Add Hooks
    elem.addEventListener(isTouch ? 'touchstart' : 'mousedown', handleDown.bind(elem));
    elem.rotFrame = elem.rotLastFrame = 0;
    elem.rotating = false;
  }

  /**
   * Handle when mouse down or touch starts
   * @param {MouseEvent|TouchEvent} e The event
   */
  function handleDown(e) {
    if (!isTouch && e.button != 0) {
      return false;
    }
    //Flag dragging
    this.rotDragging = true;
    activeElem = this;
    document.body.classList.add('dragging');

    if (this.rotCoords == null) {
      this.rotCoords = getMouse(e);
    }
    this.offset = 0;
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }

  /**
   * Handle when mouse moves or touch moves
   * @param {MouseEvent|TouchEvent} e The event
   */
  function handleMove(e) {
    if (!activeElem) {
      return false;
    }
    var offset = calcOffset(e, activeElem.rotCoords);
    dragBg(offset);
    return true;
  }

  /**
   * Handle when mouse up or touch ends
   * @param {MouseEvent|TouchEvent} e The event
   */
  function handleUp(e) {
    if (!activeElem) {
      return false;
    }
    activeElem.rotLastFrame = activeElem.rotFrame;
    activeElem.rotCoords = null;
    document.body.classList.remove('dragging');
    activeElem = null;
    return true;
  }

  /**
   * Get the mouse coordinate
   * @param {MouseEvent|TouchEvent} e The event
   * @return {Object} A pair of number of coordinates
   */
  function getMouse(e) {
    if (isTouch) {
      e = e.touches[0];
    }
    if (e.pageX && e.pageY) {
      return {
        x: e.pageX,
        y: e.pageY,
      };
    }
    return {
      x: e.clientX + (document.documentElement.scrollLeft - document.documentElement.clientLeft),
      y: e.clientY + (document.documentElement.scrollTop - document.documentElement.clientTop),
    };
  }

  /**
   * Calculate the offset of the mouse or finger
   * @param {MouseEvent|TouchEvent} e The event
   * @param {Object} coords The origin
   * @return {Object} A pair of number of the offset
   */
  function calcOffset(e, coords) {
    var curMouse = getMouse(e);
    return {
      x: curMouse.x - coords.x,
      y: curMouse.y - coords.y,
    };
  }

  /**
   * Do the rotation according to offset
   * @param {Object} offset The offset given by calcOffset
   */
  function dragBg(offset) {
    var lastFrame = activeElem.rotLastFrame || 0,
        gotoFrame;
    gotoFrame = lastFrame + Math.round(offset.x / velocity);

    //Limit with range
    if (gotoFrame >= fnum || gotoFrame < 0) {
      gotoFrame = gotoFrame - (fnum * Math.floor(gotoFrame / fnum));
    }

    //Set last infos
    activeElem.rotFrame = gotoFrame;

    //Set BG Position
    activeElem.style.backgroundPosition = (100 * gotoFrame / (fnum - 1)) + '% ' + '0%';
  }



  return {
    Initialization: Initialization,
    init: init,
  }
});

cr.ui.rotator.Initialization();