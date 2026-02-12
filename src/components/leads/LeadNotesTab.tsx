import { useState } from 'react';
import { MessageSquare, Phone, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Lead, LeadNoteType } from '@/types/crm';

interface LeadNotesTabProps {
  lead: Lead;
  onAddNote: (text: string, noteType: LeadNoteType, callDate: string | null) => void;
}

const NOTE_TYPE_CONFIG: Record<LeadNoteType, { label: string; icon: React.ReactNode; color: string; badgeColor: string }> = {
  general: { 
    label: 'Poznámka', 
    icon: <MessageSquare className="h-3.5 w-3.5" />, 
    color: 'text-muted-foreground',
    badgeColor: 'bg-muted text-muted-foreground',
  },
  call: { 
    label: 'Záznam z hovoru', 
    icon: <Phone className="h-3.5 w-3.5" />, 
    color: 'text-blue-600',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  },
  internal: { 
    label: 'Interní', 
    icon: <Lock className="h-3.5 w-3.5" />, 
    color: 'text-amber-600',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  },
  email_sent: {
    label: 'Odeslaný e-mail',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: 'text-emerald-600',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  },
  email_received: {
    label: 'Přijatý e-mail',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: 'text-cyan-600',
    badgeColor: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30',
  },
};

export function LeadNotesTab({ lead, onAddNote }: LeadNotesTabProps) {
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<LeadNoteType>('general');
  const [callDate, setCallDate] = useState('');
  const [filterType, setFilterType] = useState<LeadNoteType | 'all'>('all');

  const handleSubmit = () => {
    if (!noteText.trim()) return;
    onAddNote(noteText.trim(), noteType, noteType === 'call' && callDate ? callDate : null);
    setNoteText('');
    setCallDate('');
  };

  const filteredNotes = lead.notes.filter(
    note => filterType === 'all' || note.note_type === filterType
  );

  // Sort newest first
  const sortedNotes = [...filteredNotes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-5">
      {/* Add note form */}
      <div className="space-y-3 p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Nová poznámka</span>
        </div>

        {/* Note type selector */}
        <div className="flex gap-1">
          {(Object.entries(NOTE_TYPE_CONFIG) as [LeadNoteType, typeof NOTE_TYPE_CONFIG[LeadNoteType]][]).map(([type, config]) => (
            <Button
              key={type}
              variant={noteType === type ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setNoteType(type)}
            >
              {config.icon}
              {config.label}
            </Button>
          ))}
        </div>

        {/* Call date (only for call notes) */}
        {noteType === 'call' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Datum a čas hovoru</label>
            <Input
              type="datetime-local"
              value={callDate}
              onChange={(e) => setCallDate(e.target.value)}
              className="w-auto"
            />
          </div>
        )}

        <Textarea
          placeholder={
            noteType === 'call' 
              ? 'Co bylo probíráno, výsledek hovoru, další kroky...' 
              : noteType === 'internal'
                ? 'Interní poznámka (viditelná pouze pro tým)...'
                : 'Přidat poznámku...'
          }
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
        />

        <Button 
          size="sm" 
          onClick={handleSubmit}
          disabled={!noteText.trim()}
        >
          Přidat {NOTE_TYPE_CONFIG[noteType].label.toLowerCase()}
        </Button>
      </div>

      {/* Filter */}
      {lead.notes.length > 0 && (
        <div className="flex gap-1">
          <Button
            variant={filterType === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
            onClick={() => setFilterType('all')}
          >
            Vše ({lead.notes.length})
          </Button>
          {(Object.entries(NOTE_TYPE_CONFIG) as [LeadNoteType, typeof NOTE_TYPE_CONFIG[LeadNoteType]][]).map(([type, config]) => {
            const count = lead.notes.filter(n => n.note_type === type).length;
            if (count === 0) return null;
            return (
              <Button
                key={type}
                variant={filterType === type ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs gap-1"
                onClick={() => setFilterType(type)}
              >
                {config.icon}
                {count}
              </Button>
            );
          })}
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        {sortedNotes.map(note => {
          const config = NOTE_TYPE_CONFIG[note.note_type || 'general'];
          return (
            <div key={note.id} className={cn(
              "p-3 rounded-lg border",
              note.note_type === 'internal' && "bg-amber-500/5 border-amber-500/20",
              note.note_type === 'call' && "bg-blue-500/5 border-blue-500/20",
              (!note.note_type || note.note_type === 'general') && "bg-muted/30",
            )}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs gap-1 px-1.5 py-0", config.badgeColor)}>
                    {config.icon}
                    {config.label}
                  </Badge>
                  <span className="text-muted-foreground">{note.author_name}</span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {note.note_type === 'call' && note.call_date && (
                <p className="text-xs text-blue-600 mb-1">
                  📞 Hovor: {new Date(note.call_date).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap">{note.text}</p>
            </div>
          );
        })}
        {sortedNotes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {filterType === 'all' ? 'Zatím žádné poznámky' : 'Žádné poznámky tohoto typu'}
          </p>
        )}
      </div>
    </div>
  );
}
