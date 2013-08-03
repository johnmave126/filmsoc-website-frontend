/**
 * @fileoverview View concerning SiteSettings.
 */

cr.define('cr.view.settings', function() {
  var name = 'settings';

  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/settings\//, false, settings_setup(settings_set));
    cr.ui.template.register("admin/settings.html", function() {
      var buttons = this.querySelectorAll('button[type="submit"]'),
          node = this;
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
          var key = this.getAttribute('control'),
              input_tag = node.querySelector('*[name="' + key + '"]'),
              value = input_tag.value,
              id = cr.model.SiteSettings.getField(key).id;
          cr.ui.showLoading();
          cr.model.SiteSettings.put(id, {value: value}, true, function() {
            cr.ui.hideLoading();
            cr.ui.showNotification('Saved', 'dismiss');
          });
        });
      }
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function settings_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Site Settings | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Hook to load settings view.
   */
  function settings_set() {
    var skeleton = cr.ui.template.render_template("admin/settings.html", {model: cr.model.SiteSettings}),
        cover = skeleton.querySelector('.front-drop img'),
        cover_id = cr.model.SiteSettings.getField('header_image').value;
    if (cover_id) {
      cr.model.File.get(cover_id, function(file) {
        cover.src = cr.settings.resource_base + 'upload/' + file.url;
      });
    }
    cr.uploader.init(
      skeleton.querySelector('.front-drop'),
      null,
      function(new_cover) {
        var id = cr.model.SiteSettings.getField('header_image').id;
        cover.src = cr.settings.resource_base + 'upload/' + new_cover.url;
        cr.ui.showLoading();
        cr.model.SiteSettings.put(id, {value: new_cover.id}, true, function() {
          cr.ui.hideLoading();
          cr.ui.showNotification('Saved', 'dismiss');
        });
      }
    );
    cr.ui.replaceContent(skeleton);
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.settings.Initialize();
