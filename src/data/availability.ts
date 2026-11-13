import type { AvailabilitySlot } from "@/types";
import { addDays, format } from "date-fns";

// Generate sample availability data for the next 90 days
function generateSampleAvailability(): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const hallIds = ["gulnaksha", "pushpoguchcho", "rajdarshan", "noboratri", "pushpanjali", "seminar-hall"];
  const shifts = ["lunch", "dinner", "fullday"] as const;

  const today = new Date();

  for (let d = 0; d < 90; d++) {
    const date = format(addDays(today, d), "yyyy-MM-dd");
    const dayOfWeek = addDays(today, d).getDay();

    for (const hallId of hallIds) {
      for (const shift of shifts) {
        // Skip full day if lunch or dinner is set (they're mutually exclusive in reality)
        // For demo, just randomize
        let status: AvailabilitySlot["status"] = "available";

        // Some weekend days are booked
        if (dayOfWeek === 5 || dayOfWeek === 6) {
          const rand = Math.random();
          if (d < 30 && rand < 0.3) status = "booked";
          else if (d < 60 && rand < 0.2) status = "reserved";
        } else {
          const rand = Math.random();
          if (rand < 0.1) status = "reserved";
          else if (rand < 0.05) status = "booked";
        }

        const slot: AvailabilitySlot = {
          hallId,
          date,
          shift,
          status,
        };

        if (status === "reserved") {
          const holdExpiry = new Date();
          holdExpiry.setHours(holdExpiry.getHours() + 48);
          slot.holdExpiresAt = holdExpiry.toISOString();
        }

        slots.push(slot);
      }
    }
  }

  return slots;
}

// In-memory store for mock persistence
const availabilityStore: AvailabilitySlot[] = generateSampleAvailability();

export const getAvailability = (hallId: string, month: string): AvailabilitySlot[] => {
  return availabilityStore.filter(
    (s) => s.hallId === hallId && s.date.startsWith(month)
  );
};

export const updateAvailability = (slot: AvailabilitySlot) => {
  const idx = availabilityStore.findIndex(
    (s) => s.hallId === slot.hallId && s.date === slot.date && s.shift === slot.shift
  );
  if (idx >= 0) {
    availabilityStore[idx] = slot;
  } else {
    availabilityStore.push(slot);
  }
};

export { availabilityStore };
