/**
 * @fileoverview Provide model utility.
 */

cr.define('cr', function() {
  'use strict';
  var dirty_listening = [];

  /**
   * Constructor for BaseModel singleton.
   * Construct a base model class and handle fundamental operation.
   * @constructor
   */
  function BaseModel(name) {
    Object.defineProperty(this, 'name', {
      value: name,
    });
    this._cache = {};
    this.fields = [];
  }

  /**
   * Provide API interface.
   * @param {Object} model The model to call on.
   * @param {string} method The method to use.
   * @param {string} api The API to call.
   * @param {boolean} force_new If true, bypass any cache.
   * @constructor
   */
  function APIRequest(model, method, api, force_new) {
    var base_url = cr.settings.api_base + model.name + api;
    this.xhr = new XMLHttpRequest();
    if (method === 'GET' && force_new) {
      this.xhr.open(method, base_url + ((/\?/).test(base_url) ? "&" : "?") + (new Date()).getTime(), true);
    }
    else {
      this.xhr.open(method, base_url, true);
    }
    this.xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    this.xhr.withCredentials = true;
    this.xhr.onprogress = (function(e) {
      if (this.onloadprogress) {
        this.onloadprogress(e);
      }
    }).bind(this);
    this.xhr.upload.onprogress = (function(e) {
      if (this.onuploadprogress) {
        this.onuploadprogress(e);
      }
    }).bind(this);
    this.xhr.onreadystatechange = (function() {
      if (this.xhr.readyState === 4) {
        //Loaded
        if(this.xhr.status === 200) {
          try {
            var obj = JSON.parse(this.xhr.responseText);
            this.success = obj.errno === 0;
            this.data = obj;
            e = new cr.Event((obj.errno === 0) ? 'load' : 'error', false, true);
            e.recObj = obj;
          }
          catch(exception) {
            this.success = false;
            this.data = {errno: 2, error: "Error receiving data"};
            e = new cr.Event('error', false, true);
            e.recObj = {errno: 2, error: "Error receiving data"};
          }
        }
        else {
          this.success = false;
          this.data = {errno: this.xhr.status, error: this.xhr.statusText};
          e = new cr.Event('error', false, true);
          e.recObj = {errno: this.xhr.status, error: this.xhr.statusText};
        }
        this.dispatchEvent(e);
      }
    }).bind(this);
  }


  extend(APIRequest, cr.EventTarget);
  APIRequest.prototype.extend({
    /**
     * Default interface of event
     */
    onload: null,
    onerror: null,
    onuploadprogress: null,
    onloadprogress: null,

    /**
     * Simply send request
     */
    send: function() {
      this.xhr.send();
    },

    /**
     * Post raw data. Used when posting FormData
     * @param {string} data The data to send
     */
    sendRaw: function(data) {
      this.xhr.send(data);
    },

    /**
     * Post form data.
     * @param {string} data The data to send
     */
    sendForm: function(data) {
      this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      this.xhr.send(data);
    },

    /**
     * Post json data.
     * @param {Object} obj The obj to send
     */
    sendJSON: function(obj) {
      this.xhr.setRequestHeader("Content-Type", "application/json");
      this.xhr.send(JSON.stringify(obj));
    }
  });

  BaseModel.prototype = {
    /**
     * Update the data in the cache.
     * @param {Object} data The data to update
     * @param {integer} level The dirty level to set
     */
    update: function(data, level) {
      if (!this._cache[data.id]) {
        this._cache[data.id] = {data: {}};
      }
      for (var key in data) {
        if (this.fields.indexOf(key) !== -1) {
          this._cache[data.id].data[key] = data[key];
        }
      }
      this._cache[data.id].dirty = level;
    },

    /**
     * Get the data using id. May use data in cache if not dirty.
     * @param {integer} id The id of the data
     * @param {Function} callback The callback to call after retrieve data.
     */
    get: function(id, callback) {
      if (this._cache[id] && this._cache[id].dirty > 0) {
        if (callback) {
          callback(deepCopy(this._cache[id].data));
        }
      }
      else {
        //retrieve it
        var r = new APIRequest(this, 'GET', '/' + id + '/', this._cache[id]);
        r.onload = (function(e) {
          this.update(e.recObj, 1);
          if (callback) {
            callback(deepCopy(this._cache[id].data));
          }
        }).bind(this);
        r.onerror = function(e) {
          cr.errorHandler(e);
        };
        r.send();
      }
    },

    /**
     * edit a model information.
     * @param {id} id The id of model to edit
     * @param {Object} data Data to put
     * @param {boolean} update If true, update the cache based on return value
     * @param {Function} callback Function to call after successful access
     */
    put: function(id, data, update, callback) {
      var r = new APIRequest(this, 'PUT', '/' + id + '/');
      r.onload = (function(e) {
        if (update) {
          this.update(e.recObj, 2);
        }
        if (callback) {
          callback(deepCopy(this._cache[id].data));
        }
      }).bind(this);
      r.onerror = function(e) {
        cr.errorHandler(e);
      };
      r.sendJSON(data);
    },

    /**
     * create a model.
     * @param {Object} data Data to post
     * @param {Function} callback Function to call after successful access
     */
    post: function(data, callback) {
      var r = new APIRequest(this, 'POST', '/');
      r.onload = (function(e) {
        this.update(e.recObj, 2);
        if (callback) {
          callback(deepCopy(this._cache[e.recObj.id].data));
        }
      }).bind(this);
      r.onerror = function(e) {
        cr.errorHandler(e);
      };
      r.sendJSON(data);
    },

    /**
     * delete a model.
     * @param {integer} id ID of the instance to delete
     * @param {Function} callback Function to call after successful access
     */
    remove: function(id, callback) {
      var r = new APIRequest(this, 'DELETE', '/' + id + '/');
      r.onload = (function(e) {
        if (this._cache[e.recObj.id]) {
          delete this._cache[e.recObj.id];
        }
        if (callback) {
          callback(e.recObj);
        }
      }).bind(this);
      r.onerror = function(e) {
        cr.errorHandler(e);
      };
      r.send();
    },

    /**
     * Setup the basic behaviour of the model.
     * @param {boolean} refresh If true, refresh dirty list every 6 minutes
     */
    setup: function(refresh) {
      if (refresh) {
        addDirty(this);
      }
    },
  }

  /**
   * Add a model to retrieve dirty info.
   * @param {BaseModel} model The model to register
   */
  function addDirty(model) {
    dirty_listening.push(model);
  }

  /**
   * Init dirty utility.
   */
  function ModelInit() {
    var delay = 6 * 60 * 1000;
    var refresh_dirty = function() {
      var r = new APIRequest({name: 'dirty'}, 'GET', '/', true);
      r.onerror = function(e) {
        if (e.recObj.errno !== 403) {
          setTimeout(refresh_dirty, delay);
        }
      };
      r.onload = function(e) {
        for (var i = 0; i < dirty_listening.length; i++) {
          var model = dirty_listening[i],
              list = e.recObj[model.name];
          for (var j = 0; list && j < list.length; j++) {
            model._cache[list[i]] && (model._cache[list[i]].dirty--);
          }
        }
        setTimeout(refresh_dirty, delay);
      };
      r.send();
    };
    setTimeout(refresh_dirty, delay);
  }

  return {
    BaseModel: BaseModel,
    APIRequest: APIRequest,
    ModelInit: ModelInit,
  };
});

cr.ModelInit();