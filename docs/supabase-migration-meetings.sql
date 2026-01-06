-- Meetings Feature Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/empndmpeyrdycjdesoxr/sql/new

-- Create enums for meetings
CREATE TYPE meeting_type AS ENUM ('internal', 'client');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE participant_role AS ENUM ('organizer', 'required', 'optional');
CREATE TYPE attendance_status AS ENUM ('pending', 'confirmed', 'declined', 'attended');
CREATE TYPE meeting_task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE meeting_task_priority AS ENUM ('low', 'medium', 'high');

-- Main meetings table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    type meeting_type NOT NULL DEFAULT 'internal',
    
    -- Optional link to client/engagement for client meetings
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT DEFAULT '',
    meeting_link TEXT DEFAULT '',
    
    -- Status
    status meeting_status DEFAULT 'scheduled',
    
    -- Before meeting
    agenda TEXT DEFAULT '',
    
    -- After meeting
    transcript TEXT DEFAULT '',
    ai_summary TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    
    -- Meta
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meeting participants (internal colleagues + external guests)
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    
    -- Internal participant (colleague)
    colleague_id UUID REFERENCES colleagues(id) ON DELETE CASCADE,
    
    -- External participant (guest)
    external_name TEXT,
    external_email TEXT,
    
    -- Role and attendance
    role participant_role DEFAULT 'required',
    attendance attendance_status DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Either colleague_id or external_name must be set
    CONSTRAINT participant_identity CHECK (
        (colleague_id IS NOT NULL AND external_name IS NULL) OR
        (colleague_id IS NULL AND external_name IS NOT NULL)
    )
);

-- Tasks generated from meetings
CREATE TABLE meeting_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    
    -- Assignment
    assigned_to UUID REFERENCES colleagues(id) ON DELETE SET NULL,
    
    -- Due date and status
    due_date DATE,
    status meeting_task_status DEFAULT 'todo',
    priority meeting_task_priority DEFAULT 'medium',
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_type ON meetings(type);
CREATE INDEX idx_meetings_client_id ON meetings(client_id);
CREATE INDEX idx_meetings_engagement_id ON meetings(engagement_id);
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_colleague_id ON meeting_participants(colleague_id);
CREATE INDEX idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id);
CREATE INDEX idx_meeting_tasks_assigned_to ON meeting_tasks(assigned_to);
CREATE INDEX idx_meeting_tasks_status ON meeting_tasks(status);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for meetings
CREATE POLICY "CRM users can read meetings" ON meetings
    FOR SELECT USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage meetings" ON meetings
    FOR ALL USING (is_crm_user(auth.uid()));

-- RLS policies for meeting_participants
CREATE POLICY "CRM users can read meeting_participants" ON meeting_participants
    FOR SELECT USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage meeting_participants" ON meeting_participants
    FOR ALL USING (is_crm_user(auth.uid()));

-- RLS policies for meeting_tasks
CREATE POLICY "CRM users can read meeting_tasks" ON meeting_tasks
    FOR SELECT USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage meeting_tasks" ON meeting_tasks
    FOR ALL USING (is_crm_user(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_participants_updated_at
    BEFORE UPDATE ON meeting_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_tasks_updated_at
    BEFORE UPDATE ON meeting_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE meetings IS 'Internal and client meetings with agenda, transcript, and AI summary';
COMMENT ON TABLE meeting_participants IS 'Participants for meetings (internal colleagues or external guests)';
COMMENT ON TABLE meeting_tasks IS 'Tasks and action items generated from meetings';
