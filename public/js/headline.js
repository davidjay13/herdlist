(function () {
  function apply() {
    var nodes = document.querySelectorAll(".hero h1, h1");
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || "").trim();
      if (t === "The Zillow of Cattle" || t === "The Zillow For Cattle" || (nodes[i].closest && nodes[i].closest(".hero"))) {
        if (nodes[i].closest(".hero")) nodes[i].textContent = "Zillow For Cattle";
      }
    }
  }
  apply();
  var app = document.getElementById("app");
  if (app && window.MutationObserver) {
    new MutationObserver(apply).observe(app, { childList: true, subtree: true });
  }
  window.addEventListener("hashchange", function () { setTimeout(apply, 10); setTimeout(apply, 120); });
  setTimeout(apply, 20);
  setTimeout(apply, 200);
  setTimeout(apply, 800);
})();
