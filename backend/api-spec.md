# Website Builder — API Specification
**Backend: Golang | Format: REST/JSON**

---

## Base URL
```
/api/v1/website-builder
```
All endpoints require JWT auth token from KDK main app.

---

## Endpoints

### 1. Get My Website
```
GET /api/v1/website-builder/my-website
```
Returns the logged-in user's website config (or 404 if none created yet).

**Response 200:**
```json
{
  "id": 1,
  "subdomain": "sharma-associates",
  "full_url": "https://sharma-associates.kdksites.in",
  "status": "published",
  "profession": "ca",
  "template": "prestige",
  "color_theme": "navy_gold",
  "published_at": "2025-06-22T10:30:00Z",
  "business_info": {
    "firm_name": "Sharma & Associates",
    "tagline": "Trusted financial guidance since 1998",
    "about_text": "...",
    "years_exp": 25,
    "clients_count": 500,
    "team_size": 8,
    "phone": "+91 98765 43210",
    "whatsapp": "+91 98765 43210",
    "email": "ca@sharmafirm.in",
    "city": "New Delhi",
    "address": "301, Connaught Place, New Delhi - 110001",
    "membership_no": "ICAI M.No. 123456",
    "firm_reg_no": "FRN 004567N"
  },
  "services": [
    { "id": 1, "name": "ITR Filing", "description": "...", "is_active": true, "sort_order": 1 }
  ]
}
```

---

### 2. Create Website (Step 1 — Choose Profession)
```
POST /api/v1/website-builder/create
```
**Body:**
```json
{
  "profession": "ca"
}
```
Creates a draft website and returns pre-populated services for that profession.

**Response 201:**
```json
{
  "website_id": 1,
  "profession": "ca",
  "suggested_services": [
    { "id": 1, "name": "ITR Filing", "default_active": true },
    { "id": 2, "name": "GST Returns", "default_active": true }
  ]
}
```

---

### 3. Update Template & Theme (Steps 2 & 5)
```
PATCH /api/v1/website-builder/{website_id}/appearance
```
**Body:**
```json
{
  "template": "prestige",
  "color_theme": "navy_gold"
}
```
**Response 200:** `{ "updated": true }`

---

### 4. Save Business Info (Step 3)
```
PUT /api/v1/website-builder/{website_id}/business-info
```
**Body:**
```json
{
  "firm_name": "Sharma & Associates",
  "tagline": "Trusted financial guidance since 1998",
  "about_text": "...",
  "years_exp": 25,
  "clients_count": 500,
  "team_size": 8,
  "phone": "+91 98765 43210",
  "whatsapp": "+91 98765 43210",
  "email": "ca@sharmafirm.in",
  "city": "New Delhi",
  "address": "301, Connaught Place, New Delhi - 110001",
  "membership_no": "ICAI M.No. 123456",
  "firm_reg_no": "FRN 004567N"
}
```
**Response 200:** `{ "updated": true }`

---

### 5. Save Services (Step 4)
```
PUT /api/v1/website-builder/{website_id}/services
```
**Body:**
```json
{
  "services": [
    { "id": 1, "is_active": true, "sort_order": 1 },
    { "id": 2, "is_active": true, "sort_order": 2 },
    { "name": "My Custom Service", "is_active": true, "is_custom": true, "sort_order": 10 }
  ]
}
```
**Response 200:** `{ "updated": true }`

---

### 6. Check Subdomain Availability
```
GET /api/v1/website-builder/check-subdomain?name=sharma-associates
```
**Response 200:**
```json
{ "available": true, "suggested": ["sharma-associates", "sharma-ca", "sharmaca-delhi"] }
```

---

### 7. Publish Website (Step 6)
```
POST /api/v1/website-builder/{website_id}/publish
```
**Body:**
```json
{ "subdomain": "sharma-associates" }
```
Validates subdomain, sets status to `published`, triggers DNS/routing setup.

**Response 200:**
```json
{
  "published": true,
  "url": "https://sharma-associates.kdksites.in",
  "published_at": "2025-06-22T10:30:00Z"
}
```

---

### 8. Unpublish Website
```
POST /api/v1/website-builder/{website_id}/unpublish
```
**Response 200:** `{ "unpublished": true }`

---

### 9. Get Leads
```
GET /api/v1/website-builder/{website_id}/leads?status=new&page=1&limit=20
```
**Response 200:**
```json
{
  "leads": [
    {
      "id": 1,
      "visitor_name": "Rahul Gupta",
      "phone": "+91 98765 00001",
      "email": "rahul@example.com",
      "service": "ITR Filing",
      "message": "Need to file ITR for FY 2024-25",
      "status": "new",
      "created_at": "2025-06-22T09:15:00Z"
    }
  ],
  "total": 42,
  "page": 1
}
```

---

### 10. Update Lead Status
```
PATCH /api/v1/website-builder/{website_id}/leads/{lead_id}
```
**Body:** `{ "status": "contacted" }`
**Response 200:** `{ "updated": true }`

---

### 11. Public — Render Website (No Auth)
```
GET /sites/{subdomain}
```
Serves the published website to public visitors. No auth required.
Resolves subdomain → loads config from DB → renders template with data.

---

### 12. Public — Submit Lead (No Auth)
```
POST /sites/{subdomain}/lead
```
**Body:**
```json
{
  "name": "Rahul Gupta",
  "phone": "+91 98765 00001",
  "email": "rahul@example.com",
  "service": "ITR Filing",
  "message": "Need ITR filed for FY 2024-25"
}
```
Saves lead to DB and sends email notification to the professional.

**Response 200:** `{ "received": true }`

---

## Error Responses

All errors follow this format:
```json
{
  "error": "SUBDOMAIN_TAKEN",
  "message": "This web address is already taken. Please choose another."
}
```

Common error codes:
| Code | Meaning |
|---|---|
| `SUBDOMAIN_TAKEN` | Subdomain already in use |
| `SUBDOMAIN_INVALID` | Contains invalid characters |
| `WEBSITE_NOT_FOUND` | No website for this user |
| `VALIDATION_ERROR` | Required field missing |
| `UNAUTHORIZED` | JWT token missing or expired |
