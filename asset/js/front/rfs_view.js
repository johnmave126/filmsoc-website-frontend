/**
 * @fileoverview View concerning Regular Film Show.
 */

cr.define('cr.view.show', function() {
  var name = 'show';

  /**
   * Return the film to be shown
   * @param {Object} obj The show
   * @return {Object} The disk
   */
  function toShow(obj) {
    if (obj.film_1.avail_type === 'Onshow') {
      return obj.film_1;
    }
    if (obj.film_2.avail_type === 'Onshow') {
      return obj.film_2;
    }
    if (obj.film_3.avail_type === 'Onshow') {
      return obj.film_3;
    }
    return null;
  }

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/show\//, false, rfs_setup(rfs_list));
    cr.ui.template.register("rfs_template.html");
    cr.ui.template.register("rfs_true_template.html", function(param) {
      //Hooks
      var strips = this.querySelectorAll('.rfs-film-strip'),
          board = this.querySelector('.info-tab');
      for(var i = 0; i < strips.length; i++) {
        var idx = strips[i].getAttribute('refer'),
            cover = strips[i].querySelector('.rfs-cover'),
            disk = param.show['film_' + idx];
        //Cover
        if (disk.cover_url)
          cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + disk.cover_url.url + ')';
        else
          cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';

        //Info
        //Add actors
        var actor_wrapper = this.querySelector('.info-tab .rfs-film-info[refer="' + idx + '"] .actors-wrapper');
        actor_wrapper.textContent = disk.actors.join(', ');

        //Add tags
        var tag_wrapper = this.querySelector('.info-tab .rfs-film-info[refer="' + idx + '"] .tags-wrapper');
        tag_wrapper.textContent = disk.tags.join(', ');

        strips[i].querySelector('.rfs-cover').addEventListener('click', (function(id, e) {
          routerManager.pushState('library/' + id + '/', false);
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }).bind(null, disk.id), true);

        //Button
        strips[i].querySelector('button[controls="vote"]').addEventListener('click', rfs_vote.bind(null, param.show.id, idx));

        strips[i].addEventListener('mouseover', (function(idx) {
          board.classList.add('noscrollbar');
          var old = this.querySelectorAll('div[selected]');
          for (var i = 0; i < old.length; i++) {
            old[i].removeAttribute('selected');
          }
          this.querySelector('.rfs-film-info[refer="' + idx + '"]').setAttribute('selected', true);
        }).bind(board, idx));
        strips[i].addEventListener('mouseout', (function() {
          board.classList.remove('noscrollbar');
          var old = this.querySelectorAll('div[selected]');
          for (var i = 0; i < old.length; i++) {
            old[i].removeAttribute('selected');
          }
          this.querySelector('.rfs-remarks').setAttribute('selected', true);
        }).bind(board));
      }
    });
  }

  /**
   * Vote for a film.
   * @param {Integer} id The id of the show
   * @param {1 or 2 or 3} idx The Film to vote
   */
  function rfs_vote(id, idx) {
    var r = new cr.APIRequest(cr.model.RegularFilmShow, 'POST', '/' + id + '/vote/');
    r.onload = function(e) {
      cr.ui.showNotification('Vote success', 'dismiss');
      history.go();
    };
    r.onerror = cr.errorHandler;
    r.sendJSON({film_id: idx});
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function rfs_setup(func) {
    return function() {
      cr.view.name = name;
      cr.ui.changeSelection(name);
      document.title = "Regular Film Show | Film Society, HKUSTSU";
      routerManager.markTracker();
      if (cr.model.SiteSettings.getField('rfs_state').value !== "Open") {
        var error_template = cr.ui.template.render_template('error_page.html', {text: "Sorry, Regular Film Show is temporarily closed."});
        cr.ui.replaceContent(error_template);
        return;
      }
      var rfs_template = cr.ui.template.render_template('rfs_template.html');
      cr.ui.replaceContent(rfs_template, (function(a) {
        func.apply(this, a);
      }).bind(rfs_template, arguments));
    };
  }

  /**
   * View of regular film show
   */
  function rfs_list() {
    var node = this,
        skeleton = this.querySelector('.rfs-content-wrapper'),
        pager = new cr.Pager(cr.model.RegularFilmShow, '/?limit=1');
    pager.load(disp_rfs);

    function disp_rfs(obj_list) {
      if (obj_list.length === 0) {
        var error_template = cr.ui.template.render_template('error_page.html', {text: "Sorry, No Regular Film Show available."});
        cr.ui.replaceContent(error_template);
        return;
      }

      var template = cr.ui.template.render_template('rfs_true_template.html', {show: obj_list[0], user: cr.user, toshow: toShow(obj_list[0])});
      console.log(obj_list[0], toShow(obj_list[0]));
      //Update disks
      cr.model.Disk.update(obj_list[0].film_1, 1);
      cr.model.Disk.update(obj_list[0].film_2, 1);
      cr.model.Disk.update(obj_list[0].film_3, 1);

      skeleton.appendChild(template);
      skeleton.removeAttribute('hidden');
      setTimeout(function() {
        node.classList.remove('loading');
        var bars = skeleton.querySelectorAll('.rfs-film-strip .vote-bar'),
            sum = obj_list[0].vote_cnt_1 + obj_list[0].vote_cnt_2 + obj_list[0].vote_cnt_3;
        for (var i = 0; i < bars.length; i++) {
          var vote = obj_list[0]["vote_cnt_" + (i + 1)];
          bars[i].style.top = (100 - 90 * (vote / (sum + 0.0001))) + '%';
        }
      }, 0);
    }
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.show.Initialization();