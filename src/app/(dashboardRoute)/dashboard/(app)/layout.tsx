import { Shell } from "@/components/dashboard/shell/Shell";

export default function DashboardAppLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
