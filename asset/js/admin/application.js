/**
 * @fileoverview Main application control.
 */

cr.define('Application', function() {
  'use strict';

  /**
  * Make initializations.
  */
  function initialization() {
    cr.ui.overlay.setupOverlay($('overlay_1'));
    cr.ui.overlay.setupOverlay($('overlay_2'));
    cr.ui.showLoading();
    window.addEventListener('moduleload', function() {
      var r = new cr.APIRequest(cr.model.User, 'GET', '/current_user/', true);

      r.onload = function(ev) {
        if (!ev.recObj.admin) {
          ev.recObj = {errno: 2, error: "Admin Only"};
          errorHandler(ev);
        }
        else {
          cr.model.User.update(ev.recObj, 1);
          cr.define("cr", function() { return {user_id: ev.recObj.id}; });
          cr.model.SiteSettings.loadSettings(function() {
            cr.dispatchSimpleEvent(window, 'authload', false, false);
          });
        }
      };
      r.onerror = errorHandler;
      r.send();
    });
    window.addEventListener('authload', cr.ui.hideLoading);
    cr.define('cr', function() {
      return {
        errorHandler: errorHandler,
        notFoundHandler: notFoundHandler,
      };
    });
  }

  /**
  * Handle errors.
  * @param {Event} ev The event of error
  */
  function errorHandler(ev) {
    //Hide loading if necessary
    cr.ui.hideLoading();
    alertOverlay.setValues(
      'Error',
      ev.recObj.error || 'Fatal: Server Error',
      'Retry',
      null,
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        routerManager.parseHash();
      },
      null
    );
    cr.ui.overlay.showOverlay($('alertOverlay'));
  }

  /**
  * Start page of Admin Interface
  */
  function startPage() {
    var img = new Image();
    img.onload = function() {
      cr.ui.replaceContent(cr.ui.template.render_template("admin/start_page.html"));
    };
    img.src = "../asset/css/admin/title_img.png";
  }

  /**
  * Handle not found error.
  * @param {Event} ev The event of error
  */
  function notFoundHandler(url) {
    var content = cr.ui.template.render_template("admin/notfound.html", {
      url: url,
    });
    cr.ui.replaceContent(content);
  }

  /**
  * Collect form data from a div.
  * @param {HTMLElement} content The form to collect
  * @return {Object} The information collected
  */
  function collectForm(content) {
    var inputs = content.querySelectorAll('input:enabled, select:enabled, textarea:enabled'),
        payload = {};
    for (var i = 0; i < inputs.length; i++) {
      payload[inputs[i].name] = (inputs[i].type === 'checkbox') ? inputs[i].checked : inputs[i].value;
      if (payload[inputs[i].name] == undefined || payload[inputs[i].name] === '') {
        //If empty...It is null
        payload[inputs[i].name] = null;
        if (inputs[i].getAttribute('role') === 'list') {
          payload[inputs[i].name] = '';
        }
      }
    }
    return payload;
  }

  return {
    initialization: initialization,
    startPage: startPage,
    collectForm: collectForm,
  };
});

document.addEventListener('DOMContentLoaded', Application.initialization);
cr.ui.template.register("admin/notfound.html");
cr.ui.template.register("admin/start_page.html");
routerManager.register(/\//, true, Application.startPage);
