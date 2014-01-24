/**
 * @fileoverview View concerning DVD Library.
 */

cr.define('cr.view.library', function() {
  var name = 'library';

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/library\//, false, liba_setup(liba_list));
    routerManager.register(/library\/search\//, false, liba_setup(liba_search));
    routerManager.register(/library\/(\d+)\//, false, liba_setup(liba_disk));
    routerManager.register(/library\/rand\//, false, liba_setup(liba_rand));

    cr.ui.template.register("liba_template.html", function() {
      var node = this;
      //Add suggestion hook
      //Also deal with search
      liba_suggest(node);
      this.querySelector('button[controls="search"]').addEventListener('click', function() {
        var value = node.querySelector('input[name="search_term"]').value;
        if (value) {
          //Refuse empty string
          routerManager.pushState('library/search/?q=' + encodeURIComponent(value), false, true);
          liba_switch(node, liba_search, [{q: value}]);
        }
      });
      this.querySelector('a[controls="random"]').addEventListener('click', function(e) {
        e.preventDefault();
        routerManager.pushState('library/rand/', false, true);
        liba_switch(node, liba_rand);
      });
      this.querySelector('a[controls="popular"]').addEventListener('click', function(e) {
        e.preventDefault();
        routerManager.pushState('library/?mode=popular', false, true);
        liba_switch(node, liba_list, [{mode: 'popular'}]);
      });
      this.querySelector('a[controls="rank"]').addEventListener('click', function(e) {
        e.preventDefault();
        routerManager.pushState('library/?mode=rank', false, true);
        liba_switch(node, liba_list, [{mode: 'rank'}]);
      });
    });
    cr.ui.template.register('liba_suggest_item.html', function(param) {
      var cover = this.querySelector('.item-cover');
      //Cover
      if (param.disk.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.disk.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
    });

    cr.ui.template.register('liba_list.html');
    cr.ui.template.register('liba_list_notfound.html', function() {
      this.querySelector('.link-goback').addEventListener('click', function() {
        if (history.length > 1) {
          history.go(-1);
        }
        else {
          routerManager.pushState('library/', false, true);
          liba_switch(document.querySelector('.library-wrapper'), liba_list, [{}]);
        }
      });
    });
    cr.ui.template.register('liba_list_item.html', function(param) {
      var cover = this.querySelector('div.disk-cover-border'),
          button = this.querySelector('.disk-detail-button');
      //Cover
      if (param.disk.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.disk.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';

      //Detail button
      button.addEventListener('click', (function(id, e) {
        e.preventDefault();
        routerManager.pushState('library/' + id + '/', false, true);
        liba_switch(document.querySelector('.library-wrapper'), liba_disk, [id]);
      }).bind(null, param.disk.id));
    });

    cr.ui.template.register('liba_disk.html', function() {
      //Hook overlay
      var overlay = this.querySelector('.popup-overlay');
      overlay.addEventListener('close', function() {
        this.classList.add('loading');
        setTimeout((function() {
          this.setAttribute('hidden', true);
        }).bind(this), 210);
      });
      overlay.addEventListener('click', function(e) {
        e.target === this && cr.dispatchSimpleEvent(this, 'close', true, true);
      });
      overlay.addEventListener('keydown', function(e) {
        if (e.keyCode === 27) {
          //Escape
          cr.dispatchSimpleEvent(this, 'close', true, true);
        }
      });
      overlay.querySelector('.close-button').addEventListener('click', function() {
        cr.dispatchSimpleEvent(overlay, 'close', true, true);
      });

    });
    cr.ui.template.register('liba_disk_detail.html', function(param) {
      var cover = this.querySelector('.disk-brief .disk-cover');

      //Cover
      if (param.disk.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.disk.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';

      //Go back button
      this.querySelector('.link-goback').addEventListener('click', function() {
        if (history.length > 1) {
          history.go(-1);
        }
        else {
          routerManager.pushState('library/', false, true);
          liba_switch(document.querySelector('.library-wrapper'), liba_list, [{}]);
        }
      });

      //Add actors
      var actor_wrapper = this.querySelector('.actors-wrapper');
      for (var i = 0; i < param.disk.actors.length; i++) {
        var act = createElementWithClassName('span', 'link link-search');
        act.setAttribute('tag', 'actor');
        act.textContent = param.disk.actors[i];
        (i > 0) && actor_wrapper.appendChild(createElementWithClassName('span', 'space'));
        actor_wrapper.appendChild(act);
      }

      //Add tags
      var tag_wrapper = this.querySelector('.tags-wrapper');
      for (var i = 0; i < param.disk.tags.length; i++) {
        var tag = createElementWithClassName('span', 'link link-search');
        tag.setAttribute('tag', 'tag');
        tag.textContent = param.disk.tags[i];
        (i > 0) && tag_wrapper.appendChild(createElementWithClassName('span', 'space'));
        tag_wrapper.appendChild(tag);
      }

      //Hooks on search buttons
      var search_btns = this.querySelectorAll('.link-search');
      for (var i = 0; i < search_btns.length; i++) {
        search_btns[i].addEventListener('click', function(e) {
          var tag = this.getAttribute('tag'),
              q = tag + ':(' + this.textContent + ')';
          routerManager.pushState('library/search/?q=' + encodeURIComponent(q), false, true);
          liba_switch(document.querySelector('.library-wrapper'), liba_search, [{q: q}]);
        });
      }

      //Hooks on reserve button
      this.querySelector('button[controls="reserve"]').addEventListener('click', function() {
        var popup = document.querySelector('.library-wrapper .library-disk .popup-overlay'),
            box = popup.querySelector('.popup-box'),
            content = box.querySelector('.content'),
            reserve_form = cr.ui.template.render_template("liba_disk_reserve.html", {disk: param.disk});

        //Remove original and append new
        box.querySelector('h1').textContent = "Reserve Disk";
        while (content.firstChild) {
          content.removeChild(content.firstChild);
        }
        content.appendChild(reserve_form);
        box.classList.remove('loading');

        //Display popup
        popup.removeAttribute('hidden');
        setTimeout(function() {
          popup.classList.remove('loading');
        }, 0);
      });

      //Hooks on renew button
      this.querySelector('button[controls="renew"]').addEventListener('click', function() {
        var popup = document.querySelector('.library-wrapper .library-disk .popup-overlay'),
            box = popup.querySelector('.popup-box'),
            content = box.querySelector('.content'),
            renew_form = cr.ui.template.render_template("liba_disk_renew.html", {disk: param.disk});

        //Do something to box
        box.querySelector('h1').textContent = "Renew Disk";
        while (content.firstChild) {
          content.removeChild(content.firstChild);
        }
        content.appendChild(renew_form);
        box.classList.remove('loading');

        //Display popup
        popup.removeAttribute('hidden');
        setTimeout(function() {
          popup.classList.remove('loading');
        }, 0);
      });
    });
    
    cr.ui.template.register('liba_disk_reserve.html', function(param) {
      var node = this,
          selects = this.querySelectorAll('.custom-select');
      for (var i = 0; i < selects.length; i++) {
        cr.ui.select.init(selects[i]);
      }
      //Hook on submit button
      this.querySelector('button[controls="deliver"]').addEventListener('click', function() {
        var payload = Application.collectForm(node.querySelector('.reserve-delivery')),
            r = new cr.APIRequest(cr.model.Disk, 'POST', '/' + param.disk.id + '/reservation/');
        payload['form'] = 'Hall';
        payload['hall'] = ~~(payload['hall']);
        r.onload = function(e) {
          var disk = e.recObj;
          cr.model.Disk.update(disk, 1);
          cr.ui.showNotification('Disk reserved', 'dismiss');
          history.go();
        };
        r.onerror = function(e) {
          node.classList.remove('loading');
          cr.errorHandler(e);
        }
        node.classList.add('loading');
        r.sendJSON(payload);
      });

      this.querySelector('button[controls="reserve"]').addEventListener('click', function() {
        var r = new cr.APIRequest(cr.model.Disk, 'POST', '/' + param.disk.id + '/reservation/'),
            payload = {form: 'Counter'};
        r.onload = function(e) {
          var disk = e.recObj;
          cr.model.Disk.update(disk, 2);
          cr.ui.showNotification('Disk reserved', 'dismiss');
          history.go();
        };
        r.onerror = function(e) {
          node.classList.remove('loading');
          cr.errorHandler(e);
        }
        node.classList.add('loading');
        r.sendJSON(payload);
      });
    });

    cr.ui.template.register('liba_disk_renew.html', function(param) {
      var node = this;
      this.querySelector('button[controls="renew"]').addEventListener('click', function() {
        var r = new cr.APIRequest(cr.model.Disk, 'POST', '/' + param.disk.id + '/borrow/'),
            payload = {id: cr.user && cr.user.id};
        r.onload = function(e) {
          var disk = e.recObj;
          cr.model.Disk.update(disk, 2);
          cr.ui.showNotification('Disk renewed', 'dismiss');
          history.go();
        };
        r.onerror = function(e) {
          node.classList.remove('loading');
          cr.errorHandler(e);
        }
        node.classList.add('loading');
        r.sendJSON(payload);
      });
    });

    cr.ui.template.register('disk_review_entry.html');
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function liba_setup(func) {
    return function() {
      if (cr.model.SiteSettings.getField('liba_state').value !== "Open") {
        var error_template = cr.ui.template.render_template('error_page.html', {text: "Sorry, The VCD/DVD Library is temporarily closed."});
        cr.ui.replaceContent(error_template, function() {
          cr.ui.changeSelection(name);
          cr.view.name = name;
        });
        return;
      }
      if (cr.view.name !== name) {
        var liba_template = cr.ui.template.render_template('liba_template.html');
        cr.ui.replaceContent(liba_template, (function(a) {
          cr.ui.changeSelection(name);
          cr.view.name = name;
          func.apply(this, a);
        }).bind(liba_template, arguments));
      }
      else {
        liba_switch(document.querySelector('.library-wrapper'), func, arguments);
      }
    };
  }

  /**
   * Switch inside liba view.
   * @param {HTMLElement} root The root element to perform switch
   * @param {Function} func The callback function to deal
   * @param {Array} query The query array to apply to
   */
  function liba_switch(root, func, query) {
    var panel = root.querySelector('.right-panel');
    panel.classList.add('loading');
    setTimeout(function() {
      panel.setAttribute("hidden", true);
      while (panel.firstChild) {
        panel.removeChild(panel.firstChild);
      }
      func.apply(root, query);
    }, 210);
  }

  /**
   * Display the list and control it
   * @param {HTMLElement} node The list node
   * @param {Pager} pager The proposed pager
   * @param {Function} uri The closure to generate URI
   */
  function liba_disp_list(node, pager, uri) {
    var page = 0,
        content = node.querySelector('.list-item-wrapper');
    //Prepare Data and render
    pager.load(next_page);

    //Button Hooks
    //Previous
    node.querySelector('.prev-button').addEventListener('click', function() {
      page--;
      routerManager.pushState(uri(page), false, true);
      node.classList.add('loading');
      pager.prev(prev_page);
    });
    //Next
    node.querySelector('.next-button').addEventListener('click', function() {
      page++;
      routerManager.pushState(uri(page), false, true);
      node.classList.add('loading');
      pager.next(next_page);
    });

    function prev_page(obj_list) {
      switch_page.call(this, obj_list, 'prev');
    }

    function next_page(obj_list) {
      switch_page.call(this, obj_list, 'next');
    }

    function switch_page(obj_list, direction) {
      var current_disks = content.querySelectorAll('.list-item'),
          notfounder = content.querySelectorAll('.library-notfound');

      //Clear original items
      for (var i = 0; i < current_disks.length; i++) {
        current_disks[i].classList.add(direction == 'next' ? 'at_left' : 'at_right');
      }
      for (var i = 0; i < notfounder.length; i++) {
        notfounder[i].classList.add('loading');
      }
      if (obj_list.length === 0) {
        //Display none found
        var nothing_found = cr.ui.template.render_template("liba_list_notfound.html");
        content.appendChild(nothing_found);
        //Set buttons
        node.querySelector('.prev-button').setAttribute('hidden', true);
        node.querySelector('.next-button').setAttribute('hidden', true);
        //Commit
        setTimeout(function() {
          nothing_found.classList.remove('loading');
        }, 0);
        routerManager.markTracker();
      }
      else {
        //Set buttons
        if (this.has_prev) {
          node.querySelector('.prev-button').removeAttribute('hidden');
        }
        else {
          node.querySelector('.prev-button').setAttribute('hidden', true);
        }
        if (this.has_next) {
          node.querySelector('.next-button').removeAttribute('hidden');
        }
        else {
          node.querySelector('.next-button').setAttribute('hidden', true);
        }
        for (var i = 0; i < obj_list.length; i++) {
          var disk_item = cr.ui.template.render_template("liba_list_item.html", {disk: obj_list[i]});
          disk_item.classList.add(direction == 'next' ? 'at_right' : 'at_left');
          disk_item.classList.add('item-' + i);
          content.appendChild(disk_item);
          //Commit
          setTimeout((function() {
            this.classList.remove(direction == 'next' ? 'at_right' : 'at_left');
          }).bind(disk_item), 0);
        }
      }
      node.classList.remove('loading');
      //Remove previous objects
      setTimeout(function() {
        for (var i = 0; i < current_disks.length; i++) {
          if(current_disks[i].parentNode === content)
            content.removeChild(current_disks[i]);
        }
        for (var i = 0; i < notfounder.length; i++) {
          if(notfounder[i].parentNode === content)
            content.removeChild(notfounder[i]);
        }
      }, 410);
    }
  }

  /**
   * List view of library
   * @param {Object} param The query param
   */
  function liba_list(param) {
    var mode = param.mode || '',
        page = param.page || 1,
        skeleton = cr.ui.template.render_template('liba_list.html'),
        panel = this.querySelector('.right-panel'),
        pager = new cr.Pager(cr.model.Disk, getAPI(mode, page));
    //Display template
    panel.appendChild(skeleton);
    panel.removeAttribute("hidden");
    panel.classList.remove('loading');

    //Set title
    switch(mode) {
      case 'popular':
        document.title = "Top Popular | Film Society, HKUSTSU";
        break;
      case 'rank':
        document.title = "Top Ranked | Film Society, HKUSTSU";
        break;
      default:
        document.title = "VCD/DVD Library | Film Society, HKUSTSU";
    }

    var getURI = function(offset) {
      var param_list = [],
          cur_page = ~~(page) + ~~(offset),
          base = 'library/';
      if (cur_page !== 1) {
        param_list.push('page=' + encodeURIComponent(cur_page));
      }
      switch(mode) {
        case 'popular':
        case 'rank':
          param_list.push('mode=' + encodeURIComponent(mode));
      }
      return base + ((param_list.length !== 0)?('?' + param_list.join('&')):'');
    };
    liba_disp_list(skeleton, pager, getURI);

    function getAPI(mode, page) {
      var base = '/?limit=6&page=' + encodeURIComponent(page);
      switch(mode) {
        case 'popular':
          base += '&ordering=-borrow_cnt,-id';
          break;
        case 'rank':
          base += '&ordering=-rank,-id';
      }
      return base;
    }
  }

  /**
   * List view of library
   * @param {Object} param The query param
   */
  function liba_search(param) {
    var query = param.q || '',
        page = param.page || 1,
        skeleton = cr.ui.template.render_template('liba_list.html'),
        panel = this.querySelector('.right-panel'),
        search_box = this.querySelector('.left-panel .library-search input[name="search_term"]'),
        pager = new cr.Pager(cr.model.Disk, getAPI(query, page));
    //Set search_box
    search_box.value = query;

    //Display template
    panel.appendChild(skeleton);
    panel.removeAttribute("hidden");
    panel.classList.remove('loading');

    //Set title
    document.title = "Searching For " + query + " | Film Society, HKUSTSU";

    var getURI = function(offset) {
      var param_list = [],
          cur_page = ~~(page) + ~~(offset),
          base = 'library/search/';
      param_list.push('q=' + encodeURIComponent(query));
      if (cur_page !== 1) {
        param_list.push('page=' + encodeURIComponent(cur_page));
      }
      return base + ((param_list.length !== 0)?('?' + param_list.join('&')):'');
    };
    liba_disp_list(skeleton, pager, getURI);

    function getAPI(query, page) {
      var base = '/search/?limit=6&page=' + encodeURIComponent(page);
      base += '&query=' + encodeURIComponent(query);
      return base;
    }
  }

  /**
   * Setup suggestion utility
   * @param {HTMLElement} root The root element of library
   */
  function liba_suggest(root) {
    var search_box = root.querySelector('.left-panel input[name="search_term"]'),
        suggest_box = root.querySelector('.left-panel .search-suggestion'),
        suggest_idx = 0,
        suggest_length = 0,
        suggest_list = [],
        state = 0;
    search_box.addEventListener('keypress', function(e) {
      if (e.keyCode >= 46 || e.keyCode <= 9) {
        give_suggestion(this.value, suggest_box);
      }
    });
    search_box.addEventListener('keyup', function(e) {
      if (e.keyCode >= 46 || e.keyCode <= 9) {
        give_suggestion(this.value, suggest_box);
      }
    });
    search_box.addEventListener('focus', function() {
      prepare_suggestion(search_box);
      give_suggestion(this.value, suggest_box);
    });
    search_box.addEventListener('blur', function() {
      remove_suggestion(suggest_box);
      cleanup_suggestion(search_box);
    });

    function handle_keyevent(e) {
      switch(e.keyCode) {
        case 13:
          //Enter
          if (suggest_idx !== 0) {
            var id = suggest_list[suggest_idx - 1];
            //Clear Search Box
            this.value = "";
            this.blur();
            routerManager.pushState('library/' + id + '/', false, true);
            liba_switch(document.querySelector('.library-wrapper'), liba_disk, [id]);
          }
          else {
            this.blur();
            routerManager.pushState('library/search/?q=' + encodeURIComponent(this.value), false, true);
            liba_switch(document.querySelector('.library-wrapper'), liba_search, [{q: this.value}]);
          }
          break;
        case 27:
          //Esc
          this.blur();
          break;
        case 38:
          //Up
          e.preventDefault();
          suggest_idx = (suggest_idx + suggest_length) % (suggest_length + 1);
          highlight(suggest_idx);
          break;
        case 40:
          //Down
          e.preventDefault();
          suggest_idx = (suggest_idx + suggest_length + 2) % (suggest_length + 1);
          highlight(suggest_idx);
          break;
      }
    }

    function prepare_suggestion(search_box) {
      search_box.addEventListener('keydown', handle_keyevent, true);
      state = 1;
    }

    function cleanup_suggestion(search_box) {
      state = 0;
      search_box.removeEventListener('keydown', handle_keyevent);
    }

    function highlight(idx) {
      var current = suggest_box.querySelector('.selected'),
          target = suggest_box.querySelector('.suggest-item:nth-of-type(' + idx + ')');
      if (current === target) {
        return;
      }
      current && current.classList.remove('selected');
      target && target.classList.add('selected');
    }

    function give_suggestion(value, box) {
      if (value === '' || /[:()]/.test(value)) {
        //No suggestion
        return remove_suggestion(box);
      }
      var r = new cr.APIRequest(cr.model.Disk, 'GET', '/search/?limit=5&engine=defualt&query=' + encodeURIComponent(value));
      r.onload = function(e) {
        if (search_box.value !== value || state === 0) {
          //outdated, discard
          return;
        }
        var list = e.recObj.objects;
        remove_suggestion(box);
        suggest_length = list.length;
        box.removeAttribute('hidden');
        for (var i = 0; i < list.length; i++) {
          //Update first
          cr.model.Disk.update(list[i], 1);
          var item = cr.ui.template.render_template('liba_suggest_item.html', {disk: list[i]});
          box.appendChild(item);
          item.addEventListener('mouseover', (function(idx) {
            if (suggest_idx === idx) {
              return;
            }
            suggest_idx = idx;
            highlight(idx);
          }).bind(item, i + 1));
          item.addEventListener('mousedown', (function(id) {
            //Clear Search Box
            search_box.value = "";
            search_box.blur();
            routerManager.pushState('library/' + id + '/', false, true);
            liba_switch(document.querySelector('.library-wrapper'), liba_disk, [id]);
          }).bind(null, list[i].id));
          suggest_list.push(list[i].id);
          setTimeout((function() {
            this.classList.remove('loading');
          }).bind(item), i * 50);
        }
      };
      r.send();
    }

    function remove_suggestion(box) {
      box.setAttribute('hidden', true);
      while(box.firstChild) {
        box.removeChild(box.firstChild);
      }
      suggest_idx = 0;
      suggest_length = 0;
      suggest_list = [];
    }
  }

  /**
   * Disk view of library
   * @param {Integer} id The id of requested disk
   */
  function liba_disk(id) {
    var skeleton = cr.ui.template.render_template('liba_disk.html', {user: cr.user}),
        panel = this.querySelector('.right-panel');
    //Display template
    panel.appendChild(skeleton);
    panel.removeAttribute("hidden");
    panel.classList.remove('loading');
    cr.model.Disk.get(id, function(disk) {
      var disk_page = cr.ui.template.render_template('liba_disk_detail.html', {disk: disk, cn: cr.model.Disk.CN(disk), user: cr.user}),
          reviews = skeleton.querySelector('.diskreview-wrapper');

      //Display
      skeleton.querySelector('.disk-wrapper').appendChild(disk_page);
      setTimeout(function() {
        skeleton.classList.remove('loading');
      }, 0);

      //Set Titile
      document.title = disk.title_en + ' ' + disk.title_ch + ' | Film Society, HKUTSU';
      routerManager.markTracker();

      //Get rate
      var r = new cr.APIRequest(cr.model.Disk, 'GET', '/' + id + '/rate/');
      r.onload = function(e) {
        var rate = e.recObj,
            rate_num = skeleton.querySelector('.rate-box .rate-num'),
            up_button = skeleton.querySelector('.rate-box .rate-up-button'),
            down_button = skeleton.querySelector('.rate-box .rate-down-button');
        rate_num.textContent = rate.ups - rate.downs;
        if(rate.ups > rate.downs) {
          rate_num.classList.add('positive');
        }
        else if(rate.ups < rate.downs) {
          rate_num.classList.add('negative');
        }
        if(rate.rated) {
          //Change tips
          up_button.setAttribute("tooltip", "You have rated before");
          down_button.setAttribute("tooltip", "You have rated before");
        }
        else {
          //Add Hooks
          up_button.addEventListener('click', function() {
            submit_rate('up');
          });
          down_button.addEventListener('click', function() {
            submit_rate('down');
          });
        }

        //Display it
        skeleton.querySelector('.rate-box').classList.remove('loading');

        function submit_rate(up_or_down) {
          var r = new cr.APIRequest(cr.model.Disk, 'POST', '/' + id + '/rate/');
          r.onload = function(e) {
            var rate = e.recObj;
            if (!rate_num) {
              //Destroyed
              return;
            }
            rate_num.textContent = rate.ups - rate.downs;
            if(rate.ups > rate.downs) {
              rate_num.classList.add('positive');
            }
            else if(rate.ups < rate.downs) {
              rate_num.classList.add('negative');
            }
            if(rate.rated) {
              //Change tips
              up_button.setAttribute("tooltip", "You have rated before");
              down_button.setAttribute("tooltip", "You have rated before");
            }
            cr.ui.showNotification("Rate successful", "dismiss");
          };
          r.onerror = function() {
            cr.ui.showNotification("Rate failed", "dismiss");
          };
          r.sendJSON({rate: up_or_down});
        }
      };
      r.send();

      //Get reviews
      var review_pager = new cr.Pager(cr.model.DiskReview, '/?disk=' + id),
          review_none = false,
          review_container = skeleton.querySelector('.diskreview-wrapper'),
          review_upper = review_container.querySelector('.diskreview-entry-wrapper'),
          review_entries = review_upper.querySelector('.diskreview-inner-wrapper');
      //review_pager.load(append_reviews);


      review_entries.scrollList = new cr.ui.scrollList(review_entries, review_upper, review_pager, {
        onfirstload: function(obj_list) {
          var that = this;
              elem = that.elem;
          if(obj_list.length === 0) {
            that.anchor_element.textContent = "Be the first one to comment";
            review_none = true;
          }

          //Add btn hooks
          var btn = review_container.querySelector('.diskreview-input-box button[controls="submit"]');
          btn.addEventListener('click', function() {
            var textarea = review_container.querySelector('.diskreview-input-box textarea[name="review"]');
            if (!textarea.value) {
              //Refuse empty and disabled
              return;
            }
            var payload = {disk: id, content: textarea.value};
            cr.model.DiskReview.post(payload, function(obj) {
              var div_after = elem.querySelector('.diskreview-title').nextSibling,
                  new_entry = cr.ui.template.render_template('disk_review_entry.html', {review: obj});
              elem.insertBefore(new_entry, div_after);
              if (review_none) {
                elem.removeChild(that.anchor_element);
                review_none = false;
              }
              setTimeout(function() {
                new_entry.classList.remove('loading');
              }, 0);
            });
          });
        },
        onload: function(obj, idx) {
          var entry = cr.ui.template.render_template('disk_review_entry.html', {review: obj});
          this.elem.insertBefore(entry, this.anchor_element);
          setTimeout((function() {
            this.classList.remove('loading');
          }).bind(entry), 50 * idx);
        },
        deleteAnchor: false
      });
      review_entries.scrollList.load();
    });
  }

  /**
   * Random a disk
   */
  function liba_rand() {
    var r = new cr.APIRequest(cr.model.Disk, 'GET', '/rand/', true),
        node = this;
    r.onload = function(e) {
      cr.model.Disk.update(e.recObj, 1);
      //Transfer to liba_disk
      liba_disk.call(node, e.recObj.id);
    };
    r.onerror = cr.errorHandler;
    r.send();
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.library.Initialization();