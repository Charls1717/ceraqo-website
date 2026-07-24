/**
 * The complete copy deck for the one-page experience.
 *
 * Claims marked "verbatim" are the client's approved datasheet wording
 * carried over from the previous iteration of this site — they are real
 * product statements and must not be paraphrased into stronger claims.
 */

export const HERO = {
  kicker: "CERAQO™ — Advanced Surface Protection",
  headline: ["SURFACE.", "REDEFINED."],
  sub: "Q-ARMOR™ is the next generation beyond wax, sealants and conventional ceramic coatings — a durable, transparent shield with professional-grade results from one simple application.",
  cue: "Scroll",
  cueTarget: "01 / The Science",
};

export const CHAPTERS = [
  { id: "science", index: "01", label: "Science", title: "The Science" },
  { id: "application", index: "02", label: "Application", title: "The Application" },
  { id: "result", index: "03", label: "Result", title: "The Result" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

export const SCIENCE = {
  shield: {
    kicker: "Chapter 01 / The invisible shield",
    headline: ["AN ULTRA-THIN LAYER.", "A LASTING SHIELD."],
    // verbatim first sentence; faithful compression of the approved paragraph
    body: "Q-ARMOR creates an ultra-thin, transparent protective layer that forms a strong chemical bond with compatible surfaces. Unlike waxes or sealants that gradually wash away, the layer stays tightly attached — completely transparent, preserving the original colour while enhancing depth and clarity.",
  },
  pillars: {
    kicker: "Chapter 01 / The technology",
    headline: ["ENGINEERED TO", "REPEL THE WORLD."],
    body: "Two surface behaviours and four resistances, working as one system.",
    items: [
      // titles verbatim from the approved specification list
      { icon: "hydro", title: "Hydrophobic Performance", note: "Water beads and releases effortlessly." },
      { icon: "oleo", title: "Oleophobic Protection", note: "Oils and traffic film struggle to adhere." },
      { icon: "uv", title: "UV Protection", note: "Shields the finish from radiation ageing." },
      { icon: "chem", title: "High Chemical Resistance", note: "Stands up to road salt and contamination." },
      { icon: "corr", title: "Corrosion Resistance", note: "A barrier against oxidation and moisture." },
      { icon: "abr", title: "High Abrasion Resistance", note: "Hard enough for daily mechanical wear." },
    ],
    footnote:
      "A durable barrier against UV exposure, oxidation, corrosion, environmental contamination, road salt, chemical exposure, everyday abrasion and water staining — while preserving the appearance of your vehicle.", // verbatim list
  },
  cta: { lines: ["Explore", "the technology"], target: "science-pillars" },
};

export const APPLICATION = {
  process: {
    kicker: "Chapter 02 / The process",
    headline: ["PROFESSIONAL RESULTS.", "SIMPLE PROCESS."],
    body: "No detailing experience required. Q-ARMOR applies wipe-on, buff-off and cures at ambient temperature — professional-grade protection without professional complexity.",
    steps: [
      { n: "01", title: "Prepare", note: "Start with a clean, dry surface." },
      { n: "02", title: "Apply", note: "Wipe on evenly with the applicator pad." },
      { n: "03", title: "Buff", note: "Level with the microfiber cloth and let it cure." },
    ],
  },
  owners: {
    kicker: "Chapter 02 / Built for everyone",
    headline: ["BUILT FOR EVERY", "VEHICLE OWNER."],
    body: "From a first car to a full fleet — one system protects them all.",
    personas: [
      { icon: "daily", title: "Daily Driver", note: "Commutes, weather, car-park life." },
      { icon: "enthusiast", title: "Enthusiast", note: "Show-deep gloss, weekend after weekend." },
      { icon: "ev", title: "EV Owner", note: "Modern paint, modern protection." },
      { icon: "classic", title: "Classic Collector", note: "Preservation for irreplaceable finishes." },
      { icon: "fleet", title: "Family & Fleet", note: "Less maintenance across every vehicle." },
    ],
  },
  kit: {
    kicker: "In the box",
    headline: ["ONE KIT.", "EVERYTHING INCLUDED."],
    items: [
      { n: "01", label: "Q-ARMOR™ protective coating — 30 ml, n° 001" },
      { n: "02", label: "Premium applicator pad" },
      { n: "03", label: "Premium microfiber cloth" },
    ],
    // verbatim coverage sentence
    coverage: "One kit protects up to two large vehicles, depending on vehicle size and application method.",
  },
  cta: { lines: ["See", "the kit"], target: "application-kit" },
};

export const RESULT = {
  gloss: {
    kicker: "Chapter 03 / The payoff",
    headline: ["A DEEPER GLOSS.", "A HARDER SHIELD."],
    // verbatim "Experience the Difference" lines
    lines: [
      "A deeper gloss.",
      "A smoother finish.",
      "Water beads and releases effortlessly.",
      "Cleaning becomes easier.",
      "The surface stays looking cleaner for longer.",
    ],
    stats: [
      { value: "72", unit: "months", label: "Protection, up to*" }, // verbatim claim
      { value: "9H", unit: "pencil", label: "Hardness, up to" }, // verbatim claim
      { value: "100%", unit: "clarity", label: "Crystal clear finish" }, // verbatim spec
    ],
  },
  maintenance: {
    kicker: "Chapter 03 / Ownership",
    headline: ["LESS CLEANING.", "MORE DRIVING."],
    body: "Advanced surface characteristics reduce the adhesion of water, dirt, oils and everyday contamination — easier washing, faster drying and a cleaner-looking vehicle between washes.",
    coverage: "Up to two large vehicles per kit",
    origin: "Engineered and made in Germany",
  },
  footnote:
    "*Under suitable conditions. Durability depends on surface preparation, application quality, environmental conditions, vehicle usage, washing methods and maintenance routine.", // verbatim dependent factors
  cta: { lines: ["View", "the results"], target: "result-maintenance" },
};

export const MENU = {
  chapters: [
    { index: "01", label: "The Science", target: "science" },
    { index: "02", label: "The Application", target: "application" },
    { index: "03", label: "The Result", target: "result" },
  ],
  /* Placeholder destinations — wire to the real shop/retailer/legal URLs
     when they exist. Keeping them as anchors keeps the static export
     self-contained. */
  utilities: [
    { label: "Shop Now", href: "#shop" },
    { label: "Find a Retailer", href: "#shop" },
    { label: "Contact Us", href: "#shop" },
    { label: "Warranty & Trademark", href: "#legal" },
  ],
  socials: [
    { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
    { label: "TikTok", href: "https://tiktok.com", icon: "tiktok" },
    { label: "YouTube", href: "https://youtube.com", icon: "youtube" },
  ],
};

export const FOOTER = {
  kicker: "The future of surface protection",
  headline: ["PRE-ORDER", "Q-ARMOR™ NOW."],
  cta: "Pre-Order Q-ARMOR™",
  body: "Welcome to the future of surface protection. Welcome to CERAQO™.", // verbatim closing line
  newsletter: {
    title: "Join the CERAQO newsletter",
    note: "Launch news, application guides, no noise.",
    placeholder: "Email address",
    action: "Join",
    success: "You’re on the list. We’ll be in touch before launch.", // verbatim
    error: "Enter a valid email address.", // verbatim
  },
  legal: {
    copyright: `© ${new Date().getFullYear()} CERAQO™. All rights reserved. Q-ARMOR™ is a trademark of CERAQO.`,
    made: "Made in Germany",
  },
};
