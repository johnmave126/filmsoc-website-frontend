/**
 * @fileoverview View concerning DVD Library.
 */

cr.define('cr.view.publication', function() {
  var name = 'publication',
      isIOS = /(ipad|iphone|ipod)/i.exec(navigator.userAgent);

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/publication\//, false, pub_setup(pub_list));

    cr.ui.template.register("pub_template.html", function() {
      var node = this.querySelector('.left-panel');
          left_rotator = node.querySelectorAll('.btn-rotate-left'),
          right_rotator = node.querySelectorAll('.btn-rotate-right');
      //Init face
      node.face_idx = 1;
      node.rot = 0;
      for (var i = 0; i < left_rotator.length; i++) {
        left_rotator[i].addEventListener('click', function() {
          node.rot += 120;
          node.face_idx = (node.face_idx + 1) % 3;
          var transformText = "translateX(" + (25 * node.face_idx - 25) + "%) " +
                              "rotateY(" + node.rot + "deg)";
          node.style.webkitTransform = transformText;
          node.style.MozTransform = transformText;
          node.style.msTransform = transformText;
          node.style.OTransform = transformText;
          node.style.transform = transformText;
        });
      }
      for (var i = 0; i < right_rotator.length; i++) {
        right_rotator[i].addEventListener('click', function() {
          node.rot -= 120;
          node.face_idx = (node.face_idx + 2) % 3;
          var transformText = "translateX(" + (25 * node.face_idx - 25) + "%) " +
                              "rotateY(" + node.rot + "deg)";
          node.style.webkitTransform = transformText;
          node.style.MozTransform = transformText;
          node.style.msTransform = transformText;
          node.style.OTransform = transformText;
          node.style.transform = transformText;
        });
      }
    });
    cr.ui.template.register('pub_list_item.html', function(param) {
      var cover = this.querySelector('.publication-cover');
      //Cover
      cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.publication.cover_url.url + ')';
    });

    cr.ui.template.register('pub_magazine.html');
    cr.ui.template.register('pub_micromagazine.html');
    cr.ui.template.register('pub_podcast.html', function(param) {
      var node = this,
          player = node.querySelector('.podcast-player'),
          played = node.querySelector('.podcast-time .podcast-played'),
          control_wrapper = node.querySelector('.podcast-control-wrapper'),
          play_cover = control_wrapper.querySelector('.podcast-cover'),
          play_control = control_wrapper.querySelector('.podcast-play'),
          first_load = false;
      play_cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.publication.cover_url.url + ')';
      play_control.addEventListener('click', function() {
        if (this.classList.contains('loading')) {
          return;
        }
        if (!first_load && isIOS) {
          player.load();
          play_control.classList.add('loading');
          return;
        }

        else if (player.ended) {
          player.currentTime = 0;
          player.play();
        }
        else if (player.paused) {
          player.play();
        }
        else {
          player.pause();
          control_wrapper.classList.remove('playing');
        }
      });

      player.addEventListener('play', function() {
        control_wrapper.classList.add('playing');
        if (!first_load && isIOS) {
          first_load =  true;
          node.querySelector('.podcast-time .podcast-duration').textContent = pad(~~(this.duration / 60), 2) + ':' + pad((~~(this.duration)) % 60, 2);
        }
      });

      player.addEventListener('canplay', function() {
        player.play();
        play_control.classList.remove('loading');
      });

      player.addEventListener('waiting', function() {
        play_control.classList.add('loading');
        control_wrapper.classList.remove('playing');
      });

      player.addEventListener('ended', function() {
        control_wrapper.classList.remove('playing');
      });

      player.addEventListener('loadedmetadata', function(e) {
        node.querySelector('.podcast-time .podcast-duration').textContent = pad(~~(this.duration / 60), 2) + ':' + pad((~~(this.duration)) % 60, 2);
        play_control.classList.add('loading');
        control_wrapper.classList.remove('playing');
      });

      player.addEventListener('timeupdate', function(e) {
        played.textContent = pad(~~(this.currentTime / 60), 2) + ':' + pad((~~(this.currentTime)) % 60, 2);
      });

      player.addEventListener('error', function(e) {
        if (player.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
          player.load();
        }
      });

      player.src = param.publication.ext_doc_url;
      if (isIOS) {
        play_control.classList.remove('loading');
      }
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function pub_setup(func) {
    return function() {
      var pub_template = cr.ui.template.render_template('pub_template.html');
      cr.ui.replaceContent(pub_template, (function(a) {
        cr.ui.changeSelection(name);
        cr.view.name = name;
        func.apply(this, a);
      }).bind(pub_template, arguments));
    };
  }

  /**
   * Switch the displaying publication.
   * @param {HTMLElement} root The root element to perform switch
   * @param {Integer} id The publication to switch to
   */
  function publication_switch(root, id) {
    var panel = root.querySelector('.right-panel'),
        detail_wrapper = panel.querySelector('.publication-content-wrapper');
    panel.classList.add('loading');
    cr.model.Publication.get(id, function(publication) {
      setTimeout(function() {
        document.title = publication.title + " | Film Society, HKUSTSU";
        detail_wrapper.setAttribute("hidden", true);
        while (detail_wrapper.firstChild) {
          detail_wrapper.removeChild(detail_wrapper.firstChild);
        }
        var pub_item;
        switch(publication.Type) {
          case "Magazine":
            pub_item = cr.ui.template.render_template('pub_magazine.html', {publication: publication, base_url: cr.settings.resource_base + 'upload/'});
            break;
          case "MicroMagazine":
            pub_item = cr.ui.template.render_template('pub_micromagazine.html', {publication: publication});
            break;
          case "Podcast":
            pub_item = cr.ui.template.render_template('pub_podcast.html', {publication: publication});
            break;
        }
        detail_wrapper.appendChild(pub_item);
        detail_wrapper.removeAttribute('hidden');
        setTimeout(function() {
          panel.classList.remove('loading');
        }, 0);
      }, 410);
    });
  }

  /**
   * List view of publication
   * @param {Object} param The query param
   */
  function pub_list(param) {
    var node = this,
        left_panel = node.querySelector('.left-panel');
        list_magazine_wrapper = left_panel.querySelector('.publication-magazine-list-wrapper'),
        list_micromagazine_wrapper = left_panel.querySelector('.publication-micromagazine-list-wrapper'),
        list_podcast_wrapper = left_panel.querySelector('.publication-podcast-list-wrapper'),
        panel = node.querySelector('.right-panel');
    pub_init_list(list_magazine_wrapper, new cr.Pager(cr.model.Publication, '/?Type=Magazine'), function(item, idx) {
      var entry = cr.ui.template.render_template('pub_list_item.html', {publication: item});
      entry.addEventListener('click', (function(id) {
        var activeElements = left_panel.querySelectorAll('.publication-list-item[selected]');
        for (var i = 0; i < activeElements.length; i++) {
          activeElements[i].removeAttribute('selected');
        }
        entry.setAttribute('selected', true);
        publication_switch(node, id);
      }).bind(entry, item.id));
      list_magazine_wrapper.appendChild(entry);
      setTimeout((function() {
        this.classList.remove('loading');
      }).bind(entry), 50 * idx + 1);
      if (idx == 0 && list_magazine_wrapper.first_load) {
        entry.setAttribute('selected', true);
        publication_switch(node, item.id);
      }
    });
    pub_init_list(list_micromagazine_wrapper, new cr.Pager(cr.model.Publication, '/?Type=MicroMagazine'), function(item, idx) {
      var entry = cr.ui.template.render_template('pub_list_item.html', {publication: item});
      entry.addEventListener('click', (function(id) {
        var activeElements = left_panel.querySelectorAll('.publication-list-item[selected]');
        for (var i = 0; i < activeElements.length; i++) {
          activeElements[i].removeAttribute('selected');
        }
        entry.setAttribute('selected', true);
        publication_switch(node, id);
      }).bind(entry, item.id));
      list_micromagazine_wrapper.appendChild(entry);
      setTimeout((function() {
        this.classList.remove('loading');
      }).bind(entry), 50 * idx + 1);
    });
    pub_init_list(list_podcast_wrapper, new cr.Pager(cr.model.Publication, '/?Type=Podcast'), function(item, idx) {
      var entry = cr.ui.template.render_template('pub_list_item.html', {publication: item});
      entry.addEventListener('click', (function(id) {
        var activeElements = left_panel.querySelectorAll('.publication-list-item[selected]');
        for (var i = 0; i < activeElements.length; i++) {
          activeElements[i].removeAttribute('selected');
        }
        entry.setAttribute('selected', true);
        publication_switch(node, id);
      }).bind(entry, item.id));
      list_podcast_wrapper.appendChild(entry);
      setTimeout((function() {
        this.classList.remove('loading');
      }).bind(entry), 50 * idx + 1);
    });
  }

  /**
   * Init List view
   * @param {HTMLElement} elem The list wrapper
   * @param {Pager} pager The pager to use
   * @param {Function} item_cbk The callback function when inserting item
   */
  function pub_init_list(elem, pager, item_cbk) {
    elem.anchor_element = elem.querySelector('.anchor');
    elem.ajax_loading = true;
    elem.first_load = true;
    elem.item_cbk = item_cbk;

    elem.addEventListener('scroll', handleScroll);
    pager.load(load_items);
    function load_items(obj_list) {
      if (obj_list.length === 0 || !this.has_next) {
        elem.removeChild(elem.anchor_element);
        elem.removeEventListener('scroll', handleScroll);
      }
      //Append to list
      for (var i = 0; i < obj_list.length; i++) {
        elem.item_cbk && elem.item_cbk(obj_list[i], i);
      }
      elem.first_load = false;
      elem.ajax_loading = false;
    }

    function handleScroll(e) {
      if (this.ajax_loading) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();

      var scrollTop = this.scrollTop,
          windowHeight = this.clientHeight,
          scrollHeight = this.scrollHeight;

      if (scrollTop + windowHeight + 10 > scrollHeight) {
        //Trigger Loading
        this.ajax_loading = true;
        pager.next(load_items);
      }
    }
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.publication.Initialization();