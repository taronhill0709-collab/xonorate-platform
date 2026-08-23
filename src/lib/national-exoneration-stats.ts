import { Calendar, Scale, Users } from "lucide-react";

// Sourced from the National Registry of Exonerations (exonerationregistry.org):
// the site's own homepage banner reported 3,850 exonerations and more than
// 36,051 years lost since 1989 as of 2026-08-23 (that cumulative count is
// live and keeps climbing, so it's rounded down here rather than pinned to
// an exact snapshot). The per-year figure is the most recently closed year,
// 2025: 97 exonerations, averaging 14.2 years lost each, per the Registry's
// 2025 Annual Report —
// https://exonerationregistry.org/sites/exonerationregistry.org/files/documents/2025Exonerations.pdf.
// Re-check both when this next goes stale; the Registry publishes each
// year's annual report the following April.
export const WRONGFUL_CONVICTION_STATS = [
  {
    icon: Scale,
    value: "3,850+",
    label: "Exonerations recorded in the U.S. since 1989",
  },
  {
    icon: Calendar,
    value: "36,000+",
    label: "Years collectively lost to wrongful imprisonment",
  },
  {
    icon: Users,
    value: "97",
    label: "People exonerated in 2025 alone, averaging 14.2 years lost each",
  },
] as const;

// Share of Innocence Project client cases (n=257) involving each factor —
// https://innocenceproject.org/exonerations-data/. Cases often involve more
// than one cause, so the shares don't sum to 100%.
export const WRONGFUL_CONVICTION_CAUSES = [
  { label: "Eyewitness misidentification", value: 62 },
  { label: "Misapplied forensic science", value: 52 },
  { label: "False confessions", value: 29 },
  { label: "Informant testimony", value: 19 },
] as const;
