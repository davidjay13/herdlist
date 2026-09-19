(function () {
  var REPORT = [
    {
      id: "B1",
      title: "Message the ranch sent a dummy note",
      status: "fixed",
      where: "Listing page",
      detail: "Clicking Message the ranch immediately posted “Interested.” and toasted Message saved, then also opened the real compose box. Opening the box no longer sends anything. You write the note, then Send."
    },
    {
      id: "B2",
      title: "Unknown pages bounced to Home",
      status: "fixed",
      where: "Routing",
      detail: "Any hash the main router did not own fell through to the homepage. That made Updates flash home if another script was slow, and /bugs would never stick. Delegated routes (account, producers, ranch, updates, bugs) now hold still, and unknown links show a not-found page instead of Home."
    },
    {
      id: "B3",
      title: "Associations on Profile never saved",
      status: "fixed",
      where: "Profile",
      detail: "The Associations field was on the form but the save endpoint ignored it. It now stores the comma-separated list on the ranch profile."
    },
    {
      id: "B4",
      title: "Changing email on Profile did not change login",
      status: "fixed",
      where: "Profile",
      detail: "The email field only updated a ranch contact copy, not the account you sign in with. Saving a free address now updates the login email."
    },
    {
      id: "B5",
      title: "New accounts used the bull logo as the avatar",
      status: "fixed",
      where: "Signup",
      detail: "A brand-new ranch showed the Herd Yard bull instead of the gray cowboy silhouette. New accounts now start on the cowboy until a photo is uploaded."
    },
    {
      id: "B6",
      title: "Days left was frozen at publish time",
      status: "fixed",
      where: "Browse and listing cards",
      detail: "daysLeft was a static number from the day the listing was created, so a 60-day listing still said 60d left a month later. Remaining days now count down from listed date. Expired groups say listed instead of 0d left."
    },
    {
      id: "B7",
      title: "Sold and hidden cattle still showed on ranch pages",
      status: "fixed",
      where: "Public ranch profile",
      detail: "The ranch API returned every listing for that producer, including sold and hidden. Public ranch pages now only show live groups."
    },
    {
      id: "B8",
      title: "Ranch phone and email leaked on public APIs",
      status: "fixed",
      where: "Listings and producers JSON",
      detail: "Browse and producer list payloads included phone and email for every ranch. Guests no longer get those fields. Signed-in buyers still see them when they open a listing and Message the ranch."
    },
    {
      id: "B9",
      title: "Publishing a listing could crash with no ranch row",
      status: "fixed",
      where: "List cattle",
      detail: "If an account had no producer record, publish read producer.id and threw. List cattle now creates the ranch row first."
    },
    {
      id: "B10",
      title: "Listing titles rendered unsanitized HTML",
      status: "fixed",
      where: "Listing page",
      detail: "Title, description, and ranch name were dropped into innerHTML without escaping. They are escaped now so a listing cannot inject markup."
    }
  ];

  function page() {
    var hash = (location.hash || "#/").replace(/^#/, "");
    var path = hash.split("?")[0].replace(/^\//, "");
    if (path !== "bugs") return false;
    var app = document.getElementById("app");
    if (!app) return true;
    if (window.HerdSeo) window.HerdSeo.apply("bugs");
    var n = REPORT.length;
    var rows = REPORT.map(function (b) {
      return '<article class="panel" style="margin-bottom:14px">' +
        '<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap">' +
        '<h3 style="margin:0;font-size:1.05rem">' + b.id + " · " + b.title + "</h3>" +
        '<span style="font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#1b6b45">Squashed</span></div>' +
        '<p class="sub" style="margin:8px 0 0">' + b.where + "</p>" +
        "<p style='margin:10px 0 0'>" + b.detail + "</p></article>";
    }).join("");
    app.innerHTML =
      '<section class="section" style="max-width:760px">' +
      "<h2>Bug squash report</h2>" +
      '<p class="sub">Pass on this Herd Yard build. ' + n + " bugs found and fixed.</p>" +
      '<div style="margin-top:22px">' + rows + "</div></section>";
    return true;
  }

  window.addEventListener("hashchange", function () { setTimeout(page, 30); });
  setTimeout(page, 60);
  setTimeout(page, 400);
})();
