const SITE = "https://herd-yard.com";
const FROM = process.env.MAIL_FROM || "Herd Yard <hello@herd-yard.com>";
const NOTIFY = process.env.MAIL_NOTIFY || "david@davidjay.com";

let store = null;
function attach(db) {
  store = db;
  if (store && store.data && !Array.isArray(store.data.mailLog)) store.data.mailLog = [];
}

function record(entry) {
  try {
    if (!store || !store.data) return;
    if (!Array.isArray(store.data.mailLog)) store.data.mailLog = [];
    store.data.mailLog.unshift(entry);
    if (store.data.mailLog.length > 3000) store.data.mailLog.length = 3000;
    if (typeof store.save === "function") store.save().catch(function () {});
  } catch (e) {}
}

function postmarkToken() {
  return process.env.POSTMARK_SERVER_TOKEN || process.env.POSTMARK_API_TOKEN || process.env.POSTMARK_API_KEY || "";
}

function configured() {
  return !!(postmarkToken() || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}

function usable(email) {
  const s = String(email || "").trim().toLowerCase();
  if (!s || s.indexOf("@") < 1) return false;
  if (s.indexOf("@herd-yard.local") >= 0) return false;
  if (s.indexOf("@example.com") >= 0) return false;
  return true;
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;");
}

function wrap(preheader, heading, bodyHtml, ctaLabel, ctaHref) {
  const btn = ctaLabel
    ? '<p style="margin:28px 0 8px"><a href="' + ctaHref + '" style="display:inline-block;background:#1b6b45;color:#fffcf7;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-family:Arial,sans-serif">' + esc(ctaLabel) + "</a></p>"
    : "";
  return (
    '<!doctype html><html><body style="margin:0;padding:0;background:#f4f1ea">' +
    '<div style="display:none;max-height:0;overflow:hidden">' + esc(preheader) + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffcf7;border:1px solid #d8e0d6;border-radius:16px;overflow:hidden">' +
    '<tr><td style="background:#0f3f28;padding:18px 24px;color:#c4a35a;font-family:Arial,sans-serif;letter-spacing:.12em;font-size:12px;font-weight:700">HERD YARD</td></tr>' +
    '<tr><td style="padding:28px 24px 8px;font-family:Georgia,serif;font-size:26px;color:#142018">' + esc(heading) + "</td></tr>" +
    '<tr><td style="padding:0 24px 32px;font-family:Arial,sans-serif;font-size:16px;line-height:1.55;color:#3a4a3e">' +
    bodyHtml + btn +
    '<p style="margin:28px 0 0;font-size:13px;color:#6b7a6e">Herd Yard — private-treaty cattle, no commission.<br><a href="' + SITE + '" style="color:#1b6b45">herd-yard.com</a></p>' +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

async function sendViaPostmark(payload) {
  const body = {
    From: FROM,
    To: payload.to,
    Subject: payload.subject,
    HtmlBody: payload.html,
    TextBody: payload.text || payload.subject,
    MessageStream: process.env.POSTMARK_STREAM || "outbound"
  };
  if (payload.bcc) body.Bcc = payload.bcc;
  const r = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": postmarkToken()
    },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  if (!r.ok) throw new Error("Postmark " + r.status + " " + t.slice(0, 240));
  try { return JSON.parse(t); } catch (e) { return { ok: true }; }
}

async function sendViaResend(payload) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: FROM,
      to: [payload.to],
      bcc: payload.bcc ? [payload.bcc] : undefined,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error("Resend " + r.status + " " + t.slice(0, 200));
  }
  return r.json();
}

async function sendViaSendgrid(payload) {
  const personalizations = [{ to: [{ email: payload.to }] }];
  if (payload.bcc) personalizations[0].bcc = [{ email: payload.bcc }];
  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.SENDGRID_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: personalizations,
      from: { email: (FROM.match(/<([^>]+)>/) || [0, "hello@herd-yard.com"])[1], name: "Herd Yard" },
      subject: payload.subject,
      content: [
        { type: "text/plain", value: payload.text || payload.subject },
        { type: "text/html", value: payload.html }
      ]
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error("SendGrid " + r.status + " " + t.slice(0, 200));
  }
  return { ok: true };
}

