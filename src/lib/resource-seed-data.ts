/**
 * Preserves every resource from the old static `/resources` page
 * (formerly resources/page.tsx's SECTIONS array, replaced by the
 * database-backed Resource Center) — same orgs, same URLs, same
 * descriptions, just structured into the new schema instead of hardcoded
 * JSX. The two prose-only sections (Know Your Rights, For Families) and the
 * innocence-organization intake criteria become real internal resources
 * with a body instead of hardcoded JSX, so they get their own detail pages
 * like any other resource.
 *
 * Shared by scripts/seed-resources.ts (manual one-off run) and the
 * temporary /api/internal/setup-resource-center route (production
 * migration) so there's one source of truth for the seed content.
 */
import { db } from "@/db";
import { resources } from "@/db/schema";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

type SeedResource = {
  title: string;
  category: (typeof resources.$inferInsert)["category"];
  subcategory?: string;
  resourceType: (typeof resources.$inferInsert)["resourceType"];
  audiences?: string[];
  organization?: string;
  description: string;
  body?: string;
  url?: string;
  tags?: string[];
  featured?: boolean;
};

export const RESOURCE_SEED_DATA: SeedResource[] = [
  // --- Internal editorial guides (were prose-only sections on the old page) ---
  {
    title: "Know Your Rights",
    category: "knowledge",
    subcategory: "Police Encounters",
    resourceType: "guide",
    audiences: ["general_public", "families"],
    description:
      "What to say — and not say — in the first few minutes of a police encounter, the moment a large share of documented wrongful convictions trace back to.",
    body: `A large share of documented wrongful convictions trace back to what happened in the first few minutes of a police encounter — before a lawyer was ever in the room. These rights apply to everyone in the United States, in every state, regardless of immigration or citizenship status.

- **You have the right to remain silent, and the right to an attorney.** Say it out loud — clearly and calmly: "I am going to remain silent. I want a lawyer." Once you've invoked these rights, officers are required to stop questioning until counsel is present. Simply staying quiet is not always enough; stating it removes any ambiguity.
- **You can refuse a search of your person, car, or home.** Without a warrant, your consent, or an emergency the law recognizes, officers generally cannot search you or your property. Say "I do not consent to a search" clearly — you can say this even if they search anyway; it preserves the issue for later. Do not physically resist.
- **If you're not under arrest, you can ask "Am I free to leave?"** If the answer is yes, you may calmly walk away. If the answer is no, you are being detained or arrested, and the rights above still apply.
- **You have the right to record police in public.** Recording officers performing their duties in a public place is constitutionally protected in every state, as long as you don't physically interfere with their activity.
- **These rights do not depend on immigration or citizenship status.** Everyone physically present in the U.S. — citizen or not — has the right to remain silent and the right to refuse to sign anything without speaking to a lawyer first.

The [ACLU's Know Your Rights hub](https://www.aclu.org/know-your-rights) covers police encounters, protests, immigration status, and more, and routes to each state ACLU affiliate's own guidance — many publish free, printable, foldable "Know Your Rights" cards in multiple languages sized to keep in a wallet.

This is general public education, not legal advice, and it is not a substitute for talking to a lawyer about a specific situation. If you or someone you know is currently involved in a police encounter or facing charges, contact an attorney or a public defender's office as soon as possible.`,
    tags: ["know your rights", "police encounters"],
  },
  {
    title: "For Families",
    category: "help_support",
    subcategory: "Families",
    resourceType: "guide",
    audiences: ["families"],
    description:
      "A practical starting point for families trying to understand the post-conviction process, stay involved in a case, and find support.",
    body: `A wrongful conviction doesn't only happen to the person convicted — it reshapes the lives of everyone around them: spouses who become sole earners overnight, children who grow up with a parent behind bars for a crime they didn't commit, and communities that lose someone they knew wasn't capable of what they were accused of. That toll rarely shows up in court records, which is part of why we ask about it directly for every case we document.

The [National Resource Center on Children & Families of the Incarcerated](https://nrccfi.camden.rutgers.edu/) (Rutgers University) publishes practical guidance on maintaining contact during incarceration, talking to children about a parent's imprisonment, and finding local family-support programs — regardless of whether the conviction is being contested.

Staying involved in a case is also concrete work: keeping copies of every filing and court date, writing down what you remember about the original investigation while it's fresh, and maintaining contact with whoever is handling the appeal. Innocence organizations and public defenders can only act as fast as they get accurate information from the people closest to a case.`,
    tags: ["families", "staying involved"],
    featured: true,
  },
  {
    title: "Do You Qualify for Help From an Innocence Organization?",
    category: "case_resource",
    subcategory: "Case Intake",
    resourceType: "guide",
    audiences: ["families", "incarcerated"],
    description:
      "Intake criteria differ by organization, but most Innocence Network members generally look for the same things — here's what to check before applying.",
    body: `Intake criteria differ by organization, but most Innocence Network members generally look for:

- A claim of *actual* innocence — not just a procedural or sentencing error in an otherwise valid conviction.
- A completed conviction. Most organizations don't take cases that are still pretrial or on direct appeal with a public defender already assigned.
- Some avenue of case-specific evidence left to investigate — untested DNA, forensic re-analysis, a recanting witness, or newly discovered evidence — since these organizations investigate, not just advocate.
- Because caseloads are large and resources limited, cases with more time remaining on the sentence are often prioritized, though this varies by organization.

Every member organization has its own intake form on its website, reached through the [Innocence Network's member directory](https://innocencenetwork.org/network-members/).`,
    tags: ["intake criteria", "innocence organizations"],
  },

  // --- Legal / innocence organizations ---
  {
    title: "ACLU — Know Your Rights",
    category: "knowledge",
    resourceType: "organization",
    audiences: ["general_public"],
    organization: "ACLU",
    description:
      "The national hub covering police encounters, protests, immigration status, and more — and the place to start for finding your state ACLU affiliate's own guidance.",
    url: "https://www.aclu.org/know-your-rights",
    tags: ["know your rights"],
  },
  {
    title: "National Resource Center on Children & Families of the Incarcerated",
    category: "help_support",
    resourceType: "organization",
    audiences: ["families"],
    organization: "Rutgers University",
    description:
      "Practical guidance on maintaining contact during incarceration, talking to children about a parent's imprisonment, and finding local family-support programs.",
    url: "https://nrccfi.camden.rutgers.edu/",
    tags: ["families"],
  },
  {
    title: "Innocence Network — Find a Member Organization",
    category: "legal",
    subcategory: "Innocence Organizations",
    resourceType: "directory",
    audiences: ["incarcerated", "families", "attorneys"],
    organization: "Innocence Network",
    description:
      "Directory of 65+ regional innocence organizations. Start here to find the group that covers the state where the conviction happened.",
    url: "https://innocencenetwork.org/network-members/",
    tags: ["innocence organizations", "directory"],
  },
  {
    title: "Centurion",
    category: "legal",
    subcategory: "Innocence Organizations",
    resourceType: "organization",
    audiences: ["incarcerated", "families"],
    organization: "Centurion",
    description:
      "Founded in 1983, the first organization in the country dedicated to investigating wrongful conviction cases — has helped free dozens of people serving life or death sentences.",
    url: "https://centurion.org/",
    tags: ["innocence organizations"],
  },
  {
    title: "Equal Justice Initiative",
    category: "legal",
    subcategory: "Innocence Organizations",
    resourceType: "organization",
    audiences: ["incarcerated", "families", "advocates"],
    organization: "Equal Justice Initiative",
    description:
      "Provides legal representation to people who may have been wrongly convicted or denied a fair trial, with a particular focus on the South. Also leads litigation and advocacy on prosecutorial and police misconduct, unreliable forensic evidence, and indigent defense.",
    url: "https://eji.org/",
    tags: ["innocence organizations", "justice reform"],
  },
  {
    title: "National Registry of Exonerations",
    category: "research",
    subcategory: "Exoneration Data",
    resourceType: "data",
    audiences: ["researchers", "journalists", "attorneys"],
    organization: "University of Michigan Law School",
    description:
      "Tracks every documented exoneration in the U.S. since 1989 — case details, contributing factors, time served — and is the source for the exoneration statistics cited across this site.",
    url: "https://exonerationregistry.org/",
    tags: ["exoneration data", "research"],
  },
  {
    title: "National Registry of Exonerations — Compensation Guide",
    category: "legal",
    subcategory: "Compensation",
    resourceType: "data",
    audiences: ["exonerees", "attorneys"],
    organization: "University of Michigan Law School",
    description:
      "A state-by-state guide to wrongful-conviction compensation laws — use it to see what compensation, if any, a given state provides. Compensation is not automatic, and eligibility rules vary enormously by jurisdiction.",
    url: "https://exonerationregistry.org/about",
    tags: ["compensation", "state-by-state"],
  },

  // --- Legal resources ---
  {
    title: "Restoration of Rights Project",
    category: "legal",
    subcategory: "Restoring Rights & Licenses",
    resourceType: "directory",
    audiences: ["exonerees", "general_public"],
    organization: "Collateral Consequences Resource Center",
    description:
      "Free, state-by-state guide to expungement, record sealing, pardons, and restoring professional licenses after a conviction — the best resource for 'how do I get my license back.'",
    url: "https://ccresourcecenter.org/",
    tags: ["restoring rights", "state-by-state", "reentry"],
  },
  {
    title: "National Association of Criminal Defense Lawyers (NACDL)",
    category: "legal",
    resourceType: "organization",
    audiences: ["attorneys"],
    organization: "NACDL",
    description:
      "Attorney referrals and post-conviction resources, including a dedicated eyewitness identification hub — one of the leading contributing factors in wrongful convictions.",
    url: "https://www.nacdl.org/",
    tags: ["attorney referrals", "eyewitness identification"],
  },
  {
    title: "ABA Find Legal Help",
    category: "legal",
    resourceType: "directory",
    audiences: ["general_public", "families"],
    organization: "American Bar Association",
    description: "The American Bar Association's directory for locating legal aid and lawyer-referral services by state.",
    url: "https://www.americanbar.org/groups/legal_services/flh-home/",
    tags: ["legal aid", "state-by-state"],
  },
  {
    title: "National Legal Aid & Defender Association (NLADA)",
    category: "legal",
    resourceType: "organization",
    audiences: ["attorneys", "general_public"],
    organization: "NLADA",
    description:
      "Works to expand access to public defense nationally and can point to state-level public defender and legal aid resources.",
    url: "https://www.nlada.org/",
    tags: ["public defense"],
  },

  // --- Justice reform / research ---
  {
    title: "The Sentencing Project",
    category: "research",
    resourceType: "organization",
    audiences: ["researchers", "advocates"],
    organization: "The Sentencing Project",
    description: "Research and advocacy on sentencing policy and state-level incarceration data.",
    url: "https://www.sentencingproject.org/",
    tags: ["justice reform", "sentencing"],
  },
  {
    title: "Prison Policy Initiative",
    category: "research",
    resourceType: "organization",
    audiences: ["researchers", "advocates"],
    organization: "Prison Policy Initiative",
    description: "Independent research exposing the scale and harms of mass incarceration nationwide.",
    url: "https://www.prisonpolicy.org/",
    tags: ["justice reform", "mass incarceration"],
  },
  {
    title: "Brennan Center for Justice",
    category: "research",
    resourceType: "organization",
    audiences: ["researchers", "advocates", "attorneys"],
    organization: "Brennan Center for Justice",
    description: "Legal and policy work on prosecutorial accountability and systemic criminal justice reform.",
    url: "https://www.brennancenter.org/",
    tags: ["justice reform", "prosecutorial accountability"],
  },
  {
    title: "ACLU Campaign for Smart Justice",
    category: "advocacy",
    resourceType: "advocacy",
    audiences: ["advocates", "general_public"],
    organization: "ACLU",
    description: "Focused campaign work on prosecutorial accountability and district attorney elections.",
    url: "https://www.aclu.org/issues/smart-justice",
    tags: ["justice reform", "advocacy"],
  },
  {
    title: "The Marshall Project",
    category: "research",
    resourceType: "organization",
    audiences: ["journalists", "researchers", "general_public"],
    organization: "The Marshall Project",
    description: "Nonprofit journalism covering the criminal justice system in depth.",
    url: "https://www.themarshallproject.org/",
    tags: ["journalism", "justice reform"],
  },

  // --- Support services ---
  {
    title: "988 Suicide & Crisis Lifeline",
    category: "help_support",
    subcategory: "Crisis Support",
    resourceType: "tool",
    audiences: ["general_public", "families", "exonerees"],
    organization: "988 Suicide & Crisis Lifeline",
    description: "Free and confidential support for anyone in crisis, available around the clock — call or text 988, 24/7.",
    url: "https://988lifeline.org/",
    tags: ["crisis", "mental health"],
  },
  {
    title: "SAMHSA National Helpline",
    category: "help_support",
    subcategory: "Mental Health & Trauma",
    resourceType: "tool",
    audiences: ["general_public", "families"],
    organization: "SAMHSA",
    description: "Free, confidential treatment referral and information service for mental health and substance use, 24/7 — 1-800-662-4357.",
    url: "https://www.samhsa.gov/find-help/national-helpline",
    tags: ["mental health", "substance use"],
  },
  {
    title: "Healing Justice",
    category: "help_support",
    subcategory: "Mental Health & Trauma",
    resourceType: "organization",
    audiences: ["exonerees", "families"],
    organization: "Healing Justice",
    description: "Restorative justice and trauma-informed support built specifically for exonerees and their families.",
    url: "https://healingjustice.org/",
    tags: ["mental health", "trauma", "exonerees"],
  },
  {
    title: "211",
    category: "help_support",
    subcategory: "Reentry, Housing & Employment",
    resourceType: "tool",
    audiences: ["general_public", "exonerees", "families"],
    organization: "211",
    description:
      "The national helpline connecting anyone to local housing, food, healthcare, and financial assistance by zip code — the best single starting point if you don't know where to look locally.",
    url: "https://www.211.org/",
    tags: ["reentry", "housing"],
  },
  {
    title: "After Innocence",
    category: "help_support",
    subcategory: "Reentry, Housing & Employment",
    resourceType: "organization",
    audiences: ["exonerees"],
    organization: "After Innocence",
    description: "Case management connecting exonerees to healthcare, benefits, social services, and legal assistance during reentry.",
    url: "https://after-innocence.org/",
    tags: ["reentry", "exonerees"],
  },
  {
    title: "National Reentry Resource Center",
    category: "help_support",
    subcategory: "Reentry, Housing & Employment",
    resourceType: "directory",
    audiences: ["exonerees", "general_public"],
    organization: "Council of State Governments Justice Center",
    description: "Directories of housing and employment reentry programs, run by the Council of State Governments Justice Center.",
    url: "https://csgjusticecenter.org/",
    tags: ["reentry", "housing", "employment"],
  },
  {
    title: "Witness to Innocence",
    category: "help_support",
    subcategory: "Death Row Exonerees",
    resourceType: "organization",
    audiences: ["exonerees"],
    organization: "Witness to Innocence",
    description: "Peer support and public advocacy run by exonerees themselves, including former death row survivors.",
    url: "https://www.witnesstoinnocence.org/",
    tags: ["exonerees", "death row"],
  },
];

/** Inserts every row in RESOURCE_SEED_DATA, returning how many were
 * created. Called by scripts/seed-resources.ts and the one-time
 * production migration route — not safe to call twice against the same
 * database (it doesn't check for existing rows itself; callers that need
 * that check it before calling, e.g. the migration route). */
export async function seedResources(): Promise<number> {
  const now = new Date();
  let created = 0;
  for (const item of RESOURCE_SEED_DATA) {
    await insertWithUniqueSlug(item.title, (slug) =>
      db
        .insert(resources)
        .values({
          title: item.title,
          slug,
          category: item.category,
          subcategory: item.subcategory ?? null,
          resourceType: item.resourceType,
          audiences: item.audiences ?? [],
          organization: item.organization ?? null,
          description: item.description,
          body: item.body ?? null,
          url: item.url ?? null,
          tags: item.tags ?? [],
          featured: item.featured ?? false,
          status: "published",
          publishedAt: now,
        })
        .returning({ id: resources.id }),
    );
    created++;
  }
  return created;
}
