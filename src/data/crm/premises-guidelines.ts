import type { GuidelineRule } from "@/types/crm";

/** ICCB premises guidelines that outside vendors must follow (used for violations). */
export const PREMISES_GUIDELINES: GuidelineRule[] = [
  { id: "g01", title: "Hammering, nailing or pinning on walls, floor or pillars" },
  { id: "g02", title: "Unauthorised electric connection" },
  { id: "g03", title: "Materials not lifted within 24 hours" },
  { id: "g04", title: "Hooking or hanging on the hall structure / ceiling" },
  { id: "g05", title: "Fireworks, sparklers or open flame" },
  { id: "g06", title: "Smoking inside the hall" },
  { id: "g07", title: "Parking in the driveway or fire lane" },
  { id: "g08", title: "Outside food or catering brought in" },
  { id: "g09", title: "Sticking tape or glue on walls / glass" },
  { id: "g10", title: "Blocking emergency exits or fire equipment" },
  { id: "g11", title: "Using a generator without ICCB approval" },
  { id: "g12", title: "Sound above the permitted level / after hours" },
  { id: "g13", title: "Work outside the agreed set-up time" },
  { id: "g14", title: "Damage to carpet, furniture or fixtures" },
  { id: "g15", title: "Dragging heavy items without floor protection" },
  { id: "g16", title: "Gas cylinders or flammable liquids inside the hall" },
  { id: "g17", title: "Staff without ICCB vendor pass / ID" },
  { id: "g18", title: "Waste left in the hall or loading area" },
  { id: "g19", title: "Unloading at the main entrance instead of the service gate" },
  { id: "g20", title: "Use of confetti, glitter or powder colours" },
  { id: "g21", title: "Helium balloons released inside the hall" },
  { id: "g22", title: "Misbehaviour with ICCB staff or guests" },
];

export const guidelineTitle = (id: string) => PREMISES_GUIDELINES.find((g) => g.id === id)?.title ?? id;
