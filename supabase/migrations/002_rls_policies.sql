-- ============================================
-- Sub-Plan 02: Auth and Roles - RLS Policies
-- ============================================

-- ============================================
-- Schema Fix: Add missing is_active field
-- ============================================

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

-- ============================================
-- Additional Helper Functions
-- ============================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(check_role app_role)
RETURNS BOOLEAN AS $$
DECLARE
  _user_role app_role;
BEGIN
  SELECT role INTO _user_role
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  RETURN _user_role = check_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view specific page
CREATE OR REPLACE FUNCTION can_view_page(page_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  _is_super_admin BOOLEAN;
  _page_permissions JSONB;
BEGIN
  -- Super admin can view everything
  SELECT is_super_admin INTO _is_super_admin
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF _is_super_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check page_permissions JSONB
  SELECT page_permissions INTO _page_permissions
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  -- If no permissions defined, default to role-based access
  IF _page_permissions IS NULL OR jsonb_array_length(_page_permissions) = 0 THEN
    RETURN has_crm_access(auth.uid());
  END IF;
  
  -- Check if page has can_view = true
  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_page_permissions) AS perm
    WHERE perm->>'page' = page_name
      AND (perm->>'can_view')::boolean = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit specific page
CREATE OR REPLACE FUNCTION can_edit_page(page_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  _is_super_admin BOOLEAN;
  _page_permissions JSONB;
BEGIN
  -- Super admin can edit everything
  SELECT is_super_admin INTO _is_super_admin
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF _is_super_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check page_permissions JSONB
  SELECT page_permissions INTO _page_permissions
  FROM user_roles
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  -- If no permissions defined, default to role-based access
  IF _page_permissions IS NULL OR jsonb_array_length(_page_permissions) = 0 THEN
    RETURN is_admin_or_management(auth.uid());
  END IF;
  
  -- Check if page has can_edit = true
  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_page_permissions) AS perm
    WHERE perm->>'page' = page_name
      AND (perm->>'can_edit')::boolean = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing helper functions to check is_active
