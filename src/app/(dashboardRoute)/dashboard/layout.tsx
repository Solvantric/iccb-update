import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata = {
  title: { default: "Dashboard — ICCB", template: "%s — ICCB Dashboard" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
