export interface Venture {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  type: "catering" | "restaurant" | "icecream" | "events" | "sweets" | "cafe" | "other";
  /** Brand logo (from ICCB brand file) shown in the ventures slider controls. */
  logo: string;
  image: string;
  heroImage: string;
  stats: { label: string; value: string }[];
  highlights: { icon: string; title: string; body: string }[];
  openedYear?: number;
  hours?: string;
  phone?: string;
  location?: string;
  isSample: boolean;
}

export const ventures: Venture[] = [
  {
    id: "iccb-catering",
    slug: "iccb-catering",
    name: "ICCB Catering",
    tagline: "Taste of Happiness",
    description:
      "ICCB Catering operates a state-of-the-art kitchen staffed by experienced chefs, delivering authentic Mughal, Continental, and multi-cuisine menus with strict quality control from farm to table.",
    type: "catering",
    logo: "/images/ventures/catering.svg",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=90&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=90&w=1600",
    stats: [
      { label: "Events catered / year", value: "200+" },
      { label: "Menu packages", value: "12+" },
      { label: "Cuisines", value: "3" },
      { label: "Minimum capacity", value: "50" },
    ],
    highlights: [
      { icon: "ChefHat", title: "Expert Chefs", body: "Team of experienced head chefs and sous chefs with international training." },
      { icon: "Plant", title: "Fresh Ingredients", body: "Sourced daily from trusted local and imported suppliers." },
      { icon: "ListChecks", title: "Quality Control", body: "Strict hygiene and quality standards across every dish." },
      { icon: "Package", title: "On-site & Off-site", body: "Catering available within ICCB halls and at external venues." },
    ],
    hours: "By appointment",
    phone: "+880-2-55028600",
    location: "ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: true,
  },
  {
    id: "iccb-events",
    slug: "iccb-events",
    name: "ICCB Events",
    tagline: "Orchestrate your Dream",
    description:
      "ICCB Events plans and produces weddings, corporate conferences, exhibitions and celebrations end-to-end — from concept and décor to stage, sound and guest experience.",
    type: "events",
    logo: "/images/ventures/events.svg",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=90&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=90&w=1600",
    stats: [
      { label: "Services", value: "End-to-end" },
      { label: "Event types", value: "Weddings · Corporate · Expo" },
      { label: "Venues", value: "ICCB halls" },
      { label: "Planning", value: "Dedicated team" },
    ],
    highlights: [
      { icon: "CalendarCheck", title: "Full Planning", body: "Concept, budgeting, scheduling and on-the-day coordination." },
      { icon: "Sparkle", title: "Décor & Staging", body: "Themed décor, lighting, stage and AV production." },
      { icon: "Users", title: "Guest Experience", body: "Registration, hospitality and VIP management." },
      { icon: "Handshake", title: "One Point of Contact", body: "A dedicated event manager from enquiry to wrap-up." },
    ],
    hours: "By appointment",
    phone: "+880-2-55028600",
    location: "ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: false,
  },
  {
    id: "heritage-restaurant",
    slug: "heritage-restaurant",
    name: "Heritage Restaurant",
    tagline: "Authentic Mughal-inspired dining — opened June 2021",
    description:
      "Opened in June 2021, Heritage Restaurant offers an authentic Mughal-themed dining experience within the convention complex. Featuring royal ambiance, traditional recipes, and impeccable service.",
    type: "restaurant",
    logo: "/images/ventures/heritage-restaurant.svg",
    image:
      "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&q=90&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&q=90&w=1600",
    stats: [
      { label: "Opened", value: "June 2021" },
      { label: "Seating capacity", value: "120+" },
      { label: "Signature dishes", value: "30+" },
      { label: "Private dining rooms", value: "3" },
    ],
    highlights: [
      { icon: "Crown", title: "Royal Mughal Décor", body: "Authentic Mughal-inspired interiors with hand-crafted details." },
      { icon: "ForkKnife", title: "Traditional Recipes", body: "Time-honoured Mughal and fusion recipes by our head chef." },
      { icon: "Door", title: "Private Dining", body: "Exclusive private rooms for intimate gatherings and corporate dinners." },
      { icon: "Star", title: "Signature Experience", body: "Live cooking stations and tableside service for a royal experience." },
    ],
    openedYear: 2021,
    hours: "12:00 PM – 10:00 PM daily",
    phone: "+880-2-55028600",
    location: "Ground Floor, ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: false,
  },
  {
    id: "heritage-sweets",
    slug: "heritage-sweets",
    name: "Heritage Sweets",
    tagline: "Feel the Mughal",
    description:
      "Heritage Sweets brings traditional Mughal and Bengali sweets to ICCB — freshly made mishti, halwa and festive gift boxes for events and celebrations.",
    type: "sweets",
    logo: "/images/ventures/heritage-sweets.svg",
    image:
      "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&q=90&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&q=90&w=1600",
    stats: [
      { label: "Speciality", value: "Mughal & Bengali sweets" },
      { label: "Made", value: "Fresh daily" },
      { label: "Gift boxes", value: "Available" },
      { label: "Event orders", value: "Bulk & custom" },
    ],
    highlights: [
      { icon: "Crown", title: "Mughal Heritage", body: "Recipes inspired by royal Mughal kitchens." },
      { icon: "Leaf", title: "Fresh Every Day", body: "Prepared daily with quality ingredients." },
      { icon: "Gift", title: "Festive Gifting", body: "Gift boxes for Eid, weddings and corporate events." },
      { icon: "Package", title: "Event Orders", body: "Bulk and custom orders for ICCB events." },
    ],
    hours: "10:00 AM – 10:00 PM daily",
    phone: "+880-2-55028600",
    location: "ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: false,
  },
  {
    id: "heritage-express-cafe",
    slug: "heritage-express-cafe",
    name: "Heritage Express Café",
    tagline: "Quick bites, Heritage taste",
    description:
      "Heritage Express Café serves coffee, snacks and quick meals for delegates, exhibitors and visitors — the Heritage flavour, on the go.",
    type: "cafe",
    logo: "/images/ventures/heritage-express.svg",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=90&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=90&w=1600",
    stats: [
      { label: "Serves", value: "Coffee · Snacks · Meals" },
      { label: "Style", value: "Grab & go" },
      { label: "Ideal for", value: "Delegates & visitors" },
      { label: "Seating", value: "Café lounge" },
    ],
    highlights: [
      { icon: "Coffee", title: "Fresh Coffee", body: "Espresso bar with hot and cold drinks." },
      { icon: "Clock", title: "Fast Service", body: "Quick bites between sessions and show hours." },
      { icon: "Users", title: "Delegate Friendly", body: "Convenient for exhibitors and conference guests." },
      { icon: "ForkKnife", title: "Heritage Flavours", body: "Signature Heritage snacks and light meals." },
    ],
    hours: "8:00 AM – 9:00 PM daily",
    phone: "+880-2-55028600",
    location: "ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: false,
  },
  {
    id: "heritage-kebab-restaurant",
    slug: "heritage-kebab-restaurant",
    name: "Heritage Kebab & Restaurant",
    tagline: "Kebabs from the royal grill",
    description:
      "Heritage Kebab & Restaurant specialises in charcoal-grilled kebabs, biryani and Mughlai classics, served in a warm, family-friendly setting.",
    type: "restaurant",
    logo: "/images/ventures/heritage-kebab.svg",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=90&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=90&w=1600",
    stats: [
      { label: "Speciality", value: "Kebab & Mughlai" },
      { label: "Grill", value: "Charcoal" },
      { label: "Dining", value: "Family & groups" },
      { label: "Takeaway", value: "Available" },
    ],
    highlights: [
      { icon: "Fire", title: "Charcoal Grill", body: "Kebabs grilled fresh over charcoal." },
      { icon: "Crown", title: "Mughlai Classics", body: "Biryani, rezala and royal curries." },
      { icon: "Users", title: "Family Dining", body: "Comfortable seating for families and groups." },
      { icon: "Package", title: "Takeaway", body: "Order your favourites to go." },
    ],
    hours: "12:00 PM – 11:00 PM daily",
    phone: "+880-2-55028600",
    location: "ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: false,
  },
];

export const getVentureBySlug = (slug: string) =>
  ventures.find((v) => v.slug === slug);
