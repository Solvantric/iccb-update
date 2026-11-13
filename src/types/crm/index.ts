/* ─── Shared ─────────────────────────────────────────────────────────────── */

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  isSample?: boolean;
}

export const ROLES = [
  "admin",
  "sales_manager",
  "sales_executive",
  "marketing",
  "operations",
  "accounts",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
  marketing: "Marketing",
  operations: "Operations",
  accounts: "Accounts",
};

export const CLIENT_TYPES = ["personal", "corporate", "cultural", "exhibition", "others"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  personal: "Personal",
  corporate: "Corporate",
  cultural: "Cultural",
  exhibition: "Exhibition / Fair",
  others: "Others",
};

export const EVENT_NATURES = [
  "Wedding",
  "Reception",
  "Holud",
  "Engagement",
  "Birthday",
  "Corporate",
  "Conference",
  "Seminar",
  "Product Launch",
  "Award Ceremony",
  "Concert",
  "Fashion Show",
  "Convocation",
  "Exhibition",
  "Trade Fair",
  "Other",
] as const;

export const SOURCES = [
  "website",
  "walk_in",
  "phone",
  "whatsapp",
  "chatbot",
  "referral",
  "radar",
] as const;
export type Source = (typeof SOURCES)[number];
export const SOURCE_LABELS: Record<Source, string> = {
  website: "Website",
  walk_in: "Walk-in",
  phone: "Phone",
  whatsapp: "WhatsApp",
  chatbot: "Chatbot",
  referral: "Referral",
  radar: "Opportunity Radar",
};

/* ─── Venues & pricing catalogue ─────────────────────────────────────────── */

export type HallKind = "hall" | "expo" | "seminar";
/** Tariff group shared by halls with the same rates. */
export type TariffGroup = "h123" | "h4" | "h5" | "expoA" | "expoB" | "seminar";

export interface Hall extends BaseRecord {
  code: string; // hall-1 … hall-5, expo-a, expo-b, seminar
  name: string;
  number: string; // "Hall-1"
  kind: HallKind;
  tariffGroup: TariffGroup;
  generatorKva?: number;
  areaSqft?: string;
  notes?: string;
  facilities: string[];
  adjacentAreas?: string;
  photo?: string;
  active: boolean;
  order: number;
}

/** Versioned rate rows: the newest row with effectiveFrom ≤ pricing date wins (per `key`). */
export interface Versioned {
  key: string;
  effectiveFrom: string; // yyyy-MM-dd
}

export interface HallTariff extends BaseRecord, Versioned {
  group: TariffGroup;
  label: string;
  peakWeekend: number; // Dec–Jan Thu–Sat
  peakWeekday: number; // Dec–Jan Sun–Wed
  offPeak: number; // Feb–Nov
  extraHour: number;
  note?: string;
  /** Special tariff rule for one month (yyyy-MM), e.g. from Smart Pricing. */
  month?: string;
}

export type SecurityKey = ClientType | "hall5";
export interface SecurityRule extends BaseRecord, Versioned {
  label: string;
  amount: number;
}

export type ChargeCategory = "per_person" | "hall" | "generator" | "other" | "stall";
export interface ServiceCharge extends BaseRecord, Versioned {
  category: ChargeCategory;
  name: string;
  unit: string;
  rate: number;
  rateHall5?: number;
  maxHours?: number;
  /** generator rates differ by hall code */
  hallCodes?: string[];
  note?: string;
}

export interface DecorationCategory extends BaseRecord, Versioned {
  code: "A" | "B" | "C";
  description: string;
  rateHall14: number;
  rateHall5: number;
}

export interface ExpoZoneTariff extends BaseRecord, Versioned {
  zone: "A" | "B";
  label: string;
  minSqft: number;
  maxSqft: number;
  ratePerSqftDay: number;
  securityPersonal: number;
  securityOthers: number;
  extraHour: number;
  washroomCultural: number;
  washroomOther: number;
  freeParkingPct: number;
  parkingRate: number;
}

export interface CancellationRule extends BaseRecord, Versioned {
  minDays: number;
  maxDays: number | null;
  shiftPct: number;
  cancelPct: number;
}

