/**
 * @fileoverview View concerning Preview Show Ticket.
 */

cr.define('cr.view.ticket', function() {
  var name = 'ticket';

  /**
   * Initialization of this view.
   */
  function Initialization() {
    routerManager.register(/ticket\//, false, ticket_setup(ticket_list));

    cr.ui.template.register("ticket_template.html", function() {
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

    cr.ui.template.register('ticket_list_item.html', function(param) {
      var cover = this.querySelector('.item-cover');
      //Cover
      if (param.ticket.cover_url)
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + param.ticket.cover_url.url + ')';
      else
        cover.style.backgroundImage = 'url(' + cr.settings.resource_base + 'css/question.png)';
    });

    cr.ui.template.register('ticket_detail.html', function(param) {
      var cover = this.querySelector('.ticket-brief .ticket-cover');
      //Cover
      if (param.ticket.cover_url)
        cover.style.backgroundImage = cssurl(cr.settings.resource_base + 'upload/' + param.ticket.cover_url.url);
      else
        cover.style.backgroundImage = cssurl(cr.settings.resource_base + 'css/question.png');

      //Hooks on apply button
      this.querySelector('button[controls="apply"]').addEventListener('click', function() {
        var popup = document.querySelector('.ticket-wrapper .popup-overlay'),
            box = popup.querySelector('.popup-box'),
            content = box.querySelector('.content'),
            apply_form = cr.ui.template.render_template("ticket_apply.html", {ticket: param.ticket});

        //Remove original and append new
        box.querySelector('h1').textContent = "Apply For Ticket";
        while (content.firstChild) {
          content.removeChild(content.firstChild);
        }
        content.appendChild(apply_form);
        box.classList.remove('loading');

        //Display popup
        popup.removeAttribute('hidden');
        setTimeout(function() {
          popup.classList.remove('loading');
        }, 0);
      });
    });

    cr.ui.template.register('ticket_apply.html', function(param) {
      var node = this,
          selects = this.querySelectorAll('.custom-select');
      for (var i = 0; i < selects.length; i++) {
        cr.ui.select.init(selects[i]);
      }
      //Hook on submit button
      this.querySelector('button[controls="apply"]').addEventListener('click', function(e) {
        var payload = Application.collectForm(node),
            r = new cr.APIRequest(cr.model.PreviewShowTicket, 'POST', '/' + param.ticket.id + '/application/');
        cr.ui.swallowDoubleClick(e);
        payload['number'] = ~~(payload['number']);
        r.onload = function(e) {
          cr.ui.showNotification('Ticket applied', 'dismiss');
          cr.dispatchSimpleEvent(node, 'close', true, true);
        };
        r.onerror = function(e) {
          node.classList.remove('loading');
          cr.errorHandler(e);
        };
        node.classList.add('loading');
        r.sendJSON(payload);
      });
    });
  }

  /**
   * Pre-setup of this view.
   * @param {Function} func The real callback function
   * @return {Function} The wrapped function
   */
  function ticket_setup(func) {
    return function() {
      if (cr.model.SiteSettings.getField('pst_state').value !== "Open") {
        var error_template = cr.ui.template.render_template('error_page.html', {text: "Sorry, The Preview Show Ticket is temporarily closed."});
        cr.ui.replaceContent(error_template, function() {
          cr.ui.changeSelection(name);
          cr.view.name = name;
          document.title = "Preview Show Ticket | Film Society, HKUSTSU";
          routerManager.markTracker();
        });
        return;
      }
      var ticket_template = cr.ui.template.render_template('ticket_template.html');
      cr.ui.replaceContent(ticket_template, (function(a) {
        cr.ui.changeSelection(name);
        cr.view.name = name;
        document.title = "Preview Show Ticket | Film Society, HKUSTSU";
        routerManager.markTracker();
        func.apply(this, a);
      }).bind(ticket_template, arguments));
    };
  }

  /**
   * Switch the displaying ticket.
   * @param {HTMLElement} root The root element to perform switch
   * @param {Integer} id The ticket to switch to
   */
  function ticket_switch(root, id) {
    var panel = root.querySelector('.right-panel'),
        detail_wrapper = panel.querySelector('.ticket-detail-wrapper');
    panel.classList.add('loading');
    cr.model.PreviewShowTicket.get(id, function(ticket) {
      setTimeout(function() {
        document.title = ticket.title_en + ' ' + ticket.title_ch + " | Film Society, HKUSTSU";
        detail_wrapper.setAttribute("hidden", true);
        while (detail_wrapper.firstChild) {
          detail_wrapper.removeChild(detail_wrapper.firstChild);
        }
        var ticket_item = cr.ui.template.render_template('ticket_detail.html', {ticket: ticket, user: cr.user});
        detail_wrapper.appendChild(ticket_item);
        detail_wrapper.removeAttribute('hidden');
        setTimeout(function() {
          panel.classList.remove('loading');
        }, 0);
      }, 410);
    });
  }

  /**
   * PreviewShowTicket main view
   */
  function ticket_list() {
    var node = this,
        left_panel = node.querySelector('.left-panel'),
        list_wrapper = left_panel.querySelector('.ticket-list-wrapper'),
        panel = this.querySelector('.right-panel'),
        pager = new cr.Pager(cr.model.PreviewShowTicket, '/?limit=10');

    node.scrollList = new cr.ui.scrollList(list_wrapper, left_panel, pager, {
      onfirstload: function(obj_list) {
        if(obj_list.length == 0) {
          this.anchor_element.textContent = "No Ticket at the time";
        }
      },
      onload: function(obj, idx) {
        var entry = cr.ui.template.render_template('ticket_list_item.html', {ticket: obj});
        //Hook
        entry.addEventListener('click', (function(node, id, e) {
          ticket_switch(node, id);
          switch_selection(this);
        }).bind(entry, node, obj.id));
        this.elem.insertBefore(entry, this.anchor_element);
        setTimeout((function() {
          this.classList.remove('loading');
        }).bind(entry), idx * 100 + 400);
        if (this.first_load && idx == 0) {
          switch_selection(entry);
          ticket_switch(node, obj.id);
        }
      },
      deleteAnchor: false
    });
    node.scrollList.load();

    function switch_selection(node) {
      var selected = list_wrapper.querySelectorAll('[selected]');
      for (var i = 0; i < selected.length; i++) {
        selected[i].removeAttribute('selected');
      }
      node.setAttribute('selected', true);
    }
  }

  return {
    Initialization: Initialization,
  }
});

cr.view.ticket.Initialization();