"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowCounterClockwise, DownloadSimple } from "@phosphor-icons/react";
import type { Settings } from "@/types/crm";
import { DB_NAMES, db, exportJson, resetDemoData, useSettings, type DbName } from "@/lib/crm/db";
import { useSettingsValue } from "@/lib/crm/hooks";
import { Button, Card, CardTitle, Field, Input, PageHeader, Textarea } from "../ui/core";
import { useConfirm } from "../ui/overlay";

type OrgFields = Pick<Settings, "orgName" | "phone" | "email" | "address" | "refPrefix" | "paymentTerms">;

function OrgCard() {
  const settings = useSettingsValue();
  const set = useSettings((s) => s.set);
  const [v, setV] = useState<OrgFields>(() => ({ orgName: settings.orgName, phone: settings.phone, email: settings.email, address: settings.address, refPrefix: settings.refPrefix, paymentTerms: settings.paymentTerms }));
  const dirty = (Object.keys(v) as (keyof OrgFields)[]).some((k) => v[k] !== settings[k]);
  return (
    <Card>
      <CardTitle title="Organisation" action={<span className="text-[12.5px] text-crm-muted">Printed on every PDF</span>} />
      <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
        <Field label="Organisation name" className="sm:col-span-2">
          <Input value={v.orgName} onChange={(e) => setV({ ...v, orgName: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} />
        </Field>
        <Field label="Reference prefix" hint={`Next refs look like ${v.refPrefix || "ICCB"}-${new Date().getFullYear()}-0010`}>
          <Input value={v.refPrefix} onChange={(e) => setV({ ...v, refPrefix: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() })} />
        </Field>
        <div />
        <Field label="Payment terms" hint="Shown to staff on bills." className="sm:col-span-2">
          <Textarea value={v.paymentTerms} onChange={(e) => setV({ ...v, paymentTerms: e.target.value })} />
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <Button
            variant="primary"
            disabled={!dirty}
            onClick={() => {
              set(v);
              toast.success("Settings saved");
            }}
          >
            Save settings
          </Button>
        </div>
      </div>
    </Card>
  );
}

const LABEL: Record<string, string> = { bookings: "Bookings", clients: "Clients", payments: "Payments", meetings: "Meetings", enquiries: "Enquiries", halls: "Venues", specials: "Special prices", menus: "Menu packages", services: "Services", radar: "Radar items", reviews: "Client reviews", content: "Website content", users: "Users", analytics: "Analytics events" };

/** Live record count for one store. */
function Count({ name }: { name: DbName }) {
  const useStore = db[name].store as unknown as <T>(sel: (s: { items: unknown[] }) => T) => T;
  const n = useStore((s) => s.items.length);
  return <span className="text-crm-ink tabular">{n}</span>;
}

function DataCard() {
  const confirm = useConfirm();

  return (
    <Card>
      <CardTitle title="Data" />
      <div className="px-5 pb-5">
        <p className="mb-3 text-[13.5px] text-crm-muted">All data is sample data stored in this browser.</p>
        <ul className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
          {DB_NAMES.map((n) => (
            <li key={n} className="flex justify-between">
              <span className="text-crm-muted">{LABEL[n] ?? n}</span>
              <Count name={n} />
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            icon={DownloadSimple}
            onClick={() => {
              const url = URL.createObjectURL(new Blob([exportJson()], { type: "application/json" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `iccb-crm-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 5000);
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="danger"
            icon={ArrowCounterClockwise}
            onClick={async () => {
              if (await confirm({ title: "Reset demo data?", description: "Every change is replaced with the original sample records.", confirmLabel: "Reset", danger: true })) {
                resetDemoData();
                toast.success("Demo data reset");
              }
            }}
          >
            Reset demo data
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function SettingsPage() {
  const s = useSettingsValue();
  return (
    <>
      <PageHeader title="Settings" description="Organisation details, payment terms and data tools." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrgCard key={[s.orgName, s.phone, s.email, s.address, s.refPrefix, s.paymentTerms].join("|")} />
        </div>
        <DataCard />
      </div>
    </>
  );
}
