import { 
  Plus, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  Lock,
  PhoneCall,
  UserX,
  ClipboardList,
  ArrowRightLeft,
  User,
  MailOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Applicant } from '@/types/applicant';

interface ApplicantCommunicationTimelineProps {
  applicant: Applicant;
}

type MessageDirection = 'sent' | 'received' | 'system' | 'internal';

interface TimelineEvent {
  id: string;
  date: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  direction: MessageDirection;
  subject?: string | null;
  recipients?: string[] | null;
  noteType?: string;
  authorName?: string | null;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateFull = (date: string) => {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export function ApplicantCommunicationTimeline({ applicant }: ApplicantCommunicationTimelineProps) {
  const events: TimelineEvent[] = [];

  // Applicant created
  if (applicant.created_at) {
    events.push({
      id: 'created',
      date: applicant.created_at,
      icon: <Plus className="h-3 w-3" />,
      title: 'Uchazeč vytvořen',
      direction: 'system',
    });
  }

  // Notes (includes email_sent notes from send actions)
  applicant.notes.forEach((note) => {
    let noteIcon: React.ReactNode;
    let noteTitle: string;
    let direction: MessageDirection;

    switch (note.note_type) {
      case 'email_sent':
        noteIcon = <Send className="h-3 w-3" />;
        noteTitle = note.subject ? `${note.subject}` : 'E-mail odeslán';
        direction = 'sent';
        break;
      case 'email_received':
        noteIcon = <MailOpen className="h-3 w-3" />;
        noteTitle = note.subject ? `${note.subject}` : 'E-mail přijat';
        direction = 'received';
        break;
      case 'internal':
        noteIcon = <Lock className="h-3 w-3" />;
        noteTitle = 'Interní poznámka';
        direction = 'internal';
        break;
      default:
        noteIcon = <MessageSquare className="h-3 w-3" />;
        noteTitle = 'Poznámka';
        direction = 'internal';
    }

    events.push({
      id: `note-${note.id}`,
      date: note.created_at,
      icon: noteIcon,
      title: noteTitle,
      description: note.text,
      direction,
      subject: note.subject,
      recipients: note.recipients,
      noteType: note.note_type,
      authorName: note.author_name,
    });
  });

  // System events without email content (only if no email_sent note exists for them)
  const hasEmailNoteForInvite = applicant.notes.some(n => n.note_type === 'email_sent' && n.subject?.includes('pohovor'));
  if (applicant.interview_invite_sent_at && !hasEmailNoteForInvite) {
    events.push({
      id: 'interview-invite',
      date: applicant.interview_invite_sent_at,
      icon: <PhoneCall className="h-3 w-3" />,
      title: 'Pozvánka na pohovor odeslána',
      direction: 'sent',
    });
  }

  const hasEmailNoteForRejection = applicant.notes.some(n => n.note_type === 'email_sent' && n.subject?.includes('přihlášce'));
  if (applicant.rejection_sent_at && !hasEmailNoteForRejection) {
    events.push({
      id: 'rejection-sent',
      date: applicant.rejection_sent_at,
      icon: <UserX className="h-3 w-3" />,
      title: 'Odmítnutí odesláno',
      direction: 'sent',
    });
  }

  const hasEmailNoteForOnboarding = applicant.notes.some(n => n.note_type === 'email_sent' && n.subject?.includes('Onboarding'));
  if (applicant.onboarding_sent_at && !hasEmailNoteForOnboarding) {
    events.push({
      id: 'onboarding-sent',
      date: applicant.onboarding_sent_at,
      icon: <ClipboardList className="h-3 w-3" />,
      title: 'Onboarding formulář odeslán',
      direction: 'sent',
    });
  }

  // Onboarding completed
  if (applicant.onboarding_completed_at) {
    events.push({
      id: 'onboarding-completed',
      date: applicant.onboarding_completed_at,
      icon: <CheckCircle2 className="h-3 w-3" />,
      title: 'Onboarding formulář vyplněn',
      direction: 'received',
    });
  }

  // Converted to colleague
  if (applicant.converted_to_colleague_id) {
    events.push({
      id: 'converted',
      date: applicant.updated_at,
      icon: <ArrowRightLeft className="h-3 w-3" />,
      title: 'Převedeno na kolegu',
      direction: 'system',
    });
  }

  // Sort oldest first (chat order)
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group events by date
  const groupedByDate: Record<string, TimelineEvent[]> = {};
  events.forEach(event => {
    const dayKey = new Date(event.date).toLocaleDateString('cs-CZ');
    if (!groupedByDate[dayKey]) groupedByDate[dayKey] = [];
    groupedByDate[dayKey].push(event);
  });

  return (
    <div className="space-y-1">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Zatím žádné události</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByDate).map(([dateKey, dayEvents]) => (
            <div key={dateKey} className="space-y-2">
              {/* Date separator */}
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground px-2">{formatDateFull(dayEvents[0].date)}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {dayEvents.map((event) => {
                // System events - centered
                if (event.direction === 'system') {
                  return (
                    <div key={event.id} className="flex justify-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-xs text-muted-foreground">
                        {event.icon}
                        <span>{event.title}</span>
                        <span className="text-[10px] opacity-70">{formatDate(event.date)}</span>
                      </div>
                    </div>
                  );
                }

                // Internal notes - centered with amber styling
                if (event.direction === 'internal') {
                  return (
                    <div key={event.id} className="flex justify-center">
                      <div className="max-w-[85%] px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          {event.icon}
                          <span className="text-xs font-medium text-amber-700">{event.title}</span>
                          {event.authorName && (
                            <span className="text-[10px] text-muted-foreground">{event.authorName}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(event.date)}</span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-amber-800 whitespace-pre-wrap">{event.description}</p>
                        )}
                      </div>
                    </div>
                  );
                }

                const isSent = event.direction === 'sent';

                return (
                  <div 
                    key={event.id} 
                    className={cn(
                      "flex gap-2",
                      isSent ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Avatar for received */}
                    {!isSent && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center mt-1">
                        <User className="h-3 w-3 text-cyan-700" />
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2",
                      isSent 
                        ? "bg-primary/10 border border-primary/20 rounded-br-md" 
                        : "bg-cyan-500/10 border border-cyan-500/20 rounded-bl-md",
                    )}>
                      {/* Header */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {event.icon}
                        <span className={cn(
                          "text-xs font-medium",
                          isSent ? "text-primary" : "text-cyan-700"
                        )}>
                          {event.title}
                        </span>
                        {event.authorName && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {event.authorName}
                          </span>
                        )}
                      </div>

                      {/* Recipients */}
                      {event.recipients && event.recipients.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mb-1">
                          {isSent ? 'Komu' : 'Od'}: {event.recipients.join(', ')}
                        </p>
                      )}

                      {/* Content */}
                      {event.description && (
                        <p className="text-sm whitespace-pre-wrap">{event.description}</p>
                      )}

                      {/* Timestamp */}
                      <p className={cn(
                        "text-[10px] mt-1",
                        isSent ? "text-right text-primary/60" : "text-left text-cyan-600/60"
                      )}>
                        {formatDate(event.date)}
                      </p>
                    </div>

                    {/* Avatar for sent */}
                    {isSent && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                        <Send className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
