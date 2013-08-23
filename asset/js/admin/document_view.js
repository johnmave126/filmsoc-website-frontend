/**
 * @fileoverview View concerning Document.
 */

cr.define('cr.view.doc', function() {
  var name = 'doc';
  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/doc\//, false, doc_setup(doc_list));
    routerManager.register(/doc\/search\//, false, doc_setup(doc_search));
    cr.ui.template.register("admin/doc_list.html");
    cr.ui.template.register("admin/doc_list_item.html", function(param) {
      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_doc(obj.id);
      }).bind(null, param.doc));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_doc.bind(null, param.doc));
    });
    cr.ui.template.register("admin/doc_form.html", function() {
      var dn = this.querySelector('a.dn_link');

      cr.uploader.init(this.querySelector('.file-drop'), (function() {
        this.querySelector('input[name="doc_url"]').value = 'uploading';
      }).bind(this), (function(new_doc) {
        dn.href = cr.settings.resource_base + 'upload/' + new_doc.url + '?force_download=true&dn_name=' + new_doc.name;
        dn.removeAttribute('hidden');
        this.querySelector('input[name="doc_url"]').value = new_doc.id;
      }).bind(this));
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function doc_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Document | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create an doc.
   */
  function create_doc() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New Document";
    button2.textContent = "Create";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/doc_form.html', {doc: {}, base_url: cr.settings.resource_base + 'upload/'});
    content.appendChild(form);
    overlay.eventTracker.add(button2, 'click', function() {
      cr.ui.showLoading();
      var payload = Application.collectForm(content);
      if (payload['doc_url'] === 'uploading') {
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
      cr.model.Document.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a doc.
   * @param {Integer} id The id of doc
   */
  function edit_doc(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit Document";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.Document.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/doc_form.html', {doc: obj, base_url: cr.settings.resource_base + 'upload/'});
      content.appendChild(form);
      overlay.eventTracker.add(button2, 'click', function() {
        cr.ui.showLoading();
        var payload = Application.collectForm(content);
        if (payload['doc_url'] === 'uploading') {
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
        cr.model.Document.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a doc.
   * @param {Integer} id The id of doc
   */
  function delete_doc(doc) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete document ' + doc.title + '?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.Document.remove(doc.id, function() {
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
   * Hook to load doc list view.
   * @param {Object} query The query data
   */
  function doc_list(query) {
    var page = query.page || 1,
        skeleton = cr.ui.template.render_template("admin/doc_list.html", {query: ''});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page,
        pager = new cr.Pager(cr.model.Document, api_query);
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

    //Buttdoc
    skeleton.querySelector('#doc-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Document', {
        model: 'Document',
      }, cr.model.Document.types);
    });
    skeleton.querySelector('#doc-create-doc').addEventListener('click', create_doc);

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
        routerManager.pushState('doc/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/doc_list_item.html", {doc: obj_list[i]});
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
      return 'doc/?page=' + page;
    }
  }

  /**
   * Hook to load doc search view.
   * @param {Object} query The query data
   */
  function doc_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/doc_list.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param),
        pager = new cr.Pager(cr.model.Document, api_query);
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

    //Buttdoc
    skeleton.querySelector('#doc-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Document', {
        model: 'Document',
      }, cr.model.Document.types);
    });
    skeleton.querySelector('#doc-create-doc').addEventListener('click', create_doc);

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
        pager = new cr.Pager(cr.model.Document, api_query);
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
        var listitem = cr.ui.template.render_template("admin/doc_list_item.html", {doc: obj_list[i]});
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
      return 'doc/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.doc.Initialize();
