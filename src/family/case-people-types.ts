// Client-safe: imports only from @/db/schema (no db/pg connection at
// module scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants
// out of DB-touching files" note.
import { familyCasePersonTypeEnum } from "@/db/schema";

export type CasePersonType = (typeof familyCasePersonTypeEnum.enumValues)[number];

export const CASE_PERSON_TYPE_LABELS: Record<CasePersonType, string> = {
  attorney: "Attorney",
  public_defender: "Public defender",
  private_attorney: "Private attorney",
  family_member: "Family member",
  witness: "Witness",
  investigator: "Investigator",
  advocate: "Advocate",
  case_worker: "Case worker",
  facility_contact: "Facility contact",
  other: "Other",
};

// The types the Case Overview treats as "an attorney" when surfacing a
// primary legal contact (spec section 1's "Attorney / primary legal
// contact" field) — not stored as a separate flag, just read off
// whichever of these three types was entered first.
export const ATTORNEY_PERSON_TYPES: CasePersonType[] = ["attorney", "public_defender", "private_attorney"];
