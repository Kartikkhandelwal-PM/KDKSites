# KDK Sites: Personalised Website Builder
## Product Requirements Document

| | |
|---|---|
| **Product** | KDK Sites: Personalised Website Builder |
| **Product owner** | KDK Software (appadmin@kdksoftware.com) |
| **Prepared by** | Kartik Khandelwal (Kartik.khandelwal@kdksoftware.com) |
| **Version** | 2.0 |
| **Date** | 17 August 2026 |
| **Audience** | Leadership, product, design, development, support, sales |

**How this document is arranged.** Sections 1 to 4 explain what the product is and how a user moves through it. Section 5 is the product itself, written module by module in the order the user meets them. Every module states its purpose, its fields, the validation on each field, and the rules it follows. Sections 6 to 9 hold the reference material.

## 1. Objective

KDK's customers are Chartered Accountants, Advocates, Tax Consultants, GST Practitioners, Company Secretaries and Cost Accountants. Most of them have no website. Their clients search for them online and find nothing.

**The objective of this product is to give every one of these professionals a professional digital presence, built by themselves, in under ten minutes, with no technical knowledge and no outside help.**

| # | Objective | Measure |
|---|---|---|
| 1 | A professional can publish a complete website without help | Time from first sign-in to first published site is under 10 minutes |
| 2 | The published website looks professional, not templated | Four designs, six colour themes each, so firms do not share an appearance |
| 3 | The website brings in work, not just presence | Every site carries a contact form, a WhatsApp button, and an enquiry inbox |
| 4 | The professional responds quickly to an enquiry | The owner is emailed on every enquiry, and one click opens it |
| 5 | The website never carries a claim the professional did not make | No section, and no field, is ever filled with sample or invented content |
| 6 | The firm can maintain the site itself | Any content can be edited and republished at any time, with no charge and no waiting |

## 2. Who This Is For

The product serves six professions. Each one starts with its own set of services already loaded, so the user never faces an empty page.

| Profession | Services loaded by default |
|---|---|
| Chartered Accountant | Income Tax Return filing, GST, Tax Audit, TDS, ROC filings, NRI services |
| Advocate / Lawyer | Civil, Criminal, Corporate law, Tax litigation, Property matters |
| Tax Consultant | ITR filing, TDS, Tax planning, NRI tax, IT notices |
| GST Practitioner | GST registration, Returns filing, GSTR-9, Notice handling |
| Company Secretary | Company incorporation, ROC filings, FEMA compliance, Board meetings |
| Cost Accountant | Cost audit, CAS compliance, Management accounting, Budgeting |

**The user.** Runs a small or mid-sized practice. Uses WhatsApp and basic apps. Has never built a website and does not want to learn how.

**The second user.** The visitor to the published site, who is the professional's prospective client. The site must load fast, read clearly on a phone, and make contact obvious.

## 3. Scope

### 3.1 In Scope

| # | Included |
|---|---|
| 1 | A six-step builder covering design, business details, content, services and publishing |
| 2 | An AI interview that writes the entire website from the user's spoken-language answers |
| 3 | Profile import: the user uploads an existing firm profile and the AI fills in what it covers |
| 4 | Four designs, six colour themes each |
| 5 | Sign-in, so each user's site and drafts are saved to their own account |
| 6 | Publishing to a KDK-owned web address, with no purchase or setup by the user |
| 7 | Taking a site offline and bringing it back online |
| 8 | An enquiry inbox with status, private notes, search and export |
| 9 | An email alert to the owner on every enquiry |
| 10 | A WhatsApp button on every published site |
| 11 | Mobile layout, SSL, and search-engine groundwork, applied automatically |

### 3.2 Out of Scope

