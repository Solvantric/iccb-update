import { z } from "zod";

// ─── Localized string ─────────────────────────────────────────────────────
export const LocalizedStringSchema = z.object({
  en: z.string(),
  bn: z.string().optional(),
  ar: z.string().optional(),
  zh: z.string().optional(),
});
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

// ─── Hall / Venue ─────────────────────────────────────────────────────────
export const HallSlugEnum = z.enum([
  "gulnaksha",
  "pushpoguchcho",
  "rajdarshan",
  "noboratri",
  "pushpanjali",
  "seminar-hall",
  "expo-village",
]);
export type HallSlug = z.infer<typeof HallSlugEnum>;

export const CapacityLayoutSchema = z.object({
  theatre: z.number(),
  classroom: z.number().optional(),
  banquet: z.number(),
  cocktail: z.number().optional(),
  exhibition: z.number().optional(),
});

export const HallSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedStringSchema,
  area: z.number(), // sq ft
  ceilingHeight: z.number().optional(), // ft
  capacity: CapacityLayoutSchema,
  features: z.array(LocalizedStringSchema),
  image: z.string(),
  images: z.array(z.string()),
  priceFrom: z.number().optional(), // BDT
  isSample: z.boolean().default(true),
});
export type Hall = z.infer<typeof HallSchema>;

// ─── Availability ─────────────────────────────────────────────────────────
export const ShiftEnum = z.enum(["lunch", "dinner", "fullday"]);
export type Shift = z.infer<typeof ShiftEnum>;

export const AvailabilityStatusEnum = z.enum(["available", "reserved", "booked", "closed"]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusEnum>;

export const AvailabilitySlotSchema = z.object({
  hallId: z.string(),
  date: z.string(), // YYYY-MM-DD
  shift: ShiftEnum,
  status: AvailabilityStatusEnum,
  holdExpiresAt: z.string().optional(),
  bookingId: z.string().optional(),
});
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;

// ─── Service ──────────────────────────────────────────────────────────────
export const ServiceSlugEnum = z.enum([
  "venue-rental",
  "catering",
  "decoration",
  "event-management",
  "heritage-restaurant",
  "expo-support",
]);
export type ServiceSlug = z.infer<typeof ServiceSlugEnum>;

export const ServiceSchema = z.object({
  id: z.string(),
  slug: ServiceSlugEnum,
  name: LocalizedStringSchema,
  tagline: LocalizedStringSchema,
  description: LocalizedStringSchema,
  icon: z.string(),
  image: z.string(),
  features: z.array(LocalizedStringSchema),
  isSample: z.boolean().default(false),
});
export type Service = z.infer<typeof ServiceSchema>;

// ─── Menu ─────────────────────────────────────────────────────────────────
export const MenuPackageSchema = z.object({
  id: z.string(),
  name: LocalizedStringSchema,
  pricePerHead: z.number(), // BDT
  items: z.array(LocalizedStringSchema),
  cuisine: z.string(),
  tags: z.array(z.string()),
  isSample: z.boolean().default(true),
});
export type MenuPackage = z.infer<typeof MenuPackageSchema>;

// ─── Pricing ──────────────────────────────────────────────────────────────
export const DecorationTierEnum = z.enum(["classic", "premium", "royal"]);
export type DecorationTier = z.infer<typeof DecorationTierEnum>;

export const EventTypeEnum = z.enum([
  "conference",
  "exhibition",
  "wedding",
  "concert",
  "corporate",
  "seminar",
  "expo",
  "other",
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const EstimateInputSchema = z.object({
  eventType: EventTypeEnum,
  hallId: z.string(),
  shift: ShiftEnum,
  guests: z.number().min(1),
  cateringPackageId: z.string().optional(),
  decorationTier: DecorationTierEnum.optional(),
  addons: z.array(z.string()).default([]),
  date: z.string().optional(),
});
export type EstimateInput = z.infer<typeof EstimateInputSchema>;

export const EstimateLineItemSchema = z.object({
  label: z.string(),
  amount: z.number(),
  unit: z.string().optional(),
});

export const EstimateOutputSchema = z.object({
  lineItems: z.array(EstimateLineItemSchema),
  subtotal: z.number(),
  vat: z.number(),
  serviceCharge: z.number(),
  total: z.number(),
  rangeLow: z.number(),
  rangeHigh: z.number(),
  currency: z.literal("BDT"),
  isPeakDate: z.boolean(),
});
export type EstimateOutput = z.infer<typeof EstimateOutputSchema>;

// ─── Lead / Enquiry ───────────────────────────────────────────────────────
export const LeadSourceEnum = z.enum([
  "website",
  "chat",
  "whatsapp",
  "phone",
  "radar",
  "referral",
  "other",
]);
export type LeadSource = z.infer<typeof LeadSourceEnum>;

export const LeadStatusEnum = z.enum([
  "new",
  "contacted",
  "site-visit",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);
export type LeadStatus = z.infer<typeof LeadStatusEnum>;

export const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  organization: z.string().optional(),
  phone: z.string(),
  email: z.string().email().optional(),
  eventType: EventTypeEnum.optional(),
  hallId: z.string().optional(),
  date: z.string().optional(),
  guests: z.number().optional(),
  notes: z.string().optional(),
  source: LeadSourceEnum,
  status: LeadStatusEnum.default("new"),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  assignedTo: z.string().optional(),
  score: z.number().min(0).max(100).default(0),
  isHot: z.boolean().default(false),
  isSample: z.boolean().default(false),
  lostReason: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

// ─── Booking ──────────────────────────────────────────────────────────────
export const BookingStatusEnum = z.enum([
  "pending_hold",
  "on_hold",
  "confirmed",
  "cancelled",
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export const BookingSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  leadId: z.string().optional(),
  hallId: z.string(),
  date: z.string(),
  shift: ShiftEnum,
  status: BookingStatusEnum,
  holdExpiresAt: z.string().optional(),
  eventType: EventTypeEnum,
  guests: z.number(),
  estimatedTotal: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  isSample: z.boolean().default(false),
});
export type Booking = z.infer<typeof BookingSchema>;

// ─── Enquiry form ─────────────────────────────────────────────────────────
export const EnquiryFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  organization: z.string().optional(),
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email("Invalid email").optional(),
  eventType: EventTypeEnum,
  hallId: z.string().optional(),
  date: z.string().optional(),
  guests: z.number().min(1).optional(),
  services: z.array(z.string()).default([]),
  notes: z.string().optional(),
  preferredContactTime: z.string().optional(),
  language: z.enum(["en", "bn", "ar", "zh"]).default("en"),
  organizerType: z.enum(["company", "agency", "individual"]).default("individual"),
  consent: z.boolean().refine((v) => v, "You must consent"),
  utmSource: z.string().optional(),
});
export type EnquiryForm = z.infer<typeof EnquiryFormSchema>;

// ─── Ask form ─────────────────────────────────────────────────────────────
export const AskFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  emailOrPhone: z.string().min(5, "Contact required"),
  question: z.string().min(10, "Please describe your question"),
  language: z.enum(["en", "bn", "ar", "zh"]).default("en"),
});
export type AskForm = z.infer<typeof AskFormSchema>;

