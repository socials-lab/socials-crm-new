import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  metadata: any;
  created_at: string;
}

interface UserActivityLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const ACTION_LABELS: Record<string, string> = {
  client_created: 'Vytvořil/a klienta',
  client_updated: 'Upravil/a klienta',
  engagement_created: 'Vytvořil/a zakázku',
  engagement_updated: 'Upravil/a zakázku',
  colleague_created: 'Přidal/a kolegu',
  lead_created: 'Vytvořil/a lead',
  lead_updated: 'Upravil/a lead',
  lead_stage_changed: 'Změnil/a stav leadu',
  extra_work_created: 'Vytvořil/a vícepráci',
  extra_work_approved: 'Schválil/a vícepráci',
  meeting_created: 'Vytvořil/a meeting',
  modification_created: 'Navrhl/a modifikaci',
  modification_approved: 'Schválil/a modifikaci',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  client: 'Klient',
  engagement: 'Zakázka',
  colleague: 'Kolega',
  lead: 'Lead',
  extra_work: 'Vícepráce',
  meeting: 'Meeting',
  modification: 'Modifikace',
};

export function UserActivityLogSheet({ open, onOpenChange, userId, userName }: UserActivityLogSheetProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    (supabase as any)
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }: any) => {
        if (!error && data) setLogs(data);
        setLoading(false);
      });
  }, [open, userId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Log aktivity — {userName}</SheetTitle>
          <SheetDescription>Posledních 50 akcí uživatele v CRM</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Načítání...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Žádná zaznamenaná aktivita.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), 'd. M. yyyy HH:mm', { locale: cs })}
                    </span>
                  </div>
                  {log.entity_name && (
                    <div className="flex items-center gap-2">
                      {log.entity_type && (
                        <Badge variant="outline" className="text-xs">
                          {ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">{log.entity_name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
