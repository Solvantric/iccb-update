"use client";
import { createContext, useContext } from "react";
import type { Booking, Client, Hall, Invoice, Payment, Task, User } from "@/types/crm";
import type { Estimate, PricingRates } from "@/lib/crm/pricing";
import type { FlowContext, WorkspaceTab } from "@/lib/crm/workflow";

export interface WorkspaceCtx {
  b: Booking;
  est: Estimate;
  flow: FlowContext;
  rates: PricingRates;
  halls: Hall[];
  users: User[];
  client?: Client;
  payments: Payment[];
  docs: Invoice[];
  tasks: Task[];
  me: User;
  canEdit: boolean;
  canApprove: boolean;
  canPay: boolean;
  canOps: boolean;
  goTab: (t: WorkspaceTab) => void;
}

export const Ctx = createContext<WorkspaceCtx | null>(null);
export function useWs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Workspace context missing");
  return c;
}
