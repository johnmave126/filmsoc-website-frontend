/**
 * @fileoverview View concerning DVD Library.
 */

cr.define('cr.view.publication', function() {
  var name = 'publication',
      isIOS = /(ipad|iphone|ipod)/i.exec(navigator.userAgent),
      idx = 0;

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

      player.src = param.base_url + param.publication.doc_url.url;
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
        document.title = "Publication | Film Society, HKUSTSU";
        routerManager.markTracker();
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
        switch(publication.pub_type) {
          case "Magazine":
            pub_item = cr.ui.template.render_template('pub_magazine.html', {publication: publication, base_url: cr.settings.resource_base + 'upload/'});
            break;
          case "MicroMagazine":
            pub_item = cr.ui.template.render_template('pub_micromagazine.html', {publication: publication});
            break;
          case "Podcast":
            pub_item = cr.ui.template.render_template('pub_podcast.html', {publication: publication, base_url: cr.settings.resource_base + 'upload/'});
            break;
        }
        detail_wrapper.appendChild(pub_item);
        if (publication.pub_type === 'Magazine') {
          //Scribd
          pub_item.querySelector('.publication-content').id = "embedded_pub_" + idx;
          var scribd_doc = scribd.Document.getDocFromUrl(cr.settings.resource_base + 'upload/' + publication.doc_url.url, cr.settings.scribd_id);
          scribd_doc.addParam('jsapi_version', 2);
          scribd_doc.addParam('title', publication.title);
          scribd_doc.addParam('public', true);
          scribd_doc.addParam('mode', 'list');
          scribd_doc.write("embedded_pub_" + idx);
          idx++;
        }
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


        function onload_f(item, idx) {
          var entry = cr.ui.template.render_template('pub_list_item.html', {publication: item}),
              that = this;
          entry.addEventListener('click', (function(id) {
            var activeElements = left_panel.querySelectorAll('.publication-list-item[selected]');
            for (var i = 0; i < activeElements.length; i++) {
              activeElements[i].removeAttribute('selected');
            }
            entry.setAttribute('selected', true);
            publication_switch(node, id);
          }).bind(entry, item.id));
          that.elem.insertBefore(entry, that.anchor_element);
          setTimeout((function() {
            this.classList.remove('loading');
          }).bind(entry), 50 * idx + 1);
        }

    list_magazine_wrapper.scrollList = new cr.ui.scrollList(list_magazine_wrapper, list_magazine_wrapper,
                                                            new cr.Pager(cr.model.Publication, '/?pub_type=Magazine'), {
      onfirstload: function(obj_list) {
        if(obj_list.length === 0) {
          this.anchor_element.textContent = "No items at the time";
        }
      },
      onload: function(item, idx) {
        var entry = cr.ui.template.render_template('pub_list_item.html', {publication: item}),
            that = this;
        entry.addEventListener('click', (function(id) {
          var activeElements = left_panel.querySelectorAll('.publication-list-item[selected]');
          for (var i = 0; i < activeElements.length; i++) {
            activeElements[i].removeAttribute('selected');
          }
          entry.setAttribute('selected', true);
          publication_switch(node, id);
        }).bind(entry, item.id));
        that.elem.insertBefore(entry, that.anchor_element);
        setTimeout((function() {
          this.classList.remove('loading');
        }).bind(entry), 50 * idx + 1);
        if (idx === 0 && that.first_load) {
          entry.setAttribute('selected', true);
          publication_switch(node, item.id);
        }
      },
      deleteAnchor: false
    });
    list_magazine_wrapper.scrollList.load();

    list_micromagazine_wrapper.scrollList = new cr.ui.scrollList(list_micromagazine_wrapper, list_micromagazine_wrapper,
                                                            new cr.Pager(cr.model.Publication, '/?pub_type=MicroMagazine'), {
      onfirstload: function(obj_list) {
        if(obj_list.length === 0) {
          this.anchor_element.textContent = "No items at the time";
        }
      },
      onload: onload_f,
      deleteAnchor: false
    });
    list_micromagazine_wrapper.scrollList.load();

    list_podcast_wrapper.scrollList = new cr.ui.scrollList(list_podcast_wrapper, list_podcast_wrapper,
                                                            new cr.Pager(cr.model.Publication, '/?pub_type=Podcast'), {
      onfirstload: function(obj_list) {
        if(obj_list.length === 0) {
          this.anchor_element.textContent = "No items at the time";
        }
      },
      onload: onload_f,
      deleteAnchor: false
    });
    list_podcast_wrapper.scrollList.load();
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
      //Append to list
      for (var i = 0; i < obj_list.length; i++) {
        elem.item_cbk && elem.item_cbk(obj_list[i], i);
      }

      if (obj_list.length === 0 && elem.first_load) {
        elem.anchor_element.textContent = "No items at the time";
        elem.removeEventListener('scroll', handleScroll);
      }

      if ((!elem.first_load || obj_list.length > 0) && !this.has_next) {
        elem.removeChild(elem.anchor_element);
        elem.removeEventListener('scroll', handleScroll);
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