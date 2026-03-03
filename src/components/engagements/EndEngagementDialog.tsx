import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { toDateOnlyString } from '@/lib/dbNormalize';
import { cs } from 'date-fns/locale';
import { CalendarIcon, AlertTriangle, User, Building2 } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Engagement, TerminationReason, TerminationInitiatedBy, TerminationData } from '@/types/crm';
import { TERMINATION_REASON_LABELS } from '@/types/crm';

interface EndEngagementDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: TerminationData) => void;
}

export function EndEngagementDialog({
  engagement,
  open,
  onOpenChange,
  onConfirm,
}: EndEngagementDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [initiatedBy, setInitiatedBy] = useState<TerminationInitiatedBy>('client');
  const [reason, setReason] = useState<TerminationReason | ''>('');
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens with new engagement
  useEffect(() => {
    if (open && engagement) {
      setSelectedDate(engagement.end_date ? new Date(engagement.end_date) : undefined);
      setInitiatedBy(engagement.termination_initiated_by || 'client');
      setReason(engagement.termination_reason || '');
      setNotes(engagement.termination_notes || '');
    }
  }, [open, engagement]);

  const handleConfirm = () => {
    if (selectedDate && reason) {
      onConfirm({
        end_date: toDateOnlyString(selectedDate),
        termination_reason: reason as TerminationReason,
        termination_initiated_by: initiatedBy,
        termination_notes: notes,
      });
      onOpenChange(false);
    }
  };

  // Calculate suggested end date based on notice period
  const suggestedEndDate = engagement?.notice_period_months 
    ? addMonths(new Date(), engagement.notice_period_months)
    : undefined;

  const isFormValid = selectedDate && reason;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ukončit spolupráci</DialogTitle>
          <DialogDescription>
            Nastavte parametry ukončení zakázky "{engagement?.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Who is terminating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Kdo ukončuje spolupráci? *</Label>
            <RadioGroup
              value={initiatedBy}
              onValueChange={(value) => setInitiatedBy(value as TerminationInitiatedBy)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Klient
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="agency" id="agency" />
                <Label htmlFor="agency" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Agentura
                </Label>
              </div>
            </RadioGroup>
          </div>

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

          {/* Notice period info */}
          {engagement?.notice_period_months && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Výpovědní lhůta: {engagement.notice_period_months} {engagement.notice_period_months === 1 ? 'měsíc' : engagement.notice_period_months < 5 ? 'měsíce' : 'měsíců'}
                  </p>
                  {suggestedEndDate && (
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Doporučené datum ukončení: {format(suggestedEndDate, "d. MMMM yyyy", { locale: cs })}
                    </p>
                  )}
                </div>
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
          <Button onClick={handleConfirm} disabled={!isFormValid}>
            Potvrdit ukončení
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
