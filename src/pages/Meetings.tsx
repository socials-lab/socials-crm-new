import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, startOfToday, addDays, isBefore, isAfter, isSameDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar, Filter, Search, RefreshCw, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useCRMData } from '@/hooks/useCRMData';
import { useGoogleCalendar, GoogleCalendarEvent } from '@/hooks/useGoogleCalendar';
import { AddMeetingDialog } from '@/components/meetings/AddMeetingDialog';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import { MeetingDetailSheet } from '@/components/meetings/MeetingDetailSheet';
import { GoogleCalendarEventCard } from '@/components/meetings/GoogleCalendarEventCard';
import { CalendarCheck } from 'lucide-react';
import type { Meeting, MeetingType } from '@/types/meetings';

export default function Meetings() {
  const { meetings, participants, isLoading } = useMeetingsData();
  const { clients, colleagues } = useCRMData();
  const { connectGoogleCalendar, fetchCalendarEvents, isConnected, isCheckingConnection, isGoogleFeatureBlocked } = useGoogleCalendar();

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MeetingType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [participantFilter, setParticipantFilter] = useState<string>('all');

  // Google Calendar events state
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Fetch Google Calendar events when connected
  const loadGoogleEvents = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingGoogle(true);
    setGoogleError(null);

    try {
      // Fetch events from 30 days ago to 60 days in the future
      const timeMin = addMonths(new Date(), -1).toISOString();
      const timeMax = addMonths(new Date(), 2).toISOString();

      const events = await fetchCalendarEvents({
        timeMin,
        timeMax,
        maxResults: 250,
      });

      setGoogleEvents(events);
    } catch (err) {
      console.error('Failed to fetch Google events:', err);
      setGoogleError('Nepodařilo se načíst události z Google Calendar');
    } finally {
      setIsLoadingGoogle(false);
    }
  }, [fetchCalendarEvents, isConnected]);

  // Load Google events on mount and when connection status changes
  useEffect(() => {
    if (isConnected && !isCheckingConnection) {
      void loadGoogleEvents();
    }
  }, [isConnected, isCheckingConnection, loadGoogleEvents]);

  const today = startOfToday();

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const client = meeting.client_id ? clients.find(c => c.id === meeting.client_id) : null;
        const matchesTitle = meeting.title.toLowerCase().includes(query);
        const matchesClient = client?.name.toLowerCase().includes(query) || 
                              client?.brand_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesClient) return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && meeting.type !== typeFilter) return false;
      
      // Status filter
      if (statusFilter !== 'all' && meeting.status !== statusFilter) return false;
      
      // Participant filter
      if (participantFilter !== 'all') {
        const meetingParticipants = participants.filter(p => p.meeting_id === meeting.id);
        const isParticipant = meetingParticipants.some(p => p.colleague_id === participantFilter);
        if (!isParticipant) return false;
      }
      
      return true;
    });
  }, [meetings, searchQuery, typeFilter, statusFilter, participantFilter, participants, clients]);

  // Split into upcoming and past
  const upcomingMeetings = filteredMeetings
    .filter(m => {
      const date = new Date(m.scheduled_at);
      return (isAfter(date, today) || isSameDay(date, today)) && m.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const pastMeetings = filteredMeetings
    .filter(m => {
      const date = new Date(m.scheduled_at);
      return isBefore(date, today) && !isSameDay(date, today);
    })
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const todaysMeetings = upcomingMeetings.filter(m =>
    isSameDay(new Date(m.scheduled_at), today)
  );

  // Get set of google_event_ids from CRM meetings to avoid duplicates
  const linkedGoogleEventIds = useMemo(() => {
    return new Set(meetings.filter(m => m.google_event_id).map(m => m.google_event_id));
  }, [meetings]);

  // Filter Google Calendar events (exclude ones already linked to CRM meetings)
  const filteredGoogleEvents = useMemo(() => {
    return googleEvents.filter(event => {
      // Exclude events that are linked to CRM meetings
      if (linkedGoogleEventIds.has(event.id)) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSummary = event.summary?.toLowerCase().includes(query);
        const matchesDescription = event.description?.toLowerCase().includes(query);
        if (!matchesSummary && !matchesDescription) return false;
      }

      return true;
    });
  }, [googleEvents, searchQuery, linkedGoogleEventIds]);

  // Split Google events into upcoming and past
  const upcomingGoogleEvents = filteredGoogleEvents
    .filter(e => {
      const dateStr = e.start.dateTime || e.start.date;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return isAfter(date, today) || isSameDay(date, today);
    })
    .sort((a, b) => {
      const dateA = new Date(a.start.dateTime || a.start.date || '');
      const dateB = new Date(b.start.dateTime || b.start.date || '');
      return dateA.getTime() - dateB.getTime();
    });

  const pastGoogleEvents = filteredGoogleEvents
    .filter(e => {
      const dateStr = e.start.dateTime || e.start.date;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return isBefore(date, today) && !isSameDay(date, today);
    })
    .sort((a, b) => {
      const dateA = new Date(a.start.dateTime || a.start.date || '');
      const dateB = new Date(b.start.dateTime || b.start.date || '');
      return dateB.getTime() - dateA.getTime();
    });

  const todaysGoogleEvents = upcomingGoogleEvents.filter(e => {
    const dateStr = e.start.dateTime || e.start.date;
    if (!dateStr) return false;
    return isSameDay(new Date(dateStr), today);
  });

  const handleOpenDetail = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDetailOpen(true);
  };

  const getParticipantsForMeeting = (meetingId: string) => 
    participants.filter(p => p.meeting_id === meetingId);

  const getClientForMeeting = (meeting: Meeting) =>
    meeting.client_id ? clients.find(c => c.id === meeting.client_id) : undefined;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title="📅 Meetingy" description="Načítání..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      <PageHeader
        title="📅 Meetingy"
        description="Evidence interních a klientských meetingů"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isGoogleFeatureBlocked ? (
              <Button variant="outline" disabled className="w-full sm:w-auto">
                <CalendarCheck className="h-4 w-4 mr-2" />
                <span className="sm:inline">Google během impersonace vypnut</span>
              </Button>
            ) : isConnected ? (
              <Button
                variant="outline"
                onClick={loadGoogleEvents}
                disabled={isLoadingGoogle}
                className="w-full sm:w-auto"
              >
                {isLoadingGoogle ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                <span className="sm:inline">Obnovit</span>
              </Button>
            ) : (
              <Button variant="outline" onClick={connectGoogleCalendar} className="w-full sm:w-auto">
                <CalendarCheck className="h-4 w-4 mr-2" />
                <span className="sm:inline">Propojit Google</span>
              </Button>
            )}
            <AddMeetingDialog />
          </div>
        }
      />

      {/* Today's highlight */}
      {(todaysMeetings.length > 0 || todaysGoogleEvents.length > 0) && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="font-semibold text-sm sm:text-base">Dnešní meetingy ({todaysMeetings.length + todaysGoogleEvents.length})</h2>
          </div>
          <div className="grid gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todaysMeetings.map(meeting => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                client={getClientForMeeting(meeting)}
                participants={getParticipantsForMeeting(meeting.id)}
                colleagues={colleagues}
                onClick={() => handleOpenDetail(meeting)}
              />
            ))}
            {todaysGoogleEvents.map(event => (
              <GoogleCalendarEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat meeting..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MeetingType | 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny typy</SelectItem>
              <SelectItem value="internal">🏠 Interní</SelectItem>
              <SelectItem value="client">🏢 Klientské</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny statusy</SelectItem>
              <SelectItem value="scheduled">Naplánováno</SelectItem>
              <SelectItem value="in_progress">Probíhá</SelectItem>
              <SelectItem value="completed">Dokončeno</SelectItem>
              <SelectItem value="cancelled">Zrušeno</SelectItem>
            </SelectContent>
          </Select>
          <Select value={participantFilter} onValueChange={setParticipantFilter}>
            <SelectTrigger className="w-full col-span-2 sm:col-span-1">
              <SelectValue placeholder="Účastník" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni účastníci</SelectItem>
              {colleagues
                .filter(c => c.status === 'active')
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map(colleague => (
                  <SelectItem key={colleague.id} value={colleague.id}>
                    {colleague.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="upcoming" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <span className="hidden sm:inline">Nadcházející</span>
            <span className="sm:hidden">Nadch.</span>
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-1.5">{upcomingMeetings.length + upcomingGoogleEvents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            Minulé
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-1.5">{pastMeetings.length + pastGoogleEvents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            Všechny
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-1.5">{filteredMeetings.length + filteredGoogleEvents.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingMeetings.length === 0 && upcomingGoogleEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Žádné nadcházející meetingy</p>
              {!isConnected && !isGoogleFeatureBlocked && (
                <p className="text-sm mt-2">
                  <button
                    onClick={connectGoogleCalendar}
                    className="text-primary hover:underline"
                  >
                    Propojte Google účet
                  </button>{' '}
                  pro zobrazení událostí z kalendáře
                </p>
              )}
              {isGoogleFeatureBlocked && (
                <p className="text-sm mt-2">
                  Google kalendář je během impersonace vypnutý.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {/* Merge and sort CRM meetings and Google events by date */}
              {[
                ...upcomingMeetings.map(m => ({
                  type: 'crm' as const,
                  date: new Date(m.scheduled_at),
                  data: m
                })),
                ...upcomingGoogleEvents.map(e => ({
                  type: 'google' as const,
                  date: new Date(e.start.dateTime || e.start.date || ''),
                  data: e
                }))
              ]
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((item, idx) =>
                  item.type === 'crm' ? (
                    <MeetingCard
                      key={item.data.id}
                      meeting={item.data}
                      client={getClientForMeeting(item.data)}
                      participants={getParticipantsForMeeting(item.data.id)}
                      colleagues={colleagues}
                      onClick={() => handleOpenDetail(item.data)}
                    />
                  ) : (
                    <GoogleCalendarEventCard key={item.data.id} event={item.data} />
                  )
                )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastMeetings.length === 0 && pastGoogleEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Žádné minulé meetingy</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                ...pastMeetings.map(m => ({
                  type: 'crm' as const,
                  date: new Date(m.scheduled_at),
                  data: m
                })),
                ...pastGoogleEvents.map(e => ({
                  type: 'google' as const,
                  date: new Date(e.start.dateTime || e.start.date || ''),
                  data: e
                }))
              ]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((item, idx) =>
                  item.type === 'crm' ? (
                    <MeetingCard
                      key={item.data.id}
                      meeting={item.data}
                      client={getClientForMeeting(item.data)}
                      participants={getParticipantsForMeeting(item.data.id)}
                      colleagues={colleagues}
                      onClick={() => handleOpenDetail(item.data)}
                    />
                  ) : (
                    <GoogleCalendarEventCard key={item.data.id} event={item.data} />
                  )
                )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {filteredMeetings.length === 0 && filteredGoogleEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Žádné meetingy</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                ...filteredMeetings.map(m => ({
                  type: 'crm' as const,
                  date: new Date(m.scheduled_at),
                  data: m
                })),
                ...filteredGoogleEvents.map(e => ({
                  type: 'google' as const,
                  date: new Date(e.start.dateTime || e.start.date || ''),
                  data: e
                }))
              ]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((item, idx) =>
                  item.type === 'crm' ? (
                    <MeetingCard
                      key={item.data.id}
                      meeting={item.data}
                      client={getClientForMeeting(item.data)}
                      participants={getParticipantsForMeeting(item.data.id)}
                      colleagues={colleagues}
                      onClick={() => handleOpenDetail(item.data)}
                    />
                  ) : (
                    <GoogleCalendarEventCard key={item.data.id} event={item.data} />
                  )
                )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MeetingDetailSheet
        meeting={selectedMeeting}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
