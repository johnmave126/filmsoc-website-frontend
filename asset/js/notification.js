/**
 * @fileoverview Provide notification utility.
 */

cr.define('cr.ui', function() {
  var notificationTimeout = null;
  function showNotification(text, actionText, opt_delay) {
    var notificationElement = $('notification');
    var actionLink = notificationElement.querySelector('.link-color');
    var delay = opt_delay || 5000;

    function show() {
      window.clearTimeout(notificationTimeout);
      notificationElement.classList.add('show');
      document.body.classList.add('notification-shown');
    }

    function hide() {
      window.clearTimeout(notificationTimeout);
      notificationElement.classList.remove('show');
      document.body.classList.remove('notification-shown');
      // Prevent tabbing to the hidden link.
      actionLink.tabIndex = -1;
      // Setting tabIndex to -1 only prevents future tabbing to it. If,
      // however, the user switches window or a tab and then moves back to
      // this tab the element may gain focus. We therefore make sure that we
      // blur the element so that the element focus is not restored when
      // coming back to this window.
      actionLink.blur();
    }

    function delayedHide() {
      notificationTimeout = window.setTimeout(hide, delay);
    }

    notificationElement.firstElementChild.textContent = text;
    actionLink.textContent = actionText;

    actionLink.onclick = hide;
    actionLink.onkeydown = function(e) {
      if (e.keyIdentifier == 'Enter') {
        hide();
      }
    };
    notificationElement.onmouseover = show;
    notificationElement.onmouseout = delayedHide;
    actionLink.onfocus = show;
    actionLink.onblur = delayedHide;
    // Enable tabbing to the link now that it is shown.
    actionLink.tabIndex = 0;

    show();
    delayedHide();
  }

  return  {
    showNotification: showNotification,
  };
});
