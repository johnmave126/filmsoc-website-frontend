/**
 * @fileoverview View concerning One Sentence.
 */

cr.define('cr.view.onesentence', function() {
  var name = 'onesentence';
  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/onesentence\//, false, onesentence_setup(onesentence_list));
    routerManager.register(/onesentence\/search\//, false, onesentence_setup(onesentence_search));
    cr.ui.template.register("admin/ons_list.html");
    cr.ui.template.register("admin/ons_list_item.html", function(param) {
      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_onesentence(obj.id);
      }).bind(null, param.ons));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_onesentence.bind(null, param.ons));
    });
    cr.ui.template.register("admin/ons_form.html");
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function onesentence_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'One Sentence | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create an onesentence.
   */
  function create_onesentence() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New One Sentence";
    button2.textContent = "Create";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/ons_form.html', {ons: {}});
    content.appendChild(form);
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      cr.model.OneSentence.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a onesentence.
   * @param {Integer} id The id of onesentence
   */
  function edit_onesentence(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit One Sentence";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.OneSentence.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/ons_form.html', {ons: obj});
      content.appendChild(form);
      overlay.eventTracker.add(button2, 'click', function() {
        cr.ui.showLoading();
        var payload = Application.collectForm(content);
        cr.model.OneSentence.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a onesentence.
   * @param {Integer} id The id of onesentence
   */
  function delete_onesentence(ons) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete onesentence ' + ons.content + '?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.OneSentence.remove(ons.id, function() {
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
   * Hook to load onesentence list view.
   * @param {Object} query The query data
   */
  function onesentence_list(query) {
    var page = query.page || 1,
        skeleton = cr.ui.template.render_template("admin/ons_list.html", {query: ''});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page,
        pager = new cr.Pager(cr.model.OneSentence, api_query);
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
    skeleton.querySelector('#ons-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module OneSentence', {
        model: 'OneSentence',
      }, cr.model.OneSentence.types);
    });
    skeleton.querySelector('#ons-create-onesentence').addEventListener('click', create_onesentence);

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
        routerManager.pushState('onesentence/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/ons_list_item.html", {ons: obj_list[i]});
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
      return 'onesentence/?page=' + page;
    }
  }

  /**
   * Hook to load onesentence search view.
   * @param {Object} query The query data
   */
  function onesentence_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/ons_list.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param),
        pager = new cr.Pager(cr.model.OneSentence, api_query);
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
    skeleton.querySelector('#ons-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module OneSentence', {
        model: 'OneSentence',
      }, cr.model.OneSentence.types);
    });
    skeleton.querySelector('#ons-create-onesentence').addEventListener('click', create_onesentence);

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
        pager = new cr.Pager(cr.model.OneSentence, api_query);
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
        var listitem = cr.ui.template.render_template("admin/ons_list_item.html", {ons: obj_list[i]});
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
      return 'onesentence/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.onesentence.Initialize();
