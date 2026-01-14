# Sub-Plan 11: Edge Functions

## Status: Not Started

## Scope
Create Supabase Edge Functions for server-side operations that cannot run in the browser.

## Goals
- [ ] Set up Supabase Edge Functions environment
- [ ] Implement ARES lookup (Czech company registry)
- [ ] Implement email sending
- [ ] Implement user invitation
- [ ] Implement scheduled jobs setup

## Edge Functions to Create

### 1. ares-lookup
Fetches company data from Czech ARES registry by IČO.

### 2. send-email
Generic email sending function for various use cases.

### 3. invite-user
Creates auth user and sends invitation email.

### 4. generate-pdf (optional)
Generate PDF documents (invoices, contracts).

## Existing Structure
```
supabase/functions/
  └── invite-user/
      └── index.ts
```

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/ares-lookup/index.ts` | ARES API integration |
| `supabase/functions/send-email/index.ts` | Email sending via Resend/SMTP |
| `supabase/functions/invite-user/index.ts` | Update existing |

## Implementation Steps

### Environment Setup
- [ ] Configure Supabase CLI for edge functions
- [ ] Set up environment variables (secrets)
- [ ] Configure CORS for edge functions

### ARES Lookup Function
- [ ] Create function to call ARES API
- [ ] Parse response for company data
- [ ] Return: name, address, DIČ, legal form
- [ ] Handle not found / invalid IČO
- [ ] Cache responses (optional)

**ARES API Endpoint:**
```
https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}
```

### Email Sending Function
- [ ] Choose provider: Resend, SendGrid, or SMTP
- [ ] Create generic send-email function
- [ ] Support HTML templates
- [ ] Handle errors and retries
- [ ] Log sent emails

**Email Types:**
- Access request email (to client)
- Onboarding form link (to client)
- Interview invitation (to applicant)
- Rejection email (to applicant)
- User invitation (to new CRM user)

### User Invitation Function
- [ ] Update existing invite-user function
- [ ] Create auth user with random password
- [ ] Send password reset email
- [ ] Create profile record
- [ ] Optionally create colleague record

### Scheduled Jobs (Cron)
- [ ] Birthday notifications (daily check)
- [ ] Invoice reminders (optional)
- [ ] Data cleanup (optional)

**Supabase Cron Setup:**
Use pg_cron extension or external scheduler

## Edge Function Structure

```typescript
// supabase/functions/ares-lookup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ico } = await req.json();
    
    // Validate ICO format
    // Call ARES API
    // Parse and return data
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## Environment Variables Needed

| Variable | Purpose |
|----------|---------|
| RESEND_API_KEY | Email sending (if using Resend) |
| SMTP_HOST | SMTP server (if using SMTP) |
| SMTP_PORT | SMTP port |
| SMTP_USER | SMTP username |
| SMTP_PASS | SMTP password |
| FROM_EMAIL | Default sender email |

## Frontend Integration

Update components to call edge functions:

- Lead forms: Call ares-lookup on IČO blur
- Access request dialog: Call send-email
- Onboarding send: Call send-email
- Invite user: Call invite-user
- Applicant emails: Call send-email

## Testing Checklist
- [ ] Edge functions deploy successfully
- [ ] ARES lookup returns company data
- [ ] ARES handles invalid IČO
- [ ] Email sending works
- [ ] Email templates render correctly
- [ ] User invitation creates account
- [ ] Invitation email sent
- [ ] CORS configured correctly
- [ ] Error handling returns proper responses
- [ ] Frontend can call functions

## Notes
- Edge functions run on Deno runtime
- Use fetch for HTTP requests
- Supabase client available via service role key
- Keep functions small and focused
- Log important operations for debugging
