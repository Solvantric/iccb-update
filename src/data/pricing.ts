// All pricing is sample data — isSample: true
export const isSample = true;

export const VAT_PERCENT = 15;
export const SERVICE_CHARGE_PERCENT = 10;
export const USD_RATE = 110; // BDT per USD — sample

export const hallBasePrice: Record<string, number> = {
  "gulnaksha": 250000,
  "pushpoguchcho": 200000,
  "rajdarshan": 175000,
  "noboratri": 150000,
  "pushpanjali": 120000,
  "seminar-hall": 80000,
};

export const shiftMultiplier: Record<string, number> = {
  lunch: 0.5,
  dinner: 0.5,
  fullday: 1.0,
};

export const decorationPrices: Record<string, number> = {
  classic: 50000,
  premium: 120000,
  royal: 250000,
};

export const addonPrices: Record<string, number> = {
  stage: 30000,
  "led-wall": 50000,
  "sound-light": 40000,
  photography: 25000,
  "extra-hour": 15000,
};

export const peakDates: string[] = [
  // Sample peak dates — Fridays and Saturdays in winter
];

export const cateringPackages = [
  {
    id: "mughal-classic",
    name: { en: "Mughal Classic", bn: "মোঘল ক্লাসিক" },
    pricePerHead: 850,
    items: [
      { en: "Biryani (Chicken/Beef)", bn: "বিরিয়ানি (চিকেন/বিফ)" },
      { en: "2 Curries", bn: "২টি কারি" },
      { en: "Dal, Rice, Bread", bn: "ডাল, ভাত, রুটি" },
      { en: "Dessert + Drinks", bn: "ডেজার্ট + পানীয়" },
    ],
    cuisine: "Mughal",
    tags: ["halal", "popular"],
    isSample: true,
  },
  {
    id: "continental",
    name: { en: "Continental Package", bn: "কন্টিনেন্টাল প্যাকেজ" },
    pricePerHead: 1200,
    items: [
      { en: "Appetizers (3 items)", bn: "অ্যাপেটাইজার (৩ আইটেম)" },
      { en: "Soup", bn: "স্যুপ" },
      { en: "Main Course (2 options)", bn: "মেইন কোর্স (২টি অপশন)" },
      { en: "Salad bar", bn: "সালাদ বার" },
      { en: "Dessert + Soft drinks", bn: "ডেজার্ট + সফট ড্রিংকস" },
    ],
    cuisine: "Continental",
    tags: ["premium"],
    isSample: true,
  },
  {
    id: "multi-cuisine",
    name: { en: "Multi-Cuisine Grand", bn: "মাল্টি-কুইজিন গ্র্যান্ড" },
    pricePerHead: 1800,
    items: [
      { en: "Live cooking station", bn: "লাইভ কুকিং স্টেশন" },
      { en: "Mughal + Continental + Chinese", bn: "মোঘল + কন্টিনেন্টাল + চাইনিজ" },
      { en: "Seafood platter", bn: "সিফুড প্ল্যাটার" },
      { en: "Premium dessert buffet", bn: "প্রিমিয়াম ডেজার্ট বুফে" },
      { en: "Welcome drinks + mocktails", bn: "ওয়েলকাম ড্রিংকস + মকটেইল" },
    ],
    cuisine: "Multi",
    tags: ["luxury", "buffet"],
    isSample: true,
  },
];
