import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Link as LinkIcon, 
  Users, 
  Building2,
  FileText,
  CheckSquare,
  Sparkles,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useCRMData } from '@/hooks/useCRMData';
import { useToast } from '@/hooks/use-toast';
import type { Meeting, MeetingStatus } from '@/types/meetings';
import { MeetingParticipants } from './MeetingParticipants';
import { MeetingTasks } from './MeetingTasks';

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
    if (!confirm('Opravdu chcete smazat tento meeting?')) return;
    try {
      await deleteMeeting(meeting.id);
      onOpenChange(false);
      toast({ title: 'Meeting smazán' });
    } catch (error) {
      toast({ title: 'Chyba při mazání', variant: 'destructive' });
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
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
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
          <div className="flex gap-2 mb-6">
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
          </div>
        )}

        <Separator className="my-4" />

        <Tabs defaultValue={isPast ? 'summary' : 'agenda'} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="participants">Účastníci</TabsTrigger>
            <TabsTrigger value="summary">Shrnutí</TabsTrigger>
            <TabsTrigger value="tasks">Úkoly</TabsTrigger>
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

          <TabsContent value="participants" className="mt-4">
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
                  {!isEditingSummary && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditedSummary(meeting.ai_summary);
                        setIsEditingSummary(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
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
                  <p className="text-sm text-muted-foreground">Shrnutí nebylo přidáno</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <MeetingTasks 
              meetingId={meeting.id} 
              tasks={tasks}
              colleagues={colleagues}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