| # | Excluded | Reason |
|---|---|---|
| 1 | The firm's own domain name | Requires the user to buy and manage a domain, which is the technical burden this product removes |
| 2 | Multiple pages or a blog | Every extra page is content the firm must write and maintain |
| 3 | A client login area on the published site | A separate product with separate security requirements |
| 4 | Payments or appointment booking on the site | Compliance and support load, with no proven demand |
| 5 | Pulling the user's existing KDK records into the site automatically | Different from profile import, where the user hands over a document deliberately |
| 6 | Alerts by WhatsApp or SMS | Planned for a later phase. Email is the first channel |

## 4. How The Product Works, End To End

This is the only place the full journey is described. Each module in Section 5 then covers its own screen in detail.

### 4.1 From Sign-In To A Live Website

![How a professional gets from signing in to a live website](screenshots/user-flow-build.png)

1. The professional signs in.
2. They choose a design and a colour theme.
3. They fill in the content by one of three routes: upload an existing firm profile, answer the AI interview, or type it in themselves. The routes can be combined.
4. They review the content across the six steps.
5. They choose a web address and publish.
6. The site is live. The address is fixed from this point.

### 4.2 After The Website Is Live

![What happens once the website is live](screenshots/user-flow-live.png)

1. A prospective client finds the site and submits the contact form.
2. The enquiry is saved to the inbox immediately.
3. The owner is emailed. One click in that email opens the enquiry.
4. The owner calls, sends a WhatsApp message, or emails the client, and sets the enquiry's status.
5. The owner can edit the content and publish changes at any time, or take the site offline and bring it back.

## 5. Modules

### 5.1 Module 1: Sign In And Account

**Purpose.** Protect each user's site and give them one place to reach their account.

**What it covers.** The sign-in screen, account creation, the account menu, and sign-out.

#### Fields and validation

| Field | Required | Validation |
|---|---|---|
| Email | Yes | Must be a valid email address |
| Password | Yes | At least 6 characters when creating an account |
| Full name | Yes, when creating an account | Cannot be blank |

#### Rules

| # | Rule |
|---|---|
| 1 | The builder cannot be used without signing in |
| 2 | Signing in loads the user's saved site exactly as they left it, whether draft or published |
| 3 | A new account must confirm its email address before signing in |
| 4 | Signing out clears anything saved only on that device, so the next person to use the device sees nothing of the previous user's work |

#### The account menu

![The account menu, opened from the profile card at the bottom left](screenshots/profile-menu.png)

| Menu item | Function |
|---|---|
| Profile | Reserved. Not yet built |
| Enquiries | Opens the enquiry inbox (Module 9) |
| Settings | Reserved. Not yet built |
| Subscription | Reserved. Not yet built |
| Sign Out | Ends the session and returns to the sign-in screen |

### 5.2 Module 2: Design And Colour Theme

**Purpose.** Set how the published website looks.

**What it covers.** Step 1 of the builder: the four designs, and the six colour themes belonging to each.

![Step 1: choosing a design](screenshots/step1-design-colours.png)

![Step 1: choosing a colour theme for that design](screenshots/step1-colour-palette.png)

#### Fields and validation

| Field | Required | Options | Default | Validation |
|---|---|---|---|---|
| Design | Yes | Apex, Nova, Heritage, Zenith | Apex | Always set. Cannot be empty |
| Colour theme | Yes | Six per design | First theme of the selected design | Always set. Cannot be empty |

#### Rules

| # | Rule |
|---|---|
| 1 | Changing the design keeps all content already entered. Only the appearance changes |
| 2 | Each design has its own six colour themes. Themes are not shared between designs |
| 3 | The preview updates immediately when either is changed |
| 4 | Changing the design on a published site does not change the live site until the user publishes again |

### 5.3 Module 3: Creating The Content

**Purpose.** Produce the website's written content.

**What it covers.** Three routes to the same result. The user may use any one, or combine them.

| Route | Module | Suits |
|---|---|---|
| Upload an existing firm profile | 5.4 | Firms that already have a profile, brochure or CV |
| Answer the AI interview | 5.5 | Users who can describe their practice but do not want to write it |
| Type it in directly | 5.6 to 5.9 | Users who want full control |

