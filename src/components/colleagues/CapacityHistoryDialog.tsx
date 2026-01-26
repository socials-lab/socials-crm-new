import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { History, ArrowRight, User, Calendar, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useColleagueCapacityHistory } from '@/hooks/useColleagueCapacityHistory';
import type { Colleague } from '@/types/crm';

interface CapacityHistoryDialogProps {
  colleague: Colleague | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CapacityHistoryDialog({ 
  colleague, 
  open, 
  onOpenChange 
}: CapacityHistoryDialogProps) {
  const { history, isLoading, error } = useColleagueCapacityHistory(colleague?.id ?? null);

  if (!colleague) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Historie kapacity - {colleague.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Nepodařilo se načíst historii
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Zatím žádné změny kapacity</p>
              <p className="text-sm mt-1">
                Aktuální kapacita: {colleague.capacity_hours_per_month ?? 'Nenastaveno'} hod/měs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current capacity banner */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">Aktuální kapacita</p>
                <p className="text-xl font-semibold">
                  {colleague.capacity_hours_per_month ?? 'Nenastaveno'} hod/měs
                </p>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                  {history.map((record, index) => (
                    <div key={record.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>

                      <div className="p-3 rounded-lg border bg-card">
                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(record.effective_from), 'd. MMMM yyyy', { locale: cs })}
                        </div>

                        {/* Capacity change */}
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-muted-foreground">
                            {record.previous_capacity_hours ?? '—'}
                          </span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="text-primary">
                            {record.capacity_hours} hod/měs
                          </span>
                        </div>

                        {/* Reason */}
                        {record.reason && (
                          <div className="mt-2 flex items-start gap-2 text-sm">
                            <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                            <span>{record.reason}</span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="mt-2 text-xs text-muted-foreground">
                          Změněno: {format(new Date(record.created_at), 'd.M.yyyy HH:mm', { locale: cs })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zavřít
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
