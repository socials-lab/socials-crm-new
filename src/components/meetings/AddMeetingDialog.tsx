import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Link as LinkIcon, Users, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useCRMData } from '@/hooks/useCRMData';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { MeetingType } from '@/types/meetings';

const meetingSchema = z.object({
  title: z.string().min(1, 'Název je povinný'),
  type: z.enum(['internal', 'client']),
  client_id: z.string().nullable().optional(),
  engagement_id: z.string().nullable().optional(),
  scheduled_date: z.date({ required_error: 'Datum je povinné' }),
  scheduled_time: z.string().min(1, 'Čas je povinný'),
  duration_minutes: z.number().min(15).max(480),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  agenda: z.string().optional(),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

export function AddMeetingDialog() {
  const [open, setOpen] = useState(false);
  const [sendCalendarInvites, setSendCalendarInvites] = useState(false);
  const [selectedColleagueIds, setSelectedColleagueIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addMeeting, addParticipant } = useMeetingsData();
  const { clients, engagements, colleagues } = useCRMData();
  const { createCalendarEvent, isConnected } = useGoogleCalendar();

  const activeColleagues = colleagues.filter(c => c.status === 'active');

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      type: 'internal',
      client_id: null,
      engagement_id: null,
      scheduled_time: '09:00',
      duration_minutes: 60,
      location: '',
      meeting_link: '',
      agenda: '',
    },
  });

  const meetingType = form.watch('type');
  const selectedClientId = form.watch('client_id');

  const activeClients = clients.filter(c => c.status === 'active');
  const clientEngagements = selectedClientId
    ? engagements.filter(e => e.client_id === selectedClientId && e.status === 'active')
    : [];

  const toggleColleague = (colleagueId: string) => {
    setSelectedColleagueIds(prev =>
      prev.includes(colleagueId)
        ? prev.filter(id => id !== colleagueId)
        : [...prev, colleagueId]
    );
  };

  const removeColleague = (colleagueId: string) => {
    setSelectedColleagueIds(prev => prev.filter(id => id !== colleagueId));
  };

  const onSubmit = async (data: MeetingFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const [hours, minutes] = data.scheduled_time.split(':').map(Number);
      const scheduledAt = new Date(data.scheduled_date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const newMeeting = await addMeeting({
        title: data.title,
        description: '',
        type: data.type as MeetingType,
        client_id: data.type === 'client' ? data.client_id || null : null,
        engagement_id: data.type === 'client' ? data.engagement_id || null : null,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: data.duration_minutes,
        location: data.location || '',
        meeting_link: data.meeting_link || '',
        status: 'scheduled',
        agenda: data.agenda || '',
        transcript: '',
        ai_summary: '',
        notes: '',
        created_by: null,
        calendar_invites_sent_at: null,
      });

      // Add selected colleagues as participants
      if (newMeeting?.id && selectedColleagueIds.length > 0) {
        await Promise.all(
          selectedColleagueIds.map(colleagueId =>
            addParticipant({
              meeting_id: newMeeting.id,
              colleague_id: colleagueId,
              external_name: null,
              external_email: null,
              role: 'attendee',
              attendance: 'pending',
            })
          )
        );
      }

      // Send calendar invites if requested and connected
      if (sendCalendarInvites && isConnected && newMeeting?.id && selectedColleagueIds.length > 0) {
        try {
          await createCalendarEvent(newMeeting.id);
        } catch (calendarError) {
          console.error('Failed to send calendar invites:', calendarError);
          toast.warning('Meeting vytvořen, ale nepodařilo se odeslat pozvánky do kalendáře');
        }
      }

      toast.success('Meeting vytvořen', {
        description: `Meeting "${data.title}" byl úspěšně naplánován${selectedColleagueIds.length > 0 ? ` s ${selectedColleagueIds.length} účastníky` : ''}.`,
      });

      form.reset();
      setSendCalendarInvites(false);
      setSelectedColleagueIds([]);
      setOpen(false);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast.error('Nepodařilo se vytvořit meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nový meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nový meeting</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název meetingu *</FormLabel>
                  <FormControl>
                    <Input placeholder="Týdenní standup, Kick-off projekt..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ meetingu *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="internal">🏠 Interní</SelectItem>
                      <SelectItem value="client">🏢 Klientský</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {meetingType === 'client' && (
              <>
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Klient</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte klienta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeClients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.brand_name || client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedClientId && clientEngagements.length > 0 && (
                  <FormField
                    control={form.control}
                    name="engagement_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zakázka</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte zakázku (volitelné)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientEngagements.map(eng => (
                              <SelectItem key={eng.id} value={eng.id}>
                                {eng.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {field.value ? (
                              format(field.value, 'PPP', { locale: cs })
                            ) : (
                              <span>Vyberte datum</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={cs}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Čas *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="time" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Délka (minuty)</FormLabel>
                  <Select 
                    onValueChange={(v) => field.onChange(Number(v))} 
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hodina</SelectItem>
                      <SelectItem value="90">1.5 hodiny</SelectItem>
                      <SelectItem value="120">2 hodiny</SelectItem>
                      <SelectItem value="180">3 hodiny</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Místo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Kancelář, Online..." className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meeting_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odkaz na meeting</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="https://meet.google.com/..." className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agenda</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Body k projednání..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Colleague Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Účastníci (kolegové)
              </Label>

              {/* Selected colleagues badges */}
              {selectedColleagueIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {selectedColleagueIds.map(id => {
                    const colleague = activeColleagues.find(c => c.id === id);
                    if (!colleague) return null;
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {colleague.full_name}
                        <button
                          type="button"
                          onClick={() => removeColleague(id)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Colleague selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start text-muted-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    {selectedColleagueIds.length === 0
                      ? 'Přidat účastníky...'
                      : `Přidat další (${activeColleagues.length - selectedColleagueIds.length} dostupných)`
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Hledat kolegu..." />
                    <CommandList>
                      <CommandEmpty>Žádný kolega nenalezen</CommandEmpty>
                      <CommandGroup>
                        {activeColleagues.map(colleague => {
                          const isSelected = selectedColleagueIds.includes(colleague.id);
                          return (
                            <CommandItem
                              key={colleague.id}
                              onSelect={() => toggleColleague(colleague.id)}
                              className="cursor-pointer"
                            >
                              <div className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                              )}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span>{colleague.full_name}</span>
                              {colleague.position && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {colleague.position}
                                </span>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {isConnected && selectedColleagueIds.length > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Checkbox
                  id="send-calendar-invites"
                  checked={sendCalendarInvites}
                  onCheckedChange={(checked) => setSendCalendarInvites(checked === true)}
                />
                <Label htmlFor="send-calendar-invites" className="text-sm font-normal cursor-pointer">
                  📅 Odeslat pozvánky do Google kalendáře ({selectedColleagueIds.length} účastníků)
                </Label>
              </div>
            )}

            {!isConnected && selectedColleagueIds.length > 0 && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                Pro odesílání kalendářních pozvánek propojte svůj Google účet v nastavení.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Zrušit
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Vytvářím...' : 'Vytvořit meeting'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