async function send(payload) {
  const to = String((payload && payload.to) || "").trim();
  const subject = String((payload && payload.subject) || "");
  const row = {
    id: "e" + Date.now() + Math.floor(Math.random() * 1000),
    to: to,
    subject: subject,
    at: Date.now(),
    status: "sent",
    error: "",
    messageId: ""
  };
  if (!usable(payload.to)) {
    row.status = "skipped";
    row.error = "invalid address";
    record(row);
    return { skipped: true };
  }
  if (!configured()) {
    console.log("[mail] skipped (no POSTMARK_SERVER_TOKEN):", payload.subject, "→", payload.to);
    row.status = "skipped";
    row.error = "not-configured";
    record(row);
    return { skipped: true, reason: "not-configured" };
  }
  try {
    var result;
    if (postmarkToken()) result = await sendViaPostmark(payload);
    else if (process.env.RESEND_API_KEY) result = await sendViaResend(payload);
    else result = await sendViaSendgrid(payload);
    row.messageId = (result && (result.MessageID || result.id)) || "";
    if (result && result.error) {
      row.status = "error";
      row.error = String(result.error);
    }
    record(row);
    return result;
  } catch (err) {
    console.error("[mail] send failed:", err && err.message);
    row.status = "error";
    row.error = String(err && err.message);
    record(row);
    return { error: String(err && err.message) };
  }
}

function fire(payload) {
  Promise.resolve()
    .then(function () { return send(payload); })
    .catch(function (err) { console.error("[mail]", err && err.message); });
}

function welcome(user) {
  const name = user.name || "there";
  return sendWelcome(user.email, name, true);
}

function sendWelcome(email, name, notifyAdmin) {
  const n = name || "there";
  fire({
    to: email,
    subject: "Welcome to Herd Yard",
    text: "Hi " + n + ", your Herd Yard account is ready. Browse cattle, list a group, and message ranches at " + SITE + "/browse",
    html: wrap(
      "Your Herd Yard account is ready.",
      "Welcome, " + n,
      "<p>Your account is live. You can browse nationwide listings, follow ranches, and publish cattle when you are ready.</p><p>No commission on private treaty.</p>",
      "Open your dashboard",
      SITE + "/account"
    )
  });
  if (notifyAdmin && usable(NOTIFY) && String(email).toLowerCase() !== NOTIFY.toLowerCase()) {
    fire({
      to: NOTIFY,
      subject: "New Herd Yard account: " + n,
      text: n + " <" + email + "> just signed up.",
      html: wrap(
        "New signup",
        "New account",
        "<p><b>" + esc(n) + "</b><br>" + esc(email) + "</p>",
        "Open admin",
        SITE + "/account"
      )
    });
  }
}

function sampleWelcome(email, name) {
  return send({
    to: email,
    subject: "Welcome to Herd Yard",
    text: "Hi " + (name || "there") + ", your Herd Yard account is ready. Browse cattle, list a group, and message ranches at " + SITE + "/browse",
    html: wrap(
      "Your Herd Yard account is ready.",
      "Welcome, " + (name || "there"),
      "<p>Your account is live. You can browse nationwide listings, follow ranches, and publish cattle when you are ready.</p><p>No commission on private treaty.</p>",
      "Open your dashboard",
      SITE + "/account"
    )
  });
}

function listingLive(user, listing) {
  fire({
    to: user.email,
    subject: "Your listing is live: " + (listing.title || "Cattle"),
    text: "Your listing \"" + (listing.title || "Cattle") + "\" is up on Herd Yard. " + SITE + "/listing/" + listing.id,
    html: wrap(
      "Your cattle listing is live.",
      "Listing published",
      "<p><b>" + esc(listing.title || "Cattle") + "</b> is now on Herd Yard.</p><p>" + esc([listing.breed, listing.klass, listing.location].filter(Boolean).join(" · ")) + "</p>",
      "View listing",
      SITE + "/listing/" + listing.id
    )
  });
}

