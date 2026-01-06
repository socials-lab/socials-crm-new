import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar, Clock, Building2, Users, MapPin, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Meeting, MeetingStatus, MeetingParticipant } from '@/types/meetings';
import type { Client, Colleague } from '@/types/crm';

interface MeetingCardProps {
  meeting: Meeting;
  client?: Client;
  participants: any[];
  colleagues: Colleague[];
  onClick: () => void;
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string }> = {
  scheduled: { label: 'Naplánováno', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'Probíhá', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'Dokončeno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Zrušeno', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export function MeetingCard({ meeting, client, participants, colleagues, onClick }: MeetingCardProps) {
  const meetingDate = new Date(meeting.scheduled_at);
  const statusConfig = STATUS_CONFIG[meeting.status];
  const isToday = format(meetingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const participantColleagues = participants
    .filter(p => p.colleague_id)
    .map(p => colleagues.find(c => c.id === p.colleague_id))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md hover:border-primary/30 transition-all ${
        isToday ? 'border-primary/50 bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">{meeting.title}</h3>
              {isToday && (
                <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
                  Dnes
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(meetingDate, 'd.M.', { locale: cs })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(meetingDate, 'HH:mm')}
              </span>
              <span className="text-muted-foreground">
                {meeting.duration_minutes} min
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              <Badge variant="outline" className="text-xs">
                {meeting.type === 'internal' ? '🏠 Interní' : '🏢 Klient'}
              </Badge>
              {client && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {client.brand_name || client.name}
                </Badge>
              )}
            </div>

            {(meeting.location || meeting.meeting_link) && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {meeting.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {meeting.location}
                  </span>
                )}
                {meeting.meeting_link && (
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Online
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Participants Avatars */}
          {participantColleagues.length > 0 && (
            <div className="flex -space-x-2">
              {participantColleagues.map((colleague, i) => (
                <Avatar key={colleague!.id} className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {colleague!.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 3 && (
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    +{participants.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
