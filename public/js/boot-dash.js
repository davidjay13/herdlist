(function () {
  function keep() {
    var hash = location.hash || "";
    if (hash.indexOf("#/account") !== 0) return;
    if (document.querySelector(".dash-shell")) return;
    window.dispatchEvent(new Event("hashchange"));
  }
  setInterval(keep, 400);
})();
