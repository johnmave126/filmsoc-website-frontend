/**
 * @fileoverview Provide management of paging.
 */

cr.define('cr', function() {
  'use strict';

  /**
   * Constructor for a page manager.
   * Construct a page manager using specific model and query.
   * @param {BaseModel} model The model to use in pager
   * @param {string} query The query string to use
   * @constructor
   */
  function Pager(model, query) {
    Object.defineProperty(this, 'model', {
      value: model,
    });
    Object.defineProperty(this, 'has_prev', {
      get: function() {
        return this._cache[this.pos].meta.previous.length > 0;
      },
    });
    Object.defineProperty(this, 'has_next', {
      get: function() {
        return this._cache[this.pos].meta.next.length > 0;
      },
    });
    Object.defineProperty(this, 'page', {
      get: function() {
        return this._cache[this.pos].meta.page;
      },
    });
    Object.defineProperty(this, 'total', {
      get: function() {
        return this._cache[this.pos].meta.total;
      },
    });
    Object.defineProperty(this, 'obj_list', {
      get: function() {
        return this._cache[this.pos].objects;
      },
    });
    this._cache = {};
    this.pos = 0;
    (loadPage.bind(this))(query, 0);
  }

  /**
   * Read a page.
   * @param {Object} entry The cache entry to read.
   * @param {Function} callback The callback after reading.
   * @private
   */
  function readPage(entry, callback) {
    var objs = [], loaded = 0;
    for (var i = 0; i < entry.objects.length; i++) {
      this.model.get(entry.objects[i], (function(p, instance) {
        objs[p] = instance;
        loaded++;
        if (loaded === entry.objects.length) {
          if (callback) {
            callback.call(this, objs);
          }
        }
      }).bind(this, i));
    }
    if (entry.objects.length === 0) {
      callback.call(this, objs);
    }
  }

  /**
   * Load a page.
   * @param {string} query The callback after loading.
   * @param {integer} pos The position relative to origin.
   * @param {Function} callback The callback after loading.
   * @private
   */
  function loadPage(query, pos, callback) {
    if (this._cache[pos]) {
      if (this._cache[pos].state === 1) {
        //Loaded before
        (readPage.bind(this))(this._cache[pos], callback);
      }
      else {
        //Loading
        //Replace callback
        this._cache[pos].callback = callback;
      }
    }
    else {
      if (!query) {
        return;
      }
      //Load now
      this._cache[pos] = {
        state: 0,
        callback: callback,
        objects: [],
        meta: {},
      };
      var r = new cr.APIRequest(this.model, 'GET', query);
      r.onload = (function(ev) {
        var entry = this._cache[pos],
            obj = ev.recObj;
        entry.meta = deepCopy(obj.meta);
        for (var i = 0; i < obj.objects.length; i++) {
          this.model.update(obj.objects[i], 1);
          entry.objects.push(obj.objects[i].id);
        }
        entry.state = 1;
        if (entry.callback) {
          entry.callback.call(this, obj.objects);
        }
      }).bind(this);
      r.onerror = cr.errorHandler;
      r.send();
    }
  }

  Pager.prototype = {
    /**
     * Load the current content and cache the sibling page
     * @param {Function} callback The callback after loading.
     */
    load: function(callback) {
      (loadPage.bind(this))(null, this.pos, function() {
        if(callback)
          callback.apply(this, arguments);
        //Trigger cache
        if (!this._cache[this.pos + 1]) {
          (loadPage.bind(this))(this._cache[this.pos].meta.next, this.pos + 1, null);
        }
        if (!this._cache[this.pos - 1]) {
          (loadPage.bind(this))(this._cache[this.pos].meta.previous, this.pos - 1, null);
        }
      });
    },

    /**
     * Move to the next page. Stay if no next page.
     * @param {Function} callback The callback after loading.
     */
    next: function(callback) {
      if (this._cache[this.pos].meta.next) {
        this.pos++;
      }
      (loadPage.bind(this))(null, this.pos, function() {
        if(callback)
          callback.apply(this, arguments);
        //Trigger cache
        if (!this._cache[this.pos + 1]) {
          (loadPage.bind(this))(this._cache[this.pos].meta.next, this.pos + 1, null);
        }
      });
    },

    /**
     * Move to the previous page. Stay if no previous page.
     * @param {Function} callback The callback after loading.
     */
    prev: function(callback) {
      if (this._cache[this.pos].meta.previous) {
        this.pos--;
      }
      (loadPage.bind(this))(null, this.pos, function() {
        if(callback)
          callback.apply(this, arguments);
        //Trigger cache
        if (!this._cache[this.pos - 1]) {
          //Trigger cache
          (loadPage.bind(this))(this._cache[this.pos].meta.previous, this.pos - 1, null);
        }
      });
    }
  };

  return {
    Pager: Pager,
  };
});
