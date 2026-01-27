-- Notifications System Migration
-- This creates the notifications table for storing user notifications

-- Create the notifications table
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Komu notifikace patří
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Typ a obsah
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    
    -- Odkaz na související entitu
    entity_type text, -- 'lead', 'engagement', 'extra_work', 'creative_boost', 'modification'
    entity_id uuid,
    link text, -- URL pro přesměrování
    
    -- Stav
    is_read boolean DEFAULT false,
    read_at timestamptz,
    
    -- Metadata (pro rozšířené informace)
    metadata jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now()
);

-- Indexy pro rychlé dotazy
CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_entity 
ON notifications(entity_type, entity_id);

CREATE INDEX idx_notifications_created_at
ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- CRM users can create notifications for any user
-- This allows the system to create notifications for other users
CREATE POLICY "CRM users can create notifications"
ON notifications FOR INSERT
WITH CHECK (is_crm_user(auth.uid()));

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for leads, engagements, extra work, and other CRM events';
COMMENT ON COLUMN notifications.type IS 'Notification type: lead_form_completed, engagement_assigned, extra_work_approved, etc.';
COMMENT ON COLUMN notifications.entity_type IS 'Type of related entity: lead, engagement, extra_work, creative_boost, modification';
