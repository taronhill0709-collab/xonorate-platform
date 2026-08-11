/** Checkbox presets for "Request More Info" — shared between the admin
 * request form and the public follow-up questionnaire so the two stay in
 * sync without duplicating labels. */
export const INQUIRY_INFO_PRESETS = [
  { key: "court_documents", label: "Court documents" },
  { key: "appeal_status", label: "Current appeal status" },
  { key: "attorney_contact", label: "Attorney contact information" },
] as const;

export type InquiryInfoPresetKey = (typeof INQUIRY_INFO_PRESETS)[number]["key"];

export function inquiryInfoPresetLabel(key: string): string {
  return INQUIRY_INFO_PRESETS.find((p) => p.key === key)?.label ?? key;
}
