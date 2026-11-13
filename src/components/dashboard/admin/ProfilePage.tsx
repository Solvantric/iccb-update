"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Key, Monitor, Moon, Sun, Translate, UserCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { User } from "@/types/crm";
import { ROLE_LABELS } from "@/types/crm";
import { useCurrentUser, useSession } from "@/lib/crm/db";
import { useCrmUpdate } from "@/services/crm/hooks";
import { Item, Stagger } from "../ui/motion";
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, PageHeader, Segmented, Switch } from "../ui/core";

const PREF_KEY = "iccb-crm-v1:notify-prefs";
type Prefs = { bookings: boolean; approvals: boolean; payments: boolean; hotLeads: boolean; tasks: boolean };

export function ProfilePage() {
  const me = useCurrentUser();
  const { lang, setLang } = useSession();
  const { theme, setTheme } = useTheme();
  const update = useCrmUpdate<User>("users", "Profile saved");
  const [v, setV] = useState({ name: me.name, email: me.email, phone: me.phone, designation: me.designation });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      return { bookings: true, approvals: true, payments: true, hotLeads: true, tasks: true, ...JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}") };
    } catch {
      return { bookings: true, approvals: true, payments: true, hotLeads: true, tasks: true };
    }
  });
  const setPref = (k: keyof Prefs, b: boolean) => {
    const next = { ...prefs, [k]: b };
    setPrefs(next);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {}
    toast.success("Preference saved");
  };

  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Personal" title="Profile" description="Your details and preferences. This is a demo account — no real sign-in." />
      </Item>
      <Item>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <Card>
              <CardHeader icon={UserCircle} title="Your details" />
              <div className="px-5 pb-5">
                <div className="mb-5 flex items-center gap-4">
                  <Avatar name={me.name} color={me.color} size={64} />
                  <div>
                    <p className="text-[17px] font-semibold text-crm-ink">{me.name}</p>
                    <Badge tone="brand">{ROLE_LABELS[me.role]}</Badge>
                    <span className="ms-2 text-[12.5px] text-crm-muted">{me.department}</span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name"><Input value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value }))} /></Field>
                  <Field label="Designation"><Input value={v.designation} onChange={(e) => setV((s) => ({ ...s, designation: e.target.value }))} /></Field>
                  <Field label="Email"><Input value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} /></Field>
                  <Field label="Phone"><Input value={v.phone} onChange={(e) => setV((s) => ({ ...s, phone: e.target.value }))} /></Field>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="primary" loading={update.isPending} disabled={!v.name.trim()} onClick={() => update.mutate({ id: me.id, patch: v })}>
                    Save profile
                  </Button>
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader icon={Key} title="Password" description="Demo only — nothing is sent anywhere." />
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
                <Field label="Current"><Input type="password" value={pw.current} onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))} /></Field>
                <Field label="New"><Input type="password" value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))} /></Field>
                <Field label="Confirm" error={pw.confirm && pw.confirm !== pw.next ? "Doesn't match" : null}><Input type="password" value={pw.confirm} onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))} /></Field>
                <div className="sm:col-span-3 flex justify-end">
                  <Button disabled={!pw.next || pw.next !== pw.confirm} onClick={() => { setPw({ current: "", next: "", confirm: "" }); toast.success("Password updated (demo)"); }}>
                    Update password
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-5">
            <Card>
              <CardHeader icon={Bell} title="Notifications" />
              <div className="space-y-3 px-5 pb-5">
                {([["bookings", "New bookings & status changes"], ["approvals", "Approvals (discounts, shifts)"], ["payments", "Payments received"], ["hotLeads", "Hot lead alerts"], ["tasks", "Task reminders"]] as [keyof Prefs, string][]).map(([k, label]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[13px] text-crm-ink-2">{label}</span>
                    <Switch checked={prefs[k]} onChange={(b) => setPref(k, b)} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader icon={Monitor} title="Appearance" />
              <div className="px-5 pb-5">
                <Segmented value={(theme as "light" | "dark" | "system") ?? "light"} onChange={setTheme} options={[{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Monitor }]} />
              </div>
            </Card>
            <Card>
              <CardHeader icon={Translate} title="Dashboard language" description="Navigation and chrome; content stays in English." />
              <div className="px-5 pb-5">
                <Segmented value={lang} onChange={setLang} options={[{ value: "en", label: "English" }, { value: "bn", label: "বাংলা" }]} />
              </div>
            </Card>
          </div>
        </div>
      </Item>
    </Stagger>
  );
}
