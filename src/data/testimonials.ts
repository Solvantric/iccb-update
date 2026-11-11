import type { Testimonial } from "@/types";

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Rafiqul Islam",
    organization: "Bangladesh Textile Mills Association",
    role: "General Secretary",
    content: {
      en: "ICCB is simply unmatched for large-scale trade fairs in Bangladesh. The logistics, the space, the catering — everything exceeded our expectations at TEXFAIR 2024.",
      bn: "বাংলাদেশে বড় আকারের ট্রেড ফেয়ারের জন্য আইসিসিবি অতুলনীয়। লজিস্টিক্স, স্থান, ক্যাটারিং — সবকিছুই আমাদের প্রত্যাশা ছাড়িয়ে গেছে।",
    },
    rating: 5,
    eventType: "Exhibition",
    isSample: true,
  },
  {
    id: "t2",
    name: "Dr. Nasreen Ahmed",
    organization: "South Asian Medical Congress",
    role: "Conference Chair",
    content: {
      en: "We hosted our international medical congress with 3,000 delegates from 28 countries. The AV facilities, interpretation booths, and professional staff made it seamless.",
      bn: "আমরা ২৮টি দেশের ৩,০০০ প্রতিনিধি নিয়ে আন্তর্জাতিক চিকিৎসা কংগ্রেস আয়োজন করেছিলাম। এভি সুবিধা, ইন্টারপ্রিটেশন বুথ এবং পেশাদার কর্মীরা সবকিছু নিরবচ্ছিন্ন করে তুলেছিল।",
    },
    rating: 5,
    eventType: "Conference",
    isSample: true,
  },
  {
    id: "t3",
    name: "Tanvir & Maliha",
    role: "Wedding Hosts",
    content: {
      en: "Our wedding at ICCB was truly a dream come true. 1,800 guests, stunning decoration, and food that everyone is still talking about. The team was flawless.",
      bn: "আইসিসিবিতে আমাদের বিয়ে সত্যিই একটি স্বপ্ন পূরণ ছিল। ১,৮০০ অতিথি, অসাধারণ সাজসজ্জা, এবং খাবার যা সবাই এখনও কথা বলছে।",
    },
    rating: 5,
    eventType: "Wedding",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=3840&q=95",
    isSample: true,
  },
  {
    id: "t4",
    name: "Hiroshi Tanaka",
    organization: "Japan-Bangladesh Business Council",
    role: "President",
    content: {
      en: "ICCB provides the international standard we expect for Japan-Bangladesh bilateral events. Excellent multilingual support and world-class facilities.",
      zh: "ICCB为日孟双边活动提供了我们所期望的国际标准。出色的多语言支持和世界级设施。",
    },
    rating: 5,
    eventType: "Corporate",
    isSample: true,
  },
];
