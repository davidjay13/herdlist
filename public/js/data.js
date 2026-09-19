/* RangeList demo data — fictional ranches inspired by real marketplace patterns */
window.RL = window.RL || {};

RL.PRODUCERS = [
  {
    id: "p1",
    slug: "sutter-ridge-cattle",
    name: "Sutter Ridge Cattle",
    owner: "Maya Delgado",
    location: "Auburn, CA",
    state: "CA",
    lat: 38.8966,
    lng: -121.0770,
    rating: 5.0,
    reviews: 12,
    sold: 86,
    followers: 214,
    founded: 1998,
    about:
      "Fourth-generation foothill ranch running Angus and Red Angus pairs on irrigated pasture above the American River. We sell private treaty off the farm — no sale barn, no sick pen.",
    associations: ["California Cattlemen's Association", "Red Angus Association"],
    cover:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80",
    avatar:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p2",
    slug: "high-plains-angus",
    name: "High Plains Angus",
    owner: "Cole Brennan",
    location: "Linton, ND",
    state: "ND",
    lat: 46.2666,
    lng: -100.2329,
    rating: 4.9,
    reviews: 31,
    sold: 420,
    followers: 508,
    founded: 2004,
    about:
      "Commercial Angus operation focused on early-bred heifers and cow-calf pairs. Quiet cattle, documented vaccinations, and pot-load ready groups.",
    associations: ["American Angus Association"],
    cover:
      "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?auto=format&fit=crop&w=1600&q=80",
    avatar:
      "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p3",
    slug: "oak-hollow-wagyu",
    name: "Oak Hollow Wagyu",
    owner: "Kenji & Lauren Mori",
    location: "Ivanhoe, TX",
    state: "TX",
    lat: 33.4371,
    lng: -96.1389,
    rating: 5.0,
    reviews: 9,
    sold: 44,
    followers: 176,
    founded: 2013,
    about:
      "Fullblood and F1 Wagyu genetics. Semen, embryos, and seedstock bulls from Tajima and Kedaka lines. Recessive-free herd.",
    associations: ["American Wagyu Association"],
    cover:
      "https://images.unsplash.com/photo-1570042223119-0d2d2d6c1384?auto=format&fit=crop&w=1600&q=80",
    avatar:
      "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p4",
    slug: "rio-verde-ranch",
    name: "Rio Verde Ranch",
    owner: "Elena Vasquez",
    location: "Marfa, TX",
    state: "TX",
    lat: 30.3072,
    lng: -104.0245,
    rating: 4.8,
    reviews: 7,
    sold: 63,
    followers: 98,
    founded: 2009,
    about:
      "Drought-hardy Brangus and Beefmaster pairs raised on open range. We ship from West Texas and welcome ranch visits.",
    associations: ["International Brangus Breeders"],
    cover:
      "https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=1600&q=80",
    avatar:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p5",
    slug: "blue-stem-herefords",
    name: "Blue Stem Herefords",
    owner: "Hank Schroer",
    location: "Nelson, NE",
    state: "NE",
    lat: 40.2017,
    lng: -98.0678,
    rating: 4.9,
    reviews: 18,
    sold: 155,
    followers: 241,
    founded: 1976,
    about:
      "Horned and polled Hereford bulls selected for calving ease, pigment, and forage conversion on native Nebraska grass.",
    associations: ["American Hereford Association"],
    cover:
      "https://images.unsplash.com/photo-1596733439284-f58b3c1d9858?auto=format&fit=crop&w=1600&q=80",
    avatar:
      "https://images.unsplash.com/photo-1477764250597-dffe9f113bdc?auto=format&fit=crop&w=400&q=80",
  },
];

