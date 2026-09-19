const https = require("https");
const querystring = require("querystring");

const PRICES = {
  single: {
    price: "price_1UHD6ZDS4eKsMgCbUIaXEcdy",
    mode: "payment",
    returnPath: "/?paid=single",
    methods: ["card"],
  },
  producer: {
    price: "price_1UHD6aDS4eKsMgCb5L7EmAEE",
    mode: "subscription",
    returnPath: "/?paid=producer",
    methods: ["card"],
  },
};

function stripePost(path, fields) {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) return Promise.reject(new Error("STRIPE_SECRET_KEY is not set"));
  const body = querystring.stringify(fields);
  return new Promise(function (resolve, reject) {
    const req = https.request(
      {
        hostname: "api.stripe.com",
        path: path,
        method: "POST",
        headers: {
          Authorization: "Bearer " + key,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      function (res) {
        const chunks = [];
        res.on("data", function (c) { chunks.push(c); });
        res.on("end", function () {
          const raw = Buffer.concat(chunks).toString("utf8");
          try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function flatten(obj, prefix, out) {
  Object.keys(obj).forEach(function (k) {
    const key = prefix ? prefix + "[" + k + "]" : k;
    const val = obj[k];
    if (val && typeof val === "object" && !Array.isArray(val)) flatten(val, key, out);
    else if (Array.isArray(val)) val.forEach(function (item, i) {
      if (item && typeof item === "object") flatten(item, key + "[" + i + "]", out);
      else out[key + "[" + i + "]"] = item;
    });
    else if (val != null) out[key] = val;
  });
  return out;
}

module.exports = async function stripeBilling(ctx) {
  const { url, method, req, res, send, readBody, userFromCookie } = ctx;
  if (url === "/api/billing-config" && method === "GET") {
    send(res, 200, {
      embedded: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    });
    return true;
  }
  if (url === "/api/checkout" && method === "POST") {
    const b = await readBody(req);
    const plan = PRICES[(b.plan || "single").toLowerCase()] || PRICES.single;
    const u = userFromCookie(req);
    const origin = (req.headers.origin && /^https?:\/\//.test(req.headers.origin))
      ? req.headers.origin.replace(/\/$/, "")
      : "https://herd-yard.com";
    try {
      const payload = {
        ui_mode: "embedded",
        mode: plan.mode,
        line_items: [{ price: plan.price, quantity: 1 }],
        return_url: origin + plan.returnPath,
        redirect_on_completion: "if_required",
        payment_method_types: plan.methods,
        metadata: { plan: b.plan || "single", site: "herd-yard", userId: u ? String(u.id) : "" },
      };
      const fields = flatten(payload, "", {});
      if (u && u.email) fields.customer_email = u.email;
      const session = await stripePost("/v1/checkout/sessions", fields);
      if (session.error) return send(res, 400, { error: session.error.message }), true;
      send(res, 200, { clientSecret: session.client_secret, id: session.id });
    } catch (e) {
      send(res, 500, { error: e.message || "Stripe error" });
    }
    return true;
  }
  return false;
};
