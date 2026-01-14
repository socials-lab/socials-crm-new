# Sub-Plan 10: Feedback and Notifications

## Status: Not Started

## Scope
Implement internal feedback system and real-time notifications with Supabase.

## Goals
- [ ] Update useFeedbackData.tsx to use Supabase
- [ ] Implement feedback ideas CRUD
- [ ] Implement voting system
- [ ] Update useNotifications.tsx to use Supabase
- [ ] Implement real-time notifications with Supabase Realtime
- [ ] Create notification triggers

## Current State Analysis

### Feedback System
- Internal suggestion box
- Categories: process, service, communication, system, other
- Statuses: new, in_review, accepted, rejected, implemented
- Voting: up/down by colleagues
- One vote per person per idea

### Notifications
- Real-time updates for key events
- Types: new_lead, form_completed, contract_signed, lead_converted, access_granted, offer_sent, colleague_birthday, new_feedback_idea
- Tracks read/unread status
- Links to relevant pages

## Database Tables Used
- feedback_ideas
- feedback_votes
- notifications

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useFeedbackData.tsx` | Replace with Supabase |
| `src/hooks/useNotifications.tsx` | Replace with Supabase + Realtime |
| `src/pages/Feedback.tsx` | Use new data layer |
| `src/components/feedback/FeedbackCard.tsx` | Display/voting |
| `src/components/feedback/AddFeedbackDialog.tsx` | Create feedback |
| `src/components/feedback/FeedbackDetailSheet.tsx` | Full view |
| `src/components/notifications/NotificationsDropdown.tsx` | Real-time list |
| `src/pages/Notifications.tsx` | All notifications |
| `src/data/notificationsMockData.ts` | Remove mock data |

## Implementation Steps

### Feedback Ideas
- [ ] Create useQuery for feedback ideas with vote counts
- [ ] Create useQuery for ideas by status
- [ ] Create useQuery for ideas by category
- [ ] Create useMutation for adding idea
- [ ] Create useMutation for updating idea
- [ ] Create useMutation for changing status (admin only)

### Voting
- [ ] Create useQuery for current user's votes
- [ ] Create useMutation for upvote
- [ ] Create useMutation for downvote
- [ ] Create useMutation for removing vote
- [ ] Enforce one vote per user per idea
- [ ] Calculate net vote count (up - down)

### Notifications CRUD
- [ ] Create useQuery for user's notifications
- [ ] Create useQuery for unread count
- [ ] Create useMutation for marking as read
- [ ] Create useMutation for marking all as read
- [ ] Create useMutation for deleting notification

### Real-time Notifications
- [ ] Set up Supabase Realtime subscription
- [ ] Subscribe to notifications table for current user
- [ ] Update local state on new notification
- [ ] Show toast/badge on new notification
- [ ] Handle reconnection

### Notification Triggers
- [ ] Create trigger for new lead → notify admins
- [ ] Create trigger for form completed → notify lead owner
- [ ] Create trigger for colleague birthday → notify all (scheduled)
- [ ] Create trigger for new feedback idea → notify admins
- [ ] Create function to create notification

## Data Relationships

```
feedback_ideas
  └── author_id → colleagues.id

feedback_votes
  ├── idea_id → feedback_ideas.id
  └── colleague_id → colleagues.id (UNIQUE together)

notifications
  └── user_id → profiles.id
```

## Vote Counting Query

```sql
SELECT 
  fi.*,
  COALESCE(SUM(CASE WHEN fv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
  COALESCE(SUM(CASE WHEN fv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
  COALESCE(SUM(CASE WHEN fv.vote_type = 'up' THEN 1 WHEN fv.vote_type = 'down' THEN -1 ELSE 0 END), 0) as net_votes
FROM feedback_ideas fi
LEFT JOIN feedback_votes fv ON fi.id = fv.idea_id
GROUP BY fi.id
```

## Real-time Subscription Pattern

```typescript
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      // Add to local state
      // Show toast
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

## Testing Checklist
- [ ] Feedback page loads from Supabase
- [ ] Can add new feedback idea
- [ ] Can filter by category
- [ ] Can filter by status
- [ ] Can upvote/downvote ideas
- [ ] Vote counts update correctly
- [ ] Can only vote once per idea
- [ ] Can change vote
- [ ] Admins can change status
- [ ] Notifications dropdown shows notifications
- [ ] Unread count badge works
- [ ] Can mark as read
- [ ] Can mark all as read
- [ ] Real-time: new notifications appear without refresh
- [ ] Notification links work correctly

## Notes
- Realtime requires proper RLS policies
- Birthday notifications need scheduled job (cron)
- Consider notification preferences per user (future)
- Notification cleanup: delete old read notifications?