RL.LISTINGS = [
  {
    id: "l1",
    producerId: "p1",
    title: "Bred Angus pairs — Sierra foothills",
    breed: "Angus",
    klass: "Cow-Calf Pair",
    category: "Cattle",
    head: 42,
    unit: "Head",
    price: 4850,
    priceType: "per_head",
    daysLeft: 47,
    listedAt: "2026-08-12",
    location: "Auburn, CA",
    lat: 38.8966,
    lng: -121.0770,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "42 black Angus cow-calf pairs. Cows 4–7 years, moderate frame, good feet. Calves born Feb–April 2026, all tagged and current on 7-way and pour-on. Running on irrigated pasture. Delivery within 150 miles of Auburn included for 20+ pair loads.",
    details: {
      Age: "Cows 4–7 yrs",
      "Calf crop": "Feb–Apr 2026",
      Vaccinations: "7-way, IBR, pour-on",
      Delivery: "150 miles included",
      Papers: "Bill of sale",
    },
  },
  {
    id: "l2",
    producerId: "p2",
    title: "Early-bred Angus heifers",
    breed: "Angus",
    klass: "Bred - Early",
    category: "Cattle",
    head: 90,
    unit: "Head",
    price: 4065,
    priceType: "per_head",
    daysLeft: 22,
    listedAt: "2026-08-28",
    location: "Linton, ND",
    lat: 46.2666,
    lng: -100.2329,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560493676-04071c5f750f?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "90 home-raised Angus heifers, AI-bred to calving-ease sires. Ultrasound confirmed 45–90 days. Weaned last fall, bunk broke, and ready to ship as a pot load. Health papers current.",
    details: {
      Breeding: "AI, calving-ease",
      "Preg check": "Ultrasound confirmed",
      Frame: "Moderate",
      Load: "Pot-load ready",
    },
  },
  {
    id: "l3",
    producerId: "p3",
    title: "Akaushi semen — Ivanhoe line",
    breed: "Akaushi",
    klass: "Semen",
    category: "Genetics",
    head: 25,
    unit: "Units",
    price: null,
    priceType: "contact",
    daysLeft: 39,
    listedAt: "2026-08-01",
    location: "Ivanhoe, TX",
    lat: 33.4371,
    lng: -96.1389,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1570042223119-0d2d2d6c1384?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1570042223119-0d2d2d6c1384?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "Conventionally frozen Akaushi semen from a proven Ivanhoe-line sire. Recessive-free. Ships overnight in nitrogen. Volume pricing available for 10+ units.",
    details: {
      Type: "Conventional semen",
      Line: "Ivanhoe / Tajima",
      Shipping: "Overnight LN2",
      Testing: "Recessive-free",
    },
  },
  {
    id: "l4",
    producerId: "p2",
    title: "Red Angus cow-calf pairs",
    breed: "Red Angus",
    klass: "Cow-Calf Pair",
    category: "Cattle",
    head: 70,
    unit: "Head",
    price: 5300,
    priceType: "per_head",
    daysLeft: 19,
    listedAt: "2026-09-01",
    location: "Napoleon, ND",
    lat: 46.5047,
    lng: -99.7696,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "70 Red Angus pairs. Cows 3–8 years, calves at side averaging 280 lbs. Quiet, fence-broke, and coming off native grass. Can split loads of 35.",
    details: {
      "Calf wt": "~280 lbs",
      Disposition: "Quiet",
      Split: "35-head loads ok",
    },
  },
  {
    id: "l5",
    producerId: "p5",
    title: "Hereford yearling bulls",
    breed: "Hereford",
    klass: "Bull",
    category: "Cattle",
    head: 20,
    unit: "Head",
    price: null,
    priceType: "contact",
    daysLeft: 54,
    listedAt: "2026-07-28",
    location: "Nelson, NE",
    lat: 40.2017,
    lng: -98.0678,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1596733439284-f58b3c1d9858?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1596733439284-f58b3c1d9858?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "20 coming two-year-old Hereford bulls. Fertility tested, vaccinated, and developed on forage with limited grain. EPDs available on request. Private treaty, ranch pickup.",
    details: {
      Age: "Coming twos",
      Fertility: "Passed BSE",
      Feed: "Forage developed",
    },
  },
  {
    id: "l6",
    producerId: "p4",
    title: "Brangus open heifers",
    breed: "Brangus",
    klass: "Heifer",
    category: "Cattle",
    head: 55,
    unit: "Head",
    price: 2180,
    priceType: "per_head",
    daysLeft: 11,
    listedAt: "2026-09-06",
    location: "Marfa, TX",
    lat: 30.3072,
    lng: -104.0245,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "55 open Brangus heifers, 14–16 months. Heat-tolerant and raised without creep. Ideal for a West Texas or New Mexico program. We can help arrange trucking.",
    details: {
      Age: "14–16 months",
      Status: "Open",
      Trucking: "Available",
    },
  },
  {
    id: "l7",
    producerId: "p3",
    title: "Fullblood Wagyu herd sire",
    breed: "Wagyu",
    klass: "Bull",
    category: "Cattle",
    head: 1,
    unit: "Head",
    price: 12500,
    priceType: "per_head",
    daysLeft: 33,
    listedAt: "2026-08-20",
    location: "Ivanhoe, TX",
    lat: 33.4371,
    lng: -96.1389,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "Proven fullblood Wagyu herd sire. Gentle, structurally correct, and used on our F1 program for three seasons. Registration papers and genomic panel included.",
    details: {
      Status: "Fullblood",
      Papers: "Registered + genomic",
      Disposition: "Gentle",
    },
  },
  {
    id: "l8",
    producerId: "p1",
    title: "Black Angus stocker steers",
    breed: "Black Angus",
    klass: "Stocker",
    category: "Cattle",
    head: 120,
    unit: "Head",
    price: 1890,
    priceType: "per_head",
    daysLeft: 8,
    listedAt: "2026-09-10",
    location: "Shingle Springs, CA",
    lat: 38.6657,
    lng: -120.9263,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "120 weaned black Angus steers, 520–560 lbs. Backgrounded 45 days on the ranch west of Shingle Springs. Bunk broke and ready for grass or feedlot.",
    details: {
      Weight: "520–560 lbs",
      Backgrounded: "45 days",
      "Bunk broke": "Yes",
    },
  },
  {
    id: "l9",
    producerId: "p2",
    title: "Mid-bred commercial cows",
    breed: "Angus",
    klass: "Bred - Mid",
    category: "Cattle",
    head: 150,
    unit: "Head",
    price: 3925,
    priceType: "per_head",
    daysLeft: 27,
    listedAt: "2026-08-22",
    location: "Wilton, ND",
    lat: 47.1586,
    lng: -100.7837,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1560493676-04071c5f750f?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1560493676-04071c5f750f?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "150 mid-bred commercial Angus cows, 4–9 years. Bred to calving-ease bulls, due March–April. Can sort by age. Serious buyers only — this group will move as one or two loads.",
    details: {
      Due: "March–April",
      Age: "4–9 years",
      Sort: "By age available",
    },
  },
  {
    id: "l10",
    producerId: "p4",
    title: "Beefmaster pairs — West Texas",
    breed: "Beefmaster",
    klass: "Cow-Calf Pair",
    category: "Cattle",
    head: 38,
    unit: "Head",
    price: 3100,
    priceType: "per_head",
    daysLeft: 41,
    listedAt: "2026-08-05",
    location: "Marfa, TX",
    lat: 30.309,
    lng: -104.03,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80",
    ],
    description:
      "38 Beefmaster pairs adapted to dry country. Calves 2–4 months. These cattle travel and hold condition on sparse forage.",
    details: {
      "Calf age": "2–4 months",
      Country: "Dry-adapted",
    },
  },
];

