/* World in Numbers — bootstrap: render the current hash route and re-render
   on hash changes. All pages are rendered by app/views.js from app/data.js. */
(function () {
  'use strict';
  function start() {
    window.WINViews.render();
    window.addEventListener('hashchange', function () { window.WINViews.render(); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
