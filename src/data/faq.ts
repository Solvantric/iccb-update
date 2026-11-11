export interface FaqItem {
  id: string;
  question: { en: string; bn?: string; ar?: string; zh?: string };
  answer: { en: string; bn?: string; ar?: string; zh?: string };
  category: string;
}

export const faqItems: FaqItem[] = [
  {
    id: "faq-01",
    question: {
      en: "What is the maximum capacity of ICCB?",
      bn: "আইসিসিবির সর্বোচ্চ ধারণক্ষমতা কত?",
    },
    answer: {
      en: "ICCB can accommodate over 10,000 guests simultaneously across all halls. Our flagship Gulnaksha Hall alone seats up to 2,500 guests in theatre style.",
      bn: "আইসিসিবি সমস্ত হলে একসাথে ১০,০০০ এর বেশি অতিথি ধারণ করতে পারে। আমাদের ফ্ল্যাগশিপ গুলনক্শা হল একাই থিয়েটার স্টাইলে ২,৫০০ অতিথি ধারণ করতে পারে।",
    },
    category: "venues",
  },
  {
    id: "faq-02",
    question: {
      en: "How do I reserve a date at ICCB?",
      bn: "আইসিসিবিতে একটি তারিখ কীভাবে রিজার্ভ করবো?",
    },
    answer: {
      en: "You can check availability and submit a reservation request directly through our booking page. A sales manager will contact you within 2 hours to confirm the hold. Holds are valid for 48 hours.",
      bn: "আপনি আমাদের বুকিং পেজের মাধ্যমে সরাসরি উপলব্ধতা পরীক্ষা করতে এবং একটি রিজার্ভেশন অনুরোধ জমা দিতে পারেন।",
    },
    category: "booking",
  },
  {
    id: "faq-03",
    question: {
      en: "Does ICCB provide catering services?",
      bn: "আইসিসিবি কি ক্যাটারিং সেবা প্রদান করে?",
    },
    answer: {
      en: "Yes, ICCB operates its own state-of-the-art kitchen with experienced chefs. We offer Mughal, Continental, and multi-cuisine menus with per-head pricing. External catering is not permitted.",
      bn: "হ্যাঁ, আইসিসিবি অভিজ্ঞ শেফদের নিয়ে নিজস্ব আধুনিক রান্নাঘর পরিচালনা করে।",
    },
    category: "catering",
  },
  {
    id: "faq-04",
    question: {
      en: "Is parking available at ICCB?",
      bn: "আইসিসিবিতে কি পার্কিং সুবিধা আছে?",
    },
    answer: {
      en: "Yes, ICCB offers 2,000+ dedicated parking spaces on-site, with additional overflow parking available for large events. Security is provided 24/7.",
      bn: "হ্যাঁ, আইসিসিবিতে অন-সাইটে ২,০০০+ নিবেদিত পার্কিং স্পেস রয়েছে।",
    },
    category: "facilities",
  },
  {
    id: "faq-05",
    question: {
      en: "Where is ICCB located?",
      bn: "আইসিসিবি কোথায় অবস্থিত?",
    },
    answer: {
      en: "ICCB is located next to the 300 ft. Purbachal Express Highway, Kuril Bishwa Road, Dhaka 1229. It is approximately 25 km from Hazrat Shahjalal International Airport.",
      bn: "আইসিসিবি ৩০০ ফুট পূর্বাচল এক্সপ্রেস হাইওয়ের পাশে, কুড়িল বিশ্বরোড, ঢাকা ১২২৯ এ অবস্থিত।",
    },
    category: "location",
  },
  {
    id: "faq-06",
    question: {
      en: "Does ICCB have power backup?",
      bn: "আইসিসিবিতে কি বিদ্যুৎ ব্যাকআপ আছে?",
    },
    answer: {
      en: "Yes, ICCB has dedicated power backup systems ensuring uninterrupted power supply throughout all events. We operate high-capacity generators with automatic switchover.",
      bn: "হ্যাঁ, আইসিসিবিতে সমস্ত ইভেন্টে নিরবচ্ছিন্ন বিদ্যুৎ সরবরাহ নিশ্চিত করতে নিবেদিত বিদ্যুৎ ব্যাকআপ সিস্টেম রয়েছে।",
    },
    category: "facilities",
  },
  {
    id: "faq-07",
    question: {
      en: "Can I bring my own decoration vendor?",
      bn: "আমি কি আমার নিজের ডেকোরেশন ভেন্ডর আনতে পারি?",
    },
    answer: {
      en: "ICCB has an in-house decoration team that handles all event decoration. External decoration vendors are allowed only with prior approval and must comply with ICCB's safety and operational guidelines.",
      bn: "আইসিসিবির একটি ইন-হাউস ডেকোরেশন টিম রয়েছে যা সমস্ত ইভেন্ট ডেকোরেশন পরিচালনা করে।",
    },
    category: "decoration",
  },
  {
    id: "faq-08",
    question: {
      en: "Is ICCB suitable for international conventions?",
      bn: "আইসিসিবি কি আন্তর্জাতিক কনভেনশনের জন্য উপযুক্ত?",
    },
    answer: {
      en: "Absolutely. ICCB is designed to international standards with multilingual staff, simultaneous interpretation booths, international-grade AV systems, visa facilitation support, and direct highway access from Dhaka's international airport.",
      bn: "অবশ্যই। আইসিসিবি আন্তর্জাতিক মানদণ্ড অনুযায়ী ডিজাইন করা হয়েছে।",
    },
    category: "venues",
  },
];
