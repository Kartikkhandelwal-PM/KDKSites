# Feature Record: Import From a Profile

> **Purpose of this file.** Management added this requirement after seeing the Phase 1
> demo. It is not yet in the PRD. This is the working record of what was asked for,
> what was decided and why, what is built, and what is still open, written so its
> sections can be lifted into `PRD - Website Builder.md` once the feature is finished.
>
> **Status:** AI half built and deployed. UI built but expected to change.
> **Other post-PRD requirements are indexed in [REQUIREMENTS-PENDING.md](REQUIREMENTS-PENDING.md).**
> **Started:** 2026-08-13 · **Branch:** `cloudflare` · **Owner:** Kartik Khandelwal
> **Section 12 lists the exact PRD sections that will need editing.**

---

## 1. The Requirement

> *"Profile upload option where AI will read that profile and use that details to
> build the website."* — management, 2026-08-13

Accepted formats: **PDF, DOCX, and images** (including a photo of a printed profile).

The user uploads the firm profile, resume, CV or brochure they already have. The AI
reads it and pre-fills the website. Anything the document does not cover, the product
asks the user for, and the AI then writes the site as it does today.

---

## 2. The Decision That Shapes Everything Else

Two designs were considered:

| | Option A | Option B *(chosen)* |
|---|---|---|
| Entry point | Floating button opens a menu: "AI Writer" or "Import from profile" | One AI Writer. Its opening screen offers upload **or** answer questions |
| Implies | Two separate features | One feature, two starting points |

**Option B was chosen because Option A tells the user something untrue.** Import does
not skip the interview, it pre-fills it. Whichever route a user picks, the interview
still asks for whatever the document did not cover. Labelling them as rival features
promises a shortcut that does not exist, and the user who picks "Import from profile"
would be surprised to land in an interview anyway.

Two consequences, both deliberate:

1. **The floating button is unchanged.** No menu, no size change, no new label.
2. **Upload and "answer questions instead" carry equal visual weight** on the opening
   screen. Many sole practitioners have no profile document at all, and that path must
   not read as the lesser one.

---

## 3. User Journey

```
Floating "Write with AI" button  (unchanged)
        ↓
Opening screen
   ├── "Start writing my website"      → interview, empty          (as today)
   └── "I already have a firm profile" → upload → interview, pre-filled
                                                       ↓
                            Fields the document covered  = filled, tinted green
                            Fields it did not            = empty, and asked for
                                                       ↓
                                  User reviews and corrects everything
                                                       ↓
                                      "Write my website"  (as today)
                                                       ↓
                                   Published site  (nothing auto-publishes)
```

**A second entry point exists in the left drawer: "Import from a profile."** Someone
who skipped upload at the start, or who only found their document later, can import
without clearing their answers and starting over. Importing mid-interview can only
fill blanks, never overwrite what has been typed.

---

## 4. The Rule This Feature Is Built Around

This extends **PRD section 6.13 (No Placeholder Content on a Live Site)** one layer
earlier, and it is the single most important thing to preserve:

> **A field the uploaded document does not state must come back EMPTY, never guessed.**

An empty field is the correct and expected outcome, not a shortfall. The interview's
completeness check treats it as unanswered and asks the user for it.

**Why this is treated as a hard rule rather than a quality preference.** If the AI
invents a plausible "best known for" or an impressive client count, the user publishes
a claim they never made and were never prompted about. Our users are ICAI and Bar
Council registered professionals operating under advertising and misrepresentation
rules. A fabricated credential on their website is their liability, and our product
authored it.

### 4.1 A real example of the rule working

B P U & Co's profile states *"more than 50 years in aggregate experience."* Aggregate
means the total across all six partners. The AI correctly:

- **left "Years practising" empty**, because the firm's own age is not stated, and
- **kept the figure as a key number with its qualifier intact.**

Had it filled 50, the site would have read **"50 years of practice"** for a firm that
may be ten years old. During testing this looked like a bug and was queried; it is the
feature working exactly as intended. The interview then asks the user for the real
number, which only they know.

**Recorded because it will be queried again:** more extraction is not better
extraction. The measure of quality here is whether a field is correctly left blank.

---

## 5. What Gets Filled, and What Gets Asked

| Field | From the document? | If the document is silent |
|---|---|---|
| Profession | Yes, from qualifications or title | Falls back to the builder's current selection |
| Firm name, city, phone, email, office address, office hours | Yes | Interview asks (all are mandatory) |
| Years practising | Only if stated or derivable from a founding year | Interview asks. **Never** derived from "aggregate experience" |
| Social links | Yes, LinkedIn / Facebook / Instagram / YouTube only | Left empty, optional |
| Partner names | Yes, up to 4 | Interview asks for at least one |
| Partner role / designation | **Only if the document states a job title** | Interview asks. A qualification is never used as a stand-in |
| Partner "What do they handle" | Seeded with stated qualifications only | Optional; empty means the AI writes a short factual line |
| Best known for | Only claims the document explicitly makes | Interview asks (2 minimum) |
| Typical clients | Only client types the document names | Interview asks (2 minimum) |
| Key numbers | Rarely. See 5.1 below | Optional; the user supplies their own |
| How you work | Only if the document describes a process | Interview asks (3 minimum) |
| Services offered | Matched against the builder's own service list | User toggles in Step 4 as today |
| Client reviews | **Never extracted** | Optional. Left empty so skipping preserves testimonials already live |