#### Rules

| # | Rule |
|---|---|
| 1 | All three routes produce the same six steps of content. Nothing is exclusive to one route |
| 2 | Uploading a profile does not skip the interview. It fills what the document covers, and the interview then asks for the rest |
| 3 | Whatever the user has typed themselves is never overwritten by either AI route |
| 4 | Where two sources offer the same empty field, the uploaded document is used before the previously published site |
| 5 | Nothing produced by either AI route goes live on its own. The user reviews it in the six steps and publishes it deliberately |

### 5.4 Module 3A: Import From A Profile Document

**Purpose.** Let a firm that already has a written profile reuse it instead of retyping it.

**What it covers.** The upload screen, the reading of the document, and how the extracted answers enter the interview.

![The upload screen, with the option to answer questions instead given equal weight](screenshots/ai-writer-import-upload.png)

#### Fields and validation

| Field | Required | Validation |
|---|---|---|
| Uploaded file | No. Import is always optional | Must be PDF, DOCX, JPG or PNG. Maximum 10 MB. One file per import. Anything else is refused with a message naming what is accepted |

#### What the document fills

| Filled from the document | Never taken from the document |
|---|---|
| Firm name, city, phone, email, office address, office hours | Client reviews |
| Years practising, only if stated or derivable from a founding year | Key numbers that are not client-facing trust signals |
| Partner names, and a partner's designation only where a job title is stated | A partner's role guessed from a qualification |
| Which of the preset services to switch on, matched by meaning | Any service outside the preset list |
| Social links, and claims the document states in plain words | Anything the document only implies |

#### Rules

| # | Rule |
|---|---|
| 1 | A field the document does not state is left empty. It is never guessed, estimated or improved |
| 2 | An empty field is a correct result. The interview then asks the user for it |
| 3 | Every imported answer is shown tinted green, under a banner naming the uploaded document as the source, so the user can see what to check |
| 4 | An import made part way through the interview fills empty fields only, and never overwrites what the user has typed |
| 5 | The uploaded file is read once and discarded. It is not saved to the account, not stored on KDK's servers, and not retained afterwards |
| 6 | Import cannot create a service that is not in the profession's preset list |

#### What the user sees after the document is read

![The interview after the document has been read: answered screens are ticked in the rail on the left, and the interview asks for what the document did not cover](screenshots/ai-writer-question.png)

The rail on the left is the record of what the document supplied. A screen with a tick is complete. A screen without one is still to be answered, and its fields are empty rather than guessed. In the screen shown, the document gave nothing about what the firm is best known for or its typical clients, so the interview asks for both.

**Why rule 1 matters.** These users are registered with the ICAI or a Bar Council and work under rules on advertising and misrepresentation. A claim the AI invents is published under the professional's name and becomes their liability. Filling more fields is not a better result. Correctly leaving a field blank is.

**Example.** A firm profile states "more than 50 years in aggregate experience", meaning the total across six partners. The correct result is to leave "Years practising" empty and keep 50 only as a key number with its wording intact. Filling 50 would publish "50 years of practice" for a firm that may be ten years old.

### 5.5 Module 3B: AI Website Writer

**Purpose.** Write the entire website from short answers given in the user's own words.

**What it covers.** An interview of seven screens and a final review, then the writing of every line of content.

![The AI Website Writer opens on a choice of two routes](screenshots/ai-writer-intro.png)

#### Screen 1: Your practice

| Field | Required | Validation |
|---|---|---|
| Profession | Yes | Must be selected from the six |
| Firm or practice name | Yes | Cannot be blank |
| Years practising | Yes | Cannot be blank. Sets the founded year and anchors any figures the AI writes |

#### Screen 2: What sets you apart

