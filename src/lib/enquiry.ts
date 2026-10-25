import { configFromUnknown, type Config } from "./configurator";

/** Enquiry form options, shared by the form and the server validation. */
export const DOG_SIZES = [
  "Medium, 10–25 kg",
  "Large, 25–45 kg",
  "Not sure yet",
] as const;

export const TIMINGS = [
  "As soon as possible",
  "Within 1–3 months",
  "Within 3–6 months",
  "Just exploring for now",
] as const;

export const INTENTS = {
  consult: "Request a build consultation",
  reserve: "Reserve a build slot",
} as const;
export type Intent = keyof typeof INTENTS;

export type Enquiry = {
  intent: Intent;
  name: string;
  email: string;
  phone: string;
  suburb: string;
  breed: string;
  dogSize: string;
  timing: string;
  notes: string;
  /** null when the customer didn't come from the configurator */
  config: Config | null;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export type ValidationResult = { ok: true; enquiry: Enquiry } | { ok: false; errors: Partial<Record<keyof Enquiry, string>> };

export function validateEnquiry(body: unknown): ValidationResult {
  const o = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const enquiry: Enquiry = {
    intent: o.intent === "reserve" ? "reserve" : "consult",
    name: str(o.name, 120),
    email: str(o.email, 200),
    phone: str(o.phone, 40),
    suburb: str(o.suburb, 120),
    breed: str(o.breed, 120),
    dogSize: str(o.dogSize, 60),
    timing: str(o.timing, 60),
    notes: str(o.notes, 3000),
    config: o.config ? configFromUnknown(o.config) : null,
  };
  const errors: Partial<Record<keyof Enquiry, string>> = {};
  if (!enquiry.name) errors.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) errors.email = "Please enter a valid email address.";
  if (enquiry.phone.replace(/[^\d]/g, "").length < 8) errors.phone = "Please enter a phone number we can reach you on.";
  if (!enquiry.suburb) errors.suburb = "Which suburb is the home for?";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, enquiry };
}
