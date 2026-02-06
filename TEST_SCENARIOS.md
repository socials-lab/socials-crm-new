# Test Scenarios - Socials CRM

## How to Use This Document
Go through each scenario step-by-step. Check the checkbox when it works. If something fails, note what went wrong.

---

## 1. AUTHENTICATION & ACCESS

### 1.1 Login Flow
- [ ] Navigate to `/auth`
- [ ] Login with valid credentials
- [ ] Verify redirect to Dashboard
- [ ] Check that sidebar shows correct pages based on role

### 1.2 Role-Based Access
- [ ] As Super Admin: verify all pages are accessible
- [ ] As Specialist: verify limited pages (should NOT see Settings, User Management)
- [ ] Try accessing a forbidden page directly via URL - should redirect or show error

### 1.3 Logout
- [ ] Click logout
- [ ] Verify redirect to login page
- [ ] Try accessing protected page - should redirect to login

---

## 2. LEADS MANAGEMENT

### 2.1 Create New Lead
- [ ] Go to Leads page
- [ ] Click "Nový lead"
- [ ] Fill in company name: "Test Company s.r.o."
- [ ] Fill in ICO: "12345678"
- [ ] Fill in contact person: "Jan Novak"
- [ ] Fill in email: "jan@test.cz"
- [ ] Fill in phone: "+420 123 456 789"
- [ ] Select lead source: "Referral"
- [ ] Save lead
- [ ] Verify lead appears in Kanban in "Nový lead" column

### 2.2 Move Lead Through Pipeline
- [ ] Drag lead from "Nový lead" to "Meeting proběhl"
- [ ] Verify lead position updates
- [ ] Open lead detail
- [ ] Add a note about the meeting
- [ ] Move to "Připravuje se nabídka"

### 2.3 Create Offer for Lead
- [ ] Open lead detail
- [ ] Click "Vytvořit nabídku"
- [ ] Add service: "Meta Ads" - Growth tier
- [ ] Add service: "Google Ads" - Growth tier
- [ ] Set monthly fee
- [ ] Generate offer
- [ ] Copy public offer URL
- [ ] Open URL in incognito - verify offer displays correctly

### 2.4 Send Onboarding Form
- [ ] From lead detail, click "Poslat onboarding formulář"
- [ ] Send email
- [ ] Copy onboarding URL
- [ ] Open in incognito
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] Go back to CRM - verify lead shows "Formulář vyplněn"

### 2.5 Convert Lead to Client
- [ ] Open a lead in "Nabídka odeslána" stage
- [ ] Click "Konvertovat na klienta"
- [ ] Verify client is created
- [ ] Verify engagement is created with selected services
- [ ] Verify lead moves to "Vyhráno"

### 2.6 Mark Lead as Lost
- [ ] Create a test lead
- [ ] Open detail
- [ ] Click "Označit jako ztracený"
- [ ] Select reason
- [ ] Add note
- [ ] Verify lead moves to "Ztraceno" column

---

## 3. CLIENTS

### 3.1 View Client List
- [ ] Go to Clients page
- [ ] Verify clients display with correct info
- [ ] Use search to find a specific client
- [ ] Filter by status (Active, Paused, etc.)

### 3.2 Edit Client
- [ ] Click on a client
- [ ] Click edit
- [ ] Change company name
- [ ] Update billing address
- [ ] Save
- [ ] Verify changes persist

### 3.3 Manage Client Contacts
- [ ] Open client detail
- [ ] Add new contact
- [ ] Fill name, email, position
- [ ] Mark as decision maker
- [ ] Save contact
- [ ] Edit existing contact
- [ ] Delete a contact (soft delete)

### 3.4 End Client Relationship
- [ ] Open active client
- [ ] Click "Ukončit spolupráci"
- [ ] Select reason
- [ ] Select who initiated (client/us)
- [ ] Add notes
- [ ] Confirm
- [ ] Verify client status changes
- [ ] Verify engagement is terminated

---

## 4. ENGAGEMENTS

### 4.1 View Engagement
- [ ] Go to Engagements page
- [ ] Click on an engagement
- [ ] Verify services display correctly
- [ ] Verify assignments display correctly
- [ ] Check monthly revenue/cost/margin calculations

### 4.2 Add Service to Engagement
- [ ] Open engagement detail
- [ ] Click "Přidat službu"
- [ ] Select service type
- [ ] Select tier (Growth/Pro/Elite)
- [ ] Set custom price if needed
- [ ] Save
- [ ] Verify service appears in engagement

