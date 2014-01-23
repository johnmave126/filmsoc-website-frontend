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
        pager = new cr.Pager(cr.model.Document, '/');

    node.scrollList = new cr.ui.scrollList(list_wrapper, list_wrapper, pager, {
      onload: function(obj, idx) {
        var entry = cr.ui.template.render_template('doc_list_item.html', {doc: obj});
        //Hook
        entry.addEventListener('click', doc_switch.bind(null, node, obj.id));
        this.elem.insertBefore(entry, this.anchor_element);
        setTimeout((function() {
          this.classList.remove('loading');
        }).bind(entry), idx * 50);
        if (this.first_load && idx == 0) {
          doc_switch(node, obj.id);
        }
      }
    });
    node.scrollList.load();
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.document.Initialization();