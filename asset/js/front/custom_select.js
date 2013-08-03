/**
 * @fileoverview A custom select element.
 */

cr.define('cr.ui.select', function() {
  /**
   * init a select container
   */
	function init(elem) {
    elem.value = "";
    elem.name = elem.getAttribute('name');
    elem.type = 'select';
    elem.querySelector('.custom-options').addEventListener('click', function(e) {
      if (e.target === this) {
        //Use for proxy
        return;
      }
      elem.querySelector('.default').textContent = e.target.textContent;
      elem.value = e.target.getAttribute('value');
      this.setAttribute('hidden', true);
      setTimeout((function() {
        this.removeAttribute('hidden');
      }).bind(this), 0);
    });
	}

  return {
    init: init,
  };
});