### 4.3 Assign Colleague
- [ ] Open engagement
- [ ] Click "Přiřadit kolegu"
- [ ] Select colleague
- [ ] Select role
- [ ] Set cost model (hourly/fixed/percentage)
- [ ] Set rate
- [ ] Save
- [ ] Verify assignment appears
- [ ] Check colleague's workload updates on Colleagues page

### 4.4 Edit Assignment Cost
- [ ] Go to Colleagues page
- [ ] Expand a colleague card
- [ ] Find an assignment
- [ ] Click on the cost to edit
- [ ] Change value
- [ ] Save
- [ ] Verify new cost displays

---

## 5. MODIFICATION REQUESTS

### 5.1 Create Modification (Add Service)
- [ ] Open engagement
- [ ] Click "Navrhnout změnu"
- [ ] Select "Přidat službu"
- [ ] Choose service and tier
- [ ] Set effective date
- [ ] Mark as upsell if applicable
- [ ] Submit request
- [ ] Verify request appears in Modifications page as "Pending"

### 5.2 Approve Modification (Internal)
- [ ] Go to Modifications page
- [ ] Find pending request
- [ ] Click "Schválit"
- [ ] Verify status changes to "Approved"

### 5.3 Client Approval Flow
- [ ] Open approved modification
- [ ] Click "Poslat klientovi ke schválení"
- [ ] Copy public URL
- [ ] Open in incognito
- [ ] Review modification details
- [ ] Click approve
- [ ] Go back to CRM - verify status is "Client Approved"

### 5.4 Apply Modification
- [ ] Find "Client Approved" modification
- [ ] Click "Aplikovat změnu"
- [ ] Verify engagement is updated
- [ ] Verify modification status is "Applied"

### 5.5 Reject Modification
- [ ] Create a new modification request
- [ ] Click "Zamítnout"
- [ ] Add reason
- [ ] Verify status changes to "Rejected"

---

## 6. EXTRA WORK (Viceprace)

### 6.1 Create Extra Work
- [ ] Go to Extra Work page
- [ ] Click "Nová vícepráce"
- [ ] Select client
- [ ] Enter description: "Landing page redesign"
- [ ] Enter hours: 5
- [ ] Hourly rate should auto-fill based on colleague
- [ ] Save
- [ ] Verify appears in "Čeká na schválení" column

### 6.2 Approve Extra Work
- [ ] As admin, find pending extra work
- [ ] Click "Schválit"
- [ ] Verify moves to "In Progress" or "Ready to Invoice"

### 6.3 Mark as Invoiced
- [ ] Find approved extra work
- [ ] Move to "K fakturaci"
- [ ] Then move to "Vyfakturováno"
- [ ] Verify status updates

---

## 7. CREATIVE BOOST

### 7.1 View Client Overview
- [ ] Go to Creative Boost page
- [ ] Select month
- [ ] View clients with Creative Boost service
- [ ] Check credit allocations

### 7.2 Add Output
- [ ] Select a client
- [ ] Click "Přidat výstup"
- [ ] Select output type (banner, video, etc.)
- [ ] Enter quantity
- [ ] Mark as express if applicable
- [ ] Save
- [ ] Verify credits calculate correctly (express = 1.5x)

### 7.3 Check Colleague Rewards
- [ ] Go to My Work page (as assigned colleague)
- [ ] View Creative Boost section
- [ ] Verify credits earned display correctly
- [ ] Check reward calculation (80 Kč per credit)

---

## 8. INVOICING

### 8.1 View Monthly Invoices
- [ ] Go to Invoicing page
- [ ] Select month
- [ ] View list of clients to invoice
- [ ] Check line items auto-generate from:
  - Engagement services
  - Extra work
  - Creative Boost

### 8.2 Edit Invoice Line Item
- [ ] Open an invoice
- [ ] Edit a line item amount
- [ ] Add adjustment note
- [ ] Save
- [ ] Verify total recalculates

### 8.3 Add Manual Line Item
- [ ] Open invoice
- [ ] Click "Přidat položku"
- [ ] Enter description and amount
- [ ] Save
- [ ] Verify appears in invoice

### 8.4 Issue Invoice
- [ ] Find draft invoice
- [ ] Click "Vystavit"
- [ ] Verify status changes to "Issued"
- [ ] Check Fakturoid integration (if connected)

### 8.5 Mark as Paid
- [ ] Find issued invoice
- [ ] Click "Označit jako zaplaceno"
- [ ] Verify status changes to "Paid"

