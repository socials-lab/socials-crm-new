import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { CreateBroadcastDialog } from '@/components/broadcasts/CreateBroadcastDialog';
import { BroadcastDetailSheet } from '@/components/broadcasts/BroadcastDetailSheet';
import { Plus, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useUserRole } from '@/hooks/useUserRole';

interface Broadcast {
  id: string;
  subject: string;
  body: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  sent_by_name: string | null;
}

export default function Broadcasts() {
  const { isSuperAdmin } = useUserRole();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);

  async function loadBroadcasts() {
    setLoading(true);
    const { data } = await supabase
      .from('broadcasts' as any)
      .select('id, subject, body, recipient_count, open_count, click_count, created_at, sent_by')
      .order('created_at', { ascending: false });

    const rows = (data as any[]) || [];
    const senderIds = [...new Set(rows.map((row) => row.sent_by).filter(Boolean))];

    const profileMap = new Map<string, string>();
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);
      for (const profile of profiles || []) {
        profileMap.set(profile.id, [profile.first_name, profile.last_name].filter(Boolean).join(' '));
      }
    }

    setBroadcasts(
      rows.map((row) => ({
        ...row,
        sent_by_name: profileMap.get(row.sent_by) || null,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    void loadBroadcasts();
  }, []);

  function formatRate(count: number, total: number) {
    if (total === 0) return '—';
    return `${Math.round((count / total) * 100)}%`;
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      <PageHeader
        title="Rozesílky"
        description="Hromadné emaily kontaktům klientů (defaultně předvybráni dle aktivních zakázek v aktuálním měsíci)"
        actions={
          isSuperAdmin ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nová rozesílka
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Zatím žádné rozesílky</p>
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Předmět</TableHead>
              <TableHead>Odeslal</TableHead>
              <TableHead className="text-right">Příjemců</TableHead>
              <TableHead className="text-right">Open rate</TableHead>
              <TableHead className="text-right">Click rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {broadcasts.map((broadcast) => (
              <TableRow
                key={broadcast.id}
                className="cursor-pointer"
                onClick={() => setSelectedBroadcast(broadcast)}
              >
                <TableCell className="text-muted-foreground">
                  {format(new Date(broadcast.created_at), 'd. MMMM yyyy, HH:mm', { locale: cs })}
                </TableCell>
                <TableCell className="font-medium">{broadcast.subject}</TableCell>
                <TableCell className="text-muted-foreground">{broadcast.sent_by_name || '—'}</TableCell>
                <TableCell className="text-right">{broadcast.recipient_count}</TableCell>
                <TableCell className="text-right">{formatRate(broadcast.open_count, broadcast.recipient_count)}</TableCell>
                <TableCell className="text-right">{formatRate(broadcast.click_count, broadcast.recipient_count)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      <CreateBroadcastDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => void loadBroadcasts()}
      />

      <BroadcastDetailSheet
        broadcast={selectedBroadcast}
        open={!!selectedBroadcast}
        onOpenChange={(open) => {
          if (!open) setSelectedBroadcast(null);
        }}
      />
    </div>
  );
}
