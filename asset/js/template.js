/**
 * @fileoverview Provide template utility for page render.
 */

cr.define('cr.ui.template', function() {
  'use strict';

  var templates = {},
      BBHandler = [
    {pattern: /\[b\](.+?)\[\/b\]/ig, repl: '<b>$1</b>'},
    {pattern: /\[i\](.+?)\[\/i\]/ig, repl: '<em>$1</em>'},
    {pattern: /\[u\](.+?)\[\/u\]/ig, repl: '<u>$1</u>'},
    {pattern: /\[big\](.+?)\[\/big\]/ig, repl: '<big>$1</big>'},
    {pattern: /\[small\](.+?)\[\/small\]/ig, repl: '<small>$1</small>'},
    {pattern: /\[color=([a-zA-Z]*|\#?[0-9a-fA-F]{6})\](.+?)\[\/color\]/ig, repl: '<span style="color:$1">$2</span>'},
    {pattern: /\[link\=\s*((?:(?:ftp|https?):\/\/)?(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[\/?]\S+?))\s*\](.+?)\[\/link\]/ig, repl: '<a href="$1" rel="nofollow" target="_blank">$2</a>'},
    {pattern: /\[img\=\s*((?:(?:ftp|https?):\/\/)?(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[\/?]\S+?))\s*\](.*?)\[\/img\]/ig, repl: '<img src="$1" alt="$2" title="$2">'},
  ];

  /**
   * Escape a string between tags. With newline rendered as <p>
   * @param {string} value The string to escape.
   * @return {string} The escaped string.
   */
  function escapeWrap(value) {
    return '<p>' + value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\n/g, '</p><p>') + '</p>';
  }

  /**
   * Escape a string between tags. With newline rendered as <br>
   * @param {string} value The string to escape.
   * @return {string} The escaped string.
   */
  function escapePreWrap(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace('\n', '<br>');
  }

  /**
   * Escape a string between tags. With newline preserved
   * @param {string} value The string to escape.
   * @return {string} The escaped string.
   */
  function escapePre(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }

  /**
   * Escape a string inside attribute.
   * @param {string} value The string to escape.
   * @return {string} The escaped string.
   */
  function escapeAttr(value) {
    return value.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }

  /**
   * Escape a string between tags.
   * @param {string} value The string to escape.
   * @return {string} The escaped string.
   */
  function escapeHTML(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace('\n', ' ');
  }

  /**
   * Escape a string between tags using BBCode favour.
   * @param {string} value The string to escape.
   * @return {string} The escaped string.
   */
  function escapeBBCode(value) {
    value = escapeWrap(value);
    //Run through BBCode
    for (var i = 0; i < BBHandler.length; i++) {
      var dup_value;
      do {
        dup_value = value;
        value = value.replace(BBHandler[i].pattern, BBHandler[i].repl);
      }while(dup_value != value);
    }
    return value;
  }

  /**
   * Render a template.
   * @param {string} url The relative url to template.
   * @param {object} param An object containing param for template.
   * @param {HTMLDivElement} A div of HTML
   */
  function render_template(url, param) {
    var template = templates[url],
        wrapper = document.createElement('div'),
        item,
        text,
        func_head,
        func_bottom;
    if (template === undefined) {
      throw new ReferenceError("Undefined template.");
    }
    param = param || {};
    text = template.content || '';
    var argn = [], args = [];
    for (var prop in param) {
      if (param.hasOwnProperty(prop) && /^[_a-zA-Z][_a-zA-Z0-9]*$/.test(prop)) {
        argn.push(prop);
        args.push('param.' + prop);
      }
    }
    func_head = "(function(" + argn.join(',') + "){ return eval('";
    func_bottom = "');})(" + args.join(',') + ")";
    //Run RegExp to resolve values
    var html = text.replace(/{{(.*?)}}/g, function(m, value) {
      var arg_list, 
          escaper = escapeHTML;
      value = value.trim();
      arg_list = value.split('|');
      if (arg_list[1]) {
        switch(arg_list[1].trim()) {
          case 'safe': escaper = function(value) {return value;}; break;
          case 'attr': escaper = escapeAttr; break;
          case 'bbcode': escaper = escapeBBCode; break;
          case 'wrap': escaper = escapeWrap; break;
          case 'pre': escaper = escapePre; break;
          case 'prewrap': escaper = escapePreWrap; break;
          default: break;
        }
      }
      var result = eval(func_head + arg_list[0].trim().replace(/'/g, "\\'") + func_bottom);
      //Note: never use strong equality comparing undefined
      if (result != undefined) {
        result = '' + result;
      }
      else {
        result = '';
      }
      return escaper(result);
    });

    //Now html is safe.
    wrapper.innerHTML = html;
    item = wrapper.firstChild || document.createElement('div');
    if (template.callback) {
      template.callback.call(item, param);
    }
    return item;
  }

  /**
   * Makes initializations which must hook at the document level.
   * Load all the templates registered.
   */
  function globalInitialization() {
    var pending = [],
        complete_cnt = 0;
    for (var url in templates) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', cr.settings.resource_base + 'templates/' + url, true);
      xhr.onload = (function(url) {
        templates[url].content = this.responseText.trim();
        complete_cnt++;
        if(complete_cnt == pending.length) {
          cr.dispatchSimpleEvent(window, 'moduleload', false, false);
        }
      }).bind(xhr, url);
      xhr.onerror = function(e) {
        e.recObj = {errno: xhr.status, error: ""};
        cr.errorHandler(e);
      }
      pending.push(xhr);
    }
    for (var i = 0; i < pending.length; i++) {
      pending[i].send(null);
    }
    if (pending.length === 0) {
      cr.dispatchSimpleEvent(window, 'moduleload', false, false);
    }
  }

  /**
   * Register a template.
   * @param {string} url The relative url to template.
   * @param {function} callback The function to call when the DOM is generated.
   */
  function register(url, callback) {
    templates[url] = {
      content: null,
      callback: callback,
    };
  }

  /**
   * Register a template.
   * @param {RegExp} pattern The pattern to register.
   * @param {function|string} repl The replacement correnspondent to the pattern.
   */
  function registerBBCode(pattern, repl) {
    assert(pattern instanceof RegExp, "pattern must be RegExp");
    BBHandler.push({
      pattern: pattern, repl: repl
    });
  }

  return {
    globalInitialization: globalInitialization,
    render_template: render_template,
    register: register,
    registerBBCode: registerBBCode,
    escapeAttr: escapeAttr,
    escapeBBCode: escapeBBCode,
  };

});

document.addEventListener('DOMContentLoaded',
                          cr.ui.template.globalInitialization);
