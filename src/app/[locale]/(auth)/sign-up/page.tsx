"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";

export default function SignUpPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Demo mode — goes straight to dashboard
    await new Promise((r) => setTimeout(r, 800));
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 md:px-16 lg:max-w-[520px]">
        {/* Logo */}
        <Link href="/en" className="flex flex-col mb-12">
          <span className="font-display text-3xl text-[var(--ink)] font-light tracking-[0.12em] uppercase">ICCB</span>
          <span className="text-[9px] tracking-[0.14em] uppercase text-[var(--ink-muted)] mt-0.5">International Convention City Bashundhara</span>
        </Link>

        <div className="max-w-sm">
          <h1 className="font-display text-3xl text-[var(--ink)] font-light uppercase mb-2">
            Create account
          </h1>
          <p className="text-[var(--ink-muted)] text-[15px] mb-8">
            Register to access the ICCB management dashboard.
          </p>

          {/* Demo notice */}
          <div className="bg-[var(--accent)]/8 border border-[var(--accent)]/20 rounded-xl p-4 mb-6">
            <p className="text-[13px] text-[var(--ink-muted)]">
              <span className="text-[var(--accent)] font-medium">Demo mode</span> — registration goes directly to dashboard. No real account is created.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full border border-[var(--line)] rounded-xl px-4 py-3 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-[var(--line)] rounded-xl px-4 py-3 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="w-full border border-[var(--line)] rounded-xl px-4 py-3 pe-11 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  {showPw ? <EyeSlash size={18} weight="light" /> : <Eye size={18} weight="light" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.name || !form.email || !form.password}
              className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-4 text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create Account"}
              {!loading && <ArrowRight size={14} weight="bold" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[var(--ink-muted)] text-[13px]">Already have an account? </span>
            <Link href="/en/sign-in" className="text-[var(--accent-text)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right panel — image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[var(--bg-deep)]">
        <Image
          src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=95&w=3840"
          alt="ICCB Expo Village"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-deep)] via-transparent to-black/60" />
        <div className="absolute bottom-10 start-10 end-10">
          <span className="text-white/40 text-[11px] tracking-[0.18em] uppercase block mb-3">ICCB CRM — DASHBOARD</span>
          <p className="font-display text-4xl text-white font-light uppercase leading-tight">
            Manage Events,<br />Leads & Bookings
          </p>
          <p className="text-white/50 mt-3 text-[14px]">
            Real-time analytics · Hot lead alerts · Smart pricing
          </p>
        </div>
      </div>
    </div>
  );
}
