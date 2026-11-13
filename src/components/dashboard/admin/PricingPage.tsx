"use client";
import { useState } from "react";
import { Buildings, CalendarX, CurrencyCircleDollar, ForkKnife, PaintBrush, Percent, ShieldCheck, Sparkle, Tag } from "@phosphor-icons/react";
import type { CancellationRule, DecorationCategory, ExpoZoneTariff, HallTariff, IccbService, MenuPackage, SecurityRule, ServiceCharge, TaxRule } from "@/types/crm";
import { useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { Item, Stagger } from "../ui/motion";
import { PageHeader } from "../ui/core";
import { Tabs } from "../ui/tabs";
import { RateTable } from "./RateTable";

type Tab = "tariff" | "security" | "charges" | "decoration" | "expo" | "cancellation" | "taxes" | "menus" | "services";

const GROUPS = [
  { value: "h123", label: "Hall 1/2/3" },
  { value: "h4", label: "Hall 4" },
  { value: "h5", label: "Hall 5" },
  { value: "seminar", label: "Seminar Hall" },
];

export function PricingPage() {
  const role = useRole();
  const canEdit = can(role, "update", "pricing");
  const [tab, setTab] = useState<Tab>("tariff");
  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Admin" title="Pricing" description="Every ICCB rate, versioned by “effective from” date. Changes apply to new estimates only — each booking keeps its price version." />
      </Item>
      <Item>
        <Tabs
          value={tab}
          onChange={setTab}
          className="mb-5"
          tabs={[
            { value: "tariff", label: "Hall tariff", icon: Buildings },
            { value: "security", label: "Security money", icon: ShieldCheck },
            { value: "charges", label: "Service charges", icon: Tag },
            { value: "decoration", label: "Decoration", icon: PaintBrush },
            { value: "expo", label: "Expo zones", icon: CurrencyCircleDollar },
            { value: "cancellation", label: "Cancellation chart", icon: CalendarX },
            { value: "taxes", label: "Taxes", icon: Percent },
            { value: "menus", label: "Menu packages", icon: ForkKnife },
            { value: "services", label: "ICCB services", icon: Sparkle },
          ]}
        />
      </Item>
      <Item>
        {tab === "tariff" && (
          <RateTable<HallTariff & Record<string, unknown>>
            name="tariffs"
            title="Hall rent (per day, BDT, excl. VAT)"
            description="Weekend = Thu–Sat. Peak = Dec–Jan. Business period 12 h; extra hours charged per hour. Rows with a month are Smart Pricing special rules."
            canEdit={canEdit}
            defaults={{ group: "h123", label: "", peakWeekend: 0, peakWeekday: 0, offPeak: 0, extraHour: 0 } as never}
            fields={[
              { key: "label", label: "Halls", type: "text" },
              { key: "group", label: "Tariff group", type: "select", options: GROUPS, fixed: true, column: false },
              { key: "key", label: "Key", type: "text", fixed: true, column: false },
              { key: "month", label: "Special month (yyyy-MM)", type: "text" },
              { key: "peakWeekend", label: "Dec–Jan weekend", type: "money" },
              { key: "peakWeekday", label: "Dec–Jan weekday", type: "money" },
              { key: "offPeak", label: "Feb–Nov (all days)", type: "money" },
              { key: "extraHour", label: "Extra business hour", type: "money" },
              { key: "note", label: "Note", type: "text", column: false },
            ]}
          />
        )}
        {tab === "security" && (
          <RateTable<SecurityRule & Record<string, unknown>>
            name="security"
            title="Security money (refundable)"
            description="Refunded within 15 working days after the event, minus damages. Hall-5 overrides the event type."
            canEdit={canEdit}
            defaults={{ label: "", amount: 0 } as never}
            fields={[
              { key: "label", label: "Event type", type: "text" },
              { key: "key", label: "Key", type: "text", fixed: true, column: false },
              { key: "amount", label: "Amount", type: "money" },
            ]}
          />
        )}
        {tab === "charges" && (
          <RateTable<ServiceCharge & Record<string, unknown>>
            name="charges"
            title="Service-based charges"
            description="Per person / item, hall-level, generator support, other items and outside food stalls."
            canEdit={canEdit}
            defaults={{ category: "other", name: "", unit: "item", rate: 0 } as never}
            sortBy={(a, b) => String(a.category).localeCompare(String(b.category)) || String(a.name).localeCompare(String(b.name))}
            fields={[
              { key: "name", label: "Item", type: "text" },
              { key: "category", label: "Category", type: "select", options: [{ value: "per_person", label: "Per person / item" }, { value: "hall", label: "Hall-level" }, { value: "generator", label: "Generator" }, { value: "other", label: "Other items" }, { value: "stall", label: "Food stall" }] },
              { key: "unit", label: "Unit", type: "text" },
              { key: "rate", label: "Rate", type: "money" },
              { key: "rateHall5", label: "Hall-5 rate", type: "money" },
              { key: "maxHours", label: "Max hours", type: "number", column: false },
              { key: "key", label: "Key", type: "text", fixed: true, column: false },
            ]}
          />
        )}
        {tab === "decoration" && (
          <RateTable<DecorationCategory & Record<string, unknown>>
            name="decoration"
            title="Outside decoration fee"
            description="ICCB Events is the default provider (priced as an add-on). An outside firm pays this fee by category."
            canEdit={canEdit}
            defaults={{ code: "C", description: "", rateHall14: 0, rateHall5: 0 } as never}
            fields={[
              { key: "code", label: "Category", type: "select", options: [{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }], fixed: true },
              { key: "description", label: "Description", type: "text" },
              { key: "rateHall14", label: "Hall 1–4", type: "money" },
              { key: "rateHall5", label: "Hall 5", type: "money" },
            ]}
          />
        )}
        {tab === "expo" && (
          <RateTable<ExpoZoneTariff & Record<string, unknown>>
            name="expo"
            title="Expo Zone tariff"
            description="25% of rented space is free parking; above that, charged per sq ft per day."
            canEdit={canEdit}
            defaults={{ zone: "A", label: "", minSqft: 0, maxSqft: 0, ratePerSqftDay: 0, securityPersonal: 0, securityOthers: 0, extraHour: 0, washroomCultural: 0, washroomOther: 0, freeParkingPct: 25, parkingRate: 1.5 } as never}
            fields={[
              { key: "label", label: "Zone", type: "text" },
              { key: "zone", label: "Code", type: "select", options: [{ value: "A", label: "A" }, { value: "B", label: "B" }], fixed: true, column: false },
              { key: "ratePerSqftDay", label: "Rate / sq ft / day", type: "money" },
              { key: "securityPersonal", label: "Security (personal)", type: "money" },
              { key: "securityOthers", label: "Security (others)", type: "money" },
              { key: "extraHour", label: "Extra hour", type: "money" },
              { key: "washroomCultural", label: "Washroom (cultural)", type: "money", column: false },
              { key: "washroomOther", label: "Washroom (other)", type: "money", column: false },
              { key: "freeParkingPct", label: "Free parking", type: "pct", column: false },
              { key: "parkingRate", label: "Parking / sq ft / day", type: "money", column: false },
              { key: "minSqft", label: "Min sq ft", type: "number", column: false },
              { key: "maxSqft", label: "Max sq ft", type: "number", column: false },
            ]}
          />
        )}
        {tab === "cancellation" && (
          <RateTable<CancellationRule & Record<string, unknown>>
            name="cancellation"
            title="Cancellation / shift chart"
            description="% of total venue rent by days before the event."
            canEdit={canEdit}
            defaults={{ minDays: 0, maxDays: null, shiftPct: 0, cancelPct: 0 } as never}
            sortBy={(a, b) => Number(b.minDays) - Number(a.minDays)}
            fields={[
              { key: "key", label: "Band", type: "text", fixed: true },
              { key: "minDays", label: "From day", type: "number" },
              { key: "maxDays", label: "To day", type: "number" },
              { key: "shiftPct", label: "Shift / postpone", type: "pct" },
              { key: "cancelPct", label: "Cancel", type: "pct" },
            ]}
          />
        )}
        {tab === "taxes" && (
          <RateTable<TaxRule & Record<string, unknown>>
            name="taxes"
            title="Taxes"
            description="Food VAT applies to ICCB Catering. AIT applies when enabled on a booking."
            canEdit={canEdit}
            defaults={{ label: "", pct: 0 } as never}
            fields={[
              { key: "label", label: "Tax", type: "text" },
              { key: "key", label: "Key", type: "text", fixed: true, column: false },
              { key: "pct", label: "Rate", type: "pct" },
            ]}
          />
        )}
        {tab === "menus" && (
          <RateTable<MenuPackage & Record<string, unknown>>
            name="menus"
            title="ICCB Catering menu packages"
            description="Per-head rates (sample). Food VAT 15% is added on estimates."
            canEdit={canEdit}
            versioned={false}
            defaults={{ name: "", cuisine: "Mughal", perHead: 0, items: [], published: true } as never}
            fields={[
              { key: "name", label: "Package", type: "text" },
              { key: "cuisine", label: "Cuisine", type: "select", options: ["Mughal", "Continental", "Multi-cuisine", "Breakfast", "Snacks"].map((c) => ({ value: c, label: c })) },
              { key: "perHead", label: "Per head", type: "money" },
              { key: "items", label: "Items", type: "list" },
              { key: "published", label: "Published", type: "bool" },
            ]}
          />
        )}
        {tab === "services" && (
          <RateTable<IccbService & Record<string, unknown>>
            name="iccbServices"
            title="ICCB services (add-ons)"
            description="ICCB Events decoration, sound, LED, generator, extra hours, logistics."
            canEdit={canEdit}
            versioned={false}
            defaults={{ name: "", category: "Decoration", unit: "event", rate: 0 } as never}
            fields={[
              { key: "name", label: "Service", type: "text" },
              { key: "category", label: "Category", type: "select", options: ["Catering", "Decoration", "Sound & Light", "LED & AV", "Power", "Extra hours", "Logistics"].map((c) => ({ value: c, label: c })) },
              { key: "unit", label: "Unit", type: "text" },
              { key: "rate", label: "Rate", type: "money" },
              { key: "description", label: "Description", type: "textarea", column: false },
            ]}
          />
        )}
      </Item>
    </Stagger>
  );
}
