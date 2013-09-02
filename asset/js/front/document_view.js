/**
 * @fileoverview View concerning Document.
 */

cr.define('cr.view.document', function() {
  var name = 'document';

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/document\//, false, doc_setup(doc_list));

    cr.ui.template.register("doc_template.html");
    cr.ui.template.register('doc_list_item.html');
    cr.ui.template.register("doc_detail.html");
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function doc_setup(func) {
    return function() {
      cr.view.name = name;
      cr.ui.changeSelection(name);
      document.title = "Document | Film Society, HKUSTSU";
      routerManager.markTracker();
      var doc_template = cr.ui.template.render_template('doc_template.html');
      cr.ui.replaceContent(doc_template, (function(a) {
        func.apply(this, a);
      }).bind(doc_template, arguments));
    };
  }

  /**
   * Switch the displaying document.
   * @param {HTMLElement} root The root element to perform switch
   * @param {Integer} id The document to switch to
   */
  function doc_switch(root, id) {
    var panel = root.querySelector('.right-panel'),
        detail_wrapper = panel.querySelector('.doc-content-wrapper');
    panel.classList.add('loading');
    cr.model.Document.get(id, function(doc) {
      setTimeout(function() {
        document.title = doc.title + " | Film Society, HKUSTSU";
        detail_wrapper.setAttribute("hidden", true);
        while (detail_wrapper.firstChild) {
          detail_wrapper.removeChild(detail_wrapper.firstChild);
        }
        var doc_item = cr.ui.template.render_template('doc_detail.html', {doc: doc, base_url: cr.settings.resource_base + 'upload/'});
        detail_wrapper.appendChild(doc_item);
        detail_wrapper.removeAttribute('hidden');
        setTimeout(function() {
          panel.classList.remove('loading');
        }, 0);
      }, 410);
    });
  }

  /**
   * Document main view
   */
  function doc_list() {
    var node = this,
        list_wrapper = this.querySelector('.left-panel .doc-list-wrapper'),
        anchor_element = list_wrapper.querySelector('.anchor'),
        panel = this.querySelector('.right-panel'),
        pager = new cr.Pager(cr.model.Document, '/'),
        ajax_loading = true,
        first_load = true;

    list_wrapper.addEventListener('scroll', handleScroll);
    pager.load(load_tickets);
    function load_tickets(obj_list) {
      if (obj_list.length === 0 || !this.has_next) {
        list_wrapper.removeChild(anchor_element);
        list_wrapper.removeEventListener('scroll', handleScroll);
      }
      //Append to list
      for (var i = 0; i < obj_list.length; i++) {
        var entry = cr.ui.template.render_template('doc_list_item.html', {doc: obj_list[i]});
        //Hook
        entry.addEventListener('click', doc_switch.bind(null, node, obj_list[i].id));
        list_wrapper.appendChild(entry);
        setTimeout((function() {
          this.classList.remove('loading');
        }).bind(entry), i * 50);
        if (first_load && i == 0) {
          doc_switch(node, obj_list[i].id);
        }
      }
      first_load = false;
      ajax_loading = false;
    }

    function handleScroll(e) {
      if (ajax_loading) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();

      var scrollTop = list_wrapper.scrollTop,
          windowHeight = list_wrapper.clientHeight,
          scrollHeight = list_wrapper.scrollHeight;

      if (scrollTop + windowHeight + 10 > scrollHeight) {
        //Trigger Loading
        ajax_loading = true;
        pager.next(load_tickets);
      }
    }
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.document.Initialization();