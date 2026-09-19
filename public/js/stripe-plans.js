(function () {
  var SINGLE = "https://buy.stripe.com/9B64gzaNL7qPgco1RL8so01";
  var PRODUCER = "https://buy.stripe.com/14A3cvcVT3azgcobsl8so02";
  function wire() {
    document.querySelectorAll(".plan a.btn").forEach(function (a) {
      var t = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (t === "List now") {
        a.href = SINGLE;
        a.target = "_blank";
        a.rel = "noopener";
      }
      if (t === "Become a producer") {
        a.href = PRODUCER;
        a.target = "_blank";
        a.rel = "noopener";
      }
    });
  }
  var app = document.getElementById("app");
  if (app && window.MutationObserver) {
    new MutationObserver(wire).observe(app, { childList: true, subtree: true });
  }
  window.addEventListener("hashchange", function () { setTimeout(wire, 40); });
  setTimeout(wire, 40);
  setTimeout(wire, 300);
})();
