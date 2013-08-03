/**
 * @fileoverview Main application control.
 */

cr.define('Application', function() {
  'use strict';

  var membership_table = {
    Full: 'Full Member',
    OneSem: 'One Semester Member',
    OneYear: 'One Year Member',
    TwoYear: 'Two Year Member',
    ThreeYear: 'Three Year Member',
    Honour: 'Honour Member',
    Assoc: 'Asscocitate Member',
  };

  /**
  * Make initializations.
  */
  function initialization() {
    //cr.ui.showLoading();
    window.addEventListener('moduleload', function() {
      var r = new cr.APIRequest(cr.model.User, 'GET', '/current_user/', true);

      r.onload = function(ev) {
        cr.define("cr", function() { return {user: deepCopy(ev.recObj)}; });
        //Hook user panel
        var user_panel = cr.ui.template.render_template('user_panel.html', {user: ev.recObj, table: membership_table});
        user_panel.querySelector('.link-logout').addEventListener('click', function() {
          var next = location.hash.substr(1),
              url = cr.settings.logout_url + (next ? '?next=' + next : '');
          //Do the jump
          location.href = url;
        });
        user_panel.querySelector('.link-admin').addEventListener('click', function() {
          window.open('admin/');
        });
        $('header').replaceChild(user_panel, $('user-wrapper'));
        cr.ui.showNotification(ev.recObj.full_name + ', Welcome back!', 'dismiss');
        cr.model.SiteSettings.loadSettings(function() {
          cr.dispatchSimpleEvent(window, 'authload', false, false);
        });
      };
      r.onerror = function(ev) {
        if (ev.recObj.errno === 2) {
          //Not logged in
          //Hook Guest panel
          $('user-wrapper').querySelector('.link-login').addEventListener('click', function() {
            var next = location.hash.substr(1),
                url = cr.settings.login_url + (next ? '?next=' + next : ''),
                redirect = 'https://cas.ust.hk/cas/login?service=' + encodeURIComponent(url);
            //Do the jump
            location.href = redirect;
          });
          //Always fetch SiteSettings
          cr.model.SiteSettings.loadSettings(function() {
            cr.dispatchSimpleEvent(window, 'authload', false, false);
          });
        }
        else {
          //Give it to error handler
          errorHandler(ev);
        }
      };
      r.send();
    });
    window.addEventListener('authload', cr.ui.hideLoading);
    cr.define('cr', function() {
      return {
        errorHandler: errorHandler,
        notFoundHandler: notFoundHandler,
      };
    });

    //Hook navigations
    $('footer').addEventListener('click', function(e) {
      //Use proxy
      var control = e.target.getAttribute('href').substr(1);
      routerManager.pushState(control, false, false);
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  /**
  * Handle errors.
  * @param {Event} ev The event of error
  */
  function errorHandler(ev) {
    var errno = ev.recObj.errno,
        error = ev.recObj.error || 'Connection Failed';
    switch(errno) {
      case 0: //Client Network Problem
      case 1: //Format Error
      case 2: //Authentication Error
      case 3: //Procedure Error
        cr.ui.showNotification(error, 'dismiss');
        break;
      case 404: //Not Found Error
        notFoundHandler();
        break;
      default: //Other Server Error
        cr.ui.showNotification('Server: ' + error, 'try again later');
    }
  }

  /**
  * Start page of Admin Interface
  */
  function startPage() {
    var img = new Image();
    //Do nothing
  }

  /**
  * Handle not found error.
  */
  function notFoundHandler() {
    var content = cr.ui.template.render_template("error_page.html", {text: 'Oops... 404 Page Not Found.'});
    cr.view.name = "404";
    cr.ui.replaceContent(content);
  }

  /**
  * Collect form data from a div.
  * @param {HTMLElement} content The form to collect
  * @return {Object} The information collected
  */
  function collectForm(content) {
    var inputs = content.querySelectorAll('input:enabled, select:enabled, textarea:enabled, .input'),
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
cr.ui.template.register("user_panel.html");
cr.ui.template.register("error_page.html");