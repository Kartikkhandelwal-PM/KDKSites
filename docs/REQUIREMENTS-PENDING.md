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

**Profile import is deployed but cannot currently read a document: the OpenRouter account
has no balance.** Uploading a real PDF returns

```
openrouter 402: This request requires at least $0.50 in balance for file processing
```

so **the feature is blocked on funding, not on code.** `mode:"extract"` is deployed and
`OPENROUTER_API_KEY` is set, which is why a probe with a tiny blank image still succeeds
and returns a wholly empty profile. That probe is what made this look unblocked on
17 August; it is not. Top the account up before demonstrating or testing the feature.

Also unfinished: the UI is functional rather than final, and one path is untested, a
returning user who has a published site **and** uploads a document. Implemented precedence
there is `what the user typed > the uploaded document > the published site > empty`.

**Enquiries are stored but nothing is notified.** The published site posts straight into
`wb_leads`; the inbox reads it back. There is no per-enquiry web address yet, only
`#enquiries` for the inbox as a whole, so the alert email's "View this enquiry" link needs
one building. The list pages at ten rows, so that link has to open the page the enquiry
actually sits on.

**Before the first alert can be sent:** a ZeptoMail sending identity with its token, SPF,
DKIM and DMARC on the sending domain, and the email template created in the ZeptoMail
console so wording can change without a release.

---

## Screenshots

**Retaken on 17 August 2026** against the current build, from a demo account, using a
fictional firm (Sharma & Associates, Jaipur). No real client data appears in any of them.

| File | Now shows |
|---|---|
| `step6-never-published.png` | Everything complete, so the *"Check your address before you launch"* warning is visible |
| `step6-publish.png` | A live site with changes waiting: **Publish changes** and **Unpublish** only |
| `step6-live-in-sync.png` | Live and up to date: **Unpublish** as the only button |
| `step6-offline.png` | Offline: **Publish again**, and the address still reserved |
| `ai-writer-intro.png` | The writer's opening choice, with upload given equal weight |
| `ai-writer-import-upload.png` | **New.** The upload screen, with "Answer a few questions instead" beneath it |
| `ai-writer-partners.png` | The "What do they handle?" box, the green seeded answers, and the drawer's "Import from a profile" |
| `ai-writer-question.png`, `enquiries-inbox.png`, `profile-menu.png` | Refreshed against the current build |

**Still missing one:** the interview *after* a document has been read, with the imported
answers tinted green. It cannot be captured until the OpenRouter balance is topped up
(see the blocker above).

`step6-change-address.png` is no longer used, since the panel it showed was removed. The
file was left in place in case decision 5 brings the flow back.

**The two flow diagrams are generated, not photographed.** `user-flow-build.png` and
`user-flow-live.png` come from Mermaid sources kept in comments beside them in the PRD.
The single tall diagram they replaced was cut off in the Word export, which is why it is
now two. Regeneration is described in [DEV-LOG.md](DEV-LOG.md), 2026-08-17.

## The Word version of the PRD

Rebuild it with:

    python3 docs/build-word.py

It runs pandoc using **the 1 August `.docx` as the style reference**, so the Word file
keeps the design already approved rather than pandoc's plain default. It then fixes three
things pandoc leaves behind, each of which was a real complaint:

| Fix | Why |
|---|---|
| Table header rows do not repeat after a page break | A heading row appearing again reads as a new table starting |
| Table rows cannot split across a page break | A row broken in half is unreadable |
| A heading is kept with the content beneath it | A heading stranded at the foot of a page looks like a mistake |

It also drops the reference file's own images, which pandoc carries into the package as
orphans and which doubled the file size, and it checks that no image is taller than the
page. **That check is the one that matters:** the source document is Letter size with
0.9in margins, so the usable height is 9.40in and the text column is 6.69in. Any image
taller than about 1.40:1 will be cut off. This is what happened to the first flow diagram.

The output is written under a dated name, never over the 1 August file, because that file
carries hand edits made in Word.