| Field | Required | Validation |
|---|---|---|
| What you are best known for | Yes | At least 2 entries |
| Your typical clients | Yes | At least 2 entries |
| Key numbers worth showing | No | Optional. If any are added, at least 3 and at most 6. One or two are not allowed |

#### Screen 3: How you work

| Field | Required | Validation |
|---|---|---|
| Process steps | Yes | At least 3 steps, at most 5 |

#### Screen 4: Founders and partners

![Screen 4, with answers carried over from the published site shown in green](screenshots/ai-writer-partners.png)

| Field | Required | Validation |
|---|---|---|
| Partners | Yes | At least 1, at most 4 |
| Full name | Yes, for every partner started | Cannot be blank |
| Designation or role | Yes, for every partner started | Cannot be blank |
| What do they handle | No | Free text, one line per partner |
| Photo | No | Image file, up to 5 MB. Cropped to a square on upload |

**Why "What do they handle" exists.** A name and a designation give the AI nothing to write from, and it fills the gap by inventing a career history for a real, named person. Whatever is typed here is the only material the partner's write-up may be built from. Left empty, the AI writes a short factual line naming the role and nothing more.

#### Screen 5: Client reviews

| Field | Required | Validation |
|---|---|---|
| Reviews | No | Optional. If any are added, at least 3 and at most 6 |
| Client name | Yes, for every review started | Cannot be blank |
| What they said | Yes, for every review started | Cannot be blank. This is what the AI turns into the finished review |

#### Screen 6: Contact details

| Field | Required | Validation |
|---|---|---|
| City | Yes | Cannot be blank |
| Phone number | Yes | Cannot be blank |
| Email address | Yes | Must be a valid email address |
| Office address | Yes | Cannot be blank |
| Office hours | Yes | Cannot be blank. Pre-filled with "Mon to Sat: 10:00 AM to 7:00 PM", which the user can change |
| Social links | No | Each one given becomes an icon in the site footer |

#### Screen 7: Anything else

| Field | Required | Validation |
|---|---|---|
| Anything not already covered | No | Free text. Awards, languages spoken, specialisations |

#### Screen 8: Review and write

The user sees every answer on one screen before the AI writes anything.

#### Rules

| # | Rule |
|---|---|
| 1 | Every required answer is checked twice: when the user moves between screens, and again when they press "Write my website". A user cannot jump to the review screen and generate a site with answers missing |
| 2 | The AI writes only from the answers given. It does not add facts, figures or credentials of its own |
| 3 | If the firm already has a published site, the interview opens with the plain facts already filled in and tinted green: firm name, city, years, phone, email, address, hours, social links, and partner names, roles and photos |
| 4 | Judgement answers are never carried over: what you are known for, typical clients, key numbers, process, review notes. The site stores only the AI's finished wording, and feeding that back produces weaker writing on the second pass |
| 5 | Skipping the reviews screen leaves any reviews already live on the site untouched |
| 6 | The finished content is placed into the six steps for the user to review. Nothing is published automatically |

### 5.6 Module 4: Business And Contact Details

**Purpose.** Record who the firm is and how a client reaches them.

**What it covers.** Step 2 of the builder, in four parts: firm identity, contact information, social links, and footer.

![Step 2: firm identity and contact information](screenshots/step2-business-contact.png)

![Step 2: contact information and social links](screenshots/step2-contact-details.png)

![Step 2: social links and footer](screenshots/step2-social-footer.png)

#### Fields and validation

| Field | Required | Validation | Message shown |
|---|---|---|---|
| Profession | Yes | Must be one of the six | "Please select your profession." |
| Firm or practice name | Yes | Cannot be blank | "Enter your firm or practice name." |
| City | Yes | Cannot be blank | "Enter the city you practise in." |
| Phone number | Yes | Cannot be blank | "Enter a contact phone number." |
| Email address | Yes | Cannot be blank, and must be a valid email address | "Enter an email address." / "Enter a valid email address." |
| Tagline | No | Free text | |
| Founded year | No | Year | |
| Team size | No | Number | |
| Firm logo | No | PNG, JPG, SVG, WebP or GIF, up to 2 MB | |
| WhatsApp number | No | Powers the floating WhatsApp button on the site | |
| Office hours | No | Free text | |
| Office address | No | Free text | |
| Membership or registration number | No | For example an ICAI membership number | |
| LinkedIn, Facebook, Instagram, YouTube | No | Each is a link | |
| Footer text and copyright line | No | Free text | |

