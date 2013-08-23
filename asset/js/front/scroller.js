/**
 * @fileoverview Provide smooth scroll utility
 */

cr.define('cr.ui', function() {
  'use strict';

  /* Begin of Unit Bezier Function */
  function UnitBezier(x1, y1, x2, y2) {
    var  t = this;
    t.cx = 3 * x1;
    t.bx = 3 * (x2 - x1) - t.cx;
    t.ax = 1 - t.cx - t.bx;

    t.cy = 3 * y1;
    t.by = 3 * (y2 - y1) - t.cy;
    t.ay = 1 - t.cy - t.by;
  }

  UnitBezier.prototype = {
    getX: function(t) {
      return ((this.ax * t + this.bx) * t + this.cx) * t;
    },
    getY: function(t) {
      return ((this.ay * t + this.by) * t + this.cy) * t;
    },
    getDerivativeX: function(t) {
      return (3 * this.ax * t + 2 * this.bx) * t + this.cx;
    },
    solveAtX: function(x, epsilon) {
      assert(x >= 0 && x <= 1, "x out of range");

      var t0, t1, t2, i;

      //Newton's method
      for (t2 = x, i = 0; i < 8; i++) {
        var x2 = this.getX(t2) - x;
        if (x2 < epsilon && x2 > -epsilon) {
          return t2;
        }
        var d = this.getDerivativeX(t2);
        if (d < 1E-6 && d > -1E-6) {
          break;
        }
        t2 -= x2 / d;
      }

      //Bisection
      t0 = 0;
      t1 = 1;
      t2 = x;

      while(t0 < t1) {
        var x2 = this.getX(t2);
        if (x2 - x < epsilon && x2 - x > -epsilon) {
          return t2;
        }
        if (x > x2) {
          t0 = t2;
        }
        else {
          t1 = t2;
        }
        t2 = (t1 - t0) / 2 + t0;
      }

      return t2;
    },
    solve: function(x, epsilon) {
      if (x < 0) {
        return 0;
      }
      if (x > 1) {
        return 1;
      }
      return this.getY(this.solveAtX(x, epsilon));
    }
  };
  /* End of Unit Bezier Function */

  /**
   * Construct the scroller
   * @constructor
   * @param {HTMLElement} elem The element to add smooth scroll
   */
  function Scroller(elem) {
    this.elem = elem;
    this.lastTick = null;
    this.lastT = 0;
    this.scrolling = false;
    this.toX = null;
    this.toY = null;
    this.sX = null;
    this.sY = null;
    this.dT = null;
    this.generator = null;
    this.cbk = null;
  }

  Scroller.prototype = {
    /**
     * Start a scroll
     * @param {Integer} toX The x-coordinate to scroll to
     * @param {Integer} toX The y-coordinate to scroll to
     * @param {Integer} toX Time used to finish scroll, in ms
     * @param {Function} cbk The callback function called after scroll is over
     * @param {UnitBezier} timing The timing methos to use
     */
    scrollTo: function(toX, toY, duration, cbk, timing) {
      this.toX = toX;
      this.toY = toY;
      this.sX = this.elem.scrollLeft;
      this.sY = this.elem.scrollTop;
      this.lastT = 0;
      this.dT = 1 / duration;
      this.generator = timing;
      this.cbk = cbk;
      if (!this.scrolling) {
        this.scrolling = true;
        requestAnimationFrame(this.handleScroll.bind(this));
      }
    },

    /**
     * handle every update of scroll
     * @param {Integer} timestamp The timestamp given by requestAnimationFrame
     */
    handleScroll: function(timestamp) {
      if (this.lastT >= 1) {
        //Finish
        this.elem.scrollLeft = this.toX;
        this.elem.scrollTop = this.toY;
        this.cbk && this.cbk();
        this.reset();
        return;
      }
      if (!this.scrolling) {
        return;
      }
      if (this.lastTick == null) {
        this.lastTick = timestamp;
      }
      var percent = this.generator.solve(this.lastT, 0.005);
      this.elem.scrollLeft = this.sX + (this.toX - this.sX) * percent;
      this.elem.scrollTop = this.sY + (this.toY - this.sY) * percent;
      this.lastT += (timestamp - this.lastTick) * this.dT;
      this.lastTick = timestamp;
      cr.dispatchSimpleEvent(this.elem, 'scroll', true, true);
      requestAnimationFrame(this.handleScroll.bind(this));
    },

    /**
     * Reset all the value
     */
    reset: function() {
      this.lastTick = null;
      this.lastT = 0;
      this.scrolling = false;
      this.toX = null;
      this.toY = null;
      this.sX = null;
      this.sY = null;
      this.dT = null;
      this.generator = null;
      this.cbk = null;
    }
  };

  return {
    UnitBezier: UnitBezier,
    Scroller: Scroller,
  };
});
