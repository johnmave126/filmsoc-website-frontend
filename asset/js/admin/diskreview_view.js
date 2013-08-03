/**
 * @fileoverview View concerning DiskReview.
 */

cr.define('cr.view.review', function() {
  var name = 'review';
  /**
   * Initialization of this view.
   */
  function Initialize() {
    routerManager.register(/review\//, false, review_setup(review_list));
    routerManager.register(/review\/search\//, false, review_setup(review_search));
    cr.ui.template.register("admin/review_list.html");
    cr.ui.template.register("admin/review_list_item.html", function(param) {
      this.querySelector('button[control="delete"]').addEventListener('click', delete_review.bind(null, param.review));
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function review_setup(func) {
    return function() {
      cr.ui.changeSelection(name);
      document.title = 'Disk Review | Film Society, HKUSTSU';
      func.apply(this, arguments);
    };
  }

  /**
   * Delete a review.
   * @param {Integer} id The id of review
   */
  function delete_review(review) {
    alertOverlay.setValues(
      'Confirm Delete',
      'Confirm delete thsi review?',
      'Delete',
      'Cancel',
      function() {
        cr.dispatchSimpleEvent($('alertOverlay'), 'cancelOverlay');
        cr.ui.showLoading();
        cr.model.DiskReview.remove(review.id, function() {
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
   * Hook to load review list view.
   * @param {Object} query The query data
   */
  function review_list(query) {
    var page = query.page || 1,
        skeleton = cr.ui.template.render_template("admin/review_list.html", {query: ''});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query = "/?" + 'page=' + page,
        pager = new cr.Pager(cr.model.DiskReview, api_query);
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
    skeleton.querySelector('#review-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module DiskReview', {
        model: 'DiskReview',
      }, cr.model.DiskReview.types);
    });

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
        routerManager.pushState('review/search/?q=' + encodeURIComponent(e.target.value), false, false);
      }
    });

    function load_obj(obj_list) {
      cr.ui.removeLoading(content);
      list_container.classList.add("content-loading");
      list_container.innerHTML = "";
      for (var i = 0; i < obj_list.length; i++) {
        var listitem = cr.ui.template.render_template("admin/review_list_item.html", {review: obj_list[i]});
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
      return 'review/?page=' + page;
    }
  }

  /**
   * Hook to load review search view.
   * @param {Object} query The query data
   */
  function review_search(query) {
    var page = query.page || 1,
        param = query.q || '',
        skeleton = cr.ui.template.render_template("admin/review_list.html", {query: param});
    cr.ui.replaceContent(skeleton);
    //Load data
    var list_container = skeleton.querySelector("list"),
        content = skeleton.querySelector('.content'),
        footer = skeleton.querySelector("footer"),
        api_query;

    if (/^[AB]\d{4}$/.test(param)) {
      api_query = "/?disk=" + param.substr(1) + "&page=" + page;
    }
    else {
      api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param);
    }
    var pager = new cr.Pager(cr.model.DiskReview, api_query);
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
    skeleton.querySelector('#review-view-log').addEventListener('click', function() {
      cr.logger.showLogger('View Logs of module DiskReview', {
        model: 'DiskReview',
      }, cr.model.DiskReview.types);
    });

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
        if (/^[AB]\d{4}$/.test(param)) {
          api_query = "/?disk=" + param.substr(1).replace(/^0+/g, '') + "&page=" + page;
        }
        else {
          api_query = "/search/?" + 'page=' + page + '&query=' + encodeURIComponent(param);
        }
        pager = new cr.Pager(cr.model.DiskReview, api_query);
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
        var listitem = cr.ui.template.render_template("admin/review_list_item.html", {review: obj_list[i]});
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
      return 'review/search/?page=' + page + '&q=' + encodeURIComponent(param);
    }
  }

  return {
    Initialize: Initialize,
  }
});

cr.view.review.Initialize();