#### Rules

| # | Rule |
|---|---|
| 1 | Changing the profession reloads that profession's preset services |
| 2 | A social link left blank hides its icon on the published site. No dead link is shown |
| 3 | A contact detail left blank removes that row from the published site. It is never replaced with sample text |
| 4 | "Powered by KDK Software" appears in the footer of every site and cannot be removed |

### 5.7 Module 5: Hero And Key Numbers

**Purpose.** Set the first thing a visitor reads, and the figures that build trust.

**What it covers.** Step 3 of the builder: the banner at the top of the site, and up to six key numbers.

![Step 3: the hero banner](screenshots/step3-hero-stats.png)

![Step 3: buttons, audience tags and key numbers](screenshots/step3-stats.png)

#### Fields and validation

| Field | Required | Validation | Message shown |
|---|---|---|---|
| Headline | Yes | Cannot be blank. Each new line becomes a new line on the site | "Add a headline for your hero section." |
| Eyebrow badge | No | Short line above the headline, for example "Accepting new clients for FY 2026-27" | |
| Highlighted phrase | No | The part of the headline shown in the site's accent colour | |
| Sub-heading | No | One or two sentences, 20 to 35 words | |
| Primary button | No | Button text, for example "Book a Consultation" | |
| Secondary button | No | Button text, for example "View Services" | |
| Audience tags | No | Short labels shown under the hero, for example "NRI Clients" | |
| Key numbers | No | Up to 6. Each has a figure and a label | |

#### Rules

| # | Rule |
|---|---|
| 1 | If no key numbers are added, the whole strip is left off the published site |
| 2 | Key numbers are entered by the user only. The AI does not invent a figure |
| 3 | Quick-insert buttons are available for the common symbols: star, rupee, plus, per cent and tick |

### 5.8 Module 6: Services

**Purpose.** List what the firm does.

**What it covers.** Step 4 of the builder: the preset services for the selected profession, and any custom services the firm adds.

![Step 4: the preset services](screenshots/step4-services.png)

![Step 4: adding a custom service](screenshots/step4-add-custom.png)

#### Fields and validation

| Field | Required | Validation | Message shown |
|---|---|---|---|
| Services shown on the site | At least 1 | At least one service must be switched on | "Turn on at least one service to show on your site." |
| Service name and description | No | Every preset service can be renamed and rewritten | |
| Custom service | No | Free text. Added to the same list | |

#### Rules

| # | Rule |
|---|---|
| 1 | Switching a service off removes it from the published site. It is not deleted, and can be switched back on |
| 2 | Custom services behave exactly like preset ones once added |
| 3 | Changing the profession replaces the preset list. Custom services are kept |

### 5.9 Module 7: About, Partners, Process And Reviews

**Purpose.** Establish who the firm is and why a client should trust it.

**What it covers.** Step 5 of the builder, in five parts.

![Step 5: about the firm, and founders and partners](screenshots/step5-about-story.png)

![Step 5: about highlights, and how we work](screenshots/step5-highlights-process.png)

![Step 5: client testimonials](screenshots/step5-testimonials.png)

#### Fields and validation