export interface TaxRule extends BaseRecord, Versioned {
  label: string;
  pct: number;
}

export type CapacityHall = "hall-1" | "hall-2" | "hall-3" | "hall-4";
export interface CapacityRow extends BaseRecord {
  layout: string;
  label: string;
  /** main + mezzanine/gallery + waiting */
  byHall: Record<CapacityHall, { main: number; extra: number; waiting?: number; note?: string }>;
  isCount?: boolean; // furniture rows (chairs, sofas) — not used for guest checks
}

export interface MenuPackage extends BaseRecord {
  name: string;
  cuisine: "Mughal" | "Continental" | "Multi-cuisine" | "Breakfast" | "Snacks";
  perHead: number;
  items: string[];
  published: boolean;
}

export interface IccbService extends BaseRecord {
  name: string;
  category: "Catering" | "Decoration" | "Sound & Light" | "LED & AV" | "Power" | "Extra hours" | "Logistics";
  unit: string;
  rate: number;
  description?: string;
}

/* ─── People ─────────────────────────────────────────────────────────────── */

export interface User extends BaseRecord {
  name: string;
  email: string;
  phone: string;
  role: Role;
  department: string;
  designation: string;
  active: boolean;
  roundRobinOrder: number;
  color: string;
}


export interface Client extends BaseRecord {
  clientNo: string;
  name: string;
  organization?: string;
  type: ClientType;
  mobile: string;
  phone?: string;
  email?: string;
  address?: string;
  tags: string[];
  notes?: string;
  nid?: string;
  passport?: string;
  tradeLicense?: string;
}


/* ─── Bookings ───────────────────────────────────────────────────────────── */

export const BOOKING_STATUSES = ["requested", "confirmed", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
};

export type DayType = "program" | "preparation";
export interface BookingDay {
  id: string;
  dayType: DayType;
  hallId: string;
  date: string; // yyyy-MM-dd
  start: string; // HH:mm
  end: string; // HH:mm
  sqft?: number; // expo zones
  parkingSqft?: number;
}

export type LineKind = "service" | "iccb" | "custom" | "extra" | "damage";
export interface AddonLine {
  id: string;
  kind: LineKind;
  catalogId?: string;
  name: string;
  unit: string;
  qty: number;
  rate: number;
  reason?: string;
}

export interface MenuSelection {
  id: string;
  packageId?: string;
  name: string;
  guests: number;
  perHead: number;
}

export type ApprovalState = "none" | "pending" | "approved" | "rejected";

export interface Discount {
  mode: "amount" | "percent";
  value: number;
  reason?: string;
  approval: ApprovalState;
  requestedBy?: string;
  decidedBy?: string;
}

export interface ChecklistMark {
  done: boolean;
  at?: string;
  by?: string;
  note?: string;
}

export type DocState = "yes" | "na" | "pending";
export interface BookingDocument {
  id: string;
  key: string;
  label: string;
  state: DocState;
  dueDate?: string;
  fileName?: string;
  fileData?: string; // data URL
}

export interface PpmMinutes {
  date: string;
  time?: string;
  venue?: string;
  attendees: string;
  agenda: Record<number, string>;
  notes: string;
  done: boolean;
}

export interface TimeLogRow {
  id: string;
  date?: string;
  start: string;
  end: string;
}
export interface CleaningVisit {
  id: string;
  time: string;
  rating: number; // 1–5
}

export interface FactSheet {
  hallOpenedBy: string;
  preparationHours: number;
  businessHours: number;
  actualGuests: number;
  extraHours: number;
  acLog: TimeLogRow[];
  generatorLog: { id: string; date: string; hours: number; minutes: number }[];
  foodProvider: string;
  kitchenUsedTime: string;
  driverPackets: number;
  foodStallQty: number;
  serviceBoys: number;
  atATimeSetup: number;
  tablePerSetup: number;
  headTable: number;
  waiting: number;
  hygiene: number;
  serviceDress: number;
  mannerism: number;
  cleaningLog: CleaningVisit[];
  summary: string;
  hallClosedBy: string;
  done: boolean;
}