// ─── Chat ─────────────────────────────────────────────────────────────────
export const ChatMessageRoleEnum = z.enum(["user", "assistant"]);
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: ChatMessageRoleEnum,
  content: z.string(),
  timestamp: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatSessionSchema = z.object({
  id: z.string(),
  messages: z.array(ChatMessageSchema),
  leadId: z.string().optional(),
  language: z.string().default("en"),
  status: z.enum(["active", "handed-off", "closed"]),
  createdAt: z.string(),
  isSample: z.boolean().default(false),
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

// ─── Analytics ────────────────────────────────────────────────────────────
export const AnalyticsEventSchema = z.object({
  event: z.string(),
  visitorId: z.string(),
  sessionId: z.string(),
  locale: z.string().optional(),
  page: z.string().optional(),
  leadId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// ─── Expo ─────────────────────────────────────────────────────────────────
export const ExpoEventSchema = z.object({
  id: z.string(),
  name: LocalizedStringSchema,
  date: z.string(),
  endDate: z.string().optional(),
  hall: z.string().optional(),
  industry: z.string(),
  country: z.string().optional(),
  attendees: z.number().optional(),
  recurrence: z.enum(["annual", "biennial", "other"]).optional(),
  lastEditionDate: z.string().optional(),
  organizerContact: z.string().optional(),
  image: z.string().optional(),
  isSample: z.boolean().default(true),
});
export type ExpoEvent = z.infer<typeof ExpoEventSchema>;

// ─── Opportunity Radar ────────────────────────────────────────────────────
export const RadarItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  date: z.string(),
  location: z.string().optional(),
  industry: z.string(),
  country: z.string().optional(),
  relevanceScore: z.number().min(0).max(100),
  summary: z.string(),
  suggestedPitch: z.string().optional(),
  status: z.enum(["active", "dismissed", "converted", "saved"]).default("active"),
  isSample: z.boolean().default(true),
});
export type RadarItem = z.infer<typeof RadarItemSchema>;

// ─── Testimonial ─────────────────────────────────────────────────────────
export const TestimonialSchema = z.object({
  id: z.string(),
  name: z.string(),
  organization: z.string().optional(),
  role: z.string().optional(),
  content: LocalizedStringSchema,
  rating: z.number().min(1).max(5).default(5),
  eventType: z.string().optional(),
  image: z.string().optional(),
  isSample: z.boolean().default(true),
});
export type Testimonial = z.infer<typeof TestimonialSchema>;

// ─── News ─────────────────────────────────────────────────────────────────
export const NewsArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: LocalizedStringSchema,
  excerpt: LocalizedStringSchema,
  content: LocalizedStringSchema,
  image: z.string(),
  publishedAt: z.string(),
  category: z.string(),
  author: z.string().optional(),
  isSample: z.boolean().default(true),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

// ─── Gallery ──────────────────────────────────────────────────────────────
export const GalleryItemSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: LocalizedStringSchema,
  category: z.string(),
  photographer: z.string().optional(),
  source: z.string().optional(),
  width: z.number(),
  height: z.number(),
  isSample: z.boolean().default(false),
});
export type GalleryItem = z.infer<typeof GalleryItemSchema>;

// ─── API responses ────────────────────────────────────────────────────────
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
    success: z.boolean().default(true),
  });

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean(),
  });

// ─── Dashboard ───────────────────────────────────────────────────────────
export const DashboardUserRoleEnum = z.enum([
  "admin",
  "sales-manager",
  "sales-executive",
  "content-editor",
]);
export type DashboardUserRole = z.infer<typeof DashboardUserRoleEnum>;

export const DashboardUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: DashboardUserRoleEnum,
  avatar: z.string().optional(),
});
export type DashboardUser = z.infer<typeof DashboardUserSchema>;
