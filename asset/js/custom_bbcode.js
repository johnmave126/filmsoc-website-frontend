/**
 * @fileoverview Provide BBCode utility of the site.
 */

cr.define('cr.ui.bbcode', function() {
  'use strict';

  /**
   * Initialize custom bbcode handlers
   */
  function globalInitialization() {
    cr.ui.template.registerBBCode(/\[inlinedisk\](\d+)\[\/inlinedisk\]/ig, '<a class="richtext-inline-disk" href="#!library/$1/" remote_id="$1">...</a>');
    cr.ui.template.registerBBCode(/\[disk\](\d+)\[\/disk\]/ig, '<div class="richtext-disk" remote_id="$1"></div>');
    cr.ui.template.registerBBCode(/\[rfs\](\d+)\[\/rfs\]/ig, '<div class="richtext-rfs" remote_id="$1"></div>');
    cr.ui.template.registerBBCode(/\[ticket\](\d+)\[\/ticket\]/ig, '<div class="richtext-ticket" remote_id="$1"></div>');

    cr.ui.template.register("richtext_disk.html", function(param) {
      var cover = this.querySelector('.richtext-disk-cover');

      //Cover
      if (param.disk.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.disk.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
    });
    cr.ui.template.register("richtext_rfs.html", function(param) {
      var items = this.querySelectorAll('.richtext-rfs-item');
      for (var i = 0; i < items.length; i++) {
        var item = items[i],
            disk = param.rfs["film_" + item.getAttribute('refer')];
        
        //Cover
        if (disk.cover_url)
          item.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + disk.cover_url.url + ')';
        else
          item.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
      }
    });
    cr.ui.template.register("richtext_ticket.html", function(param) {
      var cover = this.querySelector('.richtext-disk-cover');

      //Cover
      if (param.ticket.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.ticket.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
    });
  }

  /**
   * Handle the result HTML
   * @param {HTMLElement} elem The element generated from BBCode
   */
  function handleHTML(elem) {
    var inline_disks = elem.querySelectorAll('.richtext-inline-disk'),
        disks = elem.querySelectorAll('.richtext-disk'),
        rfss = elem.querySelectorAll('.richtext-rfs'),
        tickets = elem.querySelectorAll('.richtext-ticket');
    //Inline Disk
    for (var i = 0; i < inline_disks.length; i++) {
      var entry = inline_disks[i],
          id = entry.getAttribute('remote_id');
      cr.model.Disk.get(id, (function(disk) {
        this.textContent = disk.title_en + ' / ' + disk.title_ch;
      }).bind(entry));
      entry.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        routerManager.pushState(this.getAttribute('href').substr(2), false, false);
      });
    }

    //Disk
    for (var i = 0; i < disks.length; i++) {
      var entry = disks[i],
          id = entry.getAttribute('remote_id');
      cr.model.Disk.get(id, (function(disk) {
        var info = cr.ui.template.render_template("richtext_disk.html", {disk: disk});
        this.appendChild(info);
        info.classList.remove('loading');
      }).bind(entry));
    }

    //Show
    for (var i = 0; i < rfss.length; i++) {
      var entry = rfss[i],
          id = entry.getAttribute('remote_id');
      cr.model.RegularFilmShow.get(id, (function(rfs) {
        var info = cr.ui.template.render_template("richtext_rfs.html", {rfs: rfs});
        this.appendChild(info);
        info.classList.remove('loading');
      }).bind(entry));
    }

    //Ticket
    for (var i = 0; i < tickets.length; i++) {
      var entry = tickets[i],
          id = entry.getAttribute('remote_id');
      cr.model.PreviewShowTicket.get(id, (function(ticket) {
        var info = cr.ui.template.render_template("richtext_ticket.html", {ticket: ticket});
        this.appendChild(info);
        info.classList.remove('loading');
      }).bind(entry));
    }
  }

  return {
    globalInitialization: globalInitialization,
    handleHTML: handleHTML,
  };
});

cr.ui.bbcode.globalInitialization();