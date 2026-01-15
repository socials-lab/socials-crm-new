import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Link as LinkIcon, 
  Building2,
  FileText,
  Sparkles,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  X,
  Mail,
  CalendarCheck,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useCRMData } from '@/hooks/useCRMData';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAISummary } from '@/hooks/useAISummary';
import { useToast } from '@/hooks/use-toast';
import type { Meeting, MeetingStatus } from '@/types/meetings';
import { MeetingParticipants } from './MeetingParticipants';
import { MeetingTasks } from './MeetingTasks';
import { Loader2 } from 'lucide-react';

interface MeetingDetailSheetProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string }> = {
  scheduled: { label: 'Naplánováno', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'Probíhá', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'Dokončeno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Zrušeno', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export function MeetingDetailSheet({ meeting, open, onOpenChange }: MeetingDetailSheetProps) {
  const { updateMeeting, deleteMeeting, getParticipantsByMeetingId, getTasksByMeetingId } = useMeetingsData();
  const { clients, engagements, colleagues } = useCRMData();
  const { createCalendarEvent, isConnected, isLoading: isCreatingEvent } = useGoogleCalendar();
  const { generateSummary, isGenerating } = useAISummary();
  const { toast } = useToast();
  
  const [isEditingAgenda, setIsEditingAgenda] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedAgenda, setEditedAgenda] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [editedSummary, setEditedSummary] = useState('');

  if (!meeting) return null;

  const participants = getParticipantsByMeetingId(meeting.id);
  const tasks = getTasksByMeetingId(meeting.id);
  const client = meeting.client_id ? clients.find(c => c.id === meeting.client_id) : null;
  const engagement = meeting.engagement_id ? engagements.find(e => e.id === meeting.engagement_id) : null;

  const meetingDate = new Date(meeting.scheduled_at);
  const isPast = meetingDate < new Date();
  const statusConfig = STATUS_CONFIG[meeting.status];

  const handleStatusChange = async (status: MeetingStatus) => {
    try {
      await updateMeeting(meeting.id, { status });
      toast({ title: 'Status aktualizován' });
    } catch (error) {
      toast({ title: 'Chyba při aktualizaci', variant: 'destructive' });
    }
  };

  const handleSaveAgenda = async () => {
    try {
      await updateMeeting(meeting.id, { agenda: editedAgenda });
      setIsEditingAgenda(false);
      toast({ title: 'Agenda uložena' });
    } catch (error) {
      toast({ title: 'Chyba při ukládání', variant: 'destructive' });
    }
  };

  const handleSaveTranscript = async () => {
    try {
      await updateMeeting(meeting.id, { transcript: editedTranscript });
      setIsEditingTranscript(false);
      toast({ title: 'Transcript uložen' });
    } catch (error) {
      toast({ title: 'Chyba při ukládání', variant: 'destructive' });
    }
  };

  const handleSaveSummary = async () => {
    try {
      await updateMeeting(meeting.id, { ai_summary: editedSummary });
      setIsEditingSummary(false);
      toast({ title: 'Shrnutí uloženo' });
    } catch (error) {
      toast({ title: 'Chyba při ukládání', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMeeting(meeting.id);
      onOpenChange(false);
      toast({ title: 'Meeting smazán' });
    } catch (error) {
      toast({ title: 'Chyba při mazání', variant: 'destructive' });
    }
  };

  const handleSendInvites = async () => {
    try {
      await createCalendarEvent(meeting.id);
    } catch (error: any) {
      toast({ 
        title: 'Chyba při odesílání', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl">{meeting.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                <Badge variant="outline">
                  {meeting.type === 'internal' ? '🏠 Interní' : '🏢 Klientský'}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Basic Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(meetingDate, 'EEEE, d. MMMM yyyy', { locale: cs })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(meetingDate, 'HH:mm')} ({meeting.duration_minutes} min)
            </span>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{meeting.location}</span>
            </div>
          )}
          {meeting.meeting_link && (
            <div className="flex items-center gap-3 text-sm">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a 
                href={meeting.meeting_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Připojit se <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {client && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{client.brand_name || client.name}</span>
              {engagement && (
                <span className="text-muted-foreground">• {engagement.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Status Actions */}
        {meeting.status !== 'cancelled' && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {meeting.status === 'scheduled' && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => handleStatusChange('in_progress')}
                >
                  Zahájit meeting
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusChange('cancelled')}
                >
                  Zrušit
                </Button>
              </>
            )}
            {meeting.status === 'in_progress' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('completed')}
              >
                Ukončit meeting
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Smazat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Smazat meeting?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Opravdu chcete smazat meeting "{meeting.title}"? Tuto akci nelze vrátit zpět.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Smazat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <Separator className="my-4" />

        <Tabs defaultValue={isPast ? 'summary' : 'agenda'} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="participants">Účastníci</TabsTrigger>
            <TabsTrigger value="summary">Shrnutí</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Agenda meetingu
                  </CardTitle>
                  {!isEditingAgenda && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditedAgenda(meeting.agenda);
                        setIsEditingAgenda(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingAgenda ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedAgenda}
                      onChange={(e) => setEditedAgenda(e.target.value)}
                      placeholder="Body k projednání..."
                      className="min-h-[150px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveAgenda}>
                        <Save className="h-4 w-4 mr-1" /> Uložit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingAgenda(false)}>
                        <X className="h-4 w-4 mr-1" /> Zrušit
                      </Button>
                    </div>
                  </div>
                ) : meeting.agenda ? (
                  <p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Agenda nebyla přidána</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="mt-4 space-y-4">
            {/* Calendar Invite Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    Kalendářní pozvánky
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {meeting.calendar_invites_sent_at ? (
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Mail className="h-4 w-4" />
                        Odesláno {format(new Date(meeting.calendar_invites_sent_at), 'd. M. yyyy HH:mm', { locale: cs })}
                      </span>
                    ) : (
                      <span>Pozvánky zatím nebyly odeslány</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant={meeting.calendar_invites_sent_at ? 'outline' : 'default'}
                    onClick={handleSendInvites}
                    disabled={isCreatingEvent || !isConnected || participants.length === 0}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {isCreatingEvent ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Odesílám...
                      </>
                    ) : meeting.calendar_invites_sent_at ? (
                      'Odeslat znovu'
                    ) : (
                      'Odeslat pozvánky'
                    )}
                  </Button>
                </div>
                {participants.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nejprve přidejte účastníky níže.
                  </p>
                )}
              </CardContent>
            </Card>

            <MeetingParticipants 
              meetingId={meeting.id} 
              participants={participants}
              colleagues={colleagues}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-4 space-y-4">
            {/* Transcript */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Transcript
                  </CardTitle>
                  {!isEditingTranscript && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditedTranscript(meeting.transcript);
                        setIsEditingTranscript(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingTranscript ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedTranscript}
                      onChange={(e) => setEditedTranscript(e.target.value)}
                      placeholder="Vložte transcript meetingu..."
                      className="min-h-[150px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTranscript}>
                        <Save className="h-4 w-4 mr-1" /> Uložit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingTranscript(false)}>
                        <X className="h-4 w-4 mr-1" /> Zrušit
                      </Button>
                    </div>
                  </div>
                ) : meeting.transcript ? (
                  <p className="text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {meeting.transcript}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Transcript nebyl přidán</p>
                )}
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Shrnutí
                  </CardTitle>
                  <div className="flex gap-2">
                    {!meeting.ai_summary && !isEditingSummary && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={async () => {
                          await generateSummary(meeting.id, meeting.transcript);
                          // Data refreshes automatically via query invalidation in useAISummary
                        }}
                        disabled={isGenerating || (!meeting.transcript && !meeting.notes && !meeting.agenda)}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Generování...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-1" />
                            Vygenerovat AI shrnutí
                          </>
                        )}
                      </Button>
                    )}
                    {!isEditingSummary && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setEditedSummary(meeting.ai_summary || '');
                          setIsEditingSummary(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditingSummary ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                      placeholder="Shrnutí meetingu..."
                      className="min-h-[150px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveSummary}>
                        <Save className="h-4 w-4 mr-1" /> Uložit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingSummary(false)}>
                        <X className="h-4 w-4 mr-1" /> Zrušit
                      </Button>
                    </div>
                  </div>
                ) : meeting.ai_summary ? (
                  <p className="text-sm whitespace-pre-wrap">{meeting.ai_summary}</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Shrnutí nebylo přidáno</p>
                    {!meeting.transcript && !meeting.notes && !meeting.agenda && (
                      <p className="text-xs text-muted-foreground">Nejprve přidejte transcript nebo poznámky</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