export type Rating = 0 | 1 | 2 | 3; // Poor/Average/Good/Excellent
export interface Evaluation {
  ratings: Record<number, Rating>;
  suggestion: string;
  score: number;
  submittedAt: string;
  submittedVia: "staff" | "public";
}

export const DAMAGE_DEPARTMENTS = [
  "Maintenance / Civil",
  "Cleaning & Care",
  "Operation",
  "Safety & Security",
] as const;
export type DamageDepartment = (typeof DAMAGE_DEPARTMENTS)[number];
export interface DamageRow {
  id: string;
  department: DamageDepartment;
  item: string;
  time: string;
  uom: string;
  qty: number;
  rate: number;
}
export interface DamageClaim {
  rows: DamageRow[];
  certifiedBy: string;
  noDamage: boolean;
  done: boolean;
}

export interface Refund {
  amount: number;
  dueDate: string;
  refundedAt?: string;
  chequeNo?: string;
}

export interface ActivityItem {
  id: string;
  at: string;
  by: string;
  type: "status" | "note" | "call" | "change" | "payment" | "document" | "approval" | "system";
  text: string;
}

export interface ShiftRequest {
  newDate: string;
  newHallId: string;
  charge: number;
  pct: number;
  reason: string;
  status: ApprovalState;
  requestedBy: string;
  decidedBy?: string;
}

export interface Booking extends BaseRecord {
  bfNo: string;
  refNo: string;
  programRegNo: string;
  bookingDate: string;
  priceVersion: string; // pricing date (yyyy-MM-dd)

  clientId: string;
  clientType: ClientType;
  eventTitle: string;
  eventNature: string;
  contact: {
    name: string;
    organization?: string;
    address?: string;
    phone?: string;
    mobile: string;
    fax?: string;
    email?: string;
  };
  emergency: { name?: string; address?: string; mobile?: string; phone?: string };
  refundAccountName?: string;

  days: BookingDay[];
  guests: { optimum: number; maximum: number };
  cars: { optimum: number; maximum: number };
  layout: string;
  food: { breakfast: boolean; lunch: boolean; snacks: boolean; dinner: boolean };
  menus: MenuSelection[];

  addons: AddonLine[];
  decoration: { provider: "iccb" | "outside" | "none"; firm?: string; category?: "A" | "B" | "C" };
  discount: Discount;
  applyAit: boolean;

  status: BookingStatus;
  closed?: { kind: "cancelled" | "lost"; reason: string; at: string; charge: number } | null;
  checklist: Record<string, ChecklistMark>;
  documents: BookingDocument[];
  ppm?: PpmMinutes;
  factSheet?: FactSheet;
  evaluation?: Evaluation;
  damage?: DamageClaim;
  refund?: Refund;
  shiftRequest?: ShiftRequest | null;
  acknowledgement?: { accepted: boolean; signature?: string; at?: string };
  idVerified?: { mode: "upload" | "seen"; fileName?: string; fileData?: string; at: string; by: string };

  assignedTo?: string;
  referredBy?: { name: string; designation?: string };
  salesOfficer?: { name: string; designation?: string };
  source: Source;
  utm?: string;
  tags: string[];
  notes?: string;
  preferredMeetingTime?: string;
  meetingAt?: string;
  firstResponseAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  activity: ActivityItem[];
}


/** Public website + staff "new booking" form. */

/* ─── Money ──────────────────────────────────────────────────────────────── */

export const PAYMENT_METHODS = ["cash", "cheque", "pay_order"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  cheque: "Cheque",
  pay_order: "Pay order",
};

export interface Payment extends BaseRecord {
  mrNo: string;
  bookingId: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  chequeNo?: string;
  bank?: string;
  date: string;
  receivedBy: string;
  purpose: "advance" | "balance" | "security" | "extra" | "other";
  note?: string;
}


export type DocKind =
  | "estimate"
  | "invoice"
  | "money_receipt"
  | "booking_form"
  | "refund_note"
  | "ppm"
  | "fact_sheet"
  | "evaluation"
  | "damage_claim";
