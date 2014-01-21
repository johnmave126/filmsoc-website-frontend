/**
 * @fileoverview View concerning Publication.
 */

cr.define('cr.view.publication', function() {
  var name = 'publication';
  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/publication\//, false, publication_setup(publication_list));
    routerManager.register(/publication\/search\//, false, publication_setup(publication_search));
    cr.ui.template.register("admin/publication_list.html");
    cr.ui.template.register("admin/publication_search.html");
    cr.ui.template.register("admin/publication_list_item.html", function(param) {
      var cover = this.querySelector('.cover-column > img');
      if (param.publication.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.publication.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';

      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_publication(obj.id);
      }).bind(null, param.publication));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_publication.bind(null, param.publication));
    });
    cr.ui.template.register("admin/publication_form.html", function(param) {
      var cover = this.querySelector('.cover-container'),
          dn = this.querySelector('a.dn_link'),
          file_wrapper = this.querySelector('.publication-file'),
          link_wrapper = this.querySelector('.publication-link');

      if (param.publication.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.publication.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';

      cr.uploader.init(this.querySelector('.cover-drop'), (function() {
        this.querySelector('input[name="cover_url"]').value = 'uploading';
      }).bind(this), (function(new_cover) {
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        this.querySelector('input[name="cover_url"]').value = new_cover.id;
      }).bind(this));

      cr.uploader.init(this.querySelector('.file-drop'), (function() {
        this.querySelector('input[name="doc_url"]').value = 'uploading';
      }).bind(this), (function(new_doc) {
        dn.href = cr.settings.resource_base + 'upload/' + new_doc.url + '?force_download=true&dn_name=' + new_doc.name;
        dn.removeAttribute('hidden');
        this.querySelector('input[name="doc_url"]').value = new_doc.id;
      }).bind(this));

      this.querySelector('select[name="pub_type"]').addEventListener('change', function() {
        switch(this.value) {
          case 'MicroMagazine':
            link_wrapper.removeAttribute('hidden');
            file_wrapper.setAttribute('hidden', true);
            link_wrapper.querySelector('input[name="ext_doc_url"]').removeAttribute('disabled');
            file_wrapper.querySelector('input[name="doc_url"]').value = "";
            break;
          default:
            file_wrapper.removeAttribute('hidden');
            link_wrapper.setAttribute('hidden', true);
            file_wrapper.querySelector('input[name="doc_url"]').removeAttribute('disabled');
            link_wrapper.querySelector('input[name="ext_doc_url"]').value = "";
        }
      });
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function publication_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Publication | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create an publication.
   */
  function create_publication() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New Publication";
    button2.textContent = "Create";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    var form = cr.ui.template.render_template('admin/publication_form.html', {publication: {}, base_url: cr.settings.resource_base + 'upload/'});
    content.appendChild(form);
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
      if (payload['doc_url'] === 'uploading') {
        alertOverlay.setValues(
          'Warning',
          'Document is still uploading',
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
      cr.model.Publication.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a publication.
   * @param {Integer} id The id of publication
   */
  function edit_publication(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit Publication";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.Publication.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/publication_form.html', {publication: obj, base_url: cr.settings.resource_base + 'upload/'});
      content.appendChild(form);
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
        if (payload['doc_url'] === 'uploading') {
          alertOverlay.setValues(
            'Warning',
            'Document is still uploading',
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
        cr.model.Publication.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a publication.
   * @param {Integer} id The id of publication
   */
  function delete_publication(publication) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete publication ' + publication.title + '?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.Publication.remove(publication.id, function() {
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
   * Hook to load publication list view.
   * @param {Object} query The query data
   */
  function publication_list(query) {
    var page = query.page || 1,
        type_filter = query.type_filter ? query.type_filter.split(',') : ['Magazine', 'MicroMagazine', 'Podcast'],
        skeleton = cr.ui.template.render_template("admin/publication_list.html", {filter: type_filter});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page + '&avail_type__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.Publication, api_query);
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
        pager = new cr.Pager(cr.model.Publication, api_query);
        routerManager.pushState(generateURL(), false, true);
        scrollTo(0, 0);
        cr.ui.displayLoading(content);
        pager.load(load_obj);
      })
    }

    //Buttpublication
    skeleton.querySelector('#publication-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Publication', {
        model: 'Publication',
      }, cr.model.Publication.types);
    });
    skeleton.querySelector('#publication-create-publication').addEventListener('click', create_publication);

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
        routerManager.pushState('publication/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/publication_list_item.html", {publication: obj_list[i]});
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
      return 'publication/?page=' + page + '&type_filter=' + type_filter.join(',');
    }
  }

  /**
   * Hook to load publication search view.
   * @param {Object} query The query data
   */
  function publication_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/publication_search.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param),
        pager = new cr.Pager(cr.model.Publication, api_query);
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
    skeleton.querySelector('#publication-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module Publication', {
        model: 'Publication',
      }, cr.model.Publication.types);
    });
    skeleton.querySelector('#publication-create-publication').addEventListener('click', create_publication);

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
        pager = new cr.Pager(cr.model.Publication, api_query);
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
        var listitem = cr.ui.template.render_template("admin/publication_list_item.html", {publication: obj_list[i]});
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
      return 'publication/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.publication.Initialize();