| Field | Required | Validation | Message shown |
|---|---|---|---|
| Partners | At least 1 | At least one partner must have a name. Maximum 4 | "Enter at least one founder or partner name." |
| Partner name | Yes, for every partner added | Cannot be blank | |
| Partner role or designation | No | Free text | |
| Partner photo | No | Image up to 5 MB. Cropped to a square on upload | |
| Partner credentials | No | One per line. Shown as bullet points | |
| About the firm | No | 45 to 70 words | |
| About highlights | No | Three short selling points, each with a one-line explanation | |
| How we work | No | 3 to 5 numbered steps | |
| Client testimonials | No | If used, 3 to 6. Each has a rating, the review, the client's name, their role, and an optional photo | |

#### Rules

| # | Rule |
|---|---|
| 1 | Every photo is cropped to a square when it is uploaded, because all four designs display it as a square |
| 2 | The first partner leads the About section on the published site |
| 3 | Any part left empty is left off the published site. It is never filled with the design's sample content |
| 4 | If no testimonials are added, the reviews section does not appear on the site at all |

### 5.10 Module 8: Publish

**Purpose.** Put the site on the internet, and manage it once it is live.

**What it covers.** Step 6 of the builder: choosing the web address, publishing, publishing changes, and taking the site offline.

#### Fields and validation

| Field | Required | Validation | Message shown |
|---|---|---|---|
| Web address | Yes | Cannot be blank | "Choose a subdomain for your site." |
| Web address format | Yes | At least 3 characters. Lowercase letters, numbers and hyphens only. No spaces or other symbols | "Use at least 3 letters, numbers or hyphens (no spaces)." |
| Web address availability | Yes | Checked against every existing site. Launch stays disabled until the address is confirmed free | The screen shows "Available" once confirmed |
| Domain | Yes | Selected from KDK's domain list. See Section 7 | |

#### The four states of this screen

**State 1: Ready to launch.** The site has never been published.

![Ready to launch, showing the warning that the address cannot be changed later](screenshots/step6-never-published.png)

| Item | Detail |
|---|---|
| Buttons | Launch Website |
| Message | "Check your address before you launch. It cannot be changed afterwards, so that every link you share keeps working." |
| When the button is disabled | While any required field anywhere in Steps 2 to 6 is incomplete, or the address is not confirmed free |

**State 2: Live, with changes not yet published.**

![Live, with changes waiting to be published](screenshots/step6-publish.png)

| Item | Detail |
|---|---|
| Buttons | Publish changes, Unpublish |
| Message | "You have changes that are not live yet. Visitors still see the version you published on [date]." |

**State 3: Live and up to date.**

![Live, with nothing left to publish](screenshots/step6-live-in-sync.png)

| Item | Detail |
|---|---|
| Buttons | Unpublish |
| Message | "Your website is live and up to date. Hover the preview to open it." |

**State 4: Offline.**

![Offline, with the address still reserved](screenshots/step6-offline.png)

| Item | Detail |
|---|---|
| Buttons | Publish again |
| Message | "Your site is offline. Your address stays reserved for you." |
| What visitors see | A "site unavailable" page |

#### Rules

| # | Rule |
|---|---|
| 1 | The web address cannot be changed once the site has been published. There is no way for the user to change it, and no admin screen to change it for them |
| 2 | The address is a pair: the name and the domain it sits on. Neither half can be changed after publishing |
| 3 | The user is warned that the address is permanent before they launch, which is the last point at which the warning is useful |
| 4 | Publishing checks every required field across Steps 2 to 6, not only Step 6. If anything is missing, the user is taken to the first incomplete step |
| 5 | Taking a site offline asks for confirmation first, and states what is kept |
| 6 | Taking a site offline keeps the address reserved, keeps all content, and keeps every enquiry |
| 7 | There is no delete. Unpublish is the only way to take a site down |
| 8 | Editing the site while it is offline is allowed. Publishing again puts the current version live |

**Why the address is permanent.** A changed address breaks every link already shared: visiting cards, WhatsApp forwards, client emails, and the firm's letterhead. Search engines have to find and rank the new address from the beginning. The old address becomes free for someone else to take, which can leave a competitor sitting on the address a firm printed on its stationery.

### 5.11 Module 9: Enquiries Inbox

