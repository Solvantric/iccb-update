"use client";
import { useState } from "react";
import { ChatText, Phone } from "@phosphor-icons/react";
import type { ActivityItem } from "@/types/crm";
import { addNote, logCall } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { Button, Card, CardHeader, Segmented, Textarea } from "../../ui/core";
import { Timeline } from "../../ui/status";
import { useWs } from "../context";

type Filter = "all" | ActivityItem["type"];

export function ActivityTab() {
  const { b, canEdit } = useWs();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"note" | "call">("note");
  const [filter, setFilter] = useState<Filter>("all");
  const note = useCrmAction((t: string) => (kind === "call" ? logCall(b.id, t) : addNote(b.id, t)), { success: kind === "call" ? "Call logged" : "Note added", onSuccess: () => setText("") });
  const items = filter === "all" ? b.activity : b.activity.filter((a) => a.type === filter);
  return (
    <div className="space-y-5">
      {canEdit && (
        <Card className="p-4">
          <Segmented size="sm" value={kind} onChange={setKind} options={[{ value: "note", label: "Note", icon: ChatText }, { value: "call", label: "Call log", icon: Phone }]} />
          <Textarea className="mt-3" value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "call" ? "Call outcome…" : "Write a note — mention a colleague with @FirstName"} />
          <div className="mt-2 flex justify-end">
            <Button variant="primary" disabled={!text.trim()} loading={note.isPending} onClick={() => note.mutate(text.trim())}>
              {kind === "call" ? "Log call" : "Add note"}
            </Button>
          </div>
        </Card>
      )}
      <Card>
        <CardHeader
          title="Timeline"
          description="Every change, call, payment and document."
          action={<Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "status", label: "Status" }, { value: "call", label: "Calls" }, { value: "note", label: "Notes" }, { value: "payment", label: "Payments" }]} />}
        />
        <div className="px-5 pb-5">
          <Timeline items={items} />
        </div>
      </Card>
    </div>
  );
}
