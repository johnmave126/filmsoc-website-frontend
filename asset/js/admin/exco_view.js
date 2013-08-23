/**
 * @fileoverview View concerning Exco.
 */

cr.define('cr.view.exco', function() {
  var name = 'exco';
  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/exco\//, false, exco_setup(exco_list));
    cr.ui.template.register("admin/exco_list.html");
    cr.ui.template.register("admin/exco_list_item.html", function(param) {
      this.querySelector('button[control="edit"]').addEventListener('click', (function(obj) {
        edit_exco(obj.id);
      }).bind(null, param.exco));
    });
    cr.ui.template.register("admin/exco_form.html", function(param) {
      var cover = this.querySelector('.cover-container');
      cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.exco.img_url.url + ')';
      cr.uploader.init(this.querySelector('.cover-drop'), (function() {
        this.querySelector('input[name="img_url"]').value = 'uploading';
      }).bind(this), (function(new_cover) {
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        this.querySelector('input[name="img_url"]').value = new_cover.id;
      }).bind(this));
      cr.ui.rotator.init(cover);
      cr.richText.init(this.querySelector('textarea[name="descript"]'));
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function exco_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Exco | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Edit a exco.
   * @param {Integer} id The id of exco
   */
  function edit_exco(id) {
    var overlay = $('multiuseOverlay'),
        title = overlay.querySelector('h1'),
        content = overlay.querySelector('.content-area'),
        button2 = $('multiuse-button2'),
        button3 = $('multiuse-button3');
    cr.ui.resetMultiuse();
    title.textContent = "Edit Exco";
    button2.textContent = "Save";
    button2.removeAttribute('hidden');
    button3.textContent = "Cancel";
    button3.removeAttribute('hidden');
    overlay.eventTracker.add(button3, 'click', function() {
      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });
    cr.ui.overlay.showOverlay(overlay);
    cr.model.Exco.get(id, function(obj) {
      var form = cr.ui.template.render_template('admin/exco_form.html', {exco: obj, base_url: cr.settings.resource_base + 'upload/'});
      content.appendChild(form);
      overlay.eventTracker.add(button2, 'click', function() {
        cr.ui.showLoading();
        var payload = Application.collectForm(content);
        if (payload['img_url'] === 'uploading') {
          alertOverlay.setValues(
            'Warning',
            'Picture is still uploading',
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
        cr.model.Exco.put(id, payload, true, function() {
          cr.ui.hideLoading();
          cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
          history.go();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      });
    });
  }

  /**
   * Hook to load exco list view.
   * @param {Object} query The query data
   */
  function exco_list(query) {
    var page = query.page || 1,
        skeleton = cr.ui.template.render_template("admin/exco_list.html", {query: ''});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page,
        pager = new cr.Pager(cr.model.Exco, api_query);
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

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/exco_list_item.html", {exco: obj_list[i]});
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
      return 'exco/?page=' + page;
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.exco.Initialize();
