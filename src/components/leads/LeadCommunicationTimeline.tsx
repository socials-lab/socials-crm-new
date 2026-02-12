import { 
  KeyRound, 
  ClipboardList, 
  FileSignature, 
  Send, 
  CheckCircle2, 
  Link2, 
  MessageSquare,
  Phone,
  Lock,
  ArrowRightLeft,
  Plus,
  Mail,
  MailOpen,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead, LeadNote } from '@/types/crm';

interface LeadCommunicationTimelineProps {
  lead: Lead;
  onRequestAccess: () => void;
  onSendOnboarding: () => void;
  onSendOffer: () => void;
  onCreateOffer: () => void;
  onMarkAccessReceived: () => void;
  onMarkContractSent: () => void;
  onMarkContractSigned: () => void;
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

export function LeadCommunicationTimeline({
  lead,
}: LeadCommunicationTimelineProps) {
  const events: TimelineEvent[] = [];

  // Lead created
  if (lead.created_at) {
    events.push({
      id: 'created',
      date: lead.created_at,
      icon: <Plus className="h-3 w-3" />,
      title: 'Lead vytvořen',
      direction: 'system',
    });
  }

  // Notes interleaved
  lead.notes.forEach((note) => {
    let noteIcon: React.ReactNode;
    let noteTitle: string;
    let direction: MessageDirection;

    switch (note.note_type) {
      case 'call':
        noteIcon = <Phone className="h-3 w-3" />;
        noteTitle = 'Záznam z hovoru';
        direction = 'sent';
        break;
      case 'internal':
        noteIcon = <Lock className="h-3 w-3" />;
        noteTitle = 'Interní poznámka';
        direction = 'internal';
        break;
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
      default:
        noteIcon = <MessageSquare className="h-3 w-3" />;
        noteTitle = 'Poznámka';
        direction = 'system';
    }
    
    events.push({
      id: `note-${note.id}`,
      date: note.call_date || note.created_at,
      icon: noteIcon,
      title: noteTitle,
      description: note.text,
      direction,
      subject: note.subject,
      recipients: note.recipients,
      noteType: note.note_type,
    });
  });

  // System events
  if (lead.access_request_sent_at) {
    events.push({
      id: 'access-sent',
      date: lead.access_request_sent_at,
      icon: <KeyRound className="h-3 w-3" />,
      title: 'Žádost o přístupy odeslána',
      description: lead.access_request_platforms.length > 0 
        ? `Platformy: ${lead.access_request_platforms.join(', ')}` 
        : undefined,
      direction: 'sent',
    });
  }

  if (lead.access_received_at) {
    events.push({
      id: 'access-received',
      date: lead.access_received_at,
      icon: <CheckCircle2 className="h-3 w-3" />,
      title: 'Přístupy přijaty',
      direction: 'received',
    });
  }

  if (lead.offer_created_at) {
    events.push({
      id: 'offer-created',
      date: lead.offer_created_at,
      icon: <Link2 className="h-3 w-3" />,
      title: 'Nabídka vytvořena',
      direction: 'system',
    });
  }

  if (lead.offer_sent_at) {
    events.push({
      id: 'offer-sent',
      date: lead.offer_sent_at,
      icon: <Send className="h-3 w-3" />,
      title: 'Nabídka odeslána',
      direction: 'sent',
    });
  }

  if (lead.onboarding_form_sent_at) {
    events.push({
      id: 'onboarding-sent',
      date: lead.onboarding_form_sent_at,
      icon: <ClipboardList className="h-3 w-3" />,
      title: 'Onboarding formulář odeslán',
      direction: 'sent',
    });
  }

  if (lead.onboarding_form_completed_at) {
    events.push({
      id: 'onboarding-done',
      date: lead.onboarding_form_completed_at,
      icon: <CheckCircle2 className="h-3 w-3" />,
      title: 'Onboarding formulář vyplněn',
      direction: 'received',
    });
  }

  if (lead.contract_created_at) {
    events.push({
      id: 'contract-created',
      date: lead.contract_created_at,
      icon: <FileSignature className="h-3 w-3" />,
      title: 'Smlouva vytvořena',
      direction: 'system',
    });
  }

  if (lead.contract_sent_at) {
    events.push({
      id: 'contract-sent',
      date: lead.contract_sent_at,
      icon: <Send className="h-3 w-3" />,
      title: 'Smlouva odeslána',
      direction: 'sent',
    });
  }

  if (lead.contract_signed_at) {
    events.push({
      id: 'contract-signed',
      date: lead.contract_signed_at,
      icon: <CheckCircle2 className="h-3 w-3" />,
      title: 'Smlouva podepsána',
      direction: 'received',
    });
  }

  if (lead.converted_at) {
    events.push({
      id: 'converted',
      date: lead.converted_at,
      icon: <ArrowRightLeft className="h-3 w-3" />,
      title: 'Převedeno na zakázku',
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
                const isEmail = event.noteType === 'email_sent' || event.noteType === 'email_received';

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
