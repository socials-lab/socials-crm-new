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

interface TimelineEvent {
  id: string;
  date: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  color: string;
  subject?: string | null;
  recipients?: string[] | null;
  noteType?: string;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
      icon: <Plus className="h-3.5 w-3.5" />,
      title: 'Lead vytvořen',
      color: 'bg-slate-500',
    });
  }

  // Notes interleaved
  lead.notes.forEach((note) => {
    let noteIcon: React.ReactNode;
    let noteColor: string;
    let noteTitle: string;

    switch (note.note_type) {
      case 'call':
        noteIcon = <Phone className="h-3.5 w-3.5" />;
        noteColor = 'bg-blue-500';
        noteTitle = 'Záznam z hovoru';
        break;
      case 'internal':
        noteIcon = <Lock className="h-3.5 w-3.5" />;
        noteColor = 'bg-amber-500';
        noteTitle = 'Interní poznámka';
        break;
      case 'email_sent':
        noteIcon = <Mail className="h-3.5 w-3.5" />;
        noteColor = 'bg-emerald-500';
        noteTitle = note.subject ? `📧 ${note.subject}` : 'E-mail odeslán';
        break;
      case 'email_received':
        noteIcon = <MailOpen className="h-3.5 w-3.5" />;
        noteColor = 'bg-cyan-500';
        noteTitle = note.subject ? `📨 ${note.subject}` : 'E-mail přijat';
        break;
      default:
        noteIcon = <MessageSquare className="h-3.5 w-3.5" />;
        noteColor = 'bg-slate-400';
        noteTitle = 'Poznámka';
    }
    
    events.push({
      id: `note-${note.id}`,
      date: note.call_date || note.created_at,
      icon: noteIcon,
      title: noteTitle,
      description: note.text,
      color: noteColor,
      subject: note.subject,
      recipients: note.recipients,
      noteType: note.note_type,
    });
  });

  // Access request sent
  if (lead.access_request_sent_at) {
    events.push({
      id: 'access-sent',
      date: lead.access_request_sent_at,
      icon: <KeyRound className="h-3.5 w-3.5" />,
      title: 'Žádost o přístupy odeslána',
      description: lead.access_request_platforms.length > 0 
        ? `Platformy: ${lead.access_request_platforms.join(', ')}` 
        : undefined,
      color: 'bg-blue-500',
    });
  }

  // Access received
  if (lead.access_received_at) {
    events.push({
      id: 'access-received',
      date: lead.access_received_at,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      title: 'Přístupy přijaty',
      color: 'bg-green-500',
    });
  }

  // Offer created
  if (lead.offer_created_at) {
    events.push({
      id: 'offer-created',
      date: lead.offer_created_at,
      icon: <Link2 className="h-3.5 w-3.5" />,
      title: 'Nabídka vytvořena',
      color: 'bg-violet-500',
    });
  }

  // Offer sent
  if (lead.offer_sent_at) {
    events.push({
      id: 'offer-sent',
      date: lead.offer_sent_at,
      icon: <Send className="h-3.5 w-3.5" />,
      title: 'Nabídka odeslána',
      color: 'bg-pink-500',
    });
  }

  // Onboarding form sent
  if (lead.onboarding_form_sent_at) {
    events.push({
      id: 'onboarding-sent',
      date: lead.onboarding_form_sent_at,
      icon: <ClipboardList className="h-3.5 w-3.5" />,
      title: 'Onboarding formulář odeslán',
      color: 'bg-blue-500',
    });
  }

  // Onboarding form completed
  if (lead.onboarding_form_completed_at) {
    events.push({
      id: 'onboarding-done',
      date: lead.onboarding_form_completed_at,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      title: 'Onboarding formulář vyplněn',
      color: 'bg-green-500',
    });
  }

  // Contract created
  if (lead.contract_created_at) {
    events.push({
      id: 'contract-created',
      date: lead.contract_created_at,
      icon: <FileSignature className="h-3.5 w-3.5" />,
      title: 'Smlouva vytvořena',
      color: 'bg-violet-500',
    });
  }

  // Contract sent
  if (lead.contract_sent_at) {
    events.push({
      id: 'contract-sent',
      date: lead.contract_sent_at,
      icon: <Send className="h-3.5 w-3.5" />,
      title: 'Smlouva odeslána',
      color: 'bg-blue-500',
    });
  }

  // Contract signed
  if (lead.contract_signed_at) {
    events.push({
      id: 'contract-signed',
      date: lead.contract_signed_at,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      title: 'Smlouva podepsána',
      color: 'bg-green-500',
    });
  }

  // Conversion
  if (lead.converted_at) {
    events.push({
      id: 'converted',
      date: lead.converted_at,
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
      title: 'Převedeno na zakázku',
      color: 'bg-emerald-500',
    });
  }

  // Sort by date descending (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">Historie komunikace</h4>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Zatím žádné události</p>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex gap-3 relative">
                {/* Icon dot */}
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-white flex-shrink-0 z-10",
                  event.color
                )}>
                  {event.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium">{event.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
                  </div>
                  {/* Email recipients */}
                  {event.recipients && event.recipients.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Příjemci: {event.recipients.join(', ')}
                    </p>
                  )}
                  {event.description && (
                    <div className={cn(
                      "text-sm mt-1 whitespace-pre-wrap",
                      event.noteType === 'email_sent' && "p-2 rounded border bg-emerald-500/5 border-emerald-500/20 text-foreground",
                      event.noteType === 'email_received' && "p-2 rounded border bg-cyan-500/5 border-cyan-500/20 text-foreground",
                      event.noteType === 'internal' && "text-amber-700",
                      (!event.noteType || event.noteType === 'general' || event.noteType === 'call') && "text-muted-foreground",
                    )}>
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
