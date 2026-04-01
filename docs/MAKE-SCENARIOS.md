# Make.com Scenarios Documentation

**Organization:** Socials (My Team)  
**URL:** https://eu1.make.com/180206/scenarios  
**Last Updated:** January 15, 2026

---

## Scenarios to Reuse in CRM

### 1. ✅ Odešle e-mail s žádostí o přístupy (Meta+GA4)

**Modules:** 3 (Webhooks → Gmail → Raynet CRM)

| Step | Module | Action |
|------|--------|--------|
| 1 | **Webhooks** | Custom webhook - receives trigger from external system |
| 2 | **Gmail** | Send an Email - sends access request with subject "Žádost o nasdílení přístupů - Socials.cz" from Daniel Bauer \| Socials |
| 3 | **Raynet CRM** | Upravit existující záznam - updates lead stage in Raynet |

**Email Content:** Requests client to share access to:
- Meta Business Suite (Facebook/Instagram Ads)
- Google Analytics 4

**Webhook Data Required:**
- Lead ID, contact email, contact name, company name

**CRM Integration:** Call webhook when lead stage changes to "Čekáme na přístupy". Remove Raynet update (CRM handles this).

---

### 2. ✅ Odešle e-mail s žádostí o přístupy (PPC+Meta+GA4)