CREATE OR REPLACE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _is_super_admin BOOLEAN;
BEGIN
  SELECT is_super_admin INTO _is_super_admin
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN COALESCE(_is_super_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_crm_access(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN _role IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_management(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _role app_role;
BEGIN
  SELECT role INTO _role
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN _role IN ('admin', 'management');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_see_financials(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _can_see BOOLEAN;
BEGIN
  SELECT can_see_financials INTO _can_see
  FROM user_roles
  WHERE user_id = _user_id AND is_active = TRUE;
  
  RETURN COALESCE(_can_see, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS Policies: Profiles
-- ============================================

-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile or admins can view all"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    is_super_admin(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- System creates profiles via trigger
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- RLS Policies: User Roles
-- ============================================

-- Users can read their own role, super admins can read all
CREATE POLICY "Users can view own role or super admins can view all"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_super_admin(auth.uid())
  );

-- Only super admins can insert roles
CREATE POLICY "Super admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

-- Only super admins can update roles
CREATE POLICY "Super admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Only super admins can delete roles
CREATE POLICY "Super admins can delete roles"
  ON user_roles FOR DELETE
  USING (is_super_admin(auth.uid()));

-- ============================================
-- RLS Policies: Colleagues
-- ============================================

-- CRM users can read colleagues
CREATE POLICY "CRM users can view colleagues"
  ON colleagues FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert colleagues
CREATE POLICY "Admins can insert colleagues"
  ON colleagues FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update colleagues
CREATE POLICY "Admins can update colleagues"
  ON colleagues FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete colleagues
CREATE POLICY "Admins can delete colleagues"
  ON colleagues FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Services
-- ============================================

-- CRM users can read services
CREATE POLICY "CRM users can view services"
  ON services FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert services
CREATE POLICY "Admins can insert services"
  ON services FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update services
CREATE POLICY "Admins can update services"
  ON services FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete services
CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Clients
-- ============================================

-- CRM users can read clients
CREATE POLICY "CRM users can view clients"
  ON clients FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert clients
CREATE POLICY "Admins can insert clients"
  ON clients FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update clients
CREATE POLICY "Admins can update clients"
  ON clients FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete clients
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Client Contacts
-- ============================================

-- CRM users can read client contacts
CREATE POLICY "CRM users can view client contacts"
  ON client_contacts FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert client contacts
CREATE POLICY "Admins can insert client contacts"
  ON client_contacts FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update client contacts
CREATE POLICY "Admins can update client contacts"
  ON client_contacts FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete client contacts
CREATE POLICY "Admins can delete client contacts"
  ON client_contacts FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Client Services
-- ============================================

-- CRM users can read client services
CREATE POLICY "CRM users can view client services"
  ON client_services FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert client services
CREATE POLICY "Admins can insert client services"
  ON client_services FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update client services
CREATE POLICY "Admins can update client services"
  ON client_services FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete client services
CREATE POLICY "Admins can delete client services"
  ON client_services FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Leads
-- ============================================

-- CRM users can read leads
CREATE POLICY "CRM users can view leads"
  ON leads FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Admins and project managers can insert leads
CREATE POLICY "Admins and PMs can insert leads"
  ON leads FOR INSERT
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    has_role('project_manager'::app_role)
  );

-- Owner or admins can update leads
CREATE POLICY "Owner or admins can update leads"
  ON leads FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    owner_id = get_colleague_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    owner_id = get_colleague_id(auth.uid())
  );

-- Only admins can delete leads
CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Lead History
-- ============================================

-- CRM users can read lead history
CREATE POLICY "CRM users can view lead history"
  ON lead_history FOR SELECT
  USING (has_crm_access(auth.uid()));

-- System inserts history (via triggers)
CREATE POLICY "System can insert lead history"
  ON lead_history FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RLS Policies: Engagements
-- ============================================

-- CRM users can read engagements
CREATE POLICY "CRM users can view engagements"
  ON engagements FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert engagements
CREATE POLICY "Admins can insert engagements"
  ON engagements FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update engagements
CREATE POLICY "Admins can update engagements"
  ON engagements FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete engagements
CREATE POLICY "Admins can delete engagements"
  ON engagements FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Engagement Services
-- ============================================

-- CRM users can read engagement services
CREATE POLICY "CRM users can view engagement services"
  ON engagement_services FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert engagement services
CREATE POLICY "Admins can insert engagement services"
  ON engagement_services FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update engagement services
CREATE POLICY "Admins can update engagement services"
  ON engagement_services FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete engagement services
CREATE POLICY "Admins can delete engagement services"
  ON engagement_services FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Engagement Assignments
-- ============================================

-- CRM users can read engagement assignments
CREATE POLICY "CRM users can view engagement assignments"
  ON engagement_assignments FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert engagement assignments
CREATE POLICY "Admins can insert engagement assignments"
  ON engagement_assignments FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update engagement assignments
CREATE POLICY "Admins can update engagement assignments"
  ON engagement_assignments FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete engagement assignments
CREATE POLICY "Admins can delete engagement assignments"
  ON engagement_assignments FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Engagement History
-- ============================================

-- CRM users can read engagement history
CREATE POLICY "CRM users can view engagement history"
  ON engagement_history FOR SELECT
  USING (has_crm_access(auth.uid()));

-- System inserts history (via triggers)
CREATE POLICY "System can insert engagement history"
  ON engagement_history FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RLS Policies: Engagement Monthly Metrics
-- ============================================

-- Finance and admins can read metrics
CREATE POLICY "Finance and admins can view metrics"
  ON engagement_monthly_metrics FOR SELECT
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can insert metrics
CREATE POLICY "Finance and admins can insert metrics"
  ON engagement_monthly_metrics FOR INSERT
  WITH CHECK (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can update metrics
CREATE POLICY "Finance and admins can update metrics"
  ON engagement_monthly_metrics FOR UPDATE
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  )
  WITH CHECK (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can delete metrics
CREATE POLICY "Finance and admins can delete metrics"
  ON engagement_monthly_metrics FOR DELETE
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- ============================================
-- RLS Policies: Extra Works
-- ============================================

-- CRM users can read extra works
CREATE POLICY "CRM users can view extra works"
  ON extra_works FOR SELECT
  USING (has_crm_access(auth.uid()));

-- CRM users can insert extra works
CREATE POLICY "CRM users can insert extra works"
  ON extra_works FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));

-- Creator or admins can update extra works
CREATE POLICY "Creator or admins can update extra works"
  ON extra_works FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    colleague_id = get_colleague_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    colleague_id = get_colleague_id(auth.uid())
  );

