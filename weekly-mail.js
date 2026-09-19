const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const HIGHLIGHTS = [
  { title: "Message the ranch", body: "Buyers can write in-app or call and email from the listing." },
  { title: "Map + listings", body: "Browse cattle nationwide with the map on top and ranch cards below." },
  { title: "Your ranch desk", body: "Dashboard tiles for messages, local listings, views, and industry news." }
];

function pacificParts(d) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = {};
  fmt.formatToParts(d || new Date()).forEach(function (p) { parts[p.type] = p.value; });
  return parts;
}

function weekKey(d) {
  const p = pacificParts(d);
  const dt = new Date(Number(p.year), Number(p.month) - 1, Number(p.day));
  const day = dt.getDay();
  const monday = new Date(dt);
  monday.setDate(dt.getDate() - ((day + 6) % 7));
  return monday.getFullYear() + "-" + String(monday.getMonth() + 1).padStart(2, "0") + "-" + String(monday.getDate()).padStart(2, "0");
}

function shouldSendMonday() {
  const p = pacificParts(new Date());
  if (p.weekday !== "Mon") return false;
  const hour = Number(p.hour);
  return hour >= 8;
}

function listingViews(db, userId) {
  return (db.data.listings || []).filter(function (l) { return l.userId === userId; })
    .reduce(function (n, l) { return n + Number(l.views || 0); }, 0);
}

function snapshot(db, user) {
  const producer = (db.data.producers || []).find(function (p) { return p.userId === user.id; });
  return {
    at: Date.now(),
    views: listingViews(db, user.id),
    listings: (db.data.listings || []).filter(function (l) { return l.userId === user.id; }).length,
    followers: (producer && producer.followers) || 0
  };
}

function statsFor(db, user) {
  const producer = (db.data.producers || []).find(function (p) { return p.userId === user.id; }) || null;
  const mine = (db.data.listings || []).filter(function (l) { return l.userId === user.id; });
  const live = mine.filter(function (l) { return l.status !== "sold" && !l.hidden; });
  const totalViews = mine.reduce(function (n, l) { return n + Number(l.views || 0); }, 0);
  const snap = user.statsSnap || {};
  const weekViews = Math.max(0, totalViews - Number(snap.views || 0));
  const newListings = mine.filter(function (l) {
    const t = Date.parse(l.listedAt || "") || 0;
    return t && Date.now() - t < WEEK_MS;
  }).length;
  const msgsIn = (db.data.messages || []).filter(function (m) {
    if (!m.at || Date.now() - Number(m.at) > WEEK_MS) return false;
    if (m.fromUser === user.id) return false;
    if (m.toUser === user.id) return true;
    if (producer && m.toProducer === producer.id) return true;
    return false;
  }).length;
  const newFollowers = (db.data.follows || []).filter(function (f) {
    if (!producer || f.producerId !== producer.id) return false;
    return f.at && Date.now() - Number(f.at) < WEEK_MS;
  }).length;
  const top = mine.slice().sort(function (a, b) { return Number(b.views || 0) - Number(a.views || 0); })[0];
  return {
    name: user.name || "there",
    ranch: (producer && producer.name) || user.name || "Your ranch",
    liveCount: live.length,
    totalListings: mine.length,
    weekViews: weekViews,
    totalViews: totalViews,
    newListings: newListings,
    messages: msgsIn,
    newFollowers: newFollowers,
    followers: (producer && producer.followers) || 0,
    topTitle: top ? top.title : "",
    topViews: top ? Number(top.views || 0) : 0
  };
}

async function run(db, mail, opts) {
  opts = opts || {};
  const key = weekKey(new Date());
  if (!opts.force && db.data.lastWeeklyStatsWeek === key) {
    return { skipped: true, reason: "already-sent", week: key, sent: 0 };
  }
  const users = (db.data.users || []).filter(function (u) {
    return u && u.emailWeeklyStats && mail.usable(u.email);
  });
  let sent = 0;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const stats = statsFor(db, u);
    const r = await mail.weeklyStats(u, stats, HIGHLIGHTS);
    u.statsSnap = snapshot(db, u);
    if (!r || (!r.error && !r.skipped)) sent += 1;
    await new Promise(function (ok) { setTimeout(ok, 120); });
  }
  db.data.lastWeeklyStatsWeek = key;
  await db.save();
  return { week: key, sent: sent, opted: users.length };
}

module.exports = { run, shouldSendMonday, weekKey, snapshot, statsFor, HIGHLIGHTS };
