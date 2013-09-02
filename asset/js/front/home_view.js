/**
 * @fileoverview View concerning Homepage and News.
 */

cr.define('cr.view.news', function() {
  var name = 'news';

  var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/home\//, true, news_setup(news_list));
    routerManager.register(/news\/(\d+)\//, false, news_setup(news_detail));
    cr.ui.template.register("news_template.html");
    cr.ui.template.register("home_template.html");
    cr.ui.template.register("home_news_item.html", function(param) {
      this.addEventListener('click', (function(id) {
        routerManager.pushState('news/' + id + '/', false, true);
        home_switch(document.querySelector('.news-wrapper'), news_detail, [id]);
      }).bind(null, param.news.id));
    });
    cr.ui.template.register("news_detail.html", function() {
      //Go back button
      this.querySelector('.link-goback').addEventListener('click', function() {
        if (history.length > 1) {
          history.go(-1);
        }
        else {
          routerManager.pushState('home', false, true);
          home_switch(document.querySelector('.news-wrapper'), news_list, [{}]);
        }
      });
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function news_setup(func) {
    return function() {
      if (cr.view.name !== name) {
        document.title = "Home | Film Society, HKUSTSU";
        var news_template = cr.ui.template.render_template('news_template.html');
        cr.ui.replaceContent(news_template, (function(a) {
          cr.view.name = name;
          cr.ui.changeSelection(name);
          func.apply(this, a);
        }).bind(news_template, arguments));
      }
      else {
        home_switch(document.querySelector('.news-wrapper'), func, arguments);
      }
    };
  }

  /**
   * Switch inside home view.
   * @param {HTMLElement} root The root element to perform switch
   * @param {Function} func The callback function to deal
   * @param {Array} query The query array to apply to
   */
  function home_switch(root, func, query) {
    var container = root.querySelector('.news-content-wrapper');
    root.classList.add('loading');
    setTimeout(function() {
      container.setAttribute("hidden", true);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      func.apply(root, query);
    }, 210);
  }

  /**
   * View of Home page
   */
  function news_list() {
    var node = this,
        skeleton = this.querySelector('.news-content-wrapper'),
        pager = new cr.Pager(cr.model.News, '/?limit=15'),
        cover = new Image(),
        cover_id = cr.model.SiteSettings.getField('header_image').value;
    document.title = "Home | Film Society, HKUSTSU";
    routerManager.markTracker();
    cover.onload = function() {
      var homepage = cr.ui.template.render_template("home_template.html", {url: this.src});
      skeleton.appendChild(homepage);
      skeleton.removeAttribute('hidden');
      setTimeout(function() {
        node.classList.remove('loading');
      }, 0);
      var first_load = true,
          news_loading = true,
          news_container = homepage.querySelector('.news-list'),
          anchor_element = news_container.querySelector('.anchor');

      //Scroll Image
      var cHeight = skeleton.clientHeight,
          h = this.height * homepage.querySelector('.home-cover-wrapper').clientWidth / this.width,
          toY = h - (cHeight >> 1);
      if (toY > 0) {
        homepage.addEventListener('scroll', preventer);
        homepage.addEventListener('mousewheel', preventer);
        homepage.classList.add('scrolling');
        var scroll_manager = new cr.ui.Scroller(homepage);
        setTimeout(scroll_manager.scrollTo.bind(scroll_manager, 0, toY, 3000, function() {
          homepage.removeEventListener('scroll', preventer);
          homepage.removeEventListener('mousewheel', preventer);
          homepage.addEventListener('scroll', news_scroll);
          homepage.classList.remove('scrolling');
          pager.load(disp_news); 
        }, new cr.ui.UnitBezier(0.5, 0, 0.6, 1)), 700); //ease-out
      }
      else {
        //Add scrolll hooks
        pager.load(disp_news);
        homepage.addEventListener('scroll', news_scroll);
      }

      function preventer(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      function disp_news(obj_list) {
        for (var i = 0; i < obj_list.length; i++) {
          var dateObj = new Date(toISODate(obj_list[i].create_log.created_at)),
              date = m_names[dateObj.getMonth()] + ' ' + pad(dateObj.getDate(), 2),
              time = pad(dateObj.getHours(), 2) + ':' + pad(dateObj.getMinutes(), 2),
              entry = cr.ui.template.render_template('home_news_item.html', {news: obj_list[i], date: date, time: time});
          news_container.insertBefore(entry, anchor_element);
          setTimeout((function() {
            this.classList.remove('loading');
          }).bind(entry), 100 * i);
        }

        if (first_load && obj_list.length === 0) {
          anchor_element.textContent = "No News at the time";
          homepage.removeEventListener('scroll', news_scroll);
        }

        if ((!first_load || obj_list.length > 0) && !this.has_next) {
          //Remove anchor
          news_container.removeChild(anchor_element);
          //Remove scroll listener
          homepage.removeEventListener('scroll', news_scroll);
        }

        news_loading = false;
        first_load = false;
      }

      function news_scroll(e) {
        if (news_loading) {
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();

        var scrollTop = homepage.scrollTop,
            windowHeight = homepage.clientHeight,
            scrollHeight = homepage.scrollHeight;

        if (scrollTop + windowHeight + 10 > scrollHeight) {
          //Trigger Loading
          news_loading = true;
          pager.next(disp_news);
        }
      }
    };
    cover.onerror = function() {
      cr.errorHandler({recObj: {errno: 500, error: "Unable to load"}});
    };
    cr.model.File.get(cover_id, function(cover_obj) {
      cover.src = cr.settings.resource_base + 'upload/' + cover_obj.url;
    });
  }

  /**
   * View of a detailed news
   */
  function news_detail(id) {
    var node = this,
        skeleton = this.querySelector('.news-content-wrapper');
    cr.model.News.get(id, function(news) {
      document.title = news.title + " | Film Society, HKUSTSU";
      routerManager.markTracker();
      var news_page = cr.ui.template.render_template("news_detail.html", {news: news});
      cr.ui.bbcode.handleHTML(news_page.querySelector('.news-content'));
      skeleton.appendChild(news_page);
      skeleton.removeAttribute('hidden');
      setTimeout(function() {
        node.classList.remove('loading');
      }, 0);
    });
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.news.Initialization();