export const DOC_KIND_LABELS: Record<DocKind, string> = {
  estimate: "Provisional Estimate",
  invoice: "Invoice",
  money_receipt: "Money Receipt",
  booking_form: "Booking Form",
  refund_note: "Security Refund Note",
  ppm: "PPM Minutes",
  fact_sheet: "Program Fact Sheet",
  evaluation: "Evaluation of Service",
  damage_claim: "Damage Claim",
};

/** A generated document (version snapshot). */
export interface Invoice extends BaseRecord {
  number: string;
  kind: DocKind;
  bookingId: string;
  clientName: string;
  version: number;
  total: number;
  received: number;
  balance: number;
  paymentId?: string;
  createdBy: string;
  /** Frozen DocModel at generation time (version history). */
  snapshot?: unknown;
}

/* ─── Sales & marketing ──────────────────────────────────────────────────── */

export const ENQUIRY_TYPES = ["enquiry", "ask", "chatbot", "exhibitor", "contact", "booking"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];
export interface Enquiry extends BaseRecord {
  type: EnquiryType;
  source: Source;
  name: string;
  mobile: string;
  email?: string;
  eventType?: string;
  preferredDate?: string;
  guests?: number;
  hallPreference?: string;
  message: string;
  status: "new" | "assigned" | "replied" | "converted" | "closed";
  assignedTo?: string;
  replyNote?: string;
  bookingId?: string;
  language?: string;
}


