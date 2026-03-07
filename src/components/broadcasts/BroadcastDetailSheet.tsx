import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, MousePointerClick, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface BroadcastDetail {
  id: string;
  subject: string;
  body: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  sent_by_name: string | null;
}

interface RecipientRow {
  id: string;
  email: string;
  contact_name: string | null;
  company: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

interface BroadcastDetailSheetProps {
  broadcast: BroadcastDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastDetailSheet({ broadcast, open, onOpenChange }: BroadcastDetailSheetProps) {
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !broadcast) return;
    void loadRecipients();
  }, [open, broadcast?.id]);

  async function loadRecipients() {
    if (!broadcast) return;
    setLoading(true);
    const { data } = await supabase
      .from('broadcast_recipients' as any)
      .select('id, email, contact_name, company, opened_at, clicked_at')
      .eq('broadcast_id', broadcast.id)
      .order('created_at', { ascending: true });
    setRecipients((data as any[]) || []);
    setLoading(false);
  }

  if (!broadcast) return null;

  const openRate = broadcast.recipient_count > 0
    ? Math.round((broadcast.open_count / broadcast.recipient_count) * 100)
    : 0;
  const clickRate = broadcast.recipient_count > 0
    ? Math.round((broadcast.click_count / broadcast.recipient_count) * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{broadcast.subject}</SheetTitle>
          <div className="text-sm text-muted-foreground text-left">
            {format(new Date(broadcast.created_at), 'd. MMMM yyyy, HH:mm', { locale: cs })}
            {broadcast.sent_by_name && ` · ${broadcast.sent_by_name}`}
          </div>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg border p-3 text-center">
            <Mail className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{broadcast.recipient_count}</div>
            <div className="text-xs text-muted-foreground">Příjemců</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{openRate}%</div>
            <div className="text-xs text-muted-foreground">Otevřeno ({broadcast.open_count})</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{clickRate}%</div>
            <div className="text-xs text-muted-foreground">Kliknuto ({broadcast.click_count})</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Příjemci</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Žádné záznamy příjemců</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{recipient.contact_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{recipient.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{recipient.company || '—'}</TableCell>
                    <TableCell>
                      {recipient.clicked_at ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Kliknuto
                        </Badge>
                      ) : recipient.opened_at ? (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Otevreno
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Neotevřeno</Badge>
                      )}
                      {(recipient.opened_at || recipient.clicked_at) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {recipient.clicked_at
                            ? format(new Date(recipient.clicked_at), 'd.M. HH:mm', { locale: cs })
                            : recipient.opened_at
                              ? format(new Date(recipient.opened_at), 'd.M. HH:mm', { locale: cs })
                              : ''}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