---

## 9. COLLEAGUES

### 9.1 View Team
- [ ] Go to Colleagues page
- [ ] Verify all colleagues display
- [ ] Check capacity/workload shows correctly (X/Y based on capacity_slots)
- [ ] Expand a card to see details

### 9.2 Edit Colleague (Admin)
- [ ] Click edit on a colleague
- [ ] Update position
- [ ] Update capacity slots (Meta Ads: 3, Google: 2)
- [ ] Save
- [ ] Verify workload denominator updates to 5

### 9.3 View Colleague Earnings
- [ ] As admin, expand colleague card
- [ ] Check monthly earnings calculation
- [ ] Verify includes:
  - Assignment costs
  - Extra work
  - Creative Boost rewards

---

## 10. MY WORK (Personal Dashboard)

### 10.1 View Assignments
- [ ] Go to My Work page
- [ ] Verify shows only YOUR assigned engagements
- [ ] Check client list

### 10.2 Add Internal Work (Interni prace)
- [ ] Click "Přidat interní práci"
- [ ] Select category (Marketing/Overhead)
- [ ] Enter description
- [ ] Enter amount or hours
- [ ] Save
- [ ] Verify appears in list

### 10.3 View Monthly Summary
- [ ] Check "Přehled fakturace" section
- [ ] Verify shows:
  - Services income
  - Extra work
  - Creative Boost rewards
  - Internal work
  - Total

---

## 11. ACADEMY

### 11.1 View Modules
- [ ] Go to Academy page
- [ ] Verify modules display
- [ ] Check progress bar shows correctly

### 11.2 Watch Video
- [ ] Click on a module
- [ ] Click on a video
- [ ] Video should play (embedded YouTube/Loom)
- [ ] Click "Označit jako zhlédnuté"
- [ ] Verify progress updates
- [ ] Refresh page - progress should persist (saved to database)

### 11.3 Admin: Create Module
- [ ] As admin with can_edit_academy permission
- [ ] Click "Upravit obsah"
- [ ] Click "Nový modul"
- [ ] Enter title, description, icon
- [ ] Save
- [ ] Verify module appears

### 11.4 Admin: Add Video to Module
- [ ] Expand module in admin panel
- [ ] Click "Přidat video"
- [ ] Enter title
- [ ] Paste YouTube URL
- [ ] Enter duration
- [ ] Save
- [ ] Verify video appears in module

---

## 12. RECRUITMENT

### 12.1 View Applicants
- [ ] Go to Recruitment page
- [ ] View Kanban of applicants
- [ ] Filter by position

### 12.2 Add New Applicant
- [ ] Click "Nový uchazeč"
- [ ] Fill name, email, phone
- [ ] Select position
- [ ] Upload CV (if supported)
- [ ] Save
- [ ] Verify appears in "Nový" column

### 12.3 Move Through Pipeline
- [ ] Drag applicant to "Pozván na pohovor"
- [ ] Send interview invitation email
- [ ] After interview, move to "Pohovor proběhl"
- [ ] Add interview notes

### 12.4 Send Offer
- [ ] Move applicant to "Nabídka odeslána"
- [ ] Generate onboarding form
- [ ] Applicant fills in freelancer details
- [ ] Mark as hired
- [ ] Convert to colleague

---

## 13. MEETINGS

### 13.1 Create Meeting
- [ ] Go to Meetings page
- [ ] Click "Nový meeting"
- [ ] Select type (internal/client)
- [ ] Enter title, date, time
- [ ] Add participants
- [ ] Save

### 13.2 Add Tasks to Meeting
- [ ] Open meeting detail
- [ ] Add task with description
- [ ] Assign to colleague
- [ ] Set priority
- [ ] Save

### 13.3 Complete Meeting
- [ ] After meeting, open detail
- [ ] Add transcript/notes
- [ ] Mark tasks as completed
- [ ] Change meeting status to "Completed"

---

## 14. NOTIFICATIONS

### 14.1 View Notifications
- [ ] Check notification bell in header
- [ ] Click to open notifications
- [ ] View unread notifications

### 14.2 Notification Triggers
- [ ] Create new lead - verify notification appears
- [ ] Submit modification request - verify notification
- [ ] Colleague birthday - verify notification on their birthday

### 14.3 Mark as Read
- [ ] Click on a notification
- [ ] Verify navigates to relevant page
- [ ] Notification should mark as read

---

## 15. DASHBOARD

