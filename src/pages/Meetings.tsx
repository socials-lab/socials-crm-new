import { useState, useMemo } from 'react';
import { format, startOfToday, addDays, isBefore, isAfter, isSameDay } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar, Filter, Search } from 'lucide-react';
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
import { AddMeetingDialog } from '@/components/meetings/AddMeetingDialog';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import { MeetingDetailSheet } from '@/components/meetings/MeetingDetailSheet';
import type { Meeting, MeetingType } from '@/types/meetings';

export default function Meetings() {
  const { meetings, participants, isLoading } = useMeetingsData();
  const { clients, colleagues } = useCRMData();
  
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MeetingType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      
      return true;
    });
  }, [meetings, searchQuery, typeFilter, statusFilter, clients]);

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
      <div className="p-6">
        <PageHeader title="📅 Meetingy" description="Načítání..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="📅 Meetingy" 
        description="Evidence interních a klientských meetingů"
        actions={<AddMeetingDialog />}
      />

      {/* Today's highlight */}
      {todaysMeetings.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Dnešní meetingy ({todaysMeetings.length})</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat meeting..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MeetingType | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            <SelectItem value="internal">🏠 Interní</SelectItem>
            <SelectItem value="client">🏢 Klientské</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            Nadcházející
            <Badge variant="secondary" className="text-xs">{upcomingMeetings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            Minulé
            <Badge variant="secondary" className="text-xs">{pastMeetings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            Všechny
            <Badge variant="secondary" className="text-xs">{filteredMeetings.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Žádné nadcházející meetingy</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMeetings.map(meeting => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  client={getClientForMeeting(meeting)}
                  participants={getParticipantsForMeeting(meeting.id)}
                  colleagues={colleagues}
                  onClick={() => handleOpenDetail(meeting)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastMeetings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Žádné minulé meetingy</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pastMeetings.map(meeting => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  client={getClientForMeeting(meeting)}
                  participants={getParticipantsForMeeting(meeting.id)}
                  colleagues={colleagues}
                  onClick={() => handleOpenDetail(meeting)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Žádné meetingy</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredMeetings
                .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
                .map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    client={getClientForMeeting(meeting)}
                    participants={getParticipantsForMeeting(meeting.id)}
                    colleagues={colleagues}
                    onClick={() => handleOpenDetail(meeting)}
                  />
                ))}
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