-- Only admins can delete extra works
CREATE POLICY "Admins can delete extra works"
  ON extra_works FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Issued Invoices
-- ============================================

-- Finance and admins can read invoices
CREATE POLICY "Finance and admins can view invoices"
  ON issued_invoices FOR SELECT
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can insert invoices
CREATE POLICY "Finance and admins can insert invoices"
  ON issued_invoices FOR INSERT
  WITH CHECK (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can update invoices
CREATE POLICY "Finance and admins can update invoices"
  ON issued_invoices FOR UPDATE
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  )
  WITH CHECK (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can delete invoices
CREATE POLICY "Finance and admins can delete invoices"
  ON issued_invoices FOR DELETE
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- ============================================
-- RLS Policies: Invoice Line Items
-- ============================================

-- Finance and admins can read line items
CREATE POLICY "Finance and admins can view line items"
  ON invoice_line_items FOR SELECT
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can insert line items
CREATE POLICY "Finance and admins can insert line items"
  ON invoice_line_items FOR INSERT
  WITH CHECK (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can update line items
CREATE POLICY "Finance and admins can update line items"
  ON invoice_line_items FOR UPDATE
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  )
  WITH CHECK (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- Finance and admins can delete line items
CREATE POLICY "Finance and admins can delete line items"
  ON invoice_line_items FOR DELETE
  USING (
    can_see_financials(auth.uid()) OR
    is_admin_or_management(auth.uid())
  );

-- ============================================
-- RLS Policies: Output Types
-- ============================================

-- CRM users can read output types
CREATE POLICY "CRM users can view output types"
  ON output_types FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert output types
CREATE POLICY "Admins can insert output types"
  ON output_types FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can update output types
CREATE POLICY "Admins can update output types"
  ON output_types FOR UPDATE
  USING (is_admin_or_management(auth.uid()))
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Only admins can delete output types
CREATE POLICY "Admins can delete output types"
  ON output_types FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Creative Boost Client Months
-- ============================================

-- CRM users can read client months
CREATE POLICY "CRM users can view client months"
  ON creative_boost_client_months FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Assigned colleague or admins can insert
CREATE POLICY "Assigned or admins can insert client months"
  ON creative_boost_client_months FOR INSERT
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    colleague_id = get_colleague_id(auth.uid())
  );

-- Assigned colleague or admins can update
CREATE POLICY "Assigned or admins can update client months"
  ON creative_boost_client_months FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    colleague_id = get_colleague_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    colleague_id = get_colleague_id(auth.uid())
  );

-- Only admins can delete
CREATE POLICY "Admins can delete client months"
  ON creative_boost_client_months FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Creative Boost Outputs
-- ============================================

-- CRM users can read outputs
CREATE POLICY "CRM users can view outputs"
  ON creative_boost_outputs FOR SELECT
  USING (has_crm_access(auth.uid()));

-- CRM users can insert outputs
CREATE POLICY "CRM users can insert outputs"
  ON creative_boost_outputs FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));

-- Creator or admins can update outputs
CREATE POLICY "Creator or admins can update outputs"
  ON creative_boost_outputs FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    colleague_id = get_colleague_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    colleague_id = get_colleague_id(auth.uid())
  );

-- Only admins can delete outputs
CREATE POLICY "Admins can delete outputs"
  ON creative_boost_outputs FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Creative Boost Settings History
-- ============================================

-- CRM users can read settings history
CREATE POLICY "CRM users can view settings history"
  ON creative_boost_settings_history FOR SELECT
  USING (has_crm_access(auth.uid()));

-- System inserts history (via triggers)
CREATE POLICY "System can insert settings history"
  ON creative_boost_settings_history FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RLS Policies: Meetings
-- ============================================

-- CRM users can read meetings
CREATE POLICY "CRM users can view meetings"
  ON meetings FOR SELECT
  USING (has_crm_access(auth.uid()));

-- CRM users can insert meetings
CREATE POLICY "CRM users can insert meetings"
  ON meetings FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));

