import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Video, ExternalLink, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GoogleCalendarEvent } from '@/hooks/useGoogleCalendar';

interface GoogleCalendarEventCardProps {
  event: GoogleCalendarEvent;
  onClick?: () => void;
}

export function GoogleCalendarEventCard({ event, onClick }: GoogleCalendarEventCardProps) {
  const startDateTime = event.start.dateTime || event.start.date;
  const eventDate = startDateTime ? new Date(startDateTime) : new Date();
  const isAllDay = !event.start.dateTime;
  const isToday = format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Calculate duration if we have end time
  let durationMinutes: number | null = null;
  if (event.start.dateTime && event.end.dateTime) {
    const startMs = new Date(event.start.dateTime).getTime();
    const endMs = new Date(event.end.dateTime).getTime();
    durationMinutes = Math.round((endMs - startMs) / 60000);
  }

  const isOnline = event.location?.includes('meet.google.com') ||
    event.location?.includes('zoom') ||
    event.location?.includes('teams');

  const attendeeCount = event.attendees?.length || 0;

  return (
    <Card
      className={`hover:shadow-md hover:border-blue-300/50 transition-all ${isToday ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10' : ''
        }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">{event.summary || '(Bez názvu)'}</h3>
              {isToday && (
                <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0">
                  Dnes
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(eventDate, 'd.M.', { locale: cs })}
              </span>
              {!isAllDay && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(eventDate, 'HH:mm')}
                </span>
              )}
              {isAllDay && (
                <span className="text-muted-foreground">Celý den</span>
              )}
              {durationMinutes && (
                <span className="text-muted-foreground">
                  {durationMinutes} min
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                📅 Google Calendar
              </Badge>
              {attendeeCount > 0 && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {attendeeCount}
                </Badge>
              )}
            </div>

            {event.location && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  {isOnline ? (
                    <Video className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                  )}
                  <span className="truncate">{event.location}</span>
                </span>
              </div>
            )}
          </div>

          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Otevřít v Google Calendar"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