function newMessage(toUser, fromName, listingTitle, body, listingId) {
  if (!toUser || !toUser.email) return;
  const preview = String(body || "").replace(/\s+/g, " ").trim().slice(0, 220);
  fire({
    to: toUser.email,
    subject: (fromName || "Someone") + " messaged you on Herd Yard",
    text: (fromName || "A buyer") + " wrote about " + (listingTitle || "a listing") + ": " + preview + "\n\n" + SITE + "/account/messages",
    html: wrap(
      "New message on Herd Yard",
      "New message",
      "<p><b>" + esc(fromName || "A member") + "</b> wrote about <b>" + esc(listingTitle || "a listing") + "</b>:</p>" +
        '<blockquote style="margin:12px 0;padding:12px 14px;background:#eef4ef;border-radius:10px;color:#142018">' + esc(preview) + "</blockquote>",
      "Open messages",
      SITE + "/account/messages"
    )
  });
}

function followed(owner, followerName, ranchName) {
  if (!owner) return;
  fire({
    to: owner.email,
    subject: (followerName || "Someone") + " followed " + (ranchName || "your ranch"),
    text: (followerName || "A member") + " followed " + (ranchName || "your ranch") + " on Herd Yard.",
    html: wrap(
      "New follower",
      "New follower",
      "<p><b>" + esc(followerName || "A member") + "</b> started following <b>" + esc(ranchName || "your ranch") + "</b> on Herd Yard.</p>",
      "Open dashboard",
      SITE + "/account"
    )
  });
}

function weeklyStats(user, stats, highlights) {
  stats = stats || {};
  highlights = highlights || [];
  const name = stats.name || user.name || "there";
  const rows = [
    ["Listing views this week", String(stats.weekViews || 0)],
    ["Messages received", String(stats.messages || 0)],
    ["New listings", String(stats.newListings || 0)],
    ["New followers", String(stats.newFollowers || 0)],
    ["Live listings", String(stats.liveCount || 0)]
  ];
  const table = rows.map(function (r) {
    return '<tr><td style="padding:8px 0;border-bottom:1px solid #e6eee8;color:#3a4a3e">' + esc(r[0]) + '</td>' +
      '<td style="padding:8px 0;border-bottom:1px solid #e6eee8;text-align:right;font-family:Georgia,serif;font-size:20px;color:#142018">' + esc(r[1]) + "</td></tr>";
  }).join("");
  const top = stats.topTitle
    ? "<p style='margin:16px 0 0'>Most viewed: <b>" + esc(stats.topTitle) + "</b> (" + esc(String(stats.topViews || 0)) + " views).</p>"
    : "";
  const feats = highlights.slice(0, 3).map(function (h) {
    return "<p style='margin:12px 0 0'><b>" + esc(h.title) + "</b><br>" + esc(h.body) + "</p>";
  }).join("");
  return send({
    to: user.email,
    subject: "Your Herd Yard week, " + name,
    text: "This week on Herd Yard: " + (stats.weekViews || 0) + " listing views, " + (stats.messages || 0) + " messages, " + (stats.newListings || 0) + " new listings. " + SITE + "/account",
    html: wrap(
      "Your weekly ranch recap is in.",
      "Your week on Herd Yard",
      "<p>Hi " + esc(name) + ", here is how <b>" + esc(stats.ranch || "your ranch") + "</b> did this week.</p>" +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">' + table + "</table>" +
        top +
        "<p style='margin:28px 0 0;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#6b7a6e;font-weight:700'>Herd Yard highlights</p>" +
        feats,
      "Open dashboard",
      SITE + "/account"
    )
  });
}

module.exports = { configured, send, fire, welcome, sampleWelcome, listingLive, newMessage, followed, weeklyStats, usable, attach };
