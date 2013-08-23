/**
 * Utility for rich text editor
 */

cr.define('cr.richText', function() {
  'use strict';

  /**
   * Init the whole part.
   */
  function Initialization() {
    cr.ui.template.register("admin/richtext_toolbar.html", function() {
      var popup_link = this.querySelector('.link-adder'),
          popup_color = this.querySelector('.colorpicker'),
          popup_img = this.querySelector('.image-adder'),
          popup_id = this.querySelector('.id-adder');
      popup_link.querySelector('button[controls="ok"]').addEventListener('click', function() {
        popup_link.ok_cbk();
      });
      popup_link.querySelector('button[controls="cancel"]').addEventListener('click', function() {
        popup_link.cancel_cbk();
      });

      popup_color.querySelector('button[controls="ok"]').addEventListener('click', function() {
        popup_color.ok_cbk();
      });
      popup_color.querySelector('button[controls="cancel"]').addEventListener('click', function() {
        popup_color.cancel_cbk();
      });
      ColorPicker(
        popup_color.querySelector('.colorpicker-wrapper'),
        function(hex) {
          popup_color.querySelector('.sample').style.color = hex;
          popup_color.querySelector('input[name="color"]').value = hex;
        });

      popup_img.querySelector('button[controls="ok"]').addEventListener('click', function() {
        popup_img.ok_cbk();
      });
      popup_img.querySelector('button[controls="cancel"]').addEventListener('click', function() {
        popup_img.cancel_cbk();
      });
      cr.uploader.init(popup_img.querySelector('.cover-drop'), function() {
        popup_img.querySelector('input[name="url"]').value = 'uploading';
      }, function(new_cover) {
        popup_img.querySelector('.cover-container').style.backgroundImage = 'url(' + cr.settings.resource_base + 'upload/' + new_cover.url + ')';
        popup_img.querySelector('input[name="url"]').value = cr.settings.resource_base + 'upload/' + new_cover.url;
      });

      popup_id.querySelector('button[controls="ok"]').addEventListener('click', function() {
        popup_id.ok_cbk();
      });
      popup_id.querySelector('button[controls="cancel"]').addEventListener('click', function() {
        popup_id.cancel_cbk();
      });
    });
  }

  /**
   * Init a rich text editor.
   * @param {HTMLTextareaElement} node The textarea to become rich text editor.
   */
  function init(node) {
    var toolbar = cr.ui.template.render_template("admin/richtext_toolbar.html");
    node.parentNode.insertBefore(toolbar, node);
    //Hooks
    toolbar.querySelector('.bar').addEventListener('click', function(e) {
      var action = e.target.getAttribute('controls');
      if (!action) {
        return;
      }
      switch(action) {
        case 'bold': 
          wrapSelection.call(node, 'b');
          break;
        case 'italics': 
          wrapSelection.call(node, 'i');
          break;
        case 'underline': 
          wrapSelection.call(node, 'u');
          break;
        case 'big': 
        case 'small': 
          wrapSelection.call(node, action);
          break;
        case 'link':
          addLink.call(node, toolbar);
          break;
        case 'color':
          addColor.call(node, toolbar);
          break;
        case 'img':
          addImage.call(node, toolbar);
          break;
        case 'inlinedisk':
        case 'disk':
        case 'rfs':
        case 'ticket':
          addCustomTag.call(node, toolbar, action);
          break;
        case 'preview':
          switchPreview.call(node, toolbar);
          break;
      }
    });

    toolbar.querySelector('.preview').addEventListener('click', function(e) {
      var action = e.target.getAttribute('controls');
      if (!action) {
        return;
      }
      switch(action) {
        case 'edit':
          switchEdit.call(node, toolbar);
          break;
      }
    });
  }

  /**
   * Wrap selection with BBCode.
   * @param {String} tag The BBCode tag to wrap.
   */
  function wrapSelection(tag) {
    if(this.selectionStart != undefined && this.selectionEnd != undefined && this.selectionEnd > this.selectionStart) {
      this.value = this.value.splice(this.selectionEnd, 0, "[/" + tag + "]");
      this.value = this.value.splice(this.selectionStart, 0, "[" + tag + "]");
      this.setSelectionRange(this.selectionStart + ("[" + tag + "]").length, this.selectionEnd + ("[" + tag + "]").length);
      this.focus();
    }
    else {
      alert("Select Text First");
    }
  }

  /**
   * Deal with adding link.
   * @param {HTMLElement} toolbar .
   */
  function addLink(toolbar) {
    var popup = toolbar.querySelector('.link-adder'),
        input = popup.querySelector('input[name="url"]'),
        start = this.selectionStart,
        end = this.selectionEnd;
    input.value = "";
    input.removeAttribute('disabled');
    popup.ok_cbk = (function(popup, input) {
      popup.setAttribute('hidden', true);
      input.setAttribute('disabled', true);
      if(start != undefined && end != undefined && end > start) {
        this.value = this.value.splice(end, 0, "[/link]");
        var startTag = "[link=" + input.value + "]";
        this.value = this.value.splice(start, 0, startTag);
        this.setSelectionRange(start + startTag.length, end + startTag.length);
        this.focus();
      }
    }).bind(this, popup, input);
    popup.cancel_cbk = (function(popup) {
      input.setAttribute('disabled', true);
      popup.setAttribute('hidden', true);
      this.setSelectionRange(start, end);
      this.focus();
    }).bind(this, popup);

    popup.removeAttribute('hidden');
  }

  /**
   * Deal with adding color.
   * @param {HTMLElement} toolbar .
   */
  function addColor(toolbar) {
    var popup = toolbar.querySelector('.colorpicker'),
        input = popup.querySelector('input[name="color"]'),
        start = this.selectionStart,
        end = this.selectionEnd;
    input.value = "";
    popup.ok_cbk = (function(popup, input) {
      popup.setAttribute('hidden', true);
      input.setAttribute('disabled', true);
      if(start != undefined && end != undefined && end > start) {
        this.value = this.value.splice(end, 0, "[/color]");
        var startTag = "[color=" + input.value + "]";
        this.value = this.value.splice(start, 0, startTag);
        this.setSelectionRange(start + startTag.length, end + startTag.length);
        this.focus();
      }
    }).bind(this, popup, input);
    popup.cancel_cbk = (function(popup) {
      input.setAttribute('disabled', true);
      popup.setAttribute('hidden', true);
      this.setSelectionRange(start, end);
      this.focus();
    }).bind(this, popup);

    popup.removeAttribute('hidden');
  }

  /**
   * Deal with adding image.
   * @param {HTMLElement} toolbar .
   */
  function addImage(toolbar) {
    var popup = toolbar.querySelector('.image-adder'),
        input = popup.querySelector('input[name="url"]'),
        start = this.selectionStart,
        end = this.selectionEnd;
    input.value = "";
    popup.querySelector('.cover-container').style.background = "";
    popup.querySelector('.progressbar-track').setAttribute('hidden', true);
    popup.querySelector('.progressbar-progress').setAttribute('hidden', true);
    popup.ok_cbk = (function(popup, input) {
      if (input.value == 'uploading') {
        alert("Still uploading");
        return;
      }
      popup.setAttribute('hidden', true);
      input.setAttribute('disabled', true);
      if(start != undefined && end != undefined && end >= start) {
        this.value = this.value.splice(end, 0, "[/img]");
        var startTag = "[img=" + input.value + "]";
        this.value = this.value.splice(start, 0, startTag);
        this.setSelectionRange(start + startTag.length, end + startTag.length);
        this.focus();
      }
    }).bind(this, popup, input);
    popup.cancel_cbk = (function(popup) {
      input.setAttribute('disabled', true);
      popup.setAttribute('hidden', true);
      this.setSelectionRange(start, end);
      this.focus();
    }).bind(this, popup);

    popup.removeAttribute('hidden');
  }

  /**
   * Deal with adding Disk.
   * @param {HTMLElement} toolbar .
   */
  function addCustomTag(toolbar, custom_tag) {
    var popup = toolbar.querySelector('.id-adder'),
        input = popup.querySelector('input[name="itemid"]'),
        start = this.selectionStart,
        end = this.selectionEnd;
    input.value = "";
    input.removeAttribute('disabled');
    popup.ok_cbk = (function(popup, input) {
      popup.setAttribute('hidden', true);
      input.setAttribute('disabled', true);
      if(start != undefined && end != undefined) {
        var Tag = "[" + custom_tag + "]" + input.value + "[/" + custom_tag + "]";
        this.value = this.value.splice(start, end - start, Tag);
        this.setSelectionRange(start, start + Tag.length);
        this.focus();
      }
    }).bind(this, popup, input);
    popup.cancel_cbk = (function(popup) {
      input.setAttribute('disabled', true);
      popup.setAttribute('hidden', true);
      this.setSelectionRange(start, end);
      this.focus();
    }).bind(this, popup);

    popup.removeAttribute('hidden');
  }

  /**
   * Deal with preview view.
   * @param {HTMLElement} toolbar .
   */
  function switchPreview(toolbar) {
    var bar = toolbar.querySelector('.bar'),
        preview = toolbar.querySelector('.preview .preview-wrapper');
    bar.setAttribute('hidden', true);
    this.setAttribute('hidden', true);
    while(preview.firstChild) {
      preview.removeChild(preview.firstChild);
    }
    preview.innerHTML = cr.ui.template.escapeBBCode(this.value);
    cr.ui.bbcode.handleHTML(preview);
    toolbar.querySelector('.preview').removeAttribute('hidden');
  }

  /**
   * Deal with edit view.
   * @param {HTMLElement} toolbar .
   */
  function switchEdit(toolbar) {
    var bar = toolbar.querySelector('.bar'),
        preview = toolbar.querySelector('.preview .preview-wrapper');
    bar.removeAttribute('hidden');
    this.removeAttribute('hidden');
    toolbar.querySelector('.preview').setAttribute('hidden', true);
  }

  return {
    Initialization: Initialization,
    init: init,
  };
});

cr.richText.Initialization();