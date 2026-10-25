/**
 * Brand settings — change the name here and it updates across the whole site,
 * the 3D configurator, page titles and the enquiry emails.
 */
export const BRAND: {
  name: string;
  tagline: string;
  description: string;
  location: string;
  serviceArea: string;
  email: string;
  phone: string;
  instagram: string;
  buildWeeks: string;
  installTime: string;
  responseTime: string;
  parentBusiness: string;
} = {
  /** Placeholder until the final brand name is chosen. */
  name: "MAISON CANINE",
  /** Short line used under the wordmark and in metadata. */
  tagline: "Architecture, for them.",
  description:
    "Luxury modular dog homes, designed, built and installed in Sydney. A limited number of homes each month, by enquiry only.",
  location: "Sydney, Australia",
  serviceArea: "Sydney and surrounds",
  /** Shown publicly on the site. Leave blank to hide. */
  email: "",
  phone: "",
  instagram: "",
  /** Typical workshop build time once a build slot is confirmed. */
  buildWeeks: "4–6 weeks",
  /** Typical on-site installation time (excluding optional site works). */
  installTime: "usually a single day",
  /** How quickly enquiries are answered. */
  responseTime: "within two business days",
  /** Sister landscaping and excavation business (used in Process copy). */
  parentBusiness: "our landscaping and excavation team",
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
