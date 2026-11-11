"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowRight } from "@phosphor-icons/react";
import { DEMO_USER } from "@/store/auth.store";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [whatsapp, setWhatsapp] = useState("8801991197719");
  const [phone, setPhone] = useState("+880 1991-197719");
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Settings</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-1">Demo configuration — changes are not persisted</p>
      </div>

      {/* Demo user card */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6">
        <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Demo User</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white font-bold text-lg">{DEMO_USER.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium text-[var(--ink)]">{DEMO_USER.name}</p>
            <p className="text-[var(--ink-muted)] text-[13px]">{DEMO_USER.email}</p>
            <span className="text-[10px] uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full font-medium">
              {DEMO_USER.role}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[var(--ink-muted)] mt-4">
          This is a demo account. No authentication is required. Replace with real auth in production.
        </p>
      </div>

      {/* Theme */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6">
        <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Appearance</h3>
        <div className="flex gap-3">
          {[
            { label: "Light", value: "light", icon: Sun },
            { label: "Dark", value: "dark", icon: Moon },
          ].map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors ${
                theme === value ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--line)]"
              }`}
            >
              <Icon size={20} className={theme === value ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"} />
              <span className={`text-[12px] font-medium ${theme === value ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6">
        <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Contact Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="meta-label block mb-1.5">WhatsApp Number</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full border border-[var(--line)] rounded-lg px-4 py-2.5 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="88019..."
            />
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">Used for WhatsApp CTAs and floating dock</p>
          </div>
          <div>
            <label className="meta-label block mb-1.5">Primary Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[var(--line)] rounded-lg px-4 py-2.5 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="+880..."
            />
          </div>
          <button
            onClick={save}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-medium tracking-[0.12em] uppercase transition-colors ${
              saved ? "bg-green-600 text-white" : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            }`}
          >
            {saved ? "Saved!" : "Save Changes"}
            {!saved && <ArrowRight size={12} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Sample data notice */}
      <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl p-5">
        <h3 className="font-display text-[14px] text-[var(--accent)] font-light uppercase mb-2">Demo Mode Active</h3>
        <p className="text-[var(--ink-muted)] text-[13px] leading-relaxed">
          All leads, bookings, and analytics shown in this dashboard are sample data marked with{" "}
          <code className="text-[11px] bg-[var(--bg-soft)] px-1.5 py-0.5 rounded">isSample: true</code>. The mock API adapter
          intercepts all requests and returns seeded data. Form submissions from the public website are persisted in{" "}
          <code className="text-[11px] bg-[var(--bg-soft)] px-1.5 py-0.5 rounded">localStorage</code> and appear in the
          Leads table in real time.
        </p>
      </div>
    </div>
  );
}
