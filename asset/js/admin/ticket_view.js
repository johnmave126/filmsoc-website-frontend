/**
 * @fileoverview View concerning Preview Show Ticket.
 */

cr.define('cr.view.ticket', function() {
  var name = 'ticket';

  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/ticket\//, false, ticket_setup(ticket_list));
    routerManager.register(/ticket\/search\//, false, ticket_setup(ticket_search));
    cr.ui.template.register("admin/ticket_list.html");
    cr.ui.template.register("admin/ticket_search.html");
    cr.ui.template.register("admin/ticket_list_item.html", function(param) {
      var cover = this.querySelector('div.cover-column > img');
      if (param.ticket.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.ticket.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_ticket(obj.id);
      }).bind(null, param.ticket));
      this.querySelector('button[control="viewlog"]').addEventListener('click', (function(obj) {
        cr.logger.showLogger('View Logs of PreviewShowTicket', {
          model: 'PreviewShowTicket',
          id: obj.id,
        }, cr.model.PreviewShowTicket.types);
      }).bind(null, param.ticket));
      this.querySelector('button[control="delete"]').addEventListener('click', delete_ticket.bind(null, param.ticket));
    });
    cr.ui.template.register("admin/ticket_edit.html", function(param) {
      var cover = this.querySelector('.cover-container');
      if (param.ticket.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.ticket.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
      cr.uploader.init(this.querySelector('.cover-drop'), (function() {
        this.querySelector('input[name="cover_url"]').value = 'uploading';
      }).bind(this), (function(new_cover) {
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        this.querySelector('input[name="cover_url"]').value = new_cover.id;
      }).bind(this));
    });
    cr.ui.template.register("admin/ticket_create.html", function() {
      var cover = this.querySelector('.cover-container');
      cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
      cr.uploader.init(this.querySelector('.cover-drop'), (function() {
        this.querySelector('input[name="cover_url"]').value = 'uploading';
      }).bind(this), (function(new_cover) {
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        this.querySelector('input[name="cover_url"]').value = new_cover.id;
      }).bind(this));
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function ticket_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Preview Show Ticket | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Create a ticket.
   */
  function create_ticket() {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button1 = $('multiuse-button1'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Create New PreviewShowTicket";
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
    var form = cr.ui.template.render_template('admin/ticket_create.html');
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
      payload['state'] = 'Draft';
      cr.model.PreviewShowTicket.post(payload, function() {
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
      payload['state'] = 'Open';
      cr.model.PreviewShowTicket.post(payload, function() {
        cr.ui.hideLoading();
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
        history.go();
        cr.ui.showNotification('Saved', 'dismiss');
      });
    });
  }

  /**
   * Edit a ticket.
   * @param {Integer} id The id of ticket
   */
  function edit_ticket(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit PreviewShowTicket Information";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.PreviewShowTicket.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/ticket_edit.html', {ticket: obj});
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
        cr.model.PreviewShowTicket.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Delete a ticket.
   * @param {Object} ticket The ticket object
   */
  function delete_ticket(ticket) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete PreviewShowTicket?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.PreviewShowTicket.remove(ticket.id, function() {
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
   * Hook to load ticket list view.
   * @param {Object} query The query data
   */
  function ticket_list(query) {
    var page = query.page || 1,
        type_filter = query.type_filter ? query.type_filter.split(',') : ['Draft', 'Open', 'Closed'],
        skeleton = cr.ui.template.render_template("admin/ticket_list.html", {filter: type_filter});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page + '&state__in=' + type_filter.join(','),
        pager = new cr.Pager(cr.model.PreviewShowTicket, api_query);
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
        pager = new cr.Pager(cr.model.PreviewShowTicket, api_query);
        routerManager.pushState(generateURL(), false, true);
        scrollTo(0, 0);
        cr.ui.displayLoading(content);
        pager.load(load_obj);
      })
    }

    //Buttons
    skeleton.querySelector('#ticket-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module PreviewShowTicket', {
        model: 'PreviewShowTicket',
      }, cr.model.PreviewShowTicket.types);
    });
    skeleton.querySelector('#ticket-create-ticket').addEventListener('click', create_ticket);

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
        routerManager.pushState('ticket/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/ticket_list_item.html", {ticket: obj_list[i]});
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
      return 'ticket/?page=' + page + '&type_filter=' + type_filter.join(',');
    }
  }

  /**
   * Hook to load ticket search view.
   * @param {Object} query The query data
   */
  function ticket_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/ticket_search.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = generateAPI(),
        pager = new cr.Pager(cr.model.PreviewShowTicket, api_query);
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
    skeleton.querySelector('#ticket-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module PreviewShowTicket', {
        model: 'PreviewShowTicket',
      }, cr.model.PreviewShowTicket.types);
    });
    skeleton.querySelector('#ticket-create-ticket').addEventListener('click', create_ticket);

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
        pager = new cr.Pager(cr.model.PreviewShowTicket, api_query);
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
        var listitem = cr.ui.template.render_template("admin/ticket_list_item.html", {ticket: obj_list[i]});
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
      return 'ticket/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }

    function generateAPI() {
      return "/search/?page=" + page + "&query=" + encodeURIComponent(param);
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.ticket.Initialize();
