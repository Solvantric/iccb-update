/**
 * Website-only presentation copy for the service pages (highlights, process, gallery, "ideal for").
 * Core name/tagline/description/features stay in `services.ts`. ⚠️ Sample copy — confirm with ICCB.
 */
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=2400`;

export interface ServiceDetail {
  /** Word of the service name shown in red. */
  highlight: string;
  idealFor: string[];
  highlights: { icon: string; title: string; text: string }[];
  steps: { title: string; text: string }[];
  gallery: string[];
}

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  "venue-rental": {
    highlight: "Rental",
    idealFor: ["Weddings", "Conventions", "Concerts", "Corporate Events", "Exhibitions"],
    highlights: [
      { icon: "Buildings", title: "Six halls, every scale", text: "From a focused seminar room to the pillar-free Gulnaksha for thousands." },
      { icon: "Users", title: "20,000+ guests at once", text: "Run several events side by side without one crowding the other." },
      { icon: "Car", title: "3,500+ car parking", text: "Wide, managed parking right beside the 300 ft. Purbachal Express Highway." },
      { icon: "SlidersHorizontal", title: "Flexible floor plans", text: "Theatre, banquet, classroom or cocktail — set up exactly as you need." },
      { icon: "Lightning", title: "Dedicated power backup", text: "Uninterrupted power for lighting, sound and kitchens throughout your event." },
      { icon: "UserCircleCheck", title: "A coordinator for you", text: "One point of contact from your first visit until the last guest leaves." },
    ],
    steps: [
      { title: "Check availability", text: "Pick a hall and date online — booked, reserved and open days are shown live." },
      { title: "Site visit", text: "Walk the hall with our team and plan the layout together." },
      { title: "Confirm & plan", text: "Lock your date, then build catering, décor and services around it." },
      { title: "Event day", text: "Our coordinator runs the day so you can be with your guests." },
    ],
    gallery: [u("1540575467063-178a50c2df87"), u("1519167758481-83f550bb49b3"), u("1511578314322-379afb476865"), u("1587825140708-dfaf72ae4b04")],
  },
  catering: {
    highlight: "Catering",
    idealFor: ["Weddings", "Receptions", "Iftar", "Corporate Lunches", "Gala Dinners"],
    highlights: [
      { icon: "CookingPot", title: "Our own double kitchen", text: "Everything is cooked on-site by ICCB chefs — nothing is outsourced." },
      { icon: "BowlFood", title: "Mughal to Continental", text: "Traditional Bangladeshi, royal Mughal, Continental and fusion menus." },
      { icon: "ShieldCheck", title: "Strict quality control", text: "Fresh ingredients, hygiene checks and tasting before every service." },
      { icon: "ChefHat", title: "Experienced chefs", text: "Teams used to serving thousands of guests at the same consistent standard." },
      { icon: "Receipt", title: "Per-head or package", text: "Choose a set package or build a custom menu around your budget." },
      { icon: "Cake", title: "Desserts & live stations", text: "Sweets, live counters and special items for the big moments." },
    ],
    steps: [
      { title: "Share your event", text: "Tell us the occasion, guest count and food preferences." },
      { title: "Menu proposal", text: "We suggest packages or a custom menu with clear per-head pricing." },
      { title: "Tasting", text: "Taste the menu with our chefs and fine-tune every dish." },
      { title: "Served fresh", text: "Cooked in our kitchen and served hot by a trained service team." },
    ],
    gallery: [u("1414235077428-338989a2e8c0"), u("1600565193348-f74bd3c7ccdf"), u("1567337710282-00832b415979"), u("1581349485608-9469926a8e5e")],
  },
  decoration: {
    highlight: "Decoration",
    idealFor: ["Weddings", "Holud & Mehendi", "Receptions", "Galas", "Product Launches"],
    highlights: [
      { icon: "Crown", title: "Classic, Premium & Royal", text: "Three décor tiers — or a fully custom concept built for you." },
      { icon: "Flower", title: "Floral & draping", text: "Fresh flowers, fabric draping and centrepieces styled to your theme." },
      { icon: "Lightbulb", title: "Lighting design", text: "Stage wash, fairy lights and mood lighting that change the whole room." },
      { icon: "FrameCorners", title: "Stage & backdrops", text: "Custom stages, photo walls and entrance gates designed in-house." },
      { icon: "Palette", title: "Themed set-ups", text: "Traditional, modern, royal or corporate — matched to your colours." },
      { icon: "Ruler", title: "Planned to the hall", text: "Every design is drawn to the exact size of your chosen hall." },
    ],
    steps: [
      { title: "Mood & theme", text: "Share your colours, references and the feeling you want." },
      { title: "Concept design", text: "Our designers propose a stage, lighting and floral concept." },
      { title: "Finalise", text: "Choose your tier, review the plan and lock the details." },
      { title: "Set-up & reveal", text: "We dress the hall before your guests arrive." },
    ],
    gallery: [u("1511795409834-ef04bbd61622"), u("1743684821666-05b9c5046937"), u("1469371670807-013ccf25f16a"), u("1464366400600-7168b8af9bc3")],
  },
  "event-management": {
    highlight: "Management",
    idealFor: ["Conferences", "Award Nights", "AGMs", "Concerts", "Product Launches"],
    highlights: [
      { icon: "UserCircleCheck", title: "Dedicated coordinator", text: "One expert owns your event plan from concept to wrap-up." },
      { icon: "SpeakerHigh", title: "AV & production", text: "Stage, LED walls, sound and lighting run by our technical team." },
      { icon: "ShieldCheck", title: "Security & crowd flow", text: "Trained security, CCTV and clear entry and exit planning." },
      { icon: "IdentificationCard", title: "Registration desk", text: "Guest lists, badges and check-in handled smoothly at the door." },
      { icon: "Camera", title: "Media & coverage", text: "Photo, video and press arrangements on request." },
      { icon: "ClipboardText", title: "Post-event report", text: "Attendance and a clear wrap-up once the event is done." },
    ],
    steps: [
      { title: "Brief", text: "Tell us your goals, audience and programme." },
      { title: "Run-of-show", text: "We build the timeline, cue sheets and supplier plan." },
      { title: "Rehearsal", text: "Technical run-through so every cue lands on time." },
      { title: "Showtime", text: "Our team runs the floor, backstage and guest flow." },
    ],
    gallery: [u("1475721027785-f74eccf877e2"), u("1505373877841-8d25f7d46678"), u("1511578314322-379afb476865"), u("1559223607-a43c990c692c")],
  },
  "heritage-restaurant": {
    highlight: "Heritage",
    idealFor: ["Family Dinners", "Business Lunches", "Private Dining", "Small Celebrations"],
    highlights: [
      { icon: "Crown", title: "Royal Mughal ambiance", text: "Interiors inspired by Mughal courts — beads, chests and warm light." },
      { icon: "BowlFood", title: "Traditional recipes", text: "Kacchi, rezala, kebabs and classic Mughal and Bangladeshi dishes." },
      { icon: "Door", title: "Private dining rooms", text: "Quiet rooms for family gatherings and business meals." },
      { icon: "Sparkle", title: "Impeccable service", text: "Hospitality from the same team that serves ICCB's grand events." },
      { icon: "Car", title: "Easy parking", text: "Arrive and park right inside the ICCB complex." },
      { icon: "CalendarCheck", title: "Open since 2021", text: "Serving guests at ICCB since June 2021." },
    ],
    steps: [
      { title: "Reserve", text: "Call or message to book a table or private room." },
      { title: "Arrive", text: "Park inside the complex and walk straight in." },
      { title: "Dine", text: "Choose from the menu or a chef's set for your group." },
      { title: "Celebrate", text: "Add a cake or special arrangement for the occasion." },
    ],
    gallery: [u("1517248135467-4c7edcad34c4"), u("1414235077428-338989a2e8c0"), u("1600891964599-f61ba0e24092"), u("1567337710282-00832b415979")],
  },
  "expo-support": {
    highlight: "Expo",
    idealFor: ["Trade Fairs", "International Expos", "Product Showcases", "Buyer Meets"],
    highlights: [
      { icon: "Storefront", title: "Expo Village", text: "The country's largest single-roof exhibition space." },
      { icon: "SquaresFour", title: "Modular booths", text: "Shell-scheme and custom booths in any size and layout." },
      { icon: "Truck", title: "Freight & logistics", text: "Move-in, storage and move-out handled on schedule." },
      { icon: "Globe", title: "International buyers", text: "Support for overseas exhibitors, buyers and media." },
      { icon: "Megaphone", title: "Promotion & media", text: "Signage, branding spots and press coverage for your show." },
      { icon: "UsersThree", title: "Expo coordination team", text: "A dedicated team for organisers and exhibitors alike." },
    ],
    steps: [
      { title: "Floor plan", text: "Plan halls, booth rows and visitor flow with our team." },
      { title: "Exhibitor services", text: "Booth build, power, internet and furniture for every stand." },
      { title: "Move-in", text: "Scheduled build-up with freight and logistics support." },
      { title: "Show days", text: "Security, cleaning and visitor management throughout the fair." },
    ],
    gallery: [u("1587825140708-dfaf72ae4b04"), u("1778402566957-c21d77a67d0d"), u("1761195689615-9469b65dac01"), u("1540575467063-178a50c2df87")],
  },
};

export const serviceDetail = (slug: string): ServiceDetail =>
  SERVICE_DETAILS[slug] ?? { highlight: "", idealFor: [], highlights: [], steps: [], gallery: [] };
