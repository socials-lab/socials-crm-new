# Sub-Plan 01: Database Schema

## Status: Not Started

## Scope
Design and create the complete Supabase database from scratch, including all tables, enums, indexes, and enable RLS.

**Strategy:** Complete replacement (Option B) - existing Supabase tables will be dropped and recreated. No data migration needed (no credentials/data exist).

## Goals
- [ ] Define all ENUM types
- [ ] Create all tables with proper foreign keys
- [ ] Set up indexes for common queries
- [ ] Enable RLS on all tables
- [ ] Create updated_at trigger function
- [ ] Create profile creation trigger on auth signup

## Database Changes

### ENUM Types to Create

| Enum Name | Values |
|-----------|--------|
| user_role | admin, management, project_manager, specialist, finance, client |
| client_status | lead, active, paused, lost, potential |
| client_tier | standard, gold, platinum, diamond |
| colleague_status | active, on_hold, left |
| seniority | junior, mid, senior, partner |
| engagement_type | retainer, one_off, internal |
| engagement_status | planned, active, paused, completed, cancelled |
| billing_model | fixed_fee, spend_based, hybrid |
| cost_model | hourly, fixed_monthly, percentage |
| service_type | core, addon |
| service_category | performance, creative, lead_gen, analytics, consulting |
| service_tier | growth, pro, elite |
| lead_stage | new_lead, meeting_done, waiting_access, access_received, preparing_offer, offer_sent, won, lost, postponed |
| lead_source | referral, inbound, cold_outreach, event, linkedin, website, other |
| lead_change_type | created, stage_change, field_update, owner_change, note_added, converted |
| engagement_change_type | created, status_change, field_update, service_added, service_removed, service_updated, colleague_assigned, colleague_removed, colleague_updated, end_date_set |
| extra_work_status | pending_approval, in_progress, ready_to_invoice, invoiced |
| invoice_status | draft, ready, issued, paid |
| line_item_source | engagement, manual, creative_boost, extra_work, one_off |
| one_off_invoicing_status | not_applicable, pending, invoiced |
| output_category | banner, banner_translation, banner_revision, ai_photo, video, video_translation, video_revision |
| month_status | active, inactive |
| settings_change_type | max_credits, price_per_credit, status, colleague |
| meeting_type | internal, client |
| meeting_status | scheduled, in_progress, completed, cancelled |
| participant_role | organizer, required, optional |
| attendance_status | pending, confirmed, declined, attended |
| meeting_task_status | todo, in_progress, done |
| meeting_task_priority | low, medium, high |
| applicant_stage | new_applicant, invited_interview, interview_done, offer_sent, hired, rejected, withdrawn |
| applicant_source | website, linkedin, referral, job_portal, other |
| feedback_category | process, service, communication, system, other |
| feedback_status | new, in_review, accepted, rejected, implemented |
| notification_type | new_lead, form_completed, contract_signed, lead_converted, access_granted, offer_sent, colleague_birthday, new_feedback_idea |

### Tables to Create

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| profiles | Extended auth user profiles | id (FK auth.users), full_name (single field), email, avatar_url |
| user_roles | Role assignments | user_id, role, is_super_admin, can_see_financials, page_permissions (JSONB), last_login |
| colleagues | Team members | profile_id, full_name, email, position, seniority, status, birthday |
| services | Service catalog | code, name, service_type, category, tier_pricing (JSONB) |
| clients | Client companies | name, ico, dic, status, tier, billing address fields |
| client_contacts | Contacts per client | client_id, name, email, is_primary, is_decision_maker |
| client_services | Direct client-service links | client_id, service_id, start_date, end_date, is_active |
| leads | Sales pipeline | company_name, ico, stage, owner_id, potential_services (JSONB), notes (JSONB) |
| lead_history | Lead audit log | lead_id, change_type, field_name, old_value, new_value |
| engagements | Contracts/projects | client_id, name, type, status, monthly_fee, platforms[] |
| engagement_services | Services per engagement | engagement_id, service_id, price, creative_boost fields, upsold_by_id, upsell_commission_percent |
| engagement_assignments | Colleague assignments | engagement_id, colleague_id, cost_model, role_on_engagement |
| engagement_history | Engagement audit log | engagement_id, change_type, field changes |
| engagement_monthly_metrics | Monthly revenue/cost tracking | engagement_id, year, month, revenue, cost_total, margin |
| extra_works | Additional billable work | engagement_id, colleague_id, amount, status, billing_period, upsold_by_id, upsell_commission_percent |
| issued_invoices | Invoice records | engagement_id, invoice_number, fakturoid_id, line_items (JSONB) |
| invoice_line_items | Invoice details | invoice_id, source, amounts, proration fields |
| output_types | Creative output types | name, category, base_credits (DECIMAL for 0.5 values) |
| creative_boost_client_months | Monthly CB settings | client_id, year, month, min/max_credits, price_per_credit |
| creative_boost_outputs | Actual CB entries | client_month_id, output_type_id, normal_count, express_count |
| creative_boost_settings_history | CB settings changes | client_month_id, change_type, old/new values |
| meetings | Meeting records | title, type, client_id, scheduled_at, transcript, ai_summary |
| meeting_participants | Attendees | meeting_id, colleague_id or external_name/email |
| meeting_tasks | Tasks from meetings | meeting_id, title, assigned_to, status, priority |
| applicants | Job applicants | full_name, email, position, stage, notes (JSONB), freelancer fields |
| feedback_ideas | Internal suggestions | title, description, category, author_id, status |
| feedback_votes | Votes on ideas | idea_id, colleague_id, vote_type |
| notifications | User notifications | user_id, type, title, message, read, metadata (JSONB) |

## Files to Create
- `supabase/migrations/001_initial_schema.sql` - Complete schema

## Implementation Steps
- [ ] Write all ENUM type definitions
- [ ] Write profiles and user_roles tables
- [ ] Write colleagues table
- [ ] Write services table
- [ ] Write clients, client_contacts, and client_services tables
- [ ] Write leads and lead_history tables
- [ ] Write engagements, engagement_services, engagement_assignments tables
- [ ] Write engagement_history table
- [ ] Write engagement_monthly_metrics table
- [ ] Write extra_works table
- [ ] Write issued_invoices and invoice_line_items tables
- [ ] Write Creative Boost tables (output_types, client_months, outputs, history)
- [ ] Write meetings, participants, tasks tables
- [ ] Write applicants table
- [ ] Write feedback_ideas and feedback_votes tables
- [ ] Write notifications table
- [ ] Create indexes on frequently queried columns
- [ ] Enable RLS on all tables
- [ ] Create updated_at trigger function
- [ ] Apply updated_at triggers to all tables
- [ ] Create handle_new_user trigger for profile auto-creation
- [ ] Create helper functions (get_user_role, is_super_admin, get_colleague_id)

## Testing Checklist
- [ ] Migration runs without errors on fresh Supabase project
- [ ] All 29 tables created
- [ ] All enum types available
- [ ] Foreign keys properly enforced
- [ ] Indexes created
- [ ] RLS enabled (but no policies yet - that's Sub-Plan 02)

## Notes
- RLS will be enabled but policies created in Sub-Plan 02
- Source types from `src/types/*.ts` files
- Use JSONB for flexible arrays (notes, potential_services, line_items)
