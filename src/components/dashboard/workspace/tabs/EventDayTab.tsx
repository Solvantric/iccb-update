"use client";
import { FactSheetForm } from "../../ops/FactSheetForm";
import { useWs } from "../context";

export function EventDayTab() {
  const { b, canEdit, canOps } = useWs();
  if (b.status === "requested")
    return <div className="crm-card p-6 text-[13.5px] text-crm-muted">The Program Fact Sheet is filled by Operations on the event day, after the booking is confirmed.</div>;
  return <FactSheetForm key={b.factSheet?.done ? "done" : "draft"} b={b} readonly={!(canOps || canEdit) || !!b.closed} />;
}
