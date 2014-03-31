/**
 * @fileoverview View concerning About Us.
 */

cr.define('cr.view.about', function() {
  var name = 'about',
      scroll_timeout = 10;

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/about\//, false, about_setup(about_list));

    cr.ui.template.register("aboutus_template.html");
    cr.ui.template.register('aboutus_list_item.html');
    cr.ui.template.register('aboutus_detail_wrapper.html', function(param) {
      var cover = this.querySelector('.aboutus-image');
      cr.ui.rotator.init(cover);
    });
    cr.ui.template.register('aboutus_society.html');

  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function about_setup(func) {
    return function() {
      var aboutus_template = cr.ui.template.render_template('aboutus_template.html');
      cr.ui.replaceContent(aboutus_template, (function(a) {
        cr.ui.changeSelection(name);
        cr.view.name = name;
        document.title = "About Us | Film Society, HKUSTSU";
        routerManager.markTracker();
        func.apply(this, a);
      }).bind(aboutus_template, arguments));
    };
  }

  /**
   * Switch the displaying ticket.
   * @param {HTMLElement} root The root element to perform switch
   * @param {Integer} id The ticket to switch to
   */
  function about_switch(root, id) {
    var panel = root.querySelector('.left-panel'),
        detail_wrapper = panel.querySelector('.item-info-wrapper');
    panel.classList.add('loading');
    if (id !== 0) {
      cr.model.Exco.get(id, function(exco) {
        setTimeout(function() {
          document.title = exco.name_ch + ' ' + exco.name_en + " | Film Society, HKUSTSU";
          detail_wrapper.setAttribute("hidden", true);
          while (detail_wrapper.firstChild) {
            detail_wrapper.removeChild(detail_wrapper.firstChild);
          }
          var exco_info = cr.ui.template.render_template('aboutus_detail_wrapper.html', {exco: exco});
          detail_wrapper.appendChild(exco_info);
          detail_wrapper.removeAttribute('hidden');
          var img = new Image(),
              cover = exco_info.querySelector('.aboutus-image');
          img.onload = (function(exco) {
            cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + exco.img_url.url + ')';
            panel.classList.remove('loading');
            cr.ui.bbcode.handleHTML(exco_info.querySelector('.aboutus-descript'));
          }).bind(null, exco);
          img.onerror = function() {
            panel.classList.remove('loading');
          }
          img.src = cr.settings.resource_base + 'upload/' + exco.img_url.url;
        }, 60);
      });
    }
    else {
      //Film Society Page
      setTimeout(function() {
        document.title = "About Us | Film Society, HKUSTSU";
        detail_wrapper.setAttribute("hidden", true);
        while (detail_wrapper.firstChild) {
          detail_wrapper.removeChild(detail_wrapper.firstChild);
        }
        var soc_info = cr.ui.template.render_template('aboutus_society.html');
        detail_wrapper.appendChild(soc_info);
        detail_wrapper.removeAttribute('hidden');
        setTimeout(function() {
          panel.classList.remove('loading');
        }, 0);
      }, 60);
    }
  }

  /**
   * About Us main view
   */
  function about_list() {
    var node = this,
        left_panel = this.querySelector('.left-panel'),
        right_panel = this.querySelector('.right-panel'),
        list_wrapper = right_panel.querySelector('.aboutus-list-wrapper'),
        pager = new cr.Pager(cr.model.Exco, '/'),
        scroller = new cr.ui.Scroller(right_panel);

    pager.load(load_excos);

    function load_excos(obj_list) {
      //Add Society Intro first
      var soc_entry = cr.ui.template.render_template('aboutus_list_item.html', {exco: {position: "Film Society, HKUSTSU", name_ch: cr.settings.session}});
      list_wrapper.appendChild(soc_entry);
      soc_entry.addEventListener('click', (function(node) {
        about_switch(node, 0);
        switch_selection(this);
      }).bind(soc_entry, node));

      //Append to list
      for (var i = 0; i < obj_list.length; i++) {
        var entry = cr.ui.template.render_template('aboutus_list_item.html', {exco: obj_list[i]});
        //Hook
        entry.addEventListener('click', (function(node, id) {
          about_switch(node, id);
          switch_selection(this);
        }).bind(entry, node, obj_list[i].id));
        list_wrapper.appendChild(entry);
      }
      //There will be only one loading (More than 40 Excos? You must be kidding)
      //View init
      ajustItems();
      var items = list_wrapper.querySelectorAll('.aboutus-list-item');
      for (var i = 0; i < items.length; i++) {
        setTimeout((function() {
          this.classList.remove('loading');
        }).bind(items[i]), 100 * i + 50);
      }
      right_panel.addEventListener('scroll', handleScroll);
      left_panel.addEventListener('mouseover', resetScroll);
      setTimeout((function() {
        about_switch(node, 0);
        switch_selection(this);
      }).bind(soc_entry), 200);
    }

    function ajustItems() {
      var items = getInView(),
          perHeight = items[0] ? items[0].clientHeight : 0,
          cHeight = right_panel.clientHeight,
          halfHeight = (cHeight >> 1) + perHeight,
          viewCenter = right_panel.scrollTop - (perHeight >> 1);
      for (var i = 0; i < items.length; i++) {
        var entry = items[i],
            distance = viewCenter - entry.offsetTop,
            abs_dist = Math.abs(distance),
            new_transform = 
              "translateX(" + ((entry.getAttribute('selected') ? 10 : 20) + (10 * abs_dist / halfHeight)) + '%)' + 
              " scale(1)";
        entry.style.webkitTransform = new_transform;
        entry.style.MozTransform = new_transform;
        entry.style.msTransform = new_transform;
        entry.style.OTransform = new_transform;
        entry.style.transform = new_transform;
        entry.style.marginBottom = (-0.5 + (0.5 * distance / halfHeight)) + 'em';
      }
    }

    function getInView() {
      var cHeight = right_panel.clientHeight,
          viewStart = right_panel.scrollTop - (cHeight >> 1),
          viewEnd = viewStart + cHeight,
          items = list_wrapper.querySelectorAll('.aboutus-list-item'),
          perHeight = items[0].clientHeight,
          cumTop = 0,
          start, end;
      for (start = 0; cumTop < viewStart && start < items.length; start++) {
        cumTop += perHeight;
      }
      for (end = start; cumTop <= viewEnd && end < items.length; end++) {
        cumTop += perHeight;
      }
      return Array.prototype.slice.call(items, Math.max(0, start - 1), end + 1);
    }

    function handleScroll(e) {
      ajustItems();
    }

    function resetScroll() {
      var selected = list_wrapper.querySelector('[selected]');
      //Scroll into view
      var itemHeight = selected.clientHeight,
          centerOffset = selected.offsetTop + (itemHeight >> 1);
      scroller.scrollTo(0, centerOffset, 500, null, new cr.ui.UnitBezier(0.5, 0, 0.6, 1));
    }

    function switch_selection(node) {
      var selected = list_wrapper.querySelectorAll('[selected]');
      for (var i = 0; i < selected.length; i++) {
        selected[i].removeAttribute('selected');
      }
      node.setAttribute('selected', true);
      //Scroll into view
      var itemHeight = node.clientHeight,
          centerOffset = node.offsetTop + (itemHeight >> 1);
      scroller.scrollTo(0, centerOffset, 500, null, new cr.ui.UnitBezier(0.5, 0, 0.6, 1));
      ajustItems();
    }
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.about.Initialization();