### 15.1 View KPIs
- [ ] Go to Dashboard
- [ ] Verify KPI cards show:
  - Active clients count
  - Monthly revenue
  - Leads in pipeline
  - Team utilization

### 15.2 Upcoming Birthdays
- [ ] Check birthday widget
- [ ] Verify shows colleagues with upcoming birthdays

### 15.3 Today's Meetings
- [ ] Check meetings widget
- [ ] Verify shows today's scheduled meetings

### 15.4 Recent Activity
- [ ] Check activity feed
- [ ] Verify shows recent actions (new leads, conversions, etc.)

---

## 16. SERVICES CATALOG

### 16.1 View Services
- [ ] Go to Services page
- [ ] View service categories
- [ ] Check tier pricing (Growth/Pro/Elite)

### 16.2 Edit Service (Admin)
- [ ] Click on a service
- [ ] Edit description
- [ ] Update tier prices
- [ ] Save
- [ ] Verify changes persist

### 16.3 Create New Service
- [ ] Click "Nová služba"
- [ ] Fill details
- [ ] Set category and type
- [ ] Set pricing per tier
- [ ] Save
- [ ] Verify appears in catalog

---

## 17. USER MANAGEMENT (Settings)

### 17.1 View Users
- [ ] Go to Settings > Správa přístupů
- [ ] View list of CRM users
- [ ] Check their roles

### 17.2 Invite New User
- [ ] Click "Pozvat uživatele"
- [ ] Enter email
- [ ] Select role
- [ ] Select allowed pages
- [ ] Send invitation
- [ ] Check email (should receive invite link)

### 17.3 Edit User Permissions
- [ ] Click on existing user
- [ ] Change role
- [ ] Toggle can_see_financials
- [ ] Toggle can_edit_academy
- [ ] Save
- [ ] Have user refresh - verify new permissions apply

---

## 18. EDGE CASES & ERROR HANDLING

### 18.1 Empty States
- [ ] View Leads page with no leads - check empty state message
- [ ] View Engagements with no data - check message
- [ ] New colleague with no assignments - check display

### 18.2 Validation Errors
- [ ] Try creating lead without required fields - check error messages
- [ ] Try saving engagement without client - check error
- [ ] Try invalid email format - check validation

### 18.3 Concurrent Editing
- [ ] Open same client in two tabs
- [ ] Edit in tab 1, save
- [ ] Edit in tab 2, save
- [ ] Check for conflicts/overwrites

### 18.4 Network Errors
- [ ] Disconnect network
- [ ] Try to save something
- [ ] Check error handling
- [ ] Reconnect - verify recovery

---

## 19. MOBILE RESPONSIVENESS

### 19.1 Dashboard
- [ ] Open on mobile (or resize browser)
- [ ] Check KPIs stack properly
- [ ] Check sidebar collapses to hamburger menu

### 19.2 Leads Kanban
- [ ] Check Kanban scrolls horizontally on mobile
- [ ] Verify drag-drop still works (or alternative UI)

### 19.3 Forms
- [ ] Check lead creation form on mobile
- [ ] Verify all fields accessible
- [ ] Check submit button visible

---

## 20. PUBLIC PAGES

### 20.1 Public Offer Page
- [ ] Generate offer URL from lead
- [ ] Open in incognito
- [ ] Verify branding displays
- [ ] Check services list correctly
- [ ] Verify no sensitive data exposed

### 20.2 Public Modification Page
- [ ] Generate modification approval URL
- [ ] Open in incognito
- [ ] Verify modification details show
- [ ] Test approve/reject buttons
- [ ] Check confirmation message

### 20.3 Onboarding Form
- [ ] Generate onboarding URL
- [ ] Open in incognito
- [ ] Fill all required fields
- [ ] Submit
- [ ] Verify success message
- [ ] Check data appears in CRM

---

## QUICK SMOKE TEST (5 min)

Run through these quickly to verify core functionality:

1. [ ] Login works
2. [ ] Dashboard loads
3. [ ] Can create a lead
4. [ ] Can view clients
5. [ ] Can view engagements
6. [ ] Can view colleagues
7. [ ] Invoicing page loads
8. [ ] Academy videos play
9. [ ] Logout works

---

## Notes Section

Use this space to document any bugs or issues found:

```
Date: ___________
Tester: ___________

Issue 1:
- Page:
- Steps to reproduce:
- Expected:
- Actual:

Issue 2:
- Page:
- Steps to reproduce:
- Expected:
- Actual:
```