**Purpose.** Collect every enquiry from the website in one place inside the KDK app, and let the firm work through it.

**What it covers.** The inbox screen, reached from the account menu.

![The enquiry inbox](screenshots/enquiries-inbox.png)

The names, numbers and messages shown above are examples used for this document, not real visitor data.

#### What is captured from each enquiry

| Field | Source | Always present |
|---|---|---|
| Name | Contact form. Required from the visitor | Yes |
| Phone number | Contact form. Required from the visitor | Yes |
| Email address | Contact form. Optional for the visitor | No |
| Service of interest | Contact form dropdown | No |
| Message | Contact form. Optional for the visitor | No |
| Received date and time | Recorded automatically | Yes |
| Which site it came from | Recorded automatically | Yes |

#### What the owner can do

| Action | Detail |
|---|---|
| Set a status | New, Contacted, In Progress, Converted, Closed |
| Add a private note | Visible only to the owner. Never shown to the visitor |
| Call, WhatsApp or email | Directly from the row |
| Search | Across name, phone, email and message |
| Filter | By status |
| Select several at once | To change status or export them together |
| Export | To Excel, either the selected rows or all of them |

#### Rules

| # | Rule |
|---|---|
| 1 | An enquiry is saved the moment it is submitted, before anything else is attempted |
| 2 | Only the owner of the site can see its enquiries |
| 3 | Enquiries are kept when a site is taken offline |
| 4 | No action anywhere in the product deletes an enquiry |
| 5 | The list shows 10 enquiries per page, newest first |

### 5.12 Module 10: Enquiry Email Alert

**Purpose.** Tell the professional an enquiry has arrived, so they respond in minutes instead of whenever they next open the builder.

**What it covers.** The email sent on every enquiry, and the link in it.

#### What the email contains

