import { Calendar, Scale, Users } from "lucide-react";

// Sourced from the National Registry of Exonerations (exonerationregistry.org):
// 3,478 exonerations logged through the end of 2023, plus 147 more in 2024
// (avg. 13.5 years lost each) — https://www.law.umich.edu/special/exoneration.
export const WRONGFUL_CONVICTION_STATS = [
  {
    icon: Scale,
    value: "3,600+",
    label: "Exonerations recorded in the U.S. since 1989",
  },
  {
    icon: Calendar,
    value: "27,000+",
    label: "Years collectively lost to wrongful imprisonment",
  },
  {
    icon: Users,
    value: "147",
    label: "People exonerated in 2024 alone, averaging 13.5 years lost each",
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
