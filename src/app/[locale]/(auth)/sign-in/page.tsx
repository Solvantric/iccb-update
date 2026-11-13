"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { DEMO_USER } from "@/store/auth.store";

export default function SignInPage() {
  const [email, setEmail] = useState("admin@iccb.demo");
  const [password, setPassword] = useState("demo1234");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Demo mode — any credentials go straight to dashboard
    await new Promise((r) => setTimeout(r, 700));
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
            Welcome back
          </h1>
          <p className="text-[var(--ink-muted)] text-[15px] mb-8">
            Sign in to access the ICCB dashboard.
          </p>

          {/* Demo notice */}
          <div className="bg-[var(--accent)]/8 border border-[var(--accent)]/20 rounded-xl p-4 mb-6">
            <p className="text-[13px] text-[var(--ink-muted)]">
              <span className="text-[var(--accent)] font-medium">Demo mode</span> — any credentials work.
              Pre-filled with the demo account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[var(--line)] rounded-xl px-4 py-3 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="admin@iccb.demo"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] py-4 text-[12px] font-bold tracking-[0.14em] uppercase hover:brightness-110 transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In to Dashboard"}
              {!loading && <ArrowRight size={14} weight="bold" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[var(--ink-muted)] text-[13px]">Don&apos;t have an account? </span>
            <Link href="/en/sign-up" className="text-[var(--accent-text)] text-[13px] font-medium hover:text-[var(--accent)] transition-colors">
              Sign up
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--line)]">
            <p className="text-[11px] text-[var(--ink-muted)] text-center">
              Demo user: <span className="font-mono text-[var(--ink)]">{DEMO_USER.email}</span>
              <br />Role: <span className="text-[var(--accent)] capitalize">{DEMO_USER.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — image, desktop only */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[var(--bg-deep)]">
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=95&w=3840"
          alt="ICCB Convention Hall"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-deep)] via-transparent to-black/60" />
        <div className="absolute bottom-10 start-10 end-10">
          <span className="text-white/40 text-[11px] tracking-[0.18em] uppercase block mb-3">ICCB — DHAKA</span>
          <p className="font-display text-4xl text-white font-light uppercase leading-tight">
            South Asia&apos;s Premier<br />Convention Destination
          </p>
          <p className="text-white/50 mt-3 text-[14px]">
            6 halls · 10,000+ capacity · Expo Village
          </p>
        </div>
      </div>
    </div>
  );
}
