(function mountSpocketAssistant() {
  var attempts = 0;
  var maxAttempts = 200;

  function mountWhenReady() {
    var mount = document.getElementById('spocket-root');
    if (!mount || mount.dataset.spocketMounted === 'true') return;

    if (window.SpocketApp && window.React && window.ReactDOM && typeof window.ReactDOM.createRoot === 'function') {
      var root = window.ReactDOM.createRoot(mount);
      root.render(window.React.createElement(window.SpocketApp));
      mount.dataset.spocketMounted = 'true';
      mount.dataset.spocketStatus = 'ready';
      window.dispatchEvent(new CustomEvent('spocket-ready'));
      return;
    }

    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(mountWhenReady, 50);
      return;
    }

    mount.dataset.spocketStatus = 'error';
    console.error('[Spocket] The assistant component did not become ready.');
  }

  mountWhenReady();
})();
