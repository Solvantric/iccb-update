import type { NewsArticle } from "@/types";

export const newsArticles: NewsArticle[] = [
  {
    id: "news-001",
    slug: "iccb-hosts-international-textile-expo",
    title: {
      en: "ICCB Successfully Hosts International Textile Expo 2025",
      bn: "আইসিসিবি সফলভাবে আন্তর্জাতিক টেক্সটাইল এক্সপো ২০২৫ আয়োজন করেছে",
    },
    excerpt: {
      en: "Over 20,000 visitors attended the three-day international textile exposition at ICCB's flagship Gulnaksha Hall.",
      bn: "আইসিসিবির ফ্ল্যাগশিপ গুলনক্শা হলে তিন দিনের আন্তর্জাতিক টেক্সটাইল প্রদর্শনীতে ২০,০০০ এরও বেশি দর্শনার্থী এসেছিলেন।",
    },
    content: {
      en: "ICCB successfully hosted the International Textile Expo 2025, welcoming over 20,000 visitors from across South and Southeast Asia. The three-day event featured 350 exhibitors from 28 countries, showcasing the latest innovations in textile manufacturing, sustainable fabrics, and fashion technology. This marks ICCB's continued commitment to being Bangladesh's premier international exhibition destination.",
      bn: "আইসিসিবি সফলভাবে আন্তর্জাতিক টেক্সটাইল এক্সপো ২০২৫ আয়োজন করেছে।",
    },
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=3840&q=95",
    publishedAt: "2025-05-20T09:00:00Z",
    category: "Events",
    author: "ICCB Communications",
    isSample: true,
  },
  {
    id: "news-002",
    slug: "heritage-restaurant-anniversary",
    title: {
      en: "Heritage Restaurant Celebrates Three Years of Mughal Excellence",
      bn: "হেরিটেজ রেস্টুরেন্ট মোঘল শ্রেষ্ঠত্বের তিন বছর উদযাপন করছে",
    },
    excerpt: {
      en: "ICCB Heritage Restaurant marks its third anniversary, having served over 500,000 guests with authentic Mughal cuisine.",
      bn: "আইসিসিবি হেরিটেজ রেস্টুরেন্ট তার তৃতীয় বার্ষিকী উদযাপন করছে।",
    },
    content: {
      en: "ICCB Heritage Restaurant celebrates three years of bringing authentic Mughal culinary traditions to Dhaka. Since its opening in June 2021, the restaurant has served over 500,000 guests, earning a reputation as one of Bangladesh's finest dining experiences. The anniversary celebration featured a special tasting menu curated by our executive chef.",
      bn: "আইসিসিবি হেরিটেজ রেস্টুরেন্ট ঢাকায় খাঁটি মোঘল রন্ধন ঐতিহ্য আনার তিন বছর উদযাপন করছে।",
    },
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=3840&q=95",
    publishedAt: "2024-06-01T09:00:00Z",
    category: "Restaurant",
    author: "ICCB Communications",
    isSample: true,
  },
  {
    id: "news-003",
    slug: "iccb-wins-best-convention-venue",
    title: {
      en: "ICCB Recognized as Best Convention Venue in South Asia",
      bn: "আইসিসিবি দক্ষিণ এশিয়ায় সেরা কনভেনশন ভেন্যু হিসেবে স্বীকৃত",
    },
    excerpt: {
      en: "ICCB receives recognition at the South Asia Events & Entertainment Awards for excellence in event hosting.",
      bn: "আইসিসিবি ইভেন্ট হোস্টিংয়ে শ্রেষ্ঠত্বের জন্য স্বীকৃতি পেয়েছে।",
    },
    content: {
      en: "ICCB has been recognized as the Best Convention Venue in South Asia at the South Asia Events & Entertainment Awards. This prestigious recognition reflects our decade-long commitment to providing world-class event facilities, exceptional service, and seamless event management to organizers from across the globe.",
      bn: "আইসিসিবি দক্ষিণ এশিয়ার সেরা কনভেনশন ভেন্যু হিসেবে স্বীকৃতি পেয়েছে।",
    },
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=3840&q=95",
    publishedAt: "2024-11-15T09:00:00Z",
    category: "Awards",
    author: "ICCB Communications",
    isSample: true,
  },
];

export const getArticleBySlug = (slug: string): NewsArticle | undefined =>
  newsArticles.find((a) => a.slug === slug);
