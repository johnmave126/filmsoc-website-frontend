/**
 * @fileoverview Provide abstract implementation of
 * list with scroll loading feature
 */

cr.define('cr.ui', function() {
  'use strict';

  /**
   * Constructor for a page manager.
   * Construct a scrollable list on certain wrapper using given pager
   * @param {HTMLElement} elem The wrapper to act as the list
   * @param {HTMLElement} wrapper The wrapper to to wrap the list
   * @param {Pager} pager The pager to use
   * @param {object} conf The configuration of the list
   * @constructor
   */
  function scrollList(elem, wrapper, pager, conf) {
    var default_conf = {
      onfirstload: function() {
        return true;
      },
      onload: function(obj, idx) {
        return true;
      },
      deleteAnchor: true,
      anchorClass: '.anchor'
    },
      that = this;

    conf = conf || {};

    for(var key in default_conf) {
      if(conf[key] == null) {
        conf[key] = default_conf[key];
      }
    }

    that.elem = elem;
    that.wrapper = wrapper;
    that.pager = pager;
    that.onfirstload = conf.onfirstload;
    that.onload = conf.onload;
    that.deleteAnchor = conf.deleteAnchor;
    that.first_load = true;
    that.ajax_loading = true;
    that.anchor_element = elem.querySelector(conf.anchorClass);

  }

  /**Handle the scroll event.
   * @param {Object} e The event object.
   * @private
   */
  function handleScroll(e) {
    if (this.ajax_loading) {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();

    var that = this,
        elem = that.wrapper,
        scrollTop = elem.scrollTop,
        windowHeight = elem.clientHeight,
        scrollHeight = elem.scrollHeight;

    if (scrollTop + windowHeight + 15 > scrollHeight) {
      //Trigger Loading
      that.ajax_loading = true;
      that.pager.next(loadItem.bind(that));
    }
  }

  /**
   * Process an object list.
   * @param {Array} obj_list The list acquired.
   * @private
   */
  function loadItem(obj_list) {
    var that =this,
        elem = that.elem,
        pager = that.pager;
    //Append to list
    for (var i = 0; i < obj_list.length; i++) {
      that.onload && that.onload(obj_list[i], i);
    }

    if (that.first_load) {
      that.onfirstload && that.onfirstload(obj_list);
    }

    if (!pager.has_next) {
      if(!that.first_load || that.deleteAnchor || obj_list.length > 0) {
        elem.removeChild(that.anchor_element);
      }
      that.wrapper.removeEventListener('scroll', that.scrollcbk);
    }

    that.first_load = false;
    that.ajax_loading = false;
  }


  scrollList.prototype = {
    /**
     * Load the list
     */
    load: function() {
      var that = this;
      that.scrollcbk = handleScroll.bind(that);
      that.wrapper.addEventListener('scroll', that.scrollcbk);
      that.pager.load(loadItem.bind(that));
    }
  };
  return {
    scrollList: scrollList,
  };
});
