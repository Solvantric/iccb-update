"use client";
import { PpmForm } from "../../ppm/PpmForm";
import { useWs } from "../context";

export function PpmTab() {
  const { b, canEdit, canOps } = useWs();
  if (b.status === "requested")
    return <div className="crm-card p-6 text-[13.5px] text-crm-muted">The PPM is held after the booking is confirmed, at least 15 days before the event.</div>;
  return <PpmForm key={b.ppm?.done ? "done" : "draft"} b={b} readonly={!(canEdit || canOps) || !!b.closed} />;
}
