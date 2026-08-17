# Delivery Status and Open Decisions

> **What this file is for.** The PRD says what the product does. It deliberately carries
> **no delivery status**, so it does not have to be restructured after every release.
> This file carries that status: what is running, what is built but not released, what is
> only specified, and every decision still waiting on an answer.
>
> **Do not restate requirements here.** Each entry points at the PRD section that holds
> the requirement, and records only what the PRD must not: build state, blockers, and the
> facts about the code that a developer picking this up would otherwise have to rediscover.

---

## Where each requirement stands

| Requirement | Asked | PRD section | Build state |
|---|---|---|---|
| Import from a profile document (PDF, Word, photo) | 2026-08-13 | 5.5, 6.13 | **Built, working on the live server. Not yet released**: the builder carrying it has not been deployed, and the UI is functional rather than final |
| Address is final once published | 2026-08-13 | 5.4 Step 6, 6.6, 9 | **Live** |
| Partner field: "What do they handle?" | 2026-08-13 | 5.5, 6.10 | **Live** |
| Email alert when an enquiry arrives | 2026-08-17 | 5.6, 6.14 | **Specified only.** No code written |

---

## Open decisions, and who they block

Every one of these is written as an open question in the PRD too, at the section named
above. They are collected here so nobody has to hunt through the document for them.

| # | Decision needed | Blocks |
|---|---|---|
| 1 | Which address receives an enquiry alert: the login email, the site's public contact email, or both. And is KDK copied, given the PRD's "KDK leads inbox" promise? | Building the alert at all |
| 2 | One email per enquiry, or a digest once a site gets busy? | The alert's design, not its start |
| 3 | Can the professional turn alerts off or redirect them? Answering yes means designing a notification settings screen, which does not exist | Release, since an alert with no opt-out is a complaint risk |
| 4 | Is a hidden anti-bot field plus an hourly ceiling enough, or is a visible captcha wanted? | Release. Junk protection has to ship with alerts, not after |
| 5 | Should a one-time address correction be allowed after launch, within a grace period or through support only? | Nothing today, but it is the likeliest support ticket the permanence rule will generate |
| 6 | May a profile import add custom services that are not in the preset list? | The largest remaining gap in profile import |
| 7 | Cost approval for profile import at roughly ₹0.35 per website | Release of profile import |

---

## Facts about the code that the PRD does not carry

**The change-address flow still exists and is unreachable.** Removing the button was the
whole change: `startAddressEdit`, `cancelAddressEdit`, `isAddrEditing`, `addressChanged`,
`askAddressMove`, the `addr-edit` CSS and the move branch inside `launch()` are all intact
and still work. The subdomain field stays read-only because that is driven by
`isAddrEditing()`, which can now never become true. **Restoring it is one line in
`renderPubActions()`**, and the comment there names the line. It was left in deliberately,
because decision 5 above could require it back.

**There is no Delete anywhere in the product.** No delete button, no `deleteSite()`.
Earlier notes claimed the publish step still offered one and that it made the permanence
rule bypassable; that was wrong, and it is worth knowing that the bypass does not exist.
Unpublish is the only way down: reversible, address kept reserved, every enquiry kept.

**Profile import is live on the server.** `mode:"extract"` is deployed on the
`ai-generate` function and `OPENROUTER_API_KEY` is set: a probe with a blank image returns
a fully empty profile, which is also the "never guess" rule behaving correctly. Earlier
notes calling this blocked on the secret are out of date. What is genuinely unfinished is
the UI and one untested path: a returning user who has a published site **and** uploads a
document. Implemented precedence there is
`what the user typed > the uploaded document > the published site > empty`.

**Enquiries are stored but nothing is notified.** The published site posts straight into
`wb_leads`; the inbox reads it back. There is no per-enquiry web address yet, only
`#enquiries` for the inbox as a whole, so the alert email's "View this enquiry" link needs
one building. The list pages at ten rows, so that link has to open the page the enquiry
actually sits on.

**Before the first alert can be sent:** a ZeptoMail sending identity with its token, SPF,
DKIM and DMARC on the sending domain, and the email template created in the ZeptoMail
console so wording can change without a release.

---

## Screenshots in the PRD that need retaking

The document's screenshots were taken on 1 August 2026. These five no longer match the
product. Keep the existing filenames and simply overwrite the files, and the PRD needs no
further edit.

| File | Retake showing |
|---|---|
| `step6-never-published.png` | Step 6 before the first publish, with everything complete, so the warning *"Check your address before you launch"* is visible |
| `step6-publish.png` | A live site with unpublished changes: **Publish changes** and **Unpublish** only, no Change address button |
| `step6-live-in-sync.png` | A live site with nothing pending: **Unpublish** as the only button |
| `step6-offline.png` | An unpublished site: **Publish again** as the only button |
| `ai-writer-partners.png` | The AI Writer's Founders & Partners screen, showing the "What do they handle?" box on each partner |

`step6-change-address.png` is no longer used anywhere, since the panel it shows was
removed from the product. The file has been left in place rather than deleted, in case
decision 5 brings the flow back.

`user-flow-diagram.png` does not need retaking: it is generated, and was regenerated on
17 August 2026 from the Mermaid source kept in a comment beside it in the PRD.
