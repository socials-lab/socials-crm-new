export type MeetingType = 'internal' | 'client';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ParticipantRole = 'organizer' | 'required' | 'optional';
export type AttendanceStatus = 'pending' | 'confirmed' | 'declined' | 'attended';
export type MeetingTaskStatus = 'todo' | 'in_progress' | 'done';
export type MeetingTaskPriority = 'low' | 'medium' | 'high';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  type: MeetingType;
  client_id: string | null;
  engagement_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string;
  meeting_link: string;
  status: MeetingStatus;
  agenda: string;
  transcript: string;
  ai_summary: string;
  notes: string;
  created_by: string | null;
  calendar_invites_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  colleague_id: string | null;
  external_name: string | null;
  external_email: string | null;
  role: ParticipantRole;
  attendance: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export interface MeetingTask {
  id: string;
  meeting_id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  status: MeetingTaskStatus;
  priority: MeetingTaskPriority;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Extended types with relations
export interface MeetingWithDetails extends Meeting {
  participants: MeetingParticipant[];
  tasks: MeetingTask[];
  client_name?: string;
  engagement_name?: string;
}

export interface MeetingParticipantWithColleague extends MeetingParticipant {
  colleague_name?: string;
  colleague_email?: string;
}
