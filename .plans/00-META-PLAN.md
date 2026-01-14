# Meta-Plan: Socials CRM Supabase Implementation

This is the master plan for implementing the complete Supabase backend for Socials CRM.

---

## Phase Overview

```mermaid
flowchart TD
    subgraph phase1 [Phase 1: Foundation]
        SP1[01 Database Schema]
        SP2[02 Auth and Roles]
    end
    
    subgraph phase2 [Phase 2: Core CRM]
        SP3[03 Core Entities]
        SP4[04 Leads Pipeline]
        SP5[05 Engagements]
    end
    
    subgraph phase3 [Phase 3: Operations]
        SP6[06 Invoicing]
        SP7[07 Creative Boost]
        SP8[08 Meetings]
    end
    
    subgraph phase4 [Phase 4: HR and Internal]
        SP9[09 Recruitment]
        SP10[10 Feedback and Notifications]
    end
    
    subgraph phase5 [Phase 5: Integrations]
        SP11[11 Edge Functions]
        SP12[12 External APIs]
    end
    
    phase1 --> phase2
    phase2 --> phase3
    phase3 --> phase4
    phase4 --> phase5
```

---

## Sub-Plans

| # | Name | File | Status |
|---|------|------|--------|
| 01 | Database Schema | [01-database-schema.md](01-database-schema.md) | Planned |
| 02 | Auth and Roles | [02-auth-and-roles.md](02-auth-and-roles.md) | Planned |
| 03 | Core Entities | [03-core-entities.md](03-core-entities.md) | Planned |
| 04 | Leads Pipeline | [04-leads-pipeline.md](04-leads-pipeline.md) | Planned |
| 05 | Engagements | [05-engagements.md](05-engagements.md) | Planned |
| 06 | Invoicing and Extra Work | [06-invoicing-extra-work.md](06-invoicing-extra-work.md) | Planned |
| 07 | Creative Boost | [07-creative-boost.md](07-creative-boost.md) | Planned |
| 08 | Meetings | [08-meetings.md](08-meetings.md) | Planned |
| 09 | Recruitment | [09-recruitment.md](09-recruitment.md) | Planned |
| 10 | Feedback and Notifications | [10-feedback-notifications.md](10-feedback-notifications.md) | Planned |
| 11 | Edge Functions | [11-edge-functions.md](11-edge-functions.md) | Planned |
| 12 | External APIs | [12-external-apis.md](12-external-apis.md) | Planned |

---

## Workflow

1. **Create sub-plan file** - Detailed implementation plan
2. **User review** - Approval or changes
3. **Execute** - Implement the plan
4. **Test** - Verify functionality
5. **Update status** - Mark complete in PROGRESS.md
6. **Next** - Move to next sub-plan

---

## Key Documents

- [PROGRESS.md](PROGRESS.md) - Overall progress tracking
- [DECISIONS.md](DECISIONS.md) - Architecture decisions log

---

## Notes

- Frontend components already exist - focus is Supabase backend
- Current Supabase integration will be completely replaced
- All integrations will be implemented: Fakturoid, DigiSign, Google Calendar, AI
