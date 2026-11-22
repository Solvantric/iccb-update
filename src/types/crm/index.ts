/** ICCB CRM — entities. Everything lives in localStorage (`iccb-crm-v4:*`). */

export type Role = "admin" | "sales" | "operations" | "marketing";
export const ROLE_LABELS: Record<Role, string> = { admin: "Admin", sales: "Sales", operations: "Operations", marketing: "Marketing" };

export interface BaseRecord {
  id: string;
  createdAt: string;
  isSample?: boolean;
}

/* ─── Clients ────────────────────────────────────────────────────────────── */

export const CLIENT_TYPES = ["Individual", "Corporate", "Government", "NGO"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export interface Client extends BaseRecord {
  clientNo: string;
  name: string;
  type: ClientType;
  organization?: string;
  mobile: string;
  email?: string;
  address?: string;
  /** NID / passport for individuals, trade licence for organisations. */
  idNo?: string;
  tags: string[];
  notes?: string;
}

/* ─── Booking ────────────────────────────────────────────────────────────── */

export type BookingStatus = "reserved" | "booked" | "closed" | "cancelled";
export const BOOKING_STATUSES: BookingStatus[] = ["reserved", "booked", "closed", "cancelled"];
export const STATUS_LABELS: Record<BookingStatus, string> = { reserved: "Reserved", booked: "Booked", closed: "Closed", cancelled: "Cancelled" };

export const EVENT_TYPES = ["Wedding", "Reception", "Corporate", "Conference", "Exhibition", "Concert", "Other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const SLOTS = ["Day (10 AM – 4 PM)", "Evening (5 PM – 11 PM)", "Full day"] as const;
export type Slot = (typeof SLOTS)[number];

export const LAYOUTS = ["Full banquet", "Banquet with stage", "Theatre", "Classroom", "Exhibition booths", "Cocktail"] as const;
export type Layout = (typeof LAYOUTS)[number];

export type Decoration = "none" | "basic" | "standard" | "premium" | "outsideA" | "outsideB" | "outsideC";
export const DECORATION_LABELS: Record<Decoration, string> = {
  none: "None",
  basic: "ICCB Basic",
  standard: "ICCB Standard",
  premium: "ICCB Premium",
  outsideA: "Outside firm — Cat. A (full ceiling, thematic)",
  outsideB: "Outside firm — Cat. B (backdrop, heavy light)",
  outsideC: "Outside firm — Cat. C (simple, small stage)",
};

export type Meal = "breakfast" | "lunch" | "snacks" | "dinner";
export const MEALS: Meal[] = ["breakfast", "lunch", "snacks", "dinner"];
export const MEAL_LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", snacks: "Evening snacks", dinner: "Dinner" };

export interface MealLine {
  persons: number;
  /** Menu package; falls back to the default per-person meal rate. */
  menuId?: string;
}
export interface ServiceLine {
  serviceId: string;
  qty: number;
}
export interface CustomLine {
  id: string;
  name: string;
  qty: number;
  rate: number;
}

export interface AddOns {
  decoration: Decoration;
  /** Outside decoration firm name (categories A/B/C). */
  decorationFirm?: string;
  breakfast?: MealLine;
  lunch?: MealLine;
  snacks?: MealLine;
  dinner?: MealLine;
  extraHours?: number;
  services?: ServiceLine[];
  custom?: CustomLine[];
}

export interface HistoryEntry {
  at: string;
  by: string;
  text: string;
}

/** Event-day run sheet (Operations → Events). */
export const RUN_STEPS = ["Hall opened", "Setup ready", "Sound check", "Food served", "Hall closed"] as const;
export type RunStep = (typeof RUN_STEPS)[number];

export const FEEDBACK_AREAS = ["Venue", "Food", "Service", "Cleanliness", "Sound & light"] as const;
export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];
export interface Feedback {
  ratings: Record<FeedbackArea, number>; // 1–5
  comment?: string;
  at: string;
}
export interface DamageItem {
  id: string;
  item: string;
  qty: number;
  rate: number;
}

export interface Booking extends BaseRecord {
  ref: string;
  clientId?: string;
  name: string;
  mobile: string;
  email?: string;
  organization?: string;
  eventName: string;
  eventType: EventType;
  hallId: string;
  /** yyyy-MM-dd */
  date: string;
  slot: Slot;
  layout: Layout;
  guests: number;
  cars?: number;
  coordinator?: string;
  note?: string;
  status: BookingStatus;
  contacted: boolean;
  addOns: AddOns;
  discount: number;
  history: HistoryEntry[];
  source: "website" | "staff";
  /** Operations */
  runSheet?: Partial<Record<RunStep, boolean>>;
  actualGuests?: number;
  feedback?: Feedback;
  damages?: DamageItem[];
}

/* ─── Client review links (Quality) ──────────────────────────────────────── */

export const REVIEW_QUESTIONS = [
  "How easy was it to book ICCB?",
  "How helpful was our sales representative?",
  "How was the hall's cleanliness and comfort?",
  "How was the hall set-up and layout on the day?",
  "How was the food quality and taste?",
  "How was the food service and serving staff?",
  "How was the sound, light and AV support?",
  "How were parking and guest arrival?",
  "How good was the value for money?",
  "How likely are you to book ICCB again?",
] as const;
export const REVIEW_RATINGS = ["Bad", "Normal", "Good", "Excellent"] as const;
export type ReviewRating = (typeof REVIEW_RATINGS)[number];

export interface ReviewRequest extends BaseRecord {
  /** Secret part of the shareable link. */
  token: string;
  bookingId?: string;
  /** Who the link was sent to (from the booking). */
  clientName: string;
  mobile?: string;
  eventName?: string;
  sentBy: string;
  status: "pending" | "submitted";
  /** One value per question, 1 = Bad … 4 = Excellent. */
  answers?: number[];
  comment?: string;
  /** Who actually filled the form (pre-filled from the booking, editable). */
  reviewerName?: string;
  reviewerMobile?: string;
  submittedAt?: string;
}

/** 1–4 average → Bad / Normal / Good / Excellent. */
export function ratingLabel(avg: number): ReviewRating {
  return avg >= 3.5 ? "Excellent" : avg >= 2.5 ? "Good" : avg >= 1.5 ? "Normal" : "Bad";
}

/* ─── Payments ───────────────────────────────────────────────────────────── */

export const PAYMENT_METHODS = ["Cash", "Bank transfer", "Cheque", "bKash", "Nagad", "Card at counter"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_KINDS = ["Advance", "Installment", "Final", "Security deposit", "Security refund"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];
/** Kinds that count against the bill (security money is held separately). */
export const isBillPayment = (k: PaymentKind) => k !== "Security deposit" && k !== "Security refund";

export interface Payment extends BaseRecord {
  receiptNo: string;
  bookingId: string;
  kind: PaymentKind;
  amount: number;
  /** yyyy-MM-dd */
  date: string;
  method: PaymentMethod;
  /** Cheque no. / transaction ID */
  reference?: string;
  receivedBy: string;
  note?: string;
}

/* ─── Meetings (PPM) ─────────────────────────────────────────────────────── */

export type MeetingStatus = "scheduled" | "done" | "cancelled";
export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = { scheduled: "Scheduled", done: "Done", cancelled: "Cancelled" };
export const MEETING_TYPES = ["Site visit", "PPM", "Follow-up call", "Final briefing"] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

export interface Meeting extends BaseRecord {
  bookingId?: string;
  clientName: string;
  mobile: string;
  type: MeetingType;
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm */
  time: string;
  rep: string;
  location?: string;
  note?: string;
  outcome?: string;
  status: MeetingStatus;
}

/* ─── Enquiries ──────────────────────────────────────────────────────────── */

export const ENQUIRY_SOURCES = ["Booking form", "Contact form", "Ask a question", "Enquiry form", "Chatbot"] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

export interface Enquiry extends BaseRecord {
  type: "booking" | "question";
  source: EnquirySource;
  bookingId?: string;
  name: string;
  mobile: string;
  email?: string;
  message: string;
  seen: boolean;
}

/* ─── Halls, catalogs, pricing ───────────────────────────────────────────── */

export interface Hall extends BaseRecord {
  name: string;
  code: string;
  capacity: number;
  areaSqft: number;
  weekdayRate: number;
  weekendRate: number;
  extraHourRate: number;
  features: string[];
  active: boolean;
}

export interface MenuPackage extends BaseRecord {
  name: string;
  meal: Meal;
  perHead: number;
  items: string[];
  active: boolean;
}

export const SERVICE_CATEGORIES = ["Sound & light", "LED & AV", "Power", "Furniture", "Staff", "Logistics", "Other"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export interface ServiceItem extends BaseRecord {
  name: string;
  category: ServiceCategory;
  unit: string;
  rate: number;
  active: boolean;
}

export interface AddOnRates {
  decorationBasic: number;
  decorationStandard: number;
  decorationPremium: number;
  outsideA: number;
  outsideB: number;
  outsideC: number;
  /** Default per-person meal rates (when no menu package is picked). */
  breakfast: number;
  lunch: number;
  snacks: number;
  dinner: number;
  /** Service charge per person: lunch/dinner and breakfast/snacks. */
  serviceChargeMain: number;
  serviceChargeLight: number;
}

/** A date-range price adjustment (from Demand & Pricing). */
export interface SpecialPrice extends BaseRecord {
  from: string;
  to: string;
  /** +10 = 10% up, -10 = 10% off. Applies to hall rent. */
  percent: number;
  label: string;
}

/* ─── Marketing ──────────────────────────────────────────────────────────── */

export interface RadarItem extends BaseRecord {
  scope: "national" | "international";
  title: string;
  organizer: string;
  date: string;
  location: string;
  category: string;
  score: number;
  summary: string;
  eventType: EventType;
  guests: number;
  dismissed: boolean;
  /** Set when staff clicked "Add as lead". */
  leadAt?: string;
}

export type TrafficSource = "Google" | "Facebook" | "Direct" | "WhatsApp" | "Other";
export const TRAFFIC_SOURCES: TrafficSource[] = ["Google", "Facebook", "Direct", "WhatsApp", "Other"];
export type Device = "Mobile" | "Desktop" | "Tablet";
export const DEVICES: Device[] = ["Mobile", "Desktop", "Tablet"];
export type AnalyticsType = "visit" | "venue_view" | "form_open" | "form_submit";

export interface AnalyticsEvent extends BaseRecord {
  type: AnalyticsType;
  source: TrafficSource;
  device?: Device;
  page?: string;
}

export type ContentSection = "hero" | "venues" | "gallery" | "faq" | "testimonials";

export interface ContentItem extends BaseRecord {
  section: ContentSection;
  title: string;
  subtitle?: string;
  body?: string;
  image?: string;
  published: boolean;
  order: number;
}

/* ─── Admin ──────────────────────────────────────────────────────────────── */

export interface User extends BaseRecord {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
}

export interface Settings {
  orgName: string;
  phone: string;
  email: string;
  address: string;
  refPrefix: string;
  /** 0 = Sunday … 6 = Saturday. Default Friday (5) & Saturday (6). */
  weekendDays: number[];
  addOnRates: AddOnRates;
  /** VAT % on food and food service charge. */
  foodVatPercent: number;
  /** Refundable security money by event type. */
  securityByType: Record<EventType, number>;
  /** Days after the event to refund security money. */
  refundDays: number;
  paymentTerms: string;
}

/** Minimal validation (name + BD mobile). Returns an error message or null. */
export const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;
export function validateContact(name: string, mobile: string): string | null {
  if (!name.trim()) return "Please enter a name.";
  if (!BD_MOBILE.test(mobile.replace(/[\s-]/g, ""))) return "Please enter a valid Bangladeshi mobile number (01XXXXXXXXX).";
  return null;
}

/** Digits-only mobile for matching clients (01711-234567 → 01711234567). */
export const normMobile = (m: string) => m.replace(/\D/g, "").replace(/^88/, "");

/* ─── Leads (sales funnel) ───────────────────────────────────────────────── */

export const LEAD_STAGES = ["discover", "interested", "appraisal", "confirmed", "customer"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = { discover: "Discover", interested: "Interested", appraisal: "Appraisal", confirmed: "Confirmed", customer: "Customer" };
export const LEAD_STAGE_HINTS: Record<LeadStage, string> = {
  discover: "New, not yet qualified",
  interested: "Replied, wants details",
  appraisal: "Site visit or quotation",
  confirmed: "Date held, advance due",
  customer: "Advance paid, converted",
};

export type LeadSource = "ai" | "website" | "manual";
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = { ai: "AI search", website: "Website", manual: "Manual" };

export const AI_PLATFORMS = ["LinkedIn", "Facebook event", "News article", "Google search", "Tender portal"] as const;
export const MANUAL_CHANNELS = ["Phone call", "Walk-in", "Referral", "Expo / event", "Social media"] as const;
export type ManualChannel = (typeof MANUAL_CHANNELS)[number];

/** Where a lead came from — enough detail to trace it back. */
export interface LeadTrace {
  /** AI search */
  platform?: string;
  query?: string;
  url?: string;
  signal?: string;
  /** 0–100 match score from the AI. */
  score?: number;
  /** Website */
  landingPage?: string;
  formPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  device?: Device;
  bookingId?: string;
  bookingRef?: string;
  /** Manual */
  channel?: ManualChannel;
  referredBy?: string;
  addedBy?: string;
}

export interface LeadActivity {
  at: string;
  by: string;
  kind: "created" | "stage" | "assign" | "note" | "call" | "lost" | "reopen" | "step";
  text: string;
}

/* ─── Lead journey: what the team did at each funnel step ────────────────── */

/** Typical work at each step, offered as quick choices when logging an update. */
export const LEAD_STEP_ACTIONS: Record<LeadStage, readonly string[]> = {
  discover: ["First call", "WhatsApp message", "Email", "Researched the client", "Found the decision maker"],
  interested: ["Follow-up call", "Sent brochure", "Shared hall options & rates", "Client meeting", "Office visit"],
  appraisal: ["Site visit at ICCB", "Sent quotation", "Menu tasting", "Price negotiation", "Revised quotation"],
  confirmed: ["Date held", "Contract sent", "Advance requested", "Advance received", "Planning call"],
  customer: ["Handed over to operations", "Event-day check", "Feedback call", "Thank-you message"],
};

/** How the employee reached the client. */
export const LEAD_STEP_MODES = ["Phone call", "WhatsApp", "Email", "Video call", "Met at ICCB", "Visited client"] as const;
export type LeadStepMode = (typeof LEAD_STEP_MODES)[number];
/** Modes where the employee met the client somewhere, so "where" is asked. */
export const IN_PERSON_MODES: readonly LeadStepMode[] = ["Met at ICCB", "Visited client"];

export type LeadStepOutcome = "positive" | "neutral" | "negative";
export const LEAD_STEP_OUTCOMES: Record<LeadStepOutcome, string> = { positive: "Went well", neutral: "No decision yet", negative: "Not good" };

/** One piece of work an employee did on a lead, at one funnel step. */
export interface LeadStepLog {
  id: string;
  stage: LeadStage;
  /** When it happened (ISO). */
  at: string;
  /** Employee who did it. */
  byId?: string;
  by: string;
  action: string;
  mode: LeadStepMode;
  /** Where they met: client office address, ICCB hall, etc. */
  place?: string;
  /** ICCB halls shown to the client. */
  hallIds?: string[];
  /** People they met or spoke to. */
  metWith?: string;
  /** Quotation or advance amount in BDT. */
  amount?: number;
  outcome: LeadStepOutcome;
  /** What the employee did. */
  note: string;
  /** What the client said or asked for. */
  clientSaid?: string;
}

export interface Lead extends BaseRecord {
  code: string;
  name: string;
  organization?: string;
  mobile: string;
  email?: string;
  eventName: string;
  eventType: EventType;
  guests: number;
  hallId?: string;
  /** yyyy-MM-dd, approximate. */
  eventDate?: string;
  /** Estimated deal value in BDT. */
  value: number;
  source: LeadSource;
  trace: LeadTrace;
  stage: LeadStage;
  /** When the lead entered each stage it reached. */
  stageAt: Partial<Record<LeadStage, string>>;
  /** Employees working this lead (one or more). Empty = unassigned. */
  ownerIds: string[];
  /** Booking made for this lead. The lead becomes a Customer only when this booking is marked Booked. */
  bookingId?: string;
  bookingRef?: string;
  lost?: boolean;
  lostReason?: string;
  /** Next follow-up, yyyy-MM-dd. */
  nextAt?: string;
  nextAction?: string;
  activity: LeadActivity[];
  /** Detailed work log per funnel step (newest first). */
  journey?: LeadStepLog[];
}

export const LOST_REASONS = ["Price too high", "Date not available", "Chose another venue", "Event cancelled", "No response"] as const;
