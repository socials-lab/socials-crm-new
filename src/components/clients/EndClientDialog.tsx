import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon, AlertTriangle, Briefcase } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Client, Engagement, TerminationReason, TerminationInitiatedBy } from '@/types/crm';
import { TERMINATION_REASON_LABELS } from '@/types/crm';

interface EndClientDialogProps {
  client: Client | null;
  engagements: Engagement[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    end_date: string;
    termination_reason: TerminationReason;
    termination_initiated_by: TerminationInitiatedBy;
    termination_notes: string;
    endAllEngagements: boolean;
  }) => void;
}

export function EndClientDialog({
  client,
  engagements,
  open,
  onOpenChange,
  onConfirm,
}: EndClientDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState<TerminationReason | ''>('');
  const [notes, setNotes] = useState('');
  const [endAllEngagements, setEndAllEngagements] = useState(true);

  // Get active engagements for this client
  const activeEngagements = useMemo(() => {
    if (!client) return [];
    return engagements.filter(
      (e) => e.client_id === client.id && e.status === 'active' && !e.end_date
    );
  }, [client, engagements]);

  // Calculate total MRR from active engagements
  const totalMRR = useMemo(() => {
    return activeEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  }, [activeEngagements]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && client) {
      setSelectedDate(client.end_date ? new Date(client.end_date) : undefined);
      setReason('');
      setNotes('');
      setEndAllEngagements(true);
    }
  }, [open, client]);

  const handleConfirm = () => {
    if (selectedDate && reason) {
      onConfirm({
        end_date: selectedDate.toISOString().split('T')[0],
        termination_reason: reason as TerminationReason,
        termination_initiated_by: 'client', // Client-level termination is always initiated by client
        termination_notes: notes,
        endAllEngagements,
      });
      onOpenChange(false);
    }
  };

  const isFormValid = selectedDate && reason;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ukončit spolupráci s klientem</DialogTitle>
          <DialogDescription>
            Ukončíte celou spolupráci s klientem "{client?.brand_name || client?.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Active engagements summary */}
          {activeEngagements.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <AlertTriangle className="h-4 w-4" />
                Aktivní zakázky ({activeEngagements.length})
              </div>
              <div className="space-y-2">
                {activeEngagements.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{e.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatCurrency(e.monthly_fee || 0)}/měsíc
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-destructive/20 flex justify-between font-medium">
                <span>Celkové MRR k ukončení:</span>
                <span className="text-destructive">{formatCurrency(totalMRR)}</span>
              </div>
            </div>
          )}

          {/* Termination reason */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Důvod ukončení *</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as TerminationReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte důvod ukončení" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TERMINATION_REASON_LABELS) as [TerminationReason, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* End date picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Datum ukončení *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "d. MMMM yyyy", { locale: cs })
                  ) : (
                    <span>Vyberte datum ukončení</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={cs}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End all engagements checkbox */}
          {activeEngagements.length > 0 && (
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="endAllEngagements"
                checked={endAllEngagements}
                onCheckedChange={(checked) => setEndAllEngagements(checked === true)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="endAllEngagements"
                  className="text-sm font-medium cursor-pointer"
                >
                  Ukončit všechny aktivní zakázky ke stejnému datu
                </Label>
                <p className="text-xs text-muted-foreground">
                  Nastaví datum ukončení na všech {activeEngagements.length} aktivních zakázkách.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Poznámky k ukončení</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Doplňující informace k ukončení spolupráce..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isFormValid}
            variant="destructive"
          >
            Ukončit spolupráci
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
