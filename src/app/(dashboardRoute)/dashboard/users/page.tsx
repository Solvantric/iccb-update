export const metadata = { title: "Users" };

export default function DashboardUsersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Users</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-1">User management — Phase 2 (requires real authentication)</p>
      </div>
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-8 text-center">
        <p className="text-[var(--ink-muted)] text-[14px]">
          User management will be available in Phase 2 when real authentication is implemented.
        </p>
      </div>
    </div>
  );
}
