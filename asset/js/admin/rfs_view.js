/**
 * @fileoverview View concerning Regular Film Show.
 */

cr.define('cr.view.rfs', function() {
  var name = 'rfs';

  /**
   * Return the film to be shown
   * @param {Object} obj The show
   * @return {Object} The disk
   */
  function toShow(obj) {
    if (obj.film_1.avail_type === 'Onshow') {
      return obj.film_1;
    }
    if (obj.film_2.avail_type === 'Onshow') {
      return obj.film_2;
    }
    if (obj.film_3.avail_type === 'Onshow') {
      return obj.film_3;
    }
    var p = 1;
    if(obj.vote_cnt_2 > obj.vote_cnt_1) {
      p = 2;
    }
    if(obj.vote_cnt_3 > obj["vote_cnt_" + p]) {
      p = 3;
    }
    return obj["film_" + p];
  }

  /**
   * Generate Call number
   * @param {Object} obj The disk
   * @return {string} The callnumber
   */
  function cn(obj) {
    return obj.disk_type + pad(obj.id, 4);
  }

  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/rfs\//, false, rfs_setup(rfs_list));
    cr.ui.template.register("admin/rfs_list.html");
    cr.ui.template.register("admin/rfs_list_item.html", function(param) {
      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_rfs(obj.id);
      }).bind(null, param.rfs));
      this.querySelector('button[control="viewlog"]').addEventListener('click', (function(obj) {
        cr.logger.showLogger('View Logs of RegularFilmShow', {
          model: 'RegularFilmShow',
          id: obj.id,
        }, cr.model.RegularFilmShow.types);
      }).bind(null, param.rfs));
      this.querySelector('button[control="signin"]').addEventListener('click', signin_rfs.bind(null, param.rfs));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_rfs.bind(null, param.rfs));
    });
    cr.ui.template.register("admin/rfs_edit.html");
    cr.ui.template.register("admin/rfs_create.html");
    cr.ui.template.register("admin/rfs_signin.html", function(param) {
      var node = this;
      this.querySelector('input[name="student_id"]').addEventListener('keyup', function() {
        if(this.value) {
          node.querySelector('input[name="id"]').value = 'relate';
        }
        else {
          node.querySelector('input[name="id"]').value = null;
        }
      });
      this.querySelector('input[name="university_id"]').addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
          //Enter
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();
          cr.ui.showLoading();
          var r = new cr.APIRequest(cr.model.User, 'GET', '/?university_id=' + this.value, true);
          r.onload = function(e) {
            cr.ui.hideLoading();
            if (e.recObj.objects.length === 0) {
              node.querySelector('input[name="student_id"]').focus();
              node.querySelector('input[name="id"]').value = 'relate';
            }
            else {
              node.querySelector('input[name="id"]').value = e.recObj.objects[0].id;
              $('multiuse-button2').click();
            }
          };
          r.onerror = cr.errorHandler;
          r.send();
        }
      }, true);
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function rfs_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Regular Film Show | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create a rfs.
   */
  function create_rfs() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button1 = $('multiuse-button1'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New Show";
    button1.textContent = "Save As Draft";
    button1.removeAttribute('hidden');
    button2.textContent = "Publish";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/rfs_create.html');
    content.appendChild(form);
    overlay.eventTracker.add(button1, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      payload['state'] = 'Draft';
      payload['film_1'] = payload['film_1'].substr(1);
      payload['film_2'] = payload['film_2'].substr(1);
      payload['film_3'] = payload['film_3'].substr(1);
      cr.model.RegularFilmShow.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      payload['state'] = 'Open';
      payload['film_1'] = payload['film_1'].substr(1);
      payload['film_2'] = payload['film_2'].substr(1);
      payload['film_3'] = payload['film_3'].substr(1);
      cr.model.RegularFilmShow.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a rfs.
   * @param {Integer} id The id of rfs
   */
  function edit_rfs(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit Regular Film Show Information";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.RegularFilmShow.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/rfs_edit.html', {rfs: obj, cn: cn});
      content.appendChild(form);
      overlay.eventTracker.add(button2, 'click', function() {
        cr.ui.showLoading();
        var payload = Application.collectForm(content);
        var regex = /^[AB]\d{4}$/;
        if ( (payload['film_1'] && !regex.test(payload['film_1']))
          || (payload['film_2'] && !regex.test(payload['film_2']))
          || (payload['film_3'] && !regex.test(payload['film_3'])) ) {
          alertOverlay.setValues(
            'Error',
            'Call Number Error',
            'Retry',
            null,
            function() {
              cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
              routerManager.parseHash();
            },
            null
          );
          cr.ui.overlay.showOverlay($('alertOverlay'));
          return;
        }
        payload['film_1'] && (payload['film_1'] = payload['film_1'].substr(1));
        payload['film_2'] && (payload['film_2'] = payload['film_2'].substr(1));
        payload['film_3'] && (payload['film_3'] = payload['film_3'].substr(1));
        cr.model.RegularFilmShow.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a rfs.
   * @param {Object} rfs The rfs object
   */
  function delete_rfs(rfs) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete Regular Film Show?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.RegularFilmShow.remove(rfs.id, function() {
          cr.ui.hideLoading();
          history.go();
          cr.ui.showNotification('Deleted', 'dismiss');
        });
      },
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
      });
    cr.ui.overlay.showOverlay($('alertOverlay'));
  }

  /**
   * Sign in a member for regular film show.
   * @param {Object} rfs The rfs object
   */
  function signin_rfs(rfs) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "RegularFilmShow Member Sign in";
    button2.textContent = "Sign in";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/rfs_signin.html', {
      rfs: rfs,
      toshow: toShow(rfs),
    });
    content.appendChild(form);
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var r = new cr.APIRequest(cr.model.RegularFilmShow, 'POST', '/' + rfs.id + '/participant/'),
          userid = form.querySelector('input[name="id"]').value;
      r.onload = function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Signed in', 'dismiss');
      };
      r.onerror = cr.errorHandler;
      if (userid === 'relate') {
        var stu_id = content.querySelector('input[name="student_id"]').value,
            uni_id = content.querySelector('input[name="university_id"]').value;
        if (stu_id && uni_id) {
          var _r = new cr.APIRequest(cr.model.User, 'POST', '/relation/');
          _r.onload = function(e) {
            r.sendJSON({id: e.recObj.id});
          }
          _r.onerror = cr.errorHandler;
          _r.sendJSON({student_id: stu_id, university_id: uni_id});
        }
        else if(stu_id) {
          var _r = new cr.APIRequest(cr.model.User, 'GET', '/?student_id=' + stu_id);
          _r.onload = function(e) {
            if (e.recObj.objects.length === 0) {
              var error = new cr.Event('error', false, true);
              error.recObj = {errno: 2, error: 'User not exist'};
              cr.errorHandler(error);
            }
            else {
              r.sendJSON({id: e.recObj.objects[0].id});
            }
          }
          _r.onerror = cr.errorHandler;
          _r.send();
        }
        else {
          content.querySelector('input[name="student_id"]').focus();
        }
      }
      else {
        r.sendJSON({id: userid});
      }
    });
  }

  /**
   * Hook to load rfs list view.
   * @param {Object} query The query data
   */
  function rfs_list(query) {
    var page = query.page || 1,
        type_filter = query.type_filter ? query.type_filter.split(',') : ['Draft', 'Open', 'Pending', 'Passed'],
        skeleton = cr.ui.template.render_template("admin/rfs_list.html", {filter: type_filter});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page + '&state__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.RegularFilmShow, api_query);
    cr.ui.displayLoading(content);
    pager.load(load_obj);
    //Add hooks

    //Previous
    skeleton.querySelector('#page-prev').addEventListener('click', function(e) {
      page--;
      routerManager.pushState(generateURL(), false, true);
      scrollTo(0, 0);
      cr.ui.displayLoading(content);
      pager.prev(load_obj);
    });

    //Next
    skeleton.querySelector('#page-next').addEventListener('click', function(e) {
      page++;
      routerManager.pushState(generateURL(), false, true);
      scrollTo(0, 0);
      cr.ui.displayLoading(content);
      pager.next(load_obj);
    });

    //Checkboxes
    var checkbox = skeleton.querySelectorAll('header .controls input[type="checkbox"]');
    for (var i = 0; i < checkbox.length; i++) {
      checkbox[i].addEventListener('change', function(e) {
        var type = e.target.getAttribute('filter');
        if (e.target.checked) {
          type_filter.push(type);
        }
        else {
          type_filter.splice(type_filter.indexOf(type), 1);
        }
        page = 1;
        api_query = "/?" + 'page=' + page + '&state__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.RegularFilmShow, api_query);
        routerManager.pushState(generateURL(), false, true);
        scrollTo(0, 0);
        cr.ui.displayLoading(content);
        pager.load(load_obj);
      })
    }

    //Buttons
    skeleton.querySelector('#rfs-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module RegularFilmShow', {
        model: 'RegularFilmShow',
      }, cr.model.RegularFilmShow.types);
    });
    skeleton.querySelector('#rfs-create-show').addEventListener('click', create_rfs);

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/rfs_list_item.html", {rfs: obj_list[i], cn: cn});
        list_container.appendChild(listitem);
      }
      if (this.has_prev) {
        footer.querySelector('.lefthub').removeAttribute('hidden');
      }
      else {
        footer.querySelector('.lefthub').setAttribute('hidden', 'true');
      }
      if (this.has_next) {
        footer.querySelector('.righthub').removeAttribute('hidden');
      }
      else {
        footer.querySelector('.righthub').setAttribute('hidden', 'true');
      }
      footer.querySelector('.centerhub > span').textContent = this.page + '/' + this.total;
      setTimeout(function() {
        list_container.classList.remove("content-loading");
      }, 100);
      
      //Add hooks
    }

    function generateURL() {
      return 'rfs/?page=' + page + '&type_filter=' + type_filter.join(',');
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.rfs.Initialize();
