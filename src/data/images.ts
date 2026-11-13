export interface ImageMeta {
  src: string;
  alt: { en: string; bn?: string; ar?: string; zh?: string };
  photographer?: string;
  source?: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export const heroSlides: Array<ImageMeta & { id: string }> = [
  {
    id: "grand-hall",
    src: "/images/hero/bashundhara-phc-banner.jpg",
    alt: { en: "Aerial view of golden fields and wind turbines at sunrise", bn: "সূর্যোদয়ে সোনালি মাঠ ও বায়ুকল" },
    source: "Bashundhara PHC Pile",
    width: 1721,
    height: 649,
  },
  {
    id: "expo",
    src: "https://images.unsplash.com/photo-1742724769470-4f921b700c71?auto=format&fit=crop&q=90&w=3840",
    alt: { en: "Grand baroque hall lit by a crystal chandelier", bn: "ক্রিস্টাল ঝাড়বাতিতে আলোকিত গ্র্যান্ড হল" },
    photographer: "Peter Herrmann",
    source: "Unsplash",
    width: 3840,
    height: 2866,
  },
  {
    id: "conference",
    src: "https://images.unsplash.com/photo-1758194090785-8e09b7288199?auto=format&fit=crop&q=90&w=3840",
    alt: { en: "Luxury hotel lobby with gold accents and warm lighting", bn: "সোনালি সাজ ও উষ্ণ আলোয় বিলাসবহুল হোটেল লবি" },
    source: "Unsplash",
    width: 3840,
    height: 2304,
  },
  {
    id: "wedding",
    src: "https://images.unsplash.com/photo-1780542900375-0cf459e38fbb?auto=format&fit=crop&q=90&w=3840",
    alt: { en: "Elegant ballroom with chandeliers, columns and long tables", bn: "ঝাড়বাতি ও স্তম্ভসহ মার্জিত বলরুম" },
    photographer: "Lucas T Photography",
    source: "Unsplash",
    width: 3840,
    height: 2561,
  },
  {
    id: "concert",
    src: "https://images.unsplash.com/photo-1575374643949-9843728de185?auto=format&fit=crop&q=90&w=3840",
    alt: { en: "Five-star resort pool glowing with lights at night", bn: "রাতে আলোকিত পাঁচ তারকা রিসোর্টের পুল" },
    photographer: "Bundo Kim",
    source: "Unsplash",
    width: 3840,
    height: 2880,
  },
];

export const galleryImages: Array<ImageMeta & { id: string; category: string }> = [
  {
    id: "g1",
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Convention hall setup" },
    category: "halls",
    photographer: "Sangga Rima Roman Selia",
    source: "Unsplash",
    width: 3840,
    height: 800,
  },
  {
    id: "g2",
    src: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Expo floor" },
    category: "expo",
    photographer: "Nastuh Abootalebi",
    source: "Unsplash",
    width: 3840,
    height: 800,
  },
  {
    id: "g3",
    src: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Conference setup" },
    category: "conferences",
    photographer: "Samuel Pereira",
    source: "Unsplash",
    width: 3840,
    height: 800,
  },
  {
    id: "g4",
    src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Wedding banquet" },
    category: "weddings",
    photographer: "Photos by Lanty",
    source: "Unsplash",
    width: 3840,
    height: 800,
  },
  {
    id: "g5",
    src: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Concert lighting" },
    category: "concerts",
    photographer: "Yvette de Wit",
    source: "Unsplash",
    width: 3840,
    height: 800,
  },
  {
    id: "g6",
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Catering plating" },
    category: "catering",
    photographer: "Jay Wennington",
    source: "Unsplash",
    width: 3840,
    height: 800,
  },
  {
    id: "g7",
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Heritage restaurant dining" },
    category: "restaurant",
    photographer: "Paul Hanaoka",
    source: "Unsplash",
    width: 3840,
    height: 800,
  },
  {
    id: "g8",
    src: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "Exhibition booths" },
    category: "expo",
    photographer: "Nastuh Abootalebi",
    source: "Unsplash",
    width: 3840,
    height: 1067,
  },
  {
    id: "g9",
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=95&w=3840",
    alt: { en: "ICCB exterior architecture" },
    category: "architecture",
    photographer: "Sangga Rima Roman Selia",
    source: "Unsplash",
    width: 3840,
    height: 1067,
  },
];
