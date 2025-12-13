import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';

interface BillingPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workName: string;
  workDate: string;
  currentBillingPeriod: string;
  onConfirm: (billingPeriod: string) => void;
}

export function BillingPeriodDialog({
  open,
  onOpenChange,
  workName,
  workDate,
  currentBillingPeriod,
  onConfirm,
}: BillingPeriodDialogProps) {
  const suggestedPeriod = useMemo(() => {
    // Suggest billing period based on work date
    const date = new Date(workDate);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, [workDate]);

  const [selectedPeriod, setSelectedPeriod] = useState(currentBillingPeriod || suggestedPeriod);

  // Generate available months: 3 months back, current, 3 months forward
  const availableMonths = useMemo(() => {
    const today = new Date();
    const months: string[] = [];
    
    for (let i = -3; i <= 3; i++) {
      const date = addMonths(today, i);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(period);
    }
    
    // Also include the suggested period if not already there
    if (!months.includes(suggestedPeriod)) {
      months.push(suggestedPeriod);
      months.sort();
    }
    
    return months;
  }, [suggestedPeriod]);

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'LLLL yyyy', { locale: cs });
  };

  const handleConfirm = () => {
    onConfirm(selectedPeriod);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vyberte fakturační období</DialogTitle>
          <DialogDescription>
            Do kterého měsíce chcete zařadit vícepráci "{workName}" pro fakturaci?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Vyberte měsíc" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {formatMonthLabel(month)}
                  {month === suggestedPeriod && ' (doporučeno)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <p className="text-sm text-muted-foreground mt-2">
            Datum práce: {format(new Date(workDate), 'd. MMMM yyyy', { locale: cs })}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleConfirm}>
            Potvrdit a nastavit K fakturaci
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
