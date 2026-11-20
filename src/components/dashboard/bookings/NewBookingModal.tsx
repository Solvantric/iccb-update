"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBooking, type BookingInput } from "@/services/crm";
import { Button } from "../ui/core";
import { Modal } from "../ui/overlay";
import { BookingForm } from "./BookingForm";

type Open = (prefill?: Partial<BookingInput>) => void;
const Ctx = createContext<Open>(() => {});

/** "New booking" modal for walk-in / phone clients — same fields as the website form. */
export function NewBookingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [prefill, setPrefill] = useState<Partial<BookingInput> | null>(null);
  const [key, setKey] = useState(0);
  const open = useCallback<Open>((p) => {
    setPrefill(p ?? {});
    setKey((k) => k + 1);
  }, []);
  const close = () => setPrefill(null);

  return (
    <Ctx.Provider value={open}>
      {children}
      <Modal open={!!prefill} onOpenChange={(v) => !v && close()} size="lg" title="New booking" description="The date is reserved as soon as you save.">
        {prefill && (
          <BookingForm
            key={key}
            initial={prefill}
            staff
            submitLabel="Save booking"
            footer={
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
            }
            onSubmit={(input) => {
              try {
                const b = createBooking({ ...input, leadId: prefill.leadId }, "staff");
                close();
                toast.success(`${b.ref} reserved`, { action: { label: "Open", onClick: () => router.push(`/dashboard/bookings/${b.id}`) } });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Couldn't save");
              }
            }}
          />
        )}
      </Modal>
    </Ctx.Provider>
  );
}

export const useNewBooking = () => useContext(Ctx);
