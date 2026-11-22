"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatCircleText, LinkSimple, ShieldWarning, Smiley, Star } from "@phosphor-icons/react";
import { ratingLabel } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { RatingChip, ReviewsDrawer, reviewAvg } from "../operations/ReviewsDrawer";
import type { Booking } from "@/types/crm";
import { FEEDBACK_AREAS } from "@/types/crm";
import { useBookings, useHallMap, useHalls } from "@/lib/crm/hooks";
import { fmtDate, money, todayYmd } from "@/lib/crm/format";
import { Button, Card, CardTitle, EmptyState, FilterRow, PageHeader, SearchInput } from "../ui/core";
import { DataTable, Kpi, RowActions, SimpleBars, type Column } from "../ui/data";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { Item, Stagger } from "../ui/motion";
import { DamageModal, FeedbackModal, Stars, damageTotal, feedbackScore } from "../operations/shared";

export function QualityPage() {
  const router = useRouter();
  const bookings = useBookings();
  const halls = useHalls();
  const hallMap = useHallMap();
  const today = todayYmd();
  const [fb, setFb] = useState<Booking | null>(null);
  const [dmg, setDmg] = useState<Booking | null>(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const reviews = db.reviews.store((st) => st.items);
  const answeredReviews = useMemo(() => reviews.filter((rv) => rv.status === "submitted").sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")), [reviews]);
  const { f, set, reset, active } = useFilters({ q: "", hall: "", rating: "", damage: "", sort: "date" });

  /** Events that have happened (closed, or booked with a past date). */
  const past = useMemo(() => bookings.filter((b) => b.status === "closed" || (b.status === "booked" && b.date < today)), [bookings, today]);

  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = past.filter((b) => {
      const s = feedbackScore(b);
      const rating = !f.rating || (f.rating === "none" ? s === null : s !== null && (f.rating === "high" ? s >= 4 : f.rating === "mid" ? s >= 3 && s < 4 : s < 3));
      const dmgOk = !f.damage || (f.damage === "yes" ? damageTotal(b) > 0 : damageTotal(b) === 0);
      return rating && dmgOk && (!f.hall || b.hallId === f.hall) && (!n || [b.name, b.eventName, b.ref, b.feedback?.comment].join(" ").toLowerCase().includes(n));
    });
    return [...list].sort((a, b) => (f.sort === "low" ? (feedbackScore(a) ?? 9) - (feedbackScore(b) ?? 9) : f.sort === "high" ? (feedbackScore(b) ?? 0) - (feedbackScore(a) ?? 0) : f.sort === "damage" ? damageTotal(b) - damageTotal(a) : b.date.localeCompare(a.date)));
  }, [past, f]);

  const kpi = useMemo(() => {
    const scored = rows.map(feedbackScore).filter((s): s is number => s !== null);
    return {
      avg: scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 0,
      collected: scored.length,
      happy: scored.length ? (scored.filter((s) => s >= 4).length / scored.length) * 100 : 0,
      damage: rows.reduce((s, b) => s + damageTotal(b), 0),
    };
  }, [rows]);

  const chart = useMemo(
    () =>
      FEEDBACK_AREAS.map((a) => {
        const vals = rows.map((b) => b.feedback?.ratings?.[a]).filter((v): v is number => typeof v === "number" && v > 0);
        return { label: a, value: vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0 };
      }),
    [rows]
  );

  const columns: Column<Booking>[] = [
    { key: "date", header: "Date", cell: (b) => <span className="whitespace-nowrap tabular">{fmtDate(b.date)}</span> },
    {
      key: "event",
      header: "Event",
      cell: (b) => (
        <span>
          <span className="block font-medium text-crm-ink">{b.eventName}</span>
          <span className="block text-[12px] text-crm-muted">
            {b.name} · {hallMap.get(b.hallId)?.name}
          </span>
        </span>
      ),
    },
    {
      key: "score",
      header: "Rating",
      cell: (b) => {
        const s = feedbackScore(b);
        return s === null ? (
          <span className="text-[13px] text-crm-muted">No feedback</span>
        ) : (
          <span className="flex items-center gap-2">
            <Stars value={s} size={14} />
            <span className="text-[13px] tabular">{s.toFixed(1)}</span>
          </span>
        );
      },
    },
    { key: "comment", header: "Comment", cell: (b) => <span className="line-clamp-1 max-w-[260px] text-[13px] text-crm-muted">{b.feedback?.comment ?? "—"}</span> },
    { key: "dmg", header: "Damages", align: "end", cell: (b) => (damageTotal(b) ? <span className="text-crm-danger">{money(damageTotal(b))}</span> : <span className="text-crm-muted">—</span>) },
    {
      key: "a",
      header: <span className="sr-only">Actions</span>,
      cell: (b) => (
        <RowActions>
          <Button size="sm" variant="ghost" icon={Star} onClick={() => setFb(b)}>
            {b.feedback ? "Edit" : "Feedback"}
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Damage claim" title="Damage claim" onClick={() => setDmg(b)}>
            <ShieldWarning size={17} />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Quality"
        description="Client feedback after each event, and damage claims deducted from security money."
        action={
          <Button variant="primary" icon={LinkSimple} onClick={() => setReviewsOpen(true)}>
            Client reviews{answeredReviews.length ? ` · ${answeredReviews.length}` : ""}
          </Button>
        }
      />
      <Stagger className="mb-6 grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Item>
          <Kpi label="Average rating" value={kpi.avg} icon={Star} format={(n) => `${n.toFixed(1)} / 5`} tone={kpi.avg >= 4 ? "good" : kpi.avg >= 3 ? "warn" : "bad"} />
        </Item>
        <Item>
          <Kpi label="Feedback collected" value={kpi.collected} icon={ChatCircleText} hint={`of ${rows.length} past events`} tone="info" />
        </Item>
        <Item>
          <Kpi label="Happy clients (4★+)" value={kpi.happy} icon={Smiley} format={(n) => `${Math.round(n)}%`} tone="good" />
        </Item>
        <Item>
          <Kpi label="Damages claimed" value={kpi.damage} icon={ShieldWarning} format={money} tone="bad" />
        </Item>
      </Stagger>

      {answeredReviews.length > 0 && (
        <Card className="mb-6">
          <CardTitle
            title="Latest client reviews"
            action={
              <Button size="sm" variant="ghost" onClick={() => setReviewsOpen(true)}>
                All reviews
              </Button>
            }
          />
          <ul className="grid grid-cols-1 gap-3 px-5 pb-5 md:grid-cols-3">
            {answeredReviews.slice(0, 3).map((rv) => (
              <li key={rv.id} className="rounded-[10px] border border-crm-line p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-crm-ink">{rv.reviewerName}</span>
                    <span className="block truncate text-[12px] text-crm-muted">{rv.eventName ?? "General review"}</span>
                  </span>
                  <RatingChip label={ratingLabel(reviewAvg(rv))} />
                </div>
                {rv.comment && <p className="mt-2 line-clamp-3 text-[13px] text-crm-ink-2">“{rv.comment}”</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-6">
        <CardTitle title="Average score by area" action={<span className="text-[12.5px] text-crm-muted">Out of 5 · filtered events</span>} />
        <div className="px-3 pb-4">
          <SimpleBars data={chart} height={200} format={(n) => n.toFixed(1)} />
        </div>
      </Card>

      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Event, client, comment…" />
        <FilterSelect label="Halls" value={f.hall} onChange={(v) => set("hall", v)} options={halls.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Rating" all="Any rating" value={f.rating} onChange={(v) => set("rating", v)} options={[{ value: "high", label: "4★ and above" }, { value: "mid", label: "3–4★" }, { value: "low", label: "Below 3★" }, { value: "none", label: "No feedback yet" }]} />
        <FilterSelect label="Damages" all="With or without damages" value={f.damage} onChange={(v) => set("damage", v)} options={[{ value: "yes", label: "Has damages" }, { value: "no", label: "No damages" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "date", label: "Latest first" }, { value: "low", label: "Lowest rating" }, { value: "high", label: "Highest rating" }, { value: "damage", label: "Most damage" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={rows.length} noun="event" />
      <DataTable
        rows={rows}
        columns={columns}
        onRowClick={(b) => router.push(`/dashboard/bookings/${b.id}`)}
        empty={<EmptyState icon={Star} text="No past events match." action={<Button onClick={reset}>Clear filters</Button>} />}
        mobileCard={(b) => {
          const s = feedbackScore(b);
          return (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-crm-ink">{b.eventName}</p>
                  <p className="text-[12.5px] text-crm-muted">
                    {fmtDate(b.date)} · {hallMap.get(b.hallId)?.name}
                  </p>
                </div>
                {s !== null ? <Stars value={s} size={14} /> : <span className="text-[12px] text-crm-muted">No feedback</span>}
              </div>
              <RowActions className="mt-3 justify-start border-t border-crm-line pt-3">
                <Button size="sm" variant="ghost" icon={Star} onClick={() => setFb(b)}>
                  Feedback
                </Button>
                <Button size="sm" variant="ghost" icon={ShieldWarning} onClick={() => setDmg(b)}>
                  Damages
                </Button>
              </RowActions>
            </div>
          );
        }}
      />
      <FeedbackModal booking={fb} onClose={() => setFb(null)} />
      <ReviewsDrawer open={reviewsOpen} onOpenChange={setReviewsOpen} />
      <DamageModal booking={dmg} onClose={() => setDmg(null)} />
    </>
  );
}
