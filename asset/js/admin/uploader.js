/**
 * @fileoverview Handle drag and drop upload.
 */

cr.define('cr.uploader', function() {
  'use strict';

  /**
  * Init a container
  * @param{HTMLElement} container The container to drop
  * @param{Function} ondrop The function to call before upload
  * @param{Function} calllback The function to call after success upload
  */
  function init(container, ondrop, callback) {
    var track = container.querySelector('.progressbar-track'),
        progressbar = container.querySelector('.progressbar-bar'),
        progresstext = container.querySelector('.progressbar-progress'),
        dropper = container.querySelector('.drag-notifier'),
        wrapper = new cr.ui.DragWrapper(container, {
      doDragEnter: function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        dropper.removeAttribute('hidden');
      },
      doDragOver: function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        dropper.removeAttribute('hidden');
      },
      doDrop: function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        dropper.setAttribute('hidden', 'true');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          var r = new cr.APIRequest(cr.model.File, 'POST', '/'),
              form = new FormData;
          form.append('file', e.dataTransfer.files[0]);
          progressbar.style.width = "0%";
          progresstext.textContent = "0%";
          track.removeAttribute('hidden');
          progresstext.removeAttribute('hidden');
          r.onuploadprogress = function(e) {
            var complete = (e.loaded / e.total * 80 | 0) + '%';
            progressbar.style.width = complete;
            progresstext.textContent = complete;
          };
          r.onloadprogress = function(e) {
            if (e.lengthComputable) {
              var complete = (80 + (e.loaded / e.total * 20 | 0)) + '%';
              progressbar.style.width = complete;
              progresstext.textContent = complete;
            }
          };
          r.onload = function(e) {
            progressbar.style.width = "100%";
            progresstext.textContent = 'Upload Complete';
            if (callback) {
              callback(e.recObj);
            }
          };
          r.onerror = cr.errorHandler;
          if (ondrop) {
            ondrop();
          }
          r.sendRaw(form);
        }
      },
      doDragLeave: function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        dropper.setAttribute('hidden', 'true');
      },
      shouldAcceptDrag: function(e) {
        return true;
      }
    });
  }
  return {
    init: init,
  }
});