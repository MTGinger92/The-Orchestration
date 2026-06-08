// ══════════════════════════════════════════════════════════
//  THE ORCHESTRATION — Single Config Source of Truth
//  All entry types, workstreams, milestones, and prompts live
//  here. Editing this file is the only change needed for
//  routine additions.
// ══════════════════════════════════════════════════════════

export const CONFIG = {
  schemaVersion: 1,
  defaultAdminPin: '1936', // Joe Sr.'s birth year

  workstreams: [
    {
      id: 'brand',
      label: 'Brand & Digital Infrastructure',
      color: '#326E6E',
      borderColor: 'rgba(50,110,110,0.5)',
    },
    {
      id: 'commerce',
      label: 'Commerce',
      color: '#C4A87A',
      borderColor: 'rgba(196,168,122,0.5)',
    },
    {
      id: 'content',
      label: 'Content Engine & SM',
      color: '#3E8A8A',
      borderColor: 'rgba(62,138,138,0.5)',
    },
    {
      id: 'institutional',
      label: 'Institutional & Relationships',
      color: '#A07848',
      borderColor: 'rgba(160,120,72,0.5)',
    },
    {
      id: 'legal',
      label: 'Legal & Entity Structure',
      color: '#7A7A6E',
      borderColor: 'rgba(122,122,110,0.4)',
    },
    {
      id: 'digitization',
      label: 'Digitization & Archive',
      color: '#244E58',
      borderColor: 'rgba(36,78,88,0.6)',
    },
  ],

  sizes: ['WORKSTREAM', 'DELIVERABLE', 'SESSION'],

  statuses: ['COMPLETE', 'IN PROGRESS', 'BLOCKED'],

  // Template stored here so it can be edited in admin without touching code.
  briefPromptTemplate: `You are writing a Legacy Ledger entry brief for The Orchestration — a personal record of the work done to revive the estate of Joseph L. Abbrescia Sr., a Western American impressionist painter (1936-2005).

The operator is Nikki Wheeler, digital architect and creative executive of the Abbrescia Art Legacy Revival. Write in a voice that is direct, serious, and carries the weight of what this project means — not corporate, not casual. This is a monument, not a project log.

Write a 2-3 sentence brief for the following entry. Describe what was built, why it mattered to the legacy, and what it represents in the larger work of this revival. Do not use the word "orchestration" in every brief — vary the language.

Entry details:
Title: {{title}}
Workstream: {{workstream}}
Size: {{size}}
What was built: {{whatWasBuilt}}
What it unlocked: {{whatItUnlocked}}
{{conversationContext}}

Return only the brief text. No labels, no preamble, no quotes around it.`,

  // Pre-loaded milestone map from the Master Blueprint v2.
  // All start pending. Marked achieved manually or via admin.
  initialMilestones: [
    // ── NOW — Commerce Live ──────────────────────────────
    { id: 'm-001', phase: 'NOW — Commerce Live',           label: 'Shopify store created and connected to Base44',                        achieved: false, achievedDate: null, order: 1  },
    { id: 'm-002', phase: 'NOW — Commerce Live',           label: '3–5 print products live with POD fulfillment',                        achieved: false, achievedDate: null, order: 2  },
    { id: 'm-003', phase: 'NOW — Commerce Live',           label: 'Email capture active',                                                achieved: false, achievedDate: null, order: 3  },
    { id: 'm-004', phase: 'NOW — Commerce Live',           label: 'Cowboy painting featured section live',                               achieved: false, achievedDate: null, order: 4  },
    { id: 'm-005', phase: 'NOW — Commerce Live',           label: 'Domain live at abbresciaart.com',                                     achieved: false, achievedDate: null, order: 5  },
    // ── 30 Days — Relationships ──────────────────────────
    { id: 'm-006', phase: '30 Days — Relationships',       label: 'Joe Jr. calls Russell Museum contacts — legacy revival conversation initiated', achieved: false, achievedDate: null, order: 6  },
    { id: 'm-007', phase: '30 Days — Relationships',       label: 'Russell auction archive photographed and documented',                 achieved: false, achievedDate: null, order: 7  },
    { id: 'm-008', phase: '30 Days — Relationships',       label: 'SM pipeline Sessions A–D built, first 10 posts queued',              achieved: false, achievedDate: null, order: 8  },
    { id: 'm-009', phase: '30 Days — Relationships',       label: 'First Joe Jr. recording session completed',                          achieved: false, achievedDate: null, order: 9  },
    // ── 90 Days — Engine Running ─────────────────────────
    { id: 'm-010', phase: '90 Days — Engine Running',      label: 'SM posting consistently at 4–5x/week IG, 3x FB',                    achieved: false, achievedDate: null, order: 10 },
    { id: 'm-011', phase: '90 Days — Engine Running',      label: 'First podcast/YouTube episode published',                            achieved: false, achievedDate: null, order: 11 },
    { id: 'm-012', phase: '90 Days — Engine Running',      label: 'Collector Booklets system live (Make.com Sessions E + F)',           achieved: false, achievedDate: null, order: 12 },
    { id: 'm-013', phase: '90 Days — Engine Running',      label: 'Montana business attorney consulted — entity structure clarified',   achieved: false, achievedDate: null, order: 13 },
    { id: 'm-014', phase: '90 Days — Engine Running',      label: 'First NEH Preservation Assistance Grant application submitted',      achieved: false, achievedDate: null, order: 14 },
    // ── March 2027 — Russell Auction ─────────────────────
    { id: 'm-015', phase: 'March 2027 — Russell Auction',  label: 'Joe Jr. attends Russell Auction with designed leave-behind',        achieved: false, achievedDate: null, order: 15 },
    { id: 'm-016', phase: 'March 2027 — Russell Auction',  label: 'Formal conversation with Russell Museum curatorial staff',          achieved: false, achievedDate: null, order: 16 },
    { id: 'm-017', phase: 'March 2027 — Russell Auction',  label: '"Where Joe Stood" content series deployed',                        achieved: false, achievedDate: null, order: 17 },
    // ── Year 1–2 — Catalog Foundation ────────────────────
    { id: 'm-018', phase: 'Year 1–2 — Catalog Foundation', label: 'Airtable catalog substantially complete for estate paintings',      achieved: false, achievedDate: null, order: 18 },
    { id: 'm-019', phase: 'Year 1–2 — Catalog Foundation', label: 'Transkribus deployed — manuscripts being transcribed',              achieved: false, achievedDate: null, order: 19 },
    { id: 'm-020', phase: 'Year 1–2 — Catalog Foundation', label: 'Russell and CDA auction archive fully documented',                  achieved: false, achievedDate: null, order: 20 },
    { id: 'm-021', phase: 'Year 1–2 — Catalog Foundation', label: 'Collector Registry live — outreach to known prior buyers',         achieved: false, achievedDate: null, order: 21 },
    { id: 'm-022', phase: 'Year 1–2 — Catalog Foundation', label: 'Montana Cultural and Aesthetic Projects Grant submitted',           achieved: false, achievedDate: null, order: 22 },
    // ── Year 2–3 — Scholarly Output ──────────────────────
    { id: 'm-023', phase: 'Year 2–3 — Scholarly Output',   label: 'Color theory book manuscript ready for submission',                 achieved: false, achievedDate: null, order: 23 },
    { id: 'm-024', phase: 'Year 2–3 — Scholarly Output',   label: 'University library special collection donation completed',          achieved: false, achievedDate: null, order: 24 },
    { id: 'm-025', phase: 'Year 2–3 — Scholarly Output',   label: 'Retrospective exhibition proposal submitted',                      achieved: false, achievedDate: null, order: 25 },
    { id: 'm-026', phase: 'Year 2–3 — Scholarly Output',   label: 'NEH Collections Stewardship Grant application submitted',          achieved: false, achievedDate: null, order: 26 },
    { id: 'm-027', phase: 'Year 2–3 — Scholarly Output',   label: '501(c)(3) Abbrescia Art Foundation formation initiated',           achieved: false, achievedDate: null, order: 27 },
    // ── Year 3–5 — Canonical ─────────────────────────────
    { id: 'm-028', phase: 'Year 3–5 — Canonical',          label: 'Catalog raisonné published',                                      achieved: false, achievedDate: null, order: 28 },
    { id: 'm-029', phase: 'Year 3–5 — Canonical',          label: 'Major retrospective exhibition — national press coverage',         achieved: false, achievedDate: null, order: 29 },
    { id: 'm-030', phase: 'Year 3–5 — Canonical',          label: 'Joe Jr. established as recognized national authority',             achieved: false, achievedDate: null, order: 30 },
    { id: 'm-031', phase: 'Year 3–5 — Canonical',          label: "Annual legacy award established in Joe Sr.'s name",               achieved: false, achievedDate: null, order: 31 },
  ],
};

// Interpolates {{placeholders}} in the prompt template.
export function buildBriefPrompt(template, entry) {
  const ws = CONFIG.workstreams.find(w => w.id === entry.workstream);
  let prompt = template
    .replace('{{title}}', entry.title || '')
    .replace('{{workstream}}', ws ? ws.label : entry.workstream)
    .replace('{{size}}', entry.size || '')
    .replace('{{whatWasBuilt}}', entry.whatWasBuilt || '')
    .replace('{{whatItUnlocked}}', entry.whatItUnlocked || '');

  if (entry.conversationContext && entry.conversationContext.trim()) {
    prompt = prompt.replace('{{conversationContext}}', `Additional context: ${entry.conversationContext}`);
  } else {
    prompt = prompt.replace('{{conversationContext}}', '');
  }

  return prompt.replace(/\n{3,}/g, '\n\n').trim();
}
