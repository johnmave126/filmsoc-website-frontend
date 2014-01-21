/**
 * @fileoverview Provide overlay to view log.
 */

cr.define('cr.logger', function() {
  'use strict';

  /**
   * Initialize
   */
  function initialize() {
    var log_list = $('log-view-list');
    $('close-log-view').addEventListener('click', function() {
      cr.dispatchSimpleEvent(this, 'cancelOverlay');
    });
    window.addEventListener('resize', setMaxHeight);

    setMaxHeight();
  }

  /**
   * Set the max height of list element
   */
  function setMaxHeight() {
    var log_list = $('log-view-list');
    log_list.style.maxHeight = (0.5 * Math.min(0.9 * window.innerHeight, 640)) + 'px';
  }

  /**
   * Display Log viewer
   * @param {Object} filter A key-value pair of filter
   * @param {Array} types All possible log type
   */
  function showLogger(title, filter, types) {
    //Copy types
    types = types && types.slice(0);
    var model = filter.model,
        ref_id = filter.id,
        user_affected = filter.user,
        logger = $('log-view-page'),
        log_list = $('log-view-list'),
        options = $('log-view-options'),
        pager = new cr.Pager(cr.model.Log, generateAPI()),
        ajax_loading = true,
        rev = 0;
    //Clear previous content
    log_list.innerHTML = "<div class=\"spacer\"></div><div class=\"list-loading\"><div class=\"spinner\"></div></div>";
    $('log-view-title').textContent = title;
    var loading = log_list.querySelector('.list-loading'),
        spacer = log_list.querySelector('.spacer');
    //Set options
    options.innerHTML = "";
    for (var i = 0; types && i < types.length; i++) {
      var d = cr.ui.template.render_template('admin/filter_checker.html', {type: types[i]});
      d.addEventListener('change', function(e) {
        var type = e.target.getAttribute('filter');
        if (e.target.checked) {
          types.push(type);
        }
        else {
          types.splice(types.indexOf(type), 1);
        }
        //Clear
        rev++;
        log_list.innerHTML = "<div class=\"spacer\"></div><div class=\"list-loading\"><div class=\"spinner\"></div></div>";
        loading = log_list.querySelector('.list-loading');
        spacer = log_list.querySelector('.spacer');
        pager = new cr.Pager(cr.model.Log, generateAPI());
        ajax_loading = true;
        pager.load(appendLog.bind(pager, rev));
      });
      options.appendChild(d);
    }
    cr.ui.overlay.showOverlay($('log-view-page'));
    pager.load(appendLog.bind(pager, rev));

    //Scroll hook
    log_list.onscroll = function(e) {
      e.stopImmediatePropagation();
      if (ajax_loading || !pager.has_next) {
        return;
      }
      var scrollTop = log_list.scrollTop,
          windowHeight = log_list.clientHeight,
          scrollHeight = log_list.scrollHeight;
      if (scrollTop + windowHeight + 5 > scrollHeight) {
        //Trigger Loading
        ajax_loading = true;
        pager.next(appendLog.bind(pager, rev));
      }
    };

    function appendLog(old_rev, obj_list) {
      if (old_rev !== rev) {
        //Abandon
        return;
      }
      if (!this.has_next) {
        log_list.removeChild(loading);
      }
      for (var i = 0; i < obj_list.length; i++) {
        var d = cr.ui.template.render_template('admin/log_item.html', {log: obj_list[i]});
        log_list.insertBefore(d, spacer);
        setTimeout((function() {
          this.classList.remove('loading');
        }).bind(d), i * 30);
      }
      ajax_loading = false;
    }

    function generateAPI() {
      var param = [];
      if (model) {
        param.push('model=' + encodeURIComponent(model));
      }
      if (ref_id) {
        param.push('model_refer=' + encodeURIComponent(ref_id));
      }
      if (user_affected) {
        param.push('user_affected=' + encodeURIComponent(user_affected));
      }
      if (types) {
        param.push('log_type__in=' + encodeURIComponent(types.join(',')))
      }
      return '/?' + param.join('&');
    }
  }

  return {
  	showLogger: showLogger,
    initialize: initialize,
  };
});

document.addEventListener('DOMContentLoaded', cr.logger.initialize);
cr.ui.template.register("admin/filter_checker.html");
cr.ui.template.register("admin/log_item.html");