export const LEAD_STAGES = ["new", "contacted", "meeting", "confirmed", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export interface Lead extends BaseRecord {
  name: string;
  organization?: string;
  mobile: string;
  email?: string;
  source: Source;
  stage: LeadStage;
  score: number;
  eventType?: string;
  expectedDate?: string;
  guests?: number;
  value: number;
  assignedTo?: string;
  lostReason?: string;
  firstResponseAt?: string;
  radarId?: string;
  enquiryId?: string;
  bookingId?: string;
  pitch?: string;
  notes?: string;
}


export const TASK_TYPES = [
  "call",
  "meeting",
  "follow_up",
  "balance_due",
  "document_due",
  "ppm_due",
  "refund_due",
  "repeat_event",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  call: "Call",
  meeting: "Meeting",
  follow_up: "Follow-up",
  balance_due: "Balance due",
  document_due: "Document due",
  ppm_due: "PPM due",
  refund_due: "Refund due",
  repeat_event: "Repeat event",
};
export interface Task extends BaseRecord {
  title: string;
  type: TaskType;
  dueAt: string;
  status: "open" | "done";
  snoozedUntil?: string;
  assignedTo?: string;
  bookingId?: string;
  leadId?: string;
  clientId?: string;
  notes?: string;
  auto?: boolean;
}


export interface Notification extends BaseRecord {
  title: string;
  body: string;
  kind: "booking" | "lead" | "approval" | "payment" | "task" | "system" | "hot_lead";
  href?: string;
  read: boolean;
  userId?: string | null; // null → everyone
  roles?: Role[];
}

export interface RadarEvent extends BaseRecord {
  title: string;
  organizer: string;
  industry: string;
  category: "Trade fair" | "Exhibition" | "Conference" | "Concert" | "Convocation" | "Summit" | "Wedding expo" | "Education fair";
  scope: "national" | "international";
  country: string;
  flag: string;
  city: string;
  startDate: string;
  endDate: string;
  expectedAttendance: number;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  score: number;
  summary: string;
  whyFits: string;
  suggestedHall: string;
  pitch: string[];
  recurrence: "annual" | "biennial" | "one-off";
  lastHeldAt?: string;
  status: "new" | "saved" | "contacted" | "converted" | "dismissed";
  note?: string;
  isNew?: boolean;
  leadId?: string;
}


export interface AnalyticsEvent extends BaseRecord {
  type: "visit" | "venue_view" | "availability_check" | "estimate" | "booking_form" | "confirmed";
  page: string;
  source: "Google" | "Facebook" | "Direct" | "Instagram" | "LinkedIn" | "Referral" | "Email";
  device: "Desktop" | "Mobile" | "Tablet";
  country: string;
  language: "en" | "bn" | "ar" | "zh";
  visitorId: string;
  leadName?: string;
  hallCode?: string;
  at: string;
}

export const CONTENT_SECTIONS = [
  "hero",
  "venues",
  "services",
  "ventures",
  "menu",
  "gallery",
  "news",
  "faq",
  "testimonials",
  "expo_clients",
] as const;
export type ContentSection = (typeof CONTENT_SECTIONS)[number];
export interface ContentItem extends BaseRecord {
  section: ContentSection;
  title: string;
  subtitle?: string;
  body?: string;
  image?: string;
  href?: string;
  published: boolean;
  order: number;
}

export interface AuditEntry extends BaseRecord {
  at: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  entity: string;
  entityId: string;
  action: "create" | "update" | "delete" | "restore" | "status" | "override" | "approve" | "reject" | "reset" | "import";
  summary: string;
  before?: unknown;
  after?: unknown;
}

export interface NumberFormat {
  prefix: string;
  digits: number;
  monthly: boolean; // includes YYYYMM
}

export interface Settings extends BaseRecord {
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgEmail: string;
  numberFormats: Record<"booking" | "client" | "mr" | "invoice" | "estimate" | "refund" | "doc", NumberFormat>;
  programRegStart: number;
  counters: Record<string, number>;
  balanceDueDays: number;
  advancePct: number;
  discountApprovalThreshold: number; // BDT
  holdHours: number;
  firstResponseTargetHours: number;
  hotLeadScore: number;
  holidays: { date: string; name: string }[];
  notifyHotLead: boolean;
  notifyOverdue: boolean;
  digitGrouping: "intl" | "bd";
  roundRobinCursor: number;
  ignoredSuggestions?: string[];
}

/** Re-exported convenience for repositories. */
export type Entity =
  | Hall
  | HallTariff
  | SecurityRule
  | ServiceCharge
  | DecorationCategory
  | ExpoZoneTariff
  | CancellationRule
  | TaxRule
  | CapacityRow
  | MenuPackage
  | IccbService
  | User
  | Client
  | Booking
  | Payment
  | Invoice
  | Enquiry
  | Lead
  | Task
  | Notification
  | RadarEvent
  | AnalyticsEvent
  | ContentItem
  | AuditEntry
  | Settings;

/* ─── Form inputs (plain types — validation is minimal: name + phone only) ── */

export type UserInput = Pick<User, "name" | "email" | "phone" | "role" | "department" | "designation" | "active" | "roundRobinOrder">;

export type ClientInput = Pick<Client, "name" | "type" | "mobile"> &
  Partial<Pick<Client, "organization" | "phone" | "email" | "address" | "tags" | "notes">>;

export interface BookingRequestInput {
  clientType: ClientType;
  eventTitle: string;
  eventNature: string;
  days: Omit<BookingDay, "id">[];
  guests: { optimum: number; maximum: number };
  cars: { optimum: number; maximum: number };
  food: Booking["food"];
  decorationProvider: "iccb" | "outside" | "none";
  name: string;
  organization?: string;
  mobile: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyName?: string;
  emergencyMobile?: string;
  referredBy?: string;
  preferredMeetingTime?: string;
  notes?: string;
  source?: Source;
  layout?: string;
  assignedTo?: string;
}

export type PaymentInput = Omit<Payment, keyof BaseRecord | "mrNo" | "clientId">;

export type EnquiryInput = Pick<Enquiry, "name" | "mobile"> &
  Partial<Pick<Enquiry, "type" | "source" | "email" | "eventType" | "preferredDate" | "guests" | "hallPreference" | "message" | "language">>;

export type LeadInput = Pick<Lead, "name" | "mobile" | "source"> &
  Partial<Pick<Lead, "organization" | "email" | "stage" | "eventType" | "expectedDate" | "guests" | "value" | "assignedTo" | "notes">>;

export type TaskInput = Pick<Task, "title" | "type" | "dueAt"> &
  Partial<Pick<Task, "assignedTo" | "bookingId" | "leadId" | "notes">>;

/** The only validation in the CRM: a name and a phone number. */
export function requireNameAndPhone(v: { name?: string; mobile?: string }): string | null {
  if (!v.name || v.name.trim().length < 2) return "Please enter a name";
  if (!v.mobile || v.mobile.replace(/\D/g, "").length < 6) return "Please enter a phone number";
  return null;
}