| Line | Content |
|---|---|
| Subject | New enquiry from [visitor's name] for [firm name] |
| Preview line | Phone number, service of interest, and when it arrived |
| Body | Visitor's name, phone, email, service of interest, the message, the date and time in IST, and which of the owner's sites it came from |
| Buttons | View this enquiry, Call, WhatsApp |
| Footer | A line stating why the email was received |

#### Rules

| # | Rule |
|---|---|
| 1 | The enquiry is saved first, and the email is sent afterwards. A failure to send can never lose an enquiry |
| 2 | A field the visitor left blank is removed from the email. It is never filled with an example |
| 3 | Replying to the email writes to the visitor, when the visitor gave an email address. When they did not, the email has no reply address |
| 4 | "View this enquiry" opens that one enquiry, on whichever page of the list it sits, with its full message already open |
| 5 | If the owner is not signed in, signing in takes them to that same enquiry |
| 6 | The email is sent from a KDK address, configured so that it reaches the inbox and not the spam folder |
| 7 | The email is sent in both formatted and plain-text form, because some corporate mail systems block formatted mail |
| 8 | Automated submissions are filtered before they can trigger an email, and one site cannot send more than a set number of alerts in an hour. Beyond that, a single summary email is sent |

**Why rule 8 is part of this module.** The contact form accepts anything submitted to it. Junk in an inbox is a nuisance. Junk that triggers email reaches the owner's mailbox and drives spam complaints, which damage the reputation of the single KDK address that every customer's alerts are sent from.

### 5.13 Module 11: The Published Website

**Purpose.** The website the visitor actually sees.

**What it covers.** Everything a published site contains, whichever design was chosen.

#### Sections of every published site

| # | Section | Content |
|---|---|---|
| 1 | Navigation bar | Firm name or logo, and the menu. Becomes solid when the page is scrolled |
| 2 | Hero banner | Headline, sub-heading, buttons and audience tags |
| 3 | Key numbers | Up to 6 figures, if the firm added any |
| 4 | Services | The services switched on in Module 6 |
| 5 | About | The firm's story and credentials |
| 6 | Founders and partners | Photo, name and role for each |
| 7 | How we work | The numbered process |
| 8 | Client reviews | The testimonials, if any were added |
| 9 | Contact | Contact details, the enquiry form, and a floating WhatsApp button |
| 10 | Footer | Firm details and "Powered by KDK Software" |

#### Rules

| # | Rule |
|---|---|
| 1 | Any section with no content is left off the site entirely. It never falls back to the design's sample content |
| 2 | Every site works on a phone, which is where most visitors arrive |
| 3 | Every site is served over https, so no browser shows a security warning |
| 4 | Every site is given the page title, description, preview image and machine-readable business summary that search engines and WhatsApp use. This is generated from what the firm entered, and updates when they publish again |

## 6. Designs And Colour System

### 6.1 The Four Designs

| Design | Intended for |
|---|---|
| Apex | Chartered Accountants, Tax and Financial Consultants. Marked "Most Popular" |
| Heritage | Advocates and Legal Consultants |
| Nova | Tax Consultants, GST Practitioners |
| Zenith | Company Secretaries and Corporate professionals |

Each design carries six colour themes of its own, giving 24 combinations. Every theme is checked so that text stays readable against its background.

**Apex**

![The Apex design](screenshots/template-apex.png)

**Heritage**

![The Heritage design](screenshots/template-heritage.png)

**Nova**

![The Nova design](screenshots/template-nova.png)

**Zenith**

![The Zenith design](screenshots/template-zenith.png)

### 6.2 Design Rules

| # | Rule |
|---|---|
| 1 | No emoji anywhere. All icons are drawn as line icons |
| 2 | No external fonts. The device's own system font is used, so pages load with nothing to download |
| 3 | Every design is fully responsive on a phone |
| 4 | Colours are defined once as a set and reused, so a theme changes the whole site consistently |

## 7. Domain Names

Every published site takes the form `firm-name.domain`. KDK owns the domains, so the user buys nothing and configures nothing.

| Domain | Positioning | Status |
|---|---|---|
| kdksites.in | General, all professions | Live. Every site currently publishes here |
| CAworld.in | Chartered Accountants | Name finalised, purchase pending |
| Mycafirm.in | Chartered accountancy firms | Name finalised, purchase pending |
| caone.ai | Modern, technology-forward practices | Name finalised, purchase pending |
| cadesk.app | Short, app-style address | Name finalised, purchase pending |

Once a domain is purchased and connected, it appears in the address picker in Module 8. No other change is needed anywhere in the product.

## 8. Non-Functional Requirements

| Requirement | What it means in practice |
|---|---|
| Speed | Pages load without waiting on external fonts, scripts or large downloads |
| Mobile | Every screen, in the builder and on published sites, works on a phone |
| Security | Every published site is served over https. AI keys and credentials are never exposed to a visitor's browser |
| Account privacy | A user's draft and published site are visible only to their own account |
| Uploaded documents | A profile document is read once and discarded. It is never stored |
| Enquiries are never lost | An enquiry is saved before any notification is attempted, and nothing in the product deletes one |
| A live address never moves | Once published, the address is permanent, so every link already shared keeps working |
| Reversibility | Taking a site offline asks for confirmation, and is always reversible |
| No placeholder content | A field left blank removes its section from the published site. It never shows sample text |
| Email delivery | Enquiry alerts are sent from a properly configured KDK address so they reach the inbox |

## 9. Glossary

| Term | Meaning |
|---|---|
| Published site | The firm's live website, visible to anyone on the internet |
| Address | The web address a site is published at: a name chosen by the firm, plus a KDK-owned domain |
| Enquiry | A message sent through the contact form on a published site |
| The builder | The six-step screen where the firm creates and manages its site |
| AI Website Writer | The interview that produces the site's content from the firm's answers |
| Profile import | Uploading an existing firm profile so the AI can fill in the interview from it |
| Preset services | The services loaded automatically for the selected profession |
