export interface Venture {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  type: "catering" | "restaurant" | "icecream" | "other";
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
    tagline: "World-class cuisine for every occasion",
    description:
      "ICCB Catering operates a state-of-the-art kitchen staffed by experienced chefs, delivering authentic Mughal, Continental, and multi-cuisine menus with strict quality control from farm to table.",
    type: "catering",
    image:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=95&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=95&w=3840",
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
    id: "heritage-restaurant",
    slug: "heritage-restaurant",
    name: "ICCB Heritage Restaurant",
    tagline: "Authentic Mughal-inspired dining — opened June 2021",
    description:
      "Opened in June 2021, ICCB Heritage Restaurant offers an authentic Mughal-themed dining experience within the convention complex. Featuring royal ambiance, traditional recipes, and impeccable service.",
    type: "restaurant",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=95&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=95&w=3840",
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
    id: "iccb-restaurant",
    slug: "iccb-restaurant",
    name: "ICCB Restaurant",
    tagline: "Modern multi-cuisine dining at the convention complex",
    description:
      "ICCB Restaurant is a modern multi-cuisine dining destination within the convention complex, offering a diverse menu for delegates, visitors, and event guests.",
    type: "restaurant",
    image:
      "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&q=95&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&q=95&w=3840",
    stats: [
      { label: "Seating capacity", value: "200+" },
      { label: "Menu items", value: "80+" },
      { label: "Cuisines served", value: "5+" },
      { label: "Daily covers", value: "300+" },
    ],
    highlights: [
      { icon: "Globe", title: "Multi-cuisine Menu", body: "Bengali, Continental, Chinese, and Arabic cuisine under one roof." },
      { icon: "Clock", title: "Open All Day", body: "Breakfast through dinner, 7 days a week." },
      { icon: "Users", title: "Delegate Friendly", body: "Dedicated zones for event attendees and corporate delegates." },
      { icon: "Sparkle", title: "Live Stations", body: "Live grill and dessert stations on selected days." },
    ],
    hours: "7:00 AM – 10:00 PM daily",
    phone: "+880-2-55028600",
    location: "Level 1, ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: true,
  },
  {
    id: "iccb-ice-cream",
    slug: "iccb-ice-cream",
    name: "ICCB Ice Cream",
    tagline: "Artisanal ice cream crafted fresh daily",
    description:
      "ICCB Ice Cream brings a premium artisanal ice cream experience to the convention complex and beyond, with rotating seasonal flavours, sundaes, and corporate gifting options.",
    type: "icecream",
    image:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=95&w=1600",
    heroImage:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=95&w=3840",
    stats: [
      { label: "Flavours", value: "24+" },
      { label: "Seasonal specials", value: "6/year" },
      { label: "Outlets", value: "2" },
      { label: "Corporate gifting", value: "Available" },
    ],
    highlights: [
      { icon: "Snowflake", title: "Artisanal Recipes", body: "Hand-crafted ice cream made fresh daily with premium ingredients." },
      { icon: "Leaf", title: "Natural Flavours", body: "No artificial colours or preservatives. Seasonal and local ingredients." },
      { icon: "Gift", title: "Corporate Gifting", body: "Custom packaging and bulk orders available for events and conferences." },
      { icon: "MapPin", title: "2 Outlets", body: "Located within the convention complex for easy access during events." },
    ],
    hours: "10:00 AM – 9:00 PM daily",
    phone: "+880-2-55028600",
    location: "ICCB Convention Complex, Purbachal Expressway, Dhaka",
    isSample: true,
  },
];

export const getVentureBySlug = (slug: string) =>
  ventures.find((v) => v.slug === slug);