-- Creator or admins can update meetings
CREATE POLICY "Creator or admins can update meetings"
  ON meetings FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    created_by = auth.uid()
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    created_by = auth.uid()
  );

-- Only admins can delete meetings
CREATE POLICY "Admins can delete meetings"
  ON meetings FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Meeting Participants
-- ============================================

-- CRM users can read participants
CREATE POLICY "CRM users can view participants"
  ON meeting_participants FOR SELECT
  USING (has_crm_access(auth.uid()));

-- CRM users can insert participants
CREATE POLICY "CRM users can insert participants"
  ON meeting_participants FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));

-- CRM users can update participants
CREATE POLICY "CRM users can update participants"
  ON meeting_participants FOR UPDATE
  USING (has_crm_access(auth.uid()))
  WITH CHECK (has_crm_access(auth.uid()));

-- CRM users can delete participants
CREATE POLICY "CRM users can delete participants"
  ON meeting_participants FOR DELETE
  USING (has_crm_access(auth.uid()));

-- ============================================
-- RLS Policies: Meeting Tasks
-- ============================================

-- CRM users can read tasks
CREATE POLICY "CRM users can view tasks"
  ON meeting_tasks FOR SELECT
  USING (has_crm_access(auth.uid()));

-- CRM users can insert tasks
CREATE POLICY "CRM users can insert tasks"
  ON meeting_tasks FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));

-- Assigned or admins can update tasks
CREATE POLICY "Assigned or admins can update tasks"
  ON meeting_tasks FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    assigned_to = get_colleague_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    assigned_to = get_colleague_id(auth.uid())
  );

-- Only admins can delete tasks
CREATE POLICY "Admins can delete tasks"
  ON meeting_tasks FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Applicants
-- ============================================

-- CRM users can read applicants
CREATE POLICY "CRM users can view applicants"
  ON applicants FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Only admins can insert applicants
CREATE POLICY "Admins can insert applicants"
  ON applicants FOR INSERT
  WITH CHECK (is_admin_or_management(auth.uid()));

-- Owner or admins can update applicants
CREATE POLICY "Owner or admins can update applicants"
  ON applicants FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    owner_id = get_colleague_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    owner_id = get_colleague_id(auth.uid())
  );

-- Only admins can delete applicants
CREATE POLICY "Admins can delete applicants"
  ON applicants FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Feedback Ideas
-- ============================================

-- CRM users can read feedback ideas
CREATE POLICY "CRM users can view feedback ideas"
  ON feedback_ideas FOR SELECT
  USING (has_crm_access(auth.uid()));

-- CRM users can insert feedback ideas
CREATE POLICY "CRM users can insert feedback ideas"
  ON feedback_ideas FOR INSERT
  WITH CHECK (has_crm_access(auth.uid()));

-- Author or admins can update feedback ideas
CREATE POLICY "Author or admins can update feedback ideas"
  ON feedback_ideas FOR UPDATE
  USING (
    is_admin_or_management(auth.uid()) OR
    author_id = get_colleague_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_management(auth.uid()) OR
    author_id = get_colleague_id(auth.uid())
  );

-- Only admins can delete feedback ideas
CREATE POLICY "Admins can delete feedback ideas"
  ON feedback_ideas FOR DELETE
  USING (is_admin_or_management(auth.uid()));

-- ============================================
-- RLS Policies: Feedback Votes
-- ============================================

-- CRM users can read votes
CREATE POLICY "CRM users can view votes"
  ON feedback_votes FOR SELECT
  USING (has_crm_access(auth.uid()));

-- Users can insert their own votes
CREATE POLICY "Users can insert own votes"
  ON feedback_votes FOR INSERT
  WITH CHECK (
    has_crm_access(auth.uid()) AND
    colleague_id = get_colleague_id(auth.uid())
  );

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON feedback_votes FOR UPDATE
  USING (colleague_id = get_colleague_id(auth.uid()))
  WITH CHECK (colleague_id = get_colleague_id(auth.uid()));

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON feedback_votes FOR DELETE
  USING (colleague_id = get_colleague_id(auth.uid()));

-- ============================================
-- RLS Policies: Notifications
-- ============================================

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- System inserts notifications (via triggers/functions)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
