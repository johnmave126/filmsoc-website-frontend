/**
 * @fileoverview View concerning Sponsor.
 */

cr.define('cr.view.sponsor', function() {
  var name = 'sponsor',
      play_duration = 15 * 1000,
      gaussian = new Ziggurat;

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/sponsor\//, false, sponsor_setup(sponsor_list));
    cr.ui.template.register("sponsor_template.html");
    cr.ui.template.register("sponsor_item.html", function(param) {
      var node = this;
          img = node.querySelector('img');
      img.onload = function() {
        node.style.width = this.width + 'px';
      };
      img.onerror = function() {
        node.style.display = 'none';
      };
      img.src = param.base_url + param.sponsor.img_url.url;
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function sponsor_setup(func) {
    return function() {
      cr.view.name = name;
      cr.ui.changeSelection(name);
      document.title = "Sponsor | Film Society, HKUSTSU";
      routerManager.markTracker();
      var sponsor_template = cr.ui.template.render_template('sponsor_template.html');
      cr.ui.replaceContent(sponsor_template, (function(a) {
        func.apply(this, a);
      }).bind(sponsor_template, arguments));
    };
  }

  /**
   * View of sponsor
   */
  function sponsor_list() {
    var node = this,
        pager = new cr.Pager(cr.model.Sponsor, '/'),
        row = 0,
        latency = 0;
    pager.load(disp_sponsor);

    var item_reload = function(e) {
      var item = e.target;
      item.classList.remove('moving');
      if (latency < play_duration) {
        //setout immediately
        item_setout.call(item, item.offset)
      }
      else {
        item_setout.call(item, latency + item.offset - play_duration * 3 / 4);
      }
    };
    node.addEventListener('webkitAnimationEnd', item_reload);
    node.addEventListener('MSAnimationEnd', item_reload);
    node.addEventListener('oAnimationEnd', item_reload);
    node.addEventListener('animationend', item_reload);

    function disp_sponsor(obj_list) {
      var arr = shuffle(obj_list);
      node.classList.remove('loading');
      for (var i = 0; i < arr.length; i++) {
        var item = cr.ui.template.render_template("sponsor_item.html", {sponsor: arr[i], base_url: cr.settings.resource_base + 'upload/'});
        node.appendChild(item);
        item_setout.call(item, latency);
        if (row == 0) {
          latency += play_duration / 4;
        }
      }
      if (this.has_next) {
        this.next(disp_sponsor);
      }
    }

    function item_setout(latency) {
      var offset = generateNumber(latency + 1000, Math.min(2000, 2 * Math.max(latency + 1000, 0))),
          t = this;
      t.style.top = generateNumber(row * 23 + 6, 12) + '%';
      t.style.zIndex = ~~(Math.random() * 10);
      t.offset = latency + 1000 - offset;
      setTimeout((function() {
        this.classList.add('moving');
      }).bind(t), offset);
      row++;
      if (row > 3) {
        row = 0;
      }
    }

    function generateNumber(center, range) {
      while (true) {
        var raw = gaussian.nextGaussian();
        raw *= range / 8;
        raw += center;
        if (raw < center - (range >> 1) || raw > center + (range >> 1)) {
          continue;
        }
        return raw;
      }
    }

    function shuffle(array) {
      var currentIndex = array.length
        , temporaryValue
        , randomIndex
        ;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.sponsor.Initialization();