/**
 * Common questions shown when the chat opens. Answers come from the backend
 * assistant's knowledge base (backend/ai-agent.js), so they appear instantly and
 * work even when the AI server is slow or down. Free-text questions go to the AI.
 */
export type ChatLang = "en" | "bn" | "ar" | "zh";

export interface ChatAction {
  label: string;
  href: string;
  external?: boolean;
}

export interface FaqItem {
  id: string;
  /** Words that route a typed question here when the AI server is unavailable. */
  keywords: RegExp;
  q: Record<ChatLang, string>;
  a: Record<ChatLang, string>;
  actions?: (lang: ChatLang, wa: string) => ChatAction[];
}

const L = (en: string, bn: string, ar: string, zh: string): Record<ChatLang, string> => ({ en, bn, ar, zh });
const path = (lang: ChatLang, p: string) => (lang === "en" ? p : `/${lang}${p}`);

export const FAQ: FaqItem[] = [
  {
    id: "book",
    keywords: /\b(book|booking|reserve|hold)\b|বুক|বুকিং|حجز|预订|预定/i,
    q: L("How do I book a hall?", "কীভাবে হল বুক করব?", "كيف أحجز قاعة؟", "如何预订场馆？"),
    a: L(
      "Booking takes 4 steps:\n1. Check your date on the Booking page.\n2. Get an estimate with the budget calculator.\n3. Send a hold or booking request (or an enquiry).\n4. A booking manager calls you with the final price and terms.\n\nAfter the manager confirms, your date is held for 48 hours. There is no online payment — payment is arranged directly with the ICCB team.",
      "বুকিং ৪ ধাপে:\n১. বুকিং পেজে আপনার তারিখ দেখুন।\n২. বাজেট ক্যালকুলেটরে খরচের ধারণা নিন।\n৩. হোল্ড বা বুকিং অনুরোধ (বা এনকোয়ারি) পাঠান।\n৪. বুকিং ম্যানেজার ফোন করে চূড়ান্ত মূল্য ও শর্ত জানাবেন।\n\nম্যানেজার নিশ্চিত করার পর তারিখটি ৪৮ ঘণ্টা হোল্ড থাকে। অনলাইন পেমেন্ট নেই — পেমেন্ট সরাসরি ICCB টিমের সাথে।",
      "الحجز في 4 خطوات:\n1. تحقق من التاريخ في صفحة الحجز.\n2. احصل على تقدير من حاسبة الميزانية.\n3. أرسل طلب حجز مؤقت أو حجز (أو استفساراً).\n4. يتصل بك مدير الحجوزات بالسعر النهائي والشروط.\n\nبعد التأكيد يُحجز التاريخ 48 ساعة. لا يوجد دفع إلكتروني.",
      "预订分 4 步：\n1. 在预订页面查看日期。\n2. 用预算计算器估算费用。\n3. 提交保留或预订申请（或咨询）。\n4. 预订经理会致电告知最终价格和条款。\n\n经理确认后日期保留 48 小时。不支持在线支付。"
    ),
    actions: (lang) => [{ label: lang === "bn" ? "বুকিং পেজ" : lang === "ar" ? "صفحة الحجز" : lang === "zh" ? "预订页面" : "Booking page", href: path(lang, "/booking") }],
  },
  {
    id: "availability",
    keywords: /availab|free date|date free|calendar|খালি|তারিখ|متاح|التاريخ|空闲|可用|档期/i,
    q: L("Is my date available?", "আমার তারিখটি কি খালি আছে?", "هل تاريخي متاح؟", "我的日期有空吗？"),
    a: L(
      "You can check it on the Booking page calendar:\n• White = available\n• Orange = on hold\n• Red = booked\n\nA booking manager confirms the final status. Share your date, event type and guest count and we'll get back to you.",
      "বুকিং পেজের ক্যালেন্ডারে দেখুন:\n• সাদা = খালি\n• কমলা = হোল্ডে আছে\n• লাল = বুকড\n\nচূড়ান্ত অবস্থা বুকিং ম্যানেজার নিশ্চিত করবেন। আপনার তারিখ, অনুষ্ঠানের ধরন ও অতিথির সংখ্যা জানালে আমরা যোগাযোগ করব।",
      "يمكنك التحقق من تقويم صفحة الحجز:\n• أبيض = متاح\n• برتقالي = محجوز مؤقتاً\n• أحمر = محجوز\n\nيؤكد مدير الحجوزات الحالة النهائية.",
      "请在预订页面日历查看：\n• 白色 = 可用\n• 橙色 = 保留中\n• 红色 = 已预订\n\n最终状态由预订经理确认。"
    ),
    actions: (lang) => [{ label: lang === "bn" ? "ক্যালেন্ডার দেখুন" : lang === "ar" ? "عرض التقويم" : lang === "zh" ? "查看日历" : "Open the calendar", href: path(lang, "/booking") }],
  },
  {
    id: "price",
    keywords: /price|cost|rent|rate|budget|how much|tariff|দাম|খরচ|ভাড়া|কত টাকা|سعر|تكلفة|价格|费用|多少钱/i,
    q: L("How much does a hall cost?", "হল ভাড়া কত?", "كم تكلفة القاعة؟", "场馆费用是多少？"),
    a: L(
      "It depends on the hall, date, shift, guest count and the services you choose. The budget calculator on the Booking page gives you an estimate, and a booking manager sends the final quotation.",
      "হল, তারিখ, শিফট, অতিথির সংখ্যা ও সেবার ওপর নির্ভর করে। বুকিং পেজের বাজেট ক্যালকুলেটরে একটি ধারণা পাবেন, চূড়ান্ত কোটেশন দেবেন বুকিং ম্যানেজার।",
      "يعتمد ذلك على القاعة والتاريخ والفترة وعدد الضيوف والخدمات. تعطيك حاسبة الميزانية تقديراً، ويرسل مدير الحجوزات العرض النهائي.",
      "取决于场馆、日期、时段、宾客人数和所选服务。预订页面的预算计算器可给出估算，最终报价由预订经理提供。"
    ),
    actions: (lang) => [{ label: lang === "bn" ? "বাজেট ক্যালকুলেটর" : lang === "ar" ? "حاسبة الميزانية" : lang === "zh" ? "预算计算器" : "Budget calculator", href: path(lang, "/booking") }],
  },
  {
    id: "capacity",
    keywords: /capacit|guest|people|seat|how many|hall|venue|অতিথি|ধারণ|কতজন|হল|ضيوف|سعة|قاعة|容纳|人数|场馆|大厅/i,
    q: L("How many guests can ICCB host?", "ICCB-তে কতজন অতিথি ধরে?", "كم عدد الضيوف الذي يستوعبه ICCB؟", "ICCB 可容纳多少宾客？"),
    a: L(
      "ICCB hosts more than 10,000 guests at a time for banquets, and up to about 20,000 people for large crowd events.\n\nVenues: 4 main halls — Gulnaksha, Pushpoguchcho, Rajdarshan and Noboratri — plus Pushpanjali, a Seminar Hall and the Expo Village. Capacity per hall depends on the layout; a manager can advise.",
      "ব্যাঙ্কুয়েটে একসাথে ১০,০০০-এর বেশি অতিথি, আর বড় অনুষ্ঠানে প্রায় ২০,০০০ জন।\n\nভেন্যু: ৪টি প্রধান হল — গুলনকশা, পুষ্পগুচ্ছ, রাজদর্শন ও নবরাত্রি — এছাড়া পুষ্পাঞ্জলি, সেমিনার হল ও এক্সপো ভিলেজ। প্রতিটি হলের ধারণক্ষমতা লেআউটের ওপর নির্ভর করে।",
      "يستوعب ICCB أكثر من 10,000 ضيف في المآدب، وحتى نحو 20,000 شخص في الفعاليات الكبيرة.\n\nالقاعات: 4 قاعات رئيسية — غولناكشا وبوشبوغوتشو وراجدارشان ونوبوراتري — إضافة إلى بوشبانجالي وقاعة الندوات وقرية المعارض.",
      "宴会形式可同时容纳 10,000 多位宾客，大型活动可达约 20,000 人。\n\n场馆：4 个主厅 — Gulnaksha、Pushpoguchcho、Rajdarshan、Noboratri，另有 Pushpanjali、研讨厅和展览村。"
    ),
    actions: (lang) => [{ label: lang === "bn" ? "ভেন্যু দেখুন" : lang === "ar" ? "القاعات" : lang === "zh" ? "查看场馆" : "See the venues", href: path(lang, "/venues") }],
  },
  {
    id: "catering",
    keywords: /cater|food|menu|halal|kitchen|dinner|lunch|খাবার|ক্যাটারিং|মেনু|طعام|قائمة|حلال|餐饮|菜单|食物/i,
    q: L("Do you provide catering?", "আপনারা কি ক্যাটারিং দেন?", "هل تقدمون خدمة الطعام؟", "提供餐饮服务吗？"),
    a: L(
      "Yes — ICCB Catering has its own modern kitchen and slaughterhouse, with quality checks on raw and cooked food. Menus: Mughal, Continental and multi-cuisine packages for weddings, receptions and corporate events.\n\nPer-head prices are confirmed by the catering team: +88-01991-197719 · iccbcatering@bga-bd.com",
      "হ্যাঁ — ICCB ক্যাটারিং-এর নিজস্ব আধুনিক রান্নাঘর ও কসাইখানা আছে, কাঁচা ও রান্না করা খাবারের মান যাচাই হয়। মেনু: মোগলাই, কন্টিনেন্টাল ও মাল্টি-কুইজিন প্যাকেজ।\n\nজনপ্রতি দাম নিশ্চিত করবে ক্যাটারিং টিম: +88-01991-197719 · iccbcatering@bga-bd.com",
      "نعم — لدى ICCB Catering مطبخ حديث ومسلخ خاص، مع فحص جودة الطعام. القوائم: مغولية وكونتيننتال ومتعددة المطابخ.\n\nتؤكد الأسعار للفرد فرقة التموين: +88-01991-197719",
      "是的 — ICCB 餐饮拥有现代化厨房和屠宰场，对原料和成品进行质量检查。菜单：莫卧儿、西式及多国料理套餐。\n\n人均价格由餐饮团队确认：+88-01991-197719"
    ),
    actions: (lang) => [{ label: lang === "bn" ? "মেনু দেখুন" : lang === "ar" ? "عرض القائمة" : lang === "zh" ? "查看菜单" : "View the menu", href: path(lang, "/menu") }],
  },
  {
    id: "location",
    keywords: /where|location|address|direction|map|parking|park|কোথায়|ঠিকানা|পার্কিং|أين|العنوان|موقف|地址|在哪|停车/i,
    q: L("Where is ICCB, and is there parking?", "ICCB কোথায়, পার্কিং আছে?", "أين يقع ICCB وهل يوجد موقف سيارات؟", "ICCB 在哪里？有停车场吗？"),
    a: L(
      "ICCB is on Kuril Bishwa Road, Dhaka 1229, next to the 300 ft. Purbachal Express Highway — a short drive from the airport. Car or ride-sharing (Uber, Pathao) is easiest.\n\nParking: organised, secured parking for 3,500+ cars.",
      "ICCB কুড়িল বিশ্বরোড, ঢাকা ১২২৯-এ, ৩০০ ফুট পূর্বাচল এক্সপ্রেসওয়ের পাশে — বিমানবন্দর থেকে অল্প দূরত্বে। গাড়ি বা রাইড-শেয়ারিং (উবার, পাঠাও) সবচেয়ে সহজ।\n\nপার্কিং: ৩,৫০০+ গাড়ির সুরক্ষিত পার্কিং।",
      "يقع ICCB في طريق كوريل بيشوا، دكا 1229، بجوار طريق بورباتشال السريع (300 قدم) — على مسافة قصيرة من المطار.\n\nموقف منظم وآمن لأكثر من 3,500 سيارة.",
      "ICCB 位于达卡 1229 Kuril Bishwa 路，紧邻 300 英尺 Purbachal 高速公路，距机场车程不远。\n\n停车：有组织、安全的停车场，可停 3,500 多辆车。"
    ),
    actions: (lang) => [{ label: lang === "bn" ? "যোগাযোগ ও ম্যাপ" : lang === "ar" ? "الخريطة" : lang === "zh" ? "地图与联系" : "Map & contact", href: path(lang, "/contact") }],
  },
];

export const HUMAN = {
  label: L("Talk to a human", "মানুষের সাথে কথা বলুন", "التحدث مع موظف", "人工客服"),
  waText: "Hello, I need to speak with an ICCB sales representative.",
};

export const GREETING = L(
  "Hello! 👋 Welcome to ICCB. I can help with booking, availability, prices, venues and catering. Pick a common question below or type your own.",
  "আসসালামু আলাইকুম! 👋 ICCB-তে স্বাগতম। বুকিং, তারিখ, দাম, ভেন্যু ও ক্যাটারিং নিয়ে সাহায্য করতে পারি। নিচের প্রশ্ন বেছে নিন বা নিজে লিখুন।",
  "مرحباً! 👋 أهلاً بك في ICCB. يمكنني المساعدة في الحجز والتواريخ والأسعار والقاعات والطعام. اختر سؤالاً أو اكتب سؤالك.",
  "您好！👋 欢迎来到 ICCB。我可以帮助您了解预订、档期、价格、场馆和餐饮。请选择下方常见问题或直接输入。"
);

export const UI = {
  title: L("ICCB Assistant", "ICCB সহকারী", "مساعد ICCB", "ICCB 助手"),
  online: L("Online · AI assistant", "অনলাইন · এআই সহকারী", "متصل · مساعد ذكي", "在线 · AI 助手"),
  placeholder: L("Type your question…", "আপনার প্রশ্ন লিখুন…", "اكتب سؤالك…", "输入您的问题…"),
  common: L("Common questions", "সাধারণ প্রশ্ন", "أسئلة شائعة", "常见问题"),
  more: L("More questions", "আরও প্রশ্ন", "المزيد من الأسئلة", "更多问题"),
  disclaimer: L("Prices and availability are confirmed by an ICCB manager.", "দাম ও তারিখ ICCB ম্যানেজার নিশ্চিত করবেন।", "يؤكد مدير ICCB الأسعار والتوافر.", "价格和档期以 ICCB 经理确认为准。"),
  offline: L(
    "Our AI assistant is busy right now, so here is our standard answer:",
    "এআই সহকারী এখন ব্যস্ত, তাই আমাদের সাধারণ উত্তরটি দিলাম:",
    "المساعد الذكي مشغول الآن، إليك إجابتنا المعتادة:",
    "AI 助手暂时繁忙，以下是标准答复："
  ),
  handover: L(
    "I couldn't reach our AI assistant just now. Our team will be happy to help — WhatsApp or call +88-01991-197719, or share your name and phone number and a manager will call you.",
    "এই মুহূর্তে এআই সহকারীর সাথে সংযোগ হয়নি। আমাদের টিম সাহায্য করবে — হোয়াটসঅ্যাপ বা কল করুন +88-01991-197719, অথবা আপনার নাম ও ফোন নম্বর দিন, ম্যানেজার ফোন করবেন।",
    "تعذّر الوصول إلى المساعد الآن. فريقنا جاهز للمساعدة — واتساب أو اتصل على +88-01991-197719، أو اترك اسمك ورقمك وسيتصل بك مدير.",
    "暂时无法连接 AI 助手。我们的团队乐意帮助您 — WhatsApp 或致电 +88-01991-197719，或留下姓名和电话，经理会回电。"
  ),
  leadThanks: L("Thank you{name}! I've shared your details with our booking team — a manager will call you at {phone} shortly.", "ধন্যবাদ{name}! আপনার তথ্য বুকিং টিমকে দিয়েছি — একজন ম্যানেজার শীঘ্রই {phone} নম্বরে ফোন করবেন।", "شكراً{name}! أرسلنا بياناتك لفريق الحجز — سيتصل بك مدير على {phone} قريباً.", "谢谢{name}！您的信息已转给预订团队，经理将很快致电 {phone}。"),
  restart: L("New chat", "নতুন চ্যাট", "محادثة جديدة", "新对话"),
};

/** Best built-in answer for a typed question (used when the AI server is unavailable). */
export function localAnswer(text: string): FaqItem | undefined {
  return FAQ.find((f) => f.keywords.test(text));
}
