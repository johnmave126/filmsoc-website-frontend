/**
 * @fileoverview View concerning Sponsor.
 */

cr.define('cr.view.sponsor', function() {
  var name = 'sponsor';
  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/sponsor\//, false, sponsor_setup(sponsor_list));
    routerManager.register(/sponsor\/search\//, false, sponsor_setup(sponsor_search));
    cr.ui.template.register("admin/sponsor_list.html");
    cr.ui.template.register("admin/sponsor_list_item.html", function(param) {
      var cover = this.querySelector('.img-column > img');
      if (param.sponsor.img_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.sponsor.img_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';

      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_sponsor(obj.id);
      }).bind(null, param.sponsor));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_sponsor.bind(null, param.sponsor));
    });
    cr.ui.template.register("admin/sponsor_form.html", function(param) {
      var cover = this.querySelector('.cover-container');
      if (param.sponsor.img_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.sponsor.img_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';

      cr.uploader.init(this.querySelector('.cover-drop'), (function() {
        this.querySelector('input[name="img_url"]').value = 'uploading';
      }).bind(this), (function(new_cover) {
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        this.querySelector('input[name="img_url"]').value = new_cover.id;
      }).bind(this));
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function sponsor_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Sponsor | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create an sponsor.
   */
  function create_sponsor() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New Sponsor";
    button2.textContent = "Create";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/sponsor_form.html', {sponsor: {}, base_url: cr.settings.resource_base + 'upload/'});
    content.appendChild(form);
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      if (payload['img_url'] === 'uploading') {
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
      cr.model.Sponsor.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a sponsor.
   * @param {Integer} id The id of sponsor
   */
  function edit_sponsor(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit Sponsor";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.Sponsor.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/sponsor_form.html', {sponsor: obj, base_url: cr.settings.resource_base + 'upload/'});
      content.appendChild(form);
      overlay.eventTracker.add(button2, 'click', function() {
        cr.ui.showLoading();
        var payload = Application.collectForm(content);
        if (payload['img_url'] === 'uploading') {
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
        cr.model.Sponsor.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a sponsor.
   * @param {Integer} id The id of sponsor
   */
  function delete_sponsor(sponsor) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete sponsor ' + sponsor.name + '?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.Sponsor.remove(sponsor.id, function() {
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
   * Hook to load sponsor list view.
   * @param {Object} query The query data
   */
  function sponsor_list(query) {
    var page = query.page || 1,
        skeleton = cr.ui.template.render_template("admin/sponsor_list.html", {query: ''});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page,
        pager = new cr.Pager(cr.model.Sponsor, api_query);
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

    //Buttsponsor
    skeleton.querySelector('#sponsor-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Sponsor', {
        model: 'Sponsor',
      }, cr.model.Sponsor.types);
    });
    skeleton.querySelector('#sponsor-create-sponsor').addEventListener('click', create_sponsor);

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
        routerManager.pushState('sponsor/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/sponsor_list_item.html", {sponsor: obj_list[i]});
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
      return 'sponsor/?page=' + page;
    }
  }

  /**
   * Hook to load sponsor search view.
   * @param {Object} query The query data
   */
  function sponsor_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/sponsor_list.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param),
        pager = new cr.Pager(cr.model.Sponsor, api_query);
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

    //Buttsponsor
    skeleton.querySelector('#sponsor-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Sponsor', {
        model: 'Sponsor',
      }, cr.model.Sponsor.types);
    });
    skeleton.querySelector('#sponsor-create-sponsor').addEventListener('click', create_sponsor);

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
        pager = new cr.Pager(cr.model.Sponsor, api_query);
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
        var listitem = cr.ui.template.render_template("admin/sponsor_list_item.html", {sponsor: obj_list[i]});
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
      return 'sponsor/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.sponsor.Initialize();
