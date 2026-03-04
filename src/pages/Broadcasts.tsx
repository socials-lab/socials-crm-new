import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { CreateBroadcastDialog } from '@/components/broadcasts/CreateBroadcastDialog';
import { Plus, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface Broadcast {
  id: string;
  subject: string;
  recipient_count: number;
  created_at: string;
}

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadBroadcasts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('broadcasts' as any)
      .select('id, subject, recipient_count, created_at')
      .order('created_at', { ascending: false });
    setBroadcasts((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Rozesílky"
        description="Hromadné emaily kontaktům aktivních klientů"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nová rozesílka
          </Button>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Předmět</TableHead>
              <TableHead className="text-right">Příjemců</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {broadcasts.map(b => (
              <TableRow key={b.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(b.created_at), 'd. MMMM yyyy, HH:mm', { locale: cs })}
                </TableCell>
                <TableCell className="font-medium">{b.subject}</TableCell>
                <TableCell className="text-right">{b.recipient_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateBroadcastDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={loadBroadcasts}
      />
    </div>
  );
}
