(function () {
  var PLANS = {
    single: {
      name: "Single listing",
      price: "$45",
      note: "One group \u00b7 60 days",
      link: "https://buy.stripe.com/9B64gzaNL7qPgco1RL8so01"
    },
    producer: {
      name: "Producer",
      price: "$432 / year",
      note: "Unlimited listings \u00b7 public ranch profile",
      link: "https://buy.stripe.com/14A3cvcVT3azgcobsl8so02"
    }
  };
  var checkoutObj = null;
  var startedFor = "";
  var busy = false;

  function planKey() {
    var q = new URLSearchParams((location.hash.split("?")[1] || ""));
    var p = (q.get("plan") || "single").toLowerCase();
    return PLANS[p] ? p : "single";
  }

  function path() {
    return (location.hash || "#/").replace(/^#\/?/, "").split("?")[0];
  }

  function destroyCheckout() {
    if (checkoutObj && typeof checkoutObj.destroy === "function") {
      try { checkoutObj.destroy(); } catch (e) {}
    }
    checkoutObj = null;
    startedFor = "";
  }

  async function render() {
    if (path() !== "checkout") {
      destroyCheckout();
      return;
    }
    var key = planKey();
    if (busy) return;
    if (checkoutObj && startedFor === key && document.getElementById("stripe-box")) return;
    busy = true;
    destroyCheckout();
    var plan = PLANS[key];
    var app = document.getElementById("app");
    if (!app) { busy = false; return; }
    app.innerHTML = `<div class="form-page" id="hy-checkout-page" style="max-width:720px">
      <h2 class="page-title">Checkout</h2>
      <p class="sub">${plan.name} \u2014 ${plan.price}. ${plan.note}</p>
      <div id="stripe-box" class="panel" style="margin-top:18px;min-height:220px">Loading checkout\u2026</div>
      <p class="sub" style="margin-top:12px"><a href="#/pricing">Back to plans</a></p>
    </div>`;
    var box = document.getElementById("stripe-box");
    try {
      var cfg = await fetch("/api/billing-config", { credentials: "include" }).then(function (r) { return r.json(); });
      if (path() !== "checkout") { busy = false; return; }
      if (!cfg || !cfg.embedded || !cfg.publishableKey) {
        box.innerHTML = `<p>Secure checkout is ready via Stripe.</p>
          <a class="btn btn-primary" href="${plan.link}">Continue to checkout</a>`;
        busy = false;
        return;
      }
      var session = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: key })
      }).then(function (r) { return r.json(); });
      if (path() !== "checkout") { busy = false; return; }
      if (!session.clientSecret) {
        box.innerHTML = `<p>${session.error || "Could not start checkout."}</p>
          <a class="btn btn-primary" href="${plan.link}">Continue to checkout</a>`;
        busy = false;
        return;
      }
      if (!window.Stripe) {
        await new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.src = "https://js.stripe.com/v3/";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (path() !== "checkout") { busy = false; return; }
      var stripe = window.Stripe(cfg.publishableKey);
      checkoutObj = await stripe.initEmbeddedCheckout({ clientSecret: session.clientSecret });
      startedFor = key;
      var mount = document.getElementById("stripe-box");
      if (!mount) {
        destroyCheckout();
        busy = false;
        return;
      }
      mount.innerHTML = "";
      checkoutObj.mount("#stripe-box");
    } catch (e) {
      var msg = (e && e.message) || "Checkout could not load.";
      if (/multiple Embedded Checkout/i.test(msg)) {
        destroyCheckout();
      }
      var el = document.getElementById("stripe-box");
      if (el) {
        el.innerHTML = `<p>${msg}</p>
          <a class="btn btn-primary" href="${plan.link}">Continue to checkout</a>`;
      }
    }
    busy = false;
  }

  function wirePlans() {
    document.querySelectorAll(".plan a.btn").forEach(function (a) {
      var t = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (t === "List now") {
        a.href = "#/checkout?plan=single";
        a.removeAttribute("target");
      }
      if (t === "Become a producer") {
        a.href = "#/checkout?plan=producer";
        a.removeAttribute("target");
      }
    });
  }

  window.addEventListener("hashchange", function () {
    setTimeout(render, 80);
    setTimeout(wirePlans, 40);
  });
  var app = document.getElementById("app");
  if (app && window.MutationObserver) {
    new MutationObserver(function () {
      wirePlans();
      if (path() !== "checkout") return;
      if (document.getElementById("hy-checkout-page")) return;
      if (busy || checkoutObj) return;
      render();
    }).observe(app, { childList: true });
  }
  setTimeout(render, 80);
  setTimeout(wirePlans, 40);
})();
