# Professional Website Builder — Product Requirements Document
**KDK Software | Phase 1**
**Date:** June 2025 | **Status:** In Design

---

## 1. Problem Statement

Most CAs, Advocates, Tax Consultants, GST Practitioners, Company Secretaries, and Cost Accountants across India do not have a professional website because:
- Website development is expensive (₹15,000–₹80,000)
- They lack technical knowledge
- Agencies take 4–8 weeks
- Website maintenance is difficult and ongoing

**The goal:** A professional can create a fully functional, mobile-ready website in **5–10 minutes** without any technical knowledge.

---

## 2. Who This Is For

| Profession | Pre-loaded Services |
|---|---|
| Chartered Accountant | ITR, GST, Tax Audit, TDS, ROC, NRI Services |
| Advocate / Lawyer | Civil, Criminal, Corporate, Tax Litigation, Property |
| Tax Consultant | ITR, TDS, Tax Planning, NRI Tax, IT Notices |
| GST Practitioner | GST Registration, Returns, GSTR-9, Notices |
| Company Secretary | Incorporation, ROC Filings, FEMA, Board Meetings |
| Cost Accountant | Cost Audit, CAS, Management Accounting, Budgeting |

---

## 3. Product Scope — Phase 1

### What's Included
- 6-step wizard inside KDK app
- 3 website templates (Prestige, Clarity, Heritage)
- Pre-populated services by profession type
- Hosting on KDK subdomains: `name.kdksites.in`
- Lead capture: email + leads inbox in KDK app
- 5 page sections per website: Hero, Services, About, Contact, Footer
- WhatsApp button on all published sites
- Mobile-responsive design
- SSL secured

### What's NOT in Phase 1
- Custom domain (own domain like yourname.com)
- Client portal / login
- Blog section
- Multiple pages
- Payment gateway
- Booking/appointment system
- Integration with existing KDK profile data

---

## 4. The 6-Step Builder Wizard

| Step | What the User Does | Time |
|---|---|---|
| 1. Profession | Select profession type | 10 sec |
| 2. Template | Choose 1 of 3 designs | 20 sec |
| 3. Business Info | Enter firm name, tagline, contact, about | 3 min |
| 4. Services | Tick/untick pre-loaded services | 1 min |
| 5. Colour Theme | Select 1 of 6 colour palettes | 20 sec |
| 6. Publish | Choose subdomain, click Publish | 30 sec |
| **Total** | | **~6 minutes** |

---

## 5. Website Templates

### Template 1 — Prestige (Dark Navy / Gold)
- **Best for:** Chartered Accountants, Senior Advocates
- **Feel:** Authoritative, trustworthy, premium
- **Hero:** Dark navy with Canvas-drawn balance scale + ledger grid texture
- **Accent:** Saffron gold (#C4830A)

### Template 2 — Clarity (White / Emerald)
- **Best for:** Tax Consultants, GST Practitioners
- **Feel:** Clean, modern, approachable
- **Hero:** White with compliance dashboard card visual
- **Accent:** Deep emerald (#0F6B45)

### Template 3 — Heritage (Warm Parchment / Brown)
- **Best for:** Advocates, Company Secretaries
- **Feel:** Traditional, warm, established
- **Hero:** Cream with ornate scales of justice canvas illustration
- **Accent:** Cognac brown (#6B3A1F) + gold

---

## 6. Page Sections (All Templates)

1. **Navigation** — Firm name, seal/logo, nav links, CTA button. Sticky, goes solid on scroll.
2. **Hero** — Firm name, tagline, specialty tags, 2 CTA buttons, trust stats card. Canvas illustration.
3. **Stats Bar** — 4 key numbers (years, clients, team, record)
4. **Services** — Cards grid with SVG icons. Pre-populated by profession.
5. **About** — Founder photo, firm story, credentials/registrations
6. **Why Us** — 4 trust points specific to the profession
7. **Testimonials** — 3 client quotes with star ratings
8. **Contact** — Info cards + enquiry form + WhatsApp button
9. **Footer** — Firm details, links, "Powered by KDK Software"

---

## 7. Lead Capture Flow

When a visitor submits the contact form on a professional's website:
1. Email notification sent to the professional instantly
2. Lead saved to "Leads" inbox inside KDK app dashboard
3. Lead contains: Name, Phone, Service Required, Message, Timestamp, Website URL

---

## 8. Design System

### Colour Themes Available
| Theme | Primary | Accent | Best For |
|---|---|---|---|
| Navy & Gold | #0D1E35 | #C4830A | CA, Senior Advocate |
| Navy & Crimson | #1A1A2E | #E94560 | Litigators |
| Forest Deep | #0D2137 | #1B5E3B | Tax / Compliance |
| Charcoal Gold | #212121 | #C4830A | Corporate professionals |
| Royal Blue | #1A237E | #FFC107 | CS, CMA |
| Walnut | #3E2723 | #C4830A | Traditional Advocates |

### Typography
System font stack: `'Segoe UI', system-ui, -apple-system, sans-serif`
- Headings: weight 800, letter-spacing -0.04em
- Body: weight 400–500, line-height 1.7
- Labels/eyebrows: weight 700, letter-spacing 0.12em, uppercase

### Icons
All service and contact icons are inline SVG — geometric, line-style. No emoji.

---

## 9. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Golang |
| Frontend (Admin/Builder) | React + Vite |
| Database | MySQL |
| Published Website Rendering | Dynamic (server-rendered on each visit) |
| Hosting | KDK infrastructure, subdomains |

---

## 10. Business Model (TBD)

To be decided. Options:
- **Add-on subscription:** ₹X/month added to existing KDK plan
- **One-time fee:** Single payment for lifetime access
- **Freemium:** Basic free, premium themes/features paid
- **Bundled:** Included in higher-tier KDK plans

**Revenue note:** This feature increases average ticket size per KDK customer.

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| Time to publish first website | < 10 minutes |
| % of users completing all 6 steps | > 70% |
| Websites published in first month | 100+ |
| Leads generated per site per month | 3–10 |
| User satisfaction score | > 4.2 / 5 |