Everything filled from a document is **tinted green** in the interview, using the same
visual language as the existing prefill-from-published-site behaviour, with a banner
naming the upload as the source so the user knows what to verify.

### 5.1 Key Numbers cannot be imported, and that is the correct outcome

Tested against three real CA firm profiles, extraction returns **almost nothing** for
this field. That is deliberate, and worth recording so nobody "fixes" it later.

A good website statistic is a **trust signal for a prospective client**: `2,000+ clients`,
`4.9 star rating`, `5,000+ returns filed`, `46 years in practice`. A firm profile is an
**internal document** and contains a different kind of number entirely: team size,
partner count, staffing breakdowns, combined years of experience across partners.

Those are true, and irrelevant. Nobody chooses an accountant because the firm employs
thirteen people. Earlier drafts of the extractor accepted them and produced stats like
`13 team members`, `5 partners`, `8 audit staffs` and `1 CA qualified staff` — the last
two actively harmful, since they make a practice look small and read as broken English.

Measured result with the correct bar applied:

| Profile | Client-relevant figures found |
|---|---|
| B P U & Co | none |
| K.C. Chheda & Co. | none |
| Dutta Ghosh & Associates | 1 — "46 years in practice" |

**So this field belongs to the user, not the importer.** The interview already prompts
for exactly the right kind of answer (its examples are "800+ clients", "4.8 Google
rating", "100% on-time filing"), and the user is the only one who knows those figures.
The stats strip is left empty by import, and the writer's existing behaviour fills the
row with qualitative statements rather than invented numbers.

**Do not relax this bar to make the import look more productive.** Extracting more here
means publishing numbers a client does not care about, on the most prominent strip of
the homepage.

---

## 6. New Field: Partner "What Do They Handle?"

**This is a new field and PRD section 6.10 will need updating.**

| Field | Required? | Validation |
|---|---|---|
| What do they handle? | No | Free text, one per partner. Optional by design |

**Why it was added.** The AI was producing partner bios like *"Nagendra Hegde offers a
blend of accounting and management skills to assist clients effectively."* Nothing in
that sentence came from the user. The cause was structural, not a prompt bug: the
generator was given a name and a job title and instructed to produce a 15 to 45 word
bio. A designation cannot tell you that someone handles GST litigation. That fact
exists only in the user's head, so the product has to ask for it.

The AI now treats this note as the source of truth for the bio: rewrite it, keep every
fact, add none. Left empty, it writes a short factual line naming the person's role
rather than inventing character.

**Note for the record:** this bug predates the import feature. The writer always
invented partner bios; import only made it obvious by filling in six partners instead
of one. The fix improves the manual path too.

---

## 7. Services: Matched, Not Replaced

A firm profile lists flat line items, often 25 of them ("Statutory Audits", "GSTR-9C",
"Drafting reply to SCNs"). The builder ships roughly 10 grouped services per
profession whose descriptions already carry the specifics:

> **GST Registration & Returns** — *"GST registration, monthly GSTR-1 and GSTR-3B
> filing, and annual GSTR-9 reconciliation, with department notices handled end to end."*

That grouping is already the right shape for a website, so nothing was redesigned. The
import simply **switches on the services the document supports**, matching on meaning
rather than wording. The AI picks from the builder's own list as a closed set, so it
cannot invent a service that does not exist.

Measured on B P U & Co: **8 of 10 correctly on**; TDS Management and NRI Taxation
correctly left off, because that firm's profile does not offer them.

Service lines with no equivalent in the builder's list (e.g. "Valuation of Financial
Assets") are passed to the writer as context so the firm's own wording still reaches
the page, but they do not create new services. **Open question in section 11.**

---

## 8. How It Works Technically

Two separate AI steps, and the separation is deliberate.

```
Uploaded document
      ↓
STEP 1 — EXTRACT      "copy out only what the document says"
      ↓  raw facts, anything unstated left empty
INTERVIEW             empty fields become questions; user reviews everything
      ↓
STEP 2 — WRITE        "turn these approved answers into website copy"   (already existed)
      ↓
Published site
```

**Why not one step.** The two jobs need opposite instructions. Extraction must be
literal and never improve anything; writing must be creative. Combined in one call,
the model blurs what the document said with what merely sounds good, and there is no
way afterwards to tell which is which. Splitting them confines creative licence to
step 2, where it only ever works on facts the user has already read and approved.

| | Detail |
|---|---|
| Where extraction runs | The existing `ai-generate` Edge Function, in a new `mode:"extract"` |
| PDF and images | Sent to the model as-is. Current models read both natively |
| DOCX | Unzipped inside the Edge Function, no third-party dependency |
| Why no browser-side parsing | Project rules forbid CDN scripts and a build step, which rules out pdf.js and every OCR library. Native document reading is what makes the feature possible at all |
| Provider | **OpenRouter**, so one key reaches every model and switching is a config change |
| Model | `google/gemini-3.5-flash-lite` (configurable in one line) |
| Size limit | 10 MB |

### 8.1 Privacy: the uploaded document is not stored

The file is sent to the model and discarded. It is **not** written to Supabase, not
saved to storage, and not retained by us in any form. Only the extracted fields reach
the user's draft, and only after they review them. This should be stated explicitly in
the BRD, as customers will ask.

---

## 9. Cost

Measured on three real CA firm profiles (9, 11 and 15 pages):

| Step | Cost per website |
|---|---|
| Extract the profile | **₹0.35** (measured: 5 to 10 seconds per document) |
| Write the website copy | ~₹0.20 (already happens today) |
| **Total** | **~₹0.55** |

So the feature **adds about ₹0.35 per website**. This is a one-time cost per site, not
per visitor and not monthly. Allowing for retries and regeneration, budget **₹1 to ₹2
per website**. At ₹2, ten thousand websites is roughly ₹20,000.

Cost is flat regardless of file size: an 8 MB, 15-page profile cost the same as a
128 KB one, because pages are billed rather than megabytes.

**Model choice is not a cost decision.** The spread between the cheapest and most
expensive viable model is a few rupees per website. The only thing worth testing is
which model correctly leaves fields blank, and no published benchmark measures that.
A test harness exists for this: `frontend/test-profile-import.html`.

---

## 10. Status

**Built and deployed**

- Document extraction (PDF, DOCX, images) returning schema-validated fields
- OpenRouter integration, model switchable from config
- Mapping of extracted facts into the interview, filling blanks only
- Service matching against the builder's own list
- New partner "What do they handle?" field, threaded through save/restore/prompt
- Two entry points: the opening screen and the left drawer
- Standalone test harness for comparing models on real documents
- Prompt corrections: partner bios must not invent; key numbers must keep qualifiers

**Not done**

- UI is expected to change; current version is functional, not final
- The returning-user path (published site **and** an upload competing) is implemented
  to a defined precedence but not yet tested end to end
- Step 2 still bills to OpenAI, so the feature spans two vendors (see section 11)

**Precedence rule, implemented:**
`what the user typed > the uploaded document > the published site > empty`
The document beats the published site because uploading is a deliberate act. Nothing
overwrites what the user typed.

---

## 11. Open Questions for Management

1. **Services with no builder equivalent.** A firm offering "Valuation of Financial
   Assets" or "ESOP structuring" cannot show it, because it is not in the preset list.
   Should the import be allowed to add custom services, capped at a small number? This
   is currently the biggest remaining gap in the feature.
2. **Consolidate billing onto one vendor?** Extraction bills to OpenRouter, copy
   writing to OpenAI. Pointing step 2 at OpenRouter too would mean one bill, one key to
   rotate, and one place to change models. Small change, not yet made.
3. **Quality floor for poor scans.** A blurry photo of a printed profile extracts less.
   Do we set an expectation, or simply let the interview ask for more?
4. **Cost approval.** ~₹0.35 per website added. Confirm this is acceptable at expected
   volume.
5. **Multiple documents.** Currently one file per import. Is that sufficient, or do
   firms commonly split profile and partner details across two files?

---

## 12. PRD Sections That Will Need Editing

| PRD section | Change needed |
|---|---|
| 4.1 What's In Scope | Add profile import |
| 5.1 User Flow Diagram | Add the upload branch from section 3 above |
| 5.3 Two Ways to Build | Now three entry points; upload is a third way in, not a third product |
| 5.5 The AI Website Writer | Describe the opening choice and the drawer action |
| **6.10 Founders & Partners** | **Add the "What do they handle?" field** (section 6 above) |
| 6.13 No Placeholder Content | Extend with the extraction rule (section 4 above) |
| New section under 6 | Profile import: accepted formats, size limit, what is filled vs asked (section 5 above) |
| 9 Non-Functional Requirements | Add the privacy statement (8.1) and per-site AI cost (9) |

---

## 13. Where the Detail Lives

| What | Where |
|---|---|
| Day-by-day build record and reasoning | `docs/DEV-LOG.md`, 2026-08-13 |
| Version summary | `docs/CHANGELOG.md` |
| Extraction logic and prompts | `backend/supabase/functions/ai-generate/index.ts` |
| Mapping into the interview | `frontend/index.html`, `applyProfile()` |
| Model list, costs, how to choose | `frontend/app-config.js`, `profileImport` block |
| Model comparison harness | `frontend/test-profile-import.html` |
| Test documents used | `CA Profile/` (real firm profiles — **not for commit**) |
