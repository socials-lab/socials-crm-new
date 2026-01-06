import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Link as LinkIcon } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
  const { addMeeting } = useMeetingsData();
  const { clients, engagements } = useCRMData();
  const { toast } = useToast();

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

  const onSubmit = async (data: MeetingFormValues) => {
    try {
      const [hours, minutes] = data.scheduled_time.split(':').map(Number);
      const scheduledAt = new Date(data.scheduled_date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      await addMeeting({
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

      toast({
        title: 'Meeting vytvořen',
        description: `Meeting "${data.title}" byl úspěšně naplánován.`,
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se vytvořit meeting.',
        variant: 'destructive',
      });
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
                            {field.value ? (
                              format(field.value, 'PPP', { locale: cs })
                            ) : (
                              <span>Vyberte datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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


            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Zrušit
              </Button>
              <Button type="submit">Vytvořit meeting</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