**Modules:** 3 (same structure as #2)

**Email Content:** Requests client to share access to:
- Google Ads (PPC)
- Meta Business Suite (Facebook/Instagram Ads)
- Google Analytics 4

**CRM Integration:** Same as #1, use when lead is a PPC client.

---

### 3. Onboarding nového člena týmu (GW, Freelo, Notion)

**Modules:** 13+ (complex multi-branch automation)

| Step | Module | Action |
|------|--------|--------|
| 1 | **Trigger** | Webhook or Airtable watch |
| 2 | **Google Workspace** | Create user account with company email |
| 3 | **Freelo** | Create project and add user |
| 4 | **Notion** | Create workspace pages (multiple modules) |
| 5 | **Gmail** | Send welcome email with credentials |
| 6 | **Gmail** | Send setup instructions |
| 7+ | **Routers** | Handle different onboarding paths based on role |

**Webhook Data Required:**
- Employee name, personal email, role/position, start date
- Manager info for assignments
- Department for permissions

**CRM Integration:** Trigger when Applicant status changes to "Přijat" (Accepted) and Colleague record is created.

---

### 4. ✅ Raynet | Pozvat členy týmu do Slacku a Freela

**Modules:** ~10 (invitation automation)

| Step | Module | Action |
|------|--------|--------|
| 1 | **Trigger** | Raynet webhook or watch |
| 2 | **Slack** | Send invitation to workspace |
| 3 | **Freelo** | Send project invitation |
| 4 | **HTTP** | API calls for invitation links |
| 5 | **Raynet** | Update colleague record with invitation status |

**Webhook Data Required:**
- Colleague name, email
- Team/department for channel assignments
- Projects to invite to

**CRM Integration:** Combine with #3 for complete onboarding. Trigger when Colleague is created in CRM.

---

### 5. ✅ Vytvoření OP - Notion nabídka - Freelo audit task - Webhook Zapier Tldv

**Modules:** 20+ (proposal workflow)

| Step | Module | Action |
|------|--------|--------|
| 1 | **Webhook** | Receives trigger (likely from tl;dv meeting recording) |
| 2 | **Notion** | Create proposal page from template |
| 3 | **Notion** | Populate with client data |
| 4 | **Freelo** | Create audit task for team |
| 5 | **HTTP/Zapier** | Integration with tl;dv for meeting notes |
| 6 | **Raynet** | Update OP with proposal link |

**Webhook Data Required:**
- Lead/client info (name, company, requirements)
- Meeting recording URL (tl;dv)
- Estimated deal size

**CRM Integration:** Trigger when lead stage changes to "Příprava nabídky". Public offer URL is generated from `public_offers.token`.

---

### 6. ✅ Vytvoření projektu - Webhook - Slack - Freelo

**Modules:** 95 (massive comprehensive automation)

| Step | Module | Action |
|------|--------|--------|
| 1 | **Webhook** | Receives project creation trigger |
| 2 | **Freelo** | Create main project |
| 3 | **Freelo** | Create standard task lists (multiple modules) |
| 4 | **Freelo** | Add team members to project |
| 5 | **Freelo** | Create initial tasks |
| 6 | **Notion** | Create project documentation pages |
| 7 | **Notion** | Create meeting notes template |
| 8 | **Slack** | Create project channel or notify existing channel |
| 9 | **Slack** | Post project kickoff message |
| 10+ | **Routers** | Handle different project types (Retainer, One-time, Internal) |

**Webhook Data Required:**
```json
{
  "client_name": "Company XYZ",
  "project_name": "Social Media Management",
  "project_type": "retainer|one-time|internal",
  "services": ["PPC", "Meta Ads", "Creative"],
  "team_members": [
    {"name": "Jan Novák", "role": "PM", "email": "jan@socials.cz"}
  ],
  "start_date": "2026-02-01",
  "estimated_value": 50000,
  "ad_platforms": ["Meta", "Google", "Sklik"]
}
```

**Returns:**
- Freelo project URL (for `freelo_project_url` field)
- Slack channel info
- Notion documentation URLs

**CRM Integration:** **CRITICAL** - Trigger when Lead is won and Engagement is created. This is the main value-add as CRM currently only stores the Freelo URL but doesn't create the project.

---

### 7. ✅ Vytvoření smlouvy - Typeform - Google Drive - Fakturoid kontakt

**Modules:** 52 (contract and billing setup)

| Step | Module | Action |
|------|--------|--------|
| 1 | **Typeform** | Watch for onboarding form submission |
| 2 | **Google Drive** | Create contract folder |
| 3 | **Google Drive** | Copy contract template |
| 4 | **Google Drive** | Populate template with client data |
| 5 | **Google Drive** | Generate share link |
| 6 | **Fakturoid** | Create or find subject (contact) |
| 7 | **Fakturoid** | Update billing details |
| 8 | **Airtable** | Update records with contract URL |
| 9 | **Raynet** | Update OP with contract info |
| 10 | **Gmail** | Send contract notification |
| 11+ | **Routers** | Handle different contract types |

**Typeform Data Captured:**
- Company name, IČO, DIČ
- Billing address (street, city, ZIP, country)
- Primary contact (name, email, phone)
- Signing contacts for DigiSign
- Freelo contacts (who to invite)
- Service preferences

**Returns:**
- Contract URL in Google Drive
- `fakturoid_subject_id` - **CRITICAL** for CRM invoicing

**CRM Integration:** **HIGH VALUE** - Trigger after onboarding form completion. Creates the Fakturoid subject that CRM needs before it can create invoices.

---

## Implementation Guide

### How to Call These Scenarios from CRM

#### Step 1: Convert Trigger to Webhook

For each scenario, change the trigger from Airtable/Raynet to **Webhooks > Custom webhook**:

1. Open scenario in Make.com
2. Right-click the trigger module → Replace
3. Select **Webhooks > Custom webhook**
4. Copy the generated webhook URL

#### Step 2: Create CRM Edge Function

```typescript
// supabase/functions/trigger-make-scenario/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MAKE_WEBHOOKS = {
  createProject: 'https://hook.eu1.make.com/xxx',
  createContract: 'https://hook.eu1.make.com/yyy',
  requestAccess: 'https://hook.eu1.make.com/zzz',
  onboardTeamMember: 'https://hook.eu1.make.com/aaa',
}

serve(async (req) => {
  const { scenario, data } = await req.json()
  
  const webhookUrl = MAKE_WEBHOOKS[scenario]
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: 'Unknown scenario' }), { status: 400 })
  }
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  return new Response(JSON.stringify(result), { status: 200 })
})
```

#### Step 3: Call from Frontend

```typescript
// In useMakeScenarios.tsx hook
const triggerScenario = async (scenario: string, data: any) => {
  const { data: result, error } = await supabase.functions.invoke('trigger-make-scenario', {
    body: { scenario, data }
  })
  return result
}

// Usage when lead is won:
await triggerScenario('createProject', {
  client_name: client.name,
  project_name: engagement.name,
  team_members: assignedColleagues,
  // ...
})
```

