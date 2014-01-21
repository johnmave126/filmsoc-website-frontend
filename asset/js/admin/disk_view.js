/**
 * @fileoverview View concerning Disk.
 */

cr.define('cr.view.liba', function() {
  var name = 'liba';

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
    routerManager.register(/liba\//, false, liba_setup(liba_list));
    routerManager.register(/liba\/search\//, false, liba_setup(liba_search));
    cr.ui.template.register("admin/liba_list.html");
    cr.ui.template.register("admin/liba_search.html");
    cr.ui.template.register("admin/disk_list_item.html", function(param) {
      var cover = this.querySelector('div.cover-column > img');
      if (param.disk.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.disk.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_disk(obj.id);
      }).bind(null, param.disk));
      this.querySelector('button[control="viewlog"]').addEventListener('click', (function(obj) {
        cr.logger.showLogger('View Logs of Disk ' + cn(obj), {
          model: 'Disk',
          id: obj.id,
        }, cr.model.Disk.types);
      }).bind(null, param.disk));
      this.querySelector('button[control="checkout"]').addEventListener('click', checkout_disk.bind(null, param.disk));
      this.querySelector('button[control="checkin"]').addEventListener('click', checkin_disk.bind(null, param.disk));
      this.querySelector('button[control="renew"]').addEventListener('click', renew_disk.bind(null, param.disk));
      this.querySelector('button[control="clear"]').addEventListener('click', clear_disk.bind(null, param.disk));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_disk.bind(null, param.disk));
    });
    cr.ui.template.register("admin/disk_edit.html", function(param) {
      var cover = this.querySelector('.cover-container');
      if (param.disk.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.disk.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
      cr.uploader.init(this.querySelector('.cover-drop'), (function() {
        this.querySelector('input[name="cover_url"]').value = 'uploading';
      }).bind(this), (function(new_cover) {
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        this.querySelector('input[name="cover_url"]').value = new_cover.id;
      }).bind(this));
    });
    cr.ui.template.register("admin/disk_create.html", function() {
      var cover = this.querySelector('.cover-container');
      cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
      cr.uploader.init(this.querySelector('.cover-drop'), (function() {
        this.querySelector('input[name="cover_url"]').value = 'uploading';
      }).bind(this), (function(new_cover) {
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        this.querySelector('input[name="cover_url"]').value = new_cover.id;
      }).bind(this));
    });
    cr.ui.template.register("admin/disk_checkout.html", function(param) {
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
  function liba_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'VCD/DVD Library | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create a disk.
   */
  function create_disk() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button1 = $('multiuse-button1'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New Disk";
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
    var form = cr.ui.template.render_template('admin/disk_create.html');
    content.appendChild(form);
    overlay.eventTracker.add(button1, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      if (payload['cover_url'] === 'uploading') {
        alertOverlay.setValues(
          'Warning',
          'Cover is still uploading',
          'OK',
          null,
          function() {
            cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
          },
          null
        );
        cr.ui.hideLoading();
        cr.ui.overlay.showOverlay($('alertOverlay'));
        return;
      }
      payload['avail_type'] = 'Draft';
      cr.model.Disk.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      if (payload['cover_url'] === 'uploading') {
        alertOverlay.setValues(
          'Warning',
          'Cover is still uploading',
          'OK',
          null,
          function() {
            cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
          },
          null
        );
        cr.ui.hideLoading();
        cr.ui.overlay.showOverlay($('alertOverlay'));
        return;
      }
      payload['avail_type'] = 'Available';
      cr.model.Disk.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a disk.
   * @param {Integer} id The id of disk
   */
  function edit_disk(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit Disk Information";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.Disk.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/disk_edit.html', {disk: obj, cn: cn(obj)});
      content.appendChild(form);
      if (obj.avail_type === 'Draft') {
        var button1 = $('multiuse-button1');
        button1.textContent = "Publish";
        button1.removeAttribute('hidden');
        overlay.eventTracker.add(button1, 'click', function() {
          cr.ui.showLoading();
          var payload = Application.collectForm(content);
          if (payload['cover_url'] === 'uploading') {
            alertOverlay.setValues(
              'Warning',
              'Cover is still uploading',
              'OK',
              null,
              function() {
                cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
              },
              null
            );
            cr.ui.hideLoading();
            cr.ui.overlay.showOverlay($('alertOverlay'));
            return;
          }
          payload['avail_type'] = 'Available';
          cr.model.Disk.put(id, payload, true, function() {
            cr.ui.hideLoading();
            cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
            history.go();
            cr.ui.showNotification('Saved', 'dismiss');
          });
        });
      }
      overlay.eventTracker.add(button2, 'click', function() {
        cr.ui.showLoading();
        var payload = Application.collectForm(content);
        if (payload['cover_url'] === 'uploading') {
          alertOverlay.setValues(
            'Warning',
            'Cover is still uploading',
            'OK',
            null,
            function() {
              cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
            },
            null
          );
          cr.ui.hideLoading();
          cr.ui.overlay.showOverlay($('alertOverlay'));
          return;
        }
        cr.model.Disk.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a disk.
   * @param {Object} disk The disk object
   */
  function delete_disk(disk) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete Disk ' + cn(disk) + '?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.Disk.remove(disk.id, function() {
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
   * Check out a disk.
   * @param {Object} disk The disk object
   */
  function checkout_disk(disk) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Check out Disk " + cn(disk);
    button2.textContent = "Check out";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/disk_checkout.html', {
      disk: disk,
      due_at: cr.model.SiteSettings.getField('due_date').value,
    });
    content.appendChild(form);
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var r = new cr.APIRequest(cr.model.Disk, 'POST', '/' + disk.id + '/borrow/'),
          userid = form.querySelector('input[name="id"]').value;
      r.onload = function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Checked out', 'dismiss');
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
   * Check in a disk.
   * @param {Object} disk The disk object
   */
  function checkin_disk(disk) {
    var today = new Date,
        t_start = Date.parse([today.getFullYear(), pad(today.getMonth() + 1, 2), pad(today.getDate(), 2)].join('-') + 'T00:00:00.000+08:00'),
        t_due = Date.parse(toISODate(disk.due_at)),
        day = 1000 * 60 * 60 * 24;
    alertOverlay.setValues(
      'Confirm Checkin',
      'Check the disk ' + cn(disk) +' before confirming!\n' + 
      'Due at: ' + disk.due_at + 
      ((t_start > t_due) ? ("\nOverdue! Raw due day: " + Math.ceil((t_start - t_due) / day) + " days") : ""),
      'Check in',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        var r = new cr.APIRequest(cr.model.Disk, 'DELETE', '/' + disk.id + '/borrow/');
        r.onload = function() {
          cr.ui.hideLoading();
          history.go();
          cr.ui.showNotification('Succeeded', 'dismiss');
        };
        r.onerror = cr.errorHandler;
        r.send();
      },
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
      });
    cr.ui.overlay.showOverlay($('alertOverlay'));
  }

  /**
   * Clear reservation for a disk.
   * @param {Object} disk The disk object
   */
  function clear_disk(disk) {
    alertOverlay.setValues(
      'Confirm Clear Reservation Record',
      'Really?',
      'Clear',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        var r = new cr.APIRequest(cr.model.Disk, 'DELETE', '/' + disk.id + '/reservation/');
        r.onload = function() {
          cr.ui.hideLoading();
          history.go();
          cr.ui.showNotification('Cleared', 'dismiss');
        };
        r.onerror = cr.errorHandler;
        r.send();
      },
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
      });
    cr.ui.overlay.showOverlay($('alertOverlay'));
  }

  /**
   * Renew a disk.
   * @param {Object} disk The disk object
   */
  function renew_disk(disk) {
    alertOverlay.setValues(
      'Confirm Renew',
      'Renewing disk ' + cn(disk) +' will postpone the due date to 7 days later!',
      'Renew',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        var r = new cr.APIRequest(cr.model.Disk, 'POST', '/' + disk.id + '/borrow/');
        r.onload = function() {
          cr.ui.hideLoading();
          history.go();
          cr.ui.showNotification('Renewed', 'dismiss');
        };
        r.onerror = cr.errorHandler;
        r.sendJSON({id: disk.hold_by.id});
      },
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
      });
    cr.ui.overlay.showOverlay($('alertOverlay'));
  }

  /**
   * Hook to load liba list view.
   * @param {Object} query The query data
   */
  function liba_list(query) {
    var page = query.page || 1,
        type_filter = query.type_filter ? query.type_filter.split(',') : ['Draft', 'Available', 'Borrowed', 'Reserved', 'OnDelivery', 'ReservedCounter', 'Voting', 'Onshow'],
        skeleton = cr.ui.template.render_template("admin/liba_list.html", {filter: type_filter});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page + '&avail_type__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.Disk, api_query);
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
        api_query = "/?" + 'page=' + page + '&avail_type__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.Disk, api_query);
        routerManager.pushState(generateURL(), false, true);
        scrollTo(0, 0);
        cr.ui.displayLoading(content);
        pager.load(load_obj);
      })
    }

    //Buttons
    skeleton.querySelector('#liba-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Disk', {
        model: 'Disk',
      }, cr.model.Disk.types);
    });
    skeleton.querySelector('#liba-create-disk').addEventListener('click', create_disk);

    //Search box
    var searchbox = skeleton.querySelector('header .corner input[type="search"]');
    searchbox.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        if (e.target.value === '') {
          return;
        }
        //Start search
        var new_query = {
          q: e.target.value,
        };
        routerManager.pushState('liba/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/disk_list_item.html", {disk: obj_list[i], cn: cn(obj_list[i])});
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
      return 'liba/?page=' + page + '&type_filter=' + type_filter.join(',');
    }
  }

  /**
   * Hook to load liba search view.
   * @param {Object} query The query data
   */
  function liba_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/liba_search.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = generateAPI(),
        pager = new cr.Pager(cr.model.Disk, api_query);
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

    //Buttons
    skeleton.querySelector('#liba-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Disk', {
        model: 'Disk',
      }, cr.model.Disk.types);
    });
    skeleton.querySelector('#liba-create-disk').addEventListener('click', create_disk);

    //Search box
    var searchbox = skeleton.querySelector('header .corner input[type="search"]');
    searchbox.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        if (e.target.value === '') {
          return;
        }
        //Start search
        param = e.target.value;
        page = 1;
        api_query = generateAPI();
        pager = new cr.Pager(cr.model.Disk, api_query);
        routerManager.pushState(generateURL(), false, true);
        scrollTo(0, 0);
        cr.ui.displayLoading(content);
        pager.load(load_obj);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/disk_list_item.html", {disk: obj_list[i], cn: cn(obj_list[i])});
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
      return 'liba/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }

    function generateAPI() {
      if (/^[AB]\d{4}$/.test(param)) {
        return "/?disk_type=" + param.substr(0, 1) + "&id=" + param.substr(1);
      }
      else {
        return "/search/?page=" + page + "&query=" + encodeURIComponent(param);
      }
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.liba.Initialize();
