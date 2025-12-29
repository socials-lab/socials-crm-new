import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  FileText, 
  Video, 
  Calendar,
  ExternalLink,
  Edit,
  MessageSquare,
  Send,
} from 'lucide-react';
import type { Applicant, ApplicantStage } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG, APPLICANT_SOURCE_LABELS } from '@/types/applicant';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { useCRMData } from '@/hooks/useCRMData';

interface ApplicantDetailSheetProps {
  applicant: Applicant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (applicant: Applicant) => void;
}

export function ApplicantDetailSheet({ 
  applicant, 
  open, 
  onOpenChange, 
  onEdit 
}: ApplicantDetailSheetProps) {
  const { updateApplicantStage, addNote } = useApplicantsData();
  const { colleagues } = useCRMData();
  const [newNote, setNewNote] = useState('');

  if (!applicant) return null;

  const stageConfig = APPLICANT_STAGE_CONFIG[applicant.stage];
  const owner = colleagues.find(c => c.id === applicant.owner_id);

  const handleStageChange = (newStage: string) => {
    updateApplicantStage(applicant.id, newStage as ApplicantStage);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(applicant.id, newNote.trim());
      setNewNote('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{applicant.full_name}</SheetTitle>
              <p className="text-muted-foreground">{applicant.position}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit(applicant)}>
              <Edit className="h-4 w-4 mr-1" />
              Upravit
            </Button>
          </div>

          {/* Stage selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Stav:</span>
            <Select value={applicant.stage} onValueChange={handleStageChange}>
              <SelectTrigger className={`w-48 ${stageConfig.color}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPLICANT_STAGE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-4">
            {/* Contact info */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Kontakt
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${applicant.email}`} className="text-primary hover:underline">
                    {applicant.email}
                  </a>
                </div>
                {applicant.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${applicant.phone}`} className="text-primary hover:underline">
                      {applicant.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Detaily
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.position}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Odpovědný: {owner?.full_name || 'Nepřiřazeno'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Přidán: {format(new Date(applicant.created_at), 'd. MMMM yyyy', { locale: cs })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {APPLICANT_SOURCE_LABELS[applicant.source]}
                    {applicant.source_custom && ` - ${applicant.source_custom}`}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Přílohy
              </h3>
              <div className="flex gap-2">
                {applicant.cv_url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={applicant.cv_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      CV
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    Bez CV
                  </Badge>
                )}
                {applicant.video_url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={applicant.video_url} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-1" />
                      Video
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Video className="h-3 w-3 mr-1" />
                    Bez videa
                  </Badge>
                )}
              </div>
            </div>

            {/* Cover letter */}
            {applicant.cover_letter && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Motivační dopis
                </h3>
                <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                  {applicant.cover_letter}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Poznámky ({applicant.notes.length})
              </h3>

              {/* Add note */}
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Přidat poznámku..."
                  className="min-h-[60px]"
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes list */}
              <div className="space-y-2">
                {applicant.notes.slice().reverse().map((note) => (
                  <div key={note.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{note.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'd. M. yyyy HH:mm', { locale: cs })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
