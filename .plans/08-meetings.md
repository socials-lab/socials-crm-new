# Sub-Plan 08: Meetings

## Status: Not Started

## Scope
Implement meetings, participants, and tasks management with Supabase.

## Goals
- [ ] Update useMeetingsData.tsx to use Supabase
- [ ] Implement meetings CRUD
- [ ] Implement participants management
- [ ] Implement tasks management
- [ ] Support transcript and AI summary fields
- [ ] Track calendar invite status

## Current State Analysis

### Meetings
- Internal or client meetings
- Has participants (colleagues and/or external)
- Generates tasks with assignments
- Tracks transcript and AI summary (text fields, AI later)
- Can be linked to client and engagement

### Meeting Types
- internal: Team meetings
- client: Client meetings (linked to client)

### Task Priorities
- low, medium, high

### Task Statuses  
- todo, in_progress, done

## Database Tables Used
- meetings
- meeting_participants
- meeting_tasks

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useMeetingsData.tsx` | Replace with Supabase |
| `src/pages/Meetings.tsx` | Use new data layer |
| `src/components/meetings/MeetingCard.tsx` | Data display |
| `src/components/meetings/MeetingDetailSheet.tsx` | Full meeting view |
| `src/components/meetings/AddMeetingDialog.tsx` | Create meeting |
| `src/components/meetings/MeetingParticipants.tsx` | Manage participants |
| `src/components/meetings/MeetingTasks.tsx` | Manage tasks |

## Implementation Steps

### Meetings CRUD
- [ ] Create useQuery for meetings list
- [ ] Create useQuery for meetings with participants and tasks
- [ ] Create useQuery for today's meetings
- [ ] Create useQuery for meetings by client
- [ ] Create useMutation for adding meeting
- [ ] Create useMutation for updating meeting
- [ ] Create useMutation for deleting meeting
- [ ] Handle status transitions

### Participants
- [ ] Create useMutation for adding participant
- [ ] Create useMutation for removing participant
- [ ] Support colleague_id OR external_name/email
- [ ] Track role (organizer, required, optional)
- [ ] Track attendance status

### Tasks
- [ ] Create useQuery for tasks by meeting
- [ ] Create useQuery for tasks by assignee
- [ ] Create useMutation for adding task
- [ ] Create useMutation for updating task
- [ ] Create useMutation for completing task
- [ ] Create useMutation for deleting task

### Transcript and Summary
- [ ] Store transcript as text field
- [ ] Store ai_summary as text field
- [ ] Allow manual editing of both
- [ ] AI generation in Sub-Plan 12

### Calendar Integration Prep
- [ ] Track calendar_invites_sent_at
- [ ] Store meeting_link
- [ ] Actual calendar sync in Sub-Plan 12

## Data Relationships

```
meetings
  ├── client_id → clients.id
  ├── engagement_id → engagements.id
  └── created_by → colleagues.id

meeting_participants
  ├── meeting_id → meetings.id
  └── colleague_id → colleagues.id (OR external_name/email)

meeting_tasks
  ├── meeting_id → meetings.id
  └── assigned_to → colleagues.id
```

## Dashboard Integration

The Dashboard shows:
- Today's meetings
- Upcoming meetings this week
- My assigned tasks

Need to ensure queries support:
- Filter by date range
- Filter by participant (current user's colleague)
- Filter by task assignee

## Testing Checklist
- [ ] Meetings page loads from Supabase
- [ ] Can filter by type (internal/client)
- [ ] Can filter by date
- [ ] Can add new meeting
- [ ] Can edit meeting details
- [ ] Can change meeting status
- [ ] Can add colleague participants
- [ ] Can add external participants
- [ ] Can track attendance
- [ ] Can add tasks
- [ ] Can assign tasks to colleagues
- [ ] Can update task status
- [ ] Can mark tasks complete
- [ ] Transcript field editable
- [ ] AI summary field editable
- [ ] Dashboard shows today's meetings

## Notes
- transcript and ai_summary are text fields for now
- AI summarization will be added in Sub-Plan 12
- Calendar integration (Google Calendar) in Sub-Plan 12
- Consider realtime subscriptions for live updates