RL.TESTIMONIALS = [
  {
    quote:
      "I listed a load of pairs on a Tuesday and had three serious calls before Friday. No spam, no tire-kickers — just people who actually buy cattle.",
    name: "Cole Brennan",
    role: "High Plains Angus · North Dakota",
  },
  {
    quote:
      "The map is the whole point. Buyers find us by county instead of scrolling Facebook. It feels like we finally have a storefront that matches how ranchers actually shop.",
    name: "Maya Delgado",
    role: "Sutter Ridge Cattle · California",
  },
  {
    quote:
      "We sell genetics and live cattle. One producer page holds both, and buyers can follow the ranch instead of hunting for our next post.",
    name: "Lauren Mori",
    role: "Oak Hollow Wagyu · Texas",
  },
];

RL.FAQS = [
  {
    q: "What is Herd Yard?",
    a: "Herd Yard is a farm-to-farm marketplace for cattle and livestock genetics. Producers list animals on a map. Buyers search by breed, class, and location, then contact the ranch directly to close a private-treaty sale.",
  },
  {
    q: "Is this an auction?",
    a: "No. There is no bidding clock and no sale barn. You set the price — or list as contact-for-price — and negotiate off the farm.",
  },
  {
    q: "Does Herd Yard take a commission on cattle?",
    a: "Not on private-treaty cattle sales. You pay a listing or membership fee. Optional e-commerce for semen and embryos carries a platform fee when payment runs through the site.",
  },
  {
    q: "How long does a listing stay up?",
    a: "Sixty days. If it hasn't sold, you can extend it at no extra cost until it does.",
  },
  {
    q: "Who can see my phone number?",
    a: "Only signed-in buyers. Guest visitors can browse listings and the map, but contact details stay gated so you are not flooded with junk messages.",
  },
  {
    q: "Can I list just one group of cattle?",
    a: "Yes. Single Listing is $45. If you sell throughout the year, Producer membership is $432 and includes unlimited listings plus a public ranch profile.",
  },
];

RL.STATS = {
  head: 37664,
  value: 133887444,
  launched: "March 2025",
  breeds: [
    ["Angus", 31005],
    ["Black Angus", 1643],
    ["Red Angus", 1056],
  ],
  classes: [
    ["Bred - Early", 14158],
    ["Bred - Mid", 8592],
    ["Cow-Calf Pair", 3258],
  ],
};

RL.BREEDS = [
  "Angus",
  "Black Angus",
  "Red Angus",
  "Hereford",
  "Wagyu",
  "Akaushi",
  "Brangus",
  "Beefmaster",
];
RL.CLASSES = [
  "Cow-Calf Pair",
  "Bred - Early",
  "Bred - Mid",
  "Heifer",
  "Bull",
  "Stocker",
  "Semen",
  "Embryo",
];
RL.CATEGORIES = ["Cattle", "Genetics"];
