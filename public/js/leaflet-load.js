(function (w) {
  var cbs = [];
  var started = false;
  w.loadLeaflet = function (cb) {
    if (w.L) {
      cb();
      return;
    }
    cbs.push(cb);
    if (started) return;
    started = true;
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = function () {
      var fns = cbs.splice(0);
      fns.forEach(function (fn) {
        try { fn(); } catch (e) {}
      });
    };
    document.head.appendChild(s);
  };
})(window);
