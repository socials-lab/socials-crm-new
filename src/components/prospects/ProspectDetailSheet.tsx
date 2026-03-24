import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Plus, Phone, MessageSquare, Lock } from 'lucide-react';
import { useProspectsData } from '@/hooks/useProspectsData';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUS_COLORS,
  INTERACTION_TYPE_LABELS,
  INTERACTION_TYPE_EMOJI,
} from '@/types/prospect';
import type { ProspectStatus, ProspectWithInteractions } from '@/types/prospect';
import type { LeadNoteType } from '@/types/crm';
import { ConvertProspectDialog } from './ConvertProspectDialog';

interface Props {
  prospect: ProspectWithInteractions | null;
  onClose: () => void;
}

const NOTE_TYPES: { value: LeadNoteType; label: string; icon: React.ReactNode }[] = [
  { value: 'general', label: 'Poznámka', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { value: 'call', label: 'Hovor', icon: <Phone className="h-3.5 w-3.5" /> },
  { value: 'internal', label: 'Interní', icon: <Lock className="h-3.5 w-3.5" /> },
];

export function ProspectDetailSheet({ prospect, onClose }: Props) {
  const { updateStatus, addNote } = useProspectsData();
  const { profile } = useAuth();
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<LeadNoteType>('general');
  const [callDate, setCallDate] = useState('');
  const [showConvert, setShowConvert] = useState(false);

  if (!prospect) return null;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const authorName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Uživatel' : 'Uživatel';
    addNote(prospect.id, noteText.trim(), noteType, authorName, noteType === 'call' ? callDate || null : null);
    setNoteText('');
    setCallDate('');
  };

  const sortedNotes = [...prospect.notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      <Sheet open={!!prospect} onOpenChange={open => !open && onClose()}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg">{prospect.name}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Basic info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail</span>
                <span>{prospect.email}</span>
              </div>
              {prospect.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon</span>
                  <span>{prospect.phone}</span>
                </div>
              )}
              {prospect.company && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Firma</span>
                  <span>{prospect.company}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Select value={prospect.status} onValueChange={v => updateStatus(prospect.id, v as ProspectStatus)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PROSPECT_STATUS_LABELS) as [ProspectStatus, string][]).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vytvořeno</span>
                <span>{new Date(prospect.created_at).toLocaleDateString('cs-CZ')}</span>
              </div>
            </div>

            {prospect.status !== 'converted' && (
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowConvert(true)}>
                <ArrowRight className="h-4 w-4" />
                Převést na lead
              </Button>
            )}

            <Separator />

            <Tabs defaultValue="interactions">
              <TabsList className="w-full">
                <TabsTrigger value="interactions" className="flex-1">Interakce ({prospect.interaction_count})</TabsTrigger>
                <TabsTrigger value="notes" className="flex-1">Poznámky ({prospect.notes.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="interactions" className="mt-4 space-y-3">
                {prospect.interactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Zatím žádné interakce</p>
                ) : (
                  prospect.interactions.map(interaction => (
                    <div key={interaction.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                      <span className="text-xl">{INTERACTION_TYPE_EMOJI[interaction.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{interaction.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {INTERACTION_TYPE_LABELS[interaction.type]} · {new Date(interaction.occurred_at).toLocaleDateString('cs-CZ', {
                            day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-4 space-y-4">
                {/* Add note */}
                <div className="space-y-3 p-3 rounded-lg border bg-card">
                  <div className="flex gap-1">
                    {NOTE_TYPES.map(nt => (
                      <Button
                        key={nt.value}
                        variant={noteType === nt.value ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setNoteType(nt.value)}
                      >
                        {nt.icon}
                        {nt.label}
                      </Button>
                    ))}
                  </div>
                  {noteType === 'call' && (
                    <Input type="datetime-local" value={callDate} onChange={e => setCallDate(e.target.value)} className="w-auto" />
                  )}
                  <Textarea placeholder="Přidat poznámku..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} />
                  <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Přidat
                  </Button>
                </div>

                {/* Notes list */}
                {sortedNotes.map(note => (
                  <div key={note.id} className={cn(
                    "p-3 rounded-lg border",
                    note.note_type === 'internal' && "bg-amber-500/5 border-amber-500/20",
                    note.note_type === 'call' && "bg-blue-500/5 border-blue-500/20",
                    note.note_type === 'general' && "bg-muted/30",
                  )}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{note.author_name}</span>
                      <span className="text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))}
                {sortedNotes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Zatím žádné poznámky</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <ConvertProspectDialog
        prospect={prospect}
        open={showConvert}
        onOpenChange={setShowConvert}
      />
    </>
  );
}
