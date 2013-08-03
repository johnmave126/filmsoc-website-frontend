/**
 * @fileoverview View concerning User.
 */

cr.define('cr.view.member', function() {
  var name = 'member';
  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/member\//, false, member_setup(member_list));
    routerManager.register(/member\/search\//, false, member_setup(member_search));
    cr.ui.template.register("admin/user_list.html");
    cr.ui.template.register("admin/user_search.html");
    cr.ui.template.register("admin/user_list_item.html", function(param) {
      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_member(obj.id);
      }).bind(null, param.user));
      this.querySelector('button[control="viewlog"]').addEventListener('click', (function(obj) {
        cr.logger.showLogger('View Logs of member ' + obj.itsc, {
          user: obj.id,
        });
      }).bind(null, param.user));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_member.bind(null, param.user));
    });
    cr.ui.template.register("admin/user_edit.html", function() {
      this.querySelector('input[name="university_id"]').addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
    });
    cr.ui.template.register("admin/user_create.html", function() {
      this.querySelector('input[name="university_id"]').addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function member_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Member | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create a member.
   */
  function create_member() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New Member";
    button2.textContent = "Create";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/user_create.html');
    content.appendChild(form);
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      cr.model.User.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a member.
   * @param {Integer} id The id of member
   */
  function edit_member(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit Member Information";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.User.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/user_edit.html', {user: obj});
      content.appendChild(form);
      overlay.eventTracker.add(button2, 'click', function() {
        cr.ui.showLoading();
        var payload = Application.collectForm(content);
        cr.model.User.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a member.
   * @param {Object} user The member object
   */
  function delete_member(user) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete member ' + user.itsc + '?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.User.remove(user.id, function() {
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
   * Hook to load member list view.
   * @param {Object} query The query data
   */
  function member_list(query) {
    var page = query.page || 1,
        type_filter = query.type_filter ? query.type_filter.split(',') : ['Full','OneSem','OneYear','TwoYear','ThreeYear','Honour','Assoc'],
        skeleton = cr.ui.template.render_template("admin/user_list.html", {filter: type_filter});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page + '&member_type__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.User, api_query);
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
        api_query = "/?" + 'page=' + page + '&member_type__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.User, api_query);
        routerManager.pushState(generateURL(), false, true);
        scrollTo(0, 0);
        cr.ui.displayLoading(content);
        pager.load(load_obj);
      })
    }

    //Buttons
    skeleton.querySelector('#user-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module User', {
        model: 'User',
      }, cr.model.User.types);
    });
    skeleton.querySelector('#user-create-member').addEventListener('click', create_member);

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
        routerManager.pushState('member/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/user_list_item.html", {user: obj_list[i]});
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
      return 'member/?page=' + page + '&type_filter=' + type_filter.join(',');
    }
  }

  /**
   * Hook to load member search view.
   * @param {Object} query The query data
   */
  function member_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/user_search.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param),
        pager = new cr.Pager(cr.model.User, api_query);
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
    skeleton.querySelector('#user-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module User', {
        model: 'User',
      }, cr.model.User.types);
    });
    skeleton.querySelector('#user-create-member').addEventListener('click', create_member);

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
        api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param);
        pager = new cr.Pager(cr.model.User, api_query);
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
        var listitem = cr.ui.template.render_template("admin/user_list_item.html", {user: obj_list[i]});
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
      return 'member/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.member.Initialize();
