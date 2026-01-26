import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { format } from 'date-fns';
import type { ActivityReward } from '@/hooks/useActivityRewards';

interface AddActivityRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (reward: Omit<ActivityReward, 'id' | 'created_at'>) => void;
  colleagueId: string;
}

export function AddActivityRewardDialog({
  open,
  onOpenChange,
  onAdd,
  colleagueId,
}: AddActivityRewardDialogProps) {
  const [description, setDescription] = useState('');
  const [billingType, setBillingType] = useState<'fixed' | 'hourly'>('fixed');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [activityDate, setActivityDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAmountManual, setIsAmountManual] = useState(false);

  // Auto-calculate amount when hours and hourly rate change
  useEffect(() => {
    if (billingType === 'hourly' && !isAmountManual && hours && hourlyRate) {
      const calculated = Number(hours) * Number(hourlyRate);
      setAmount(calculated.toString());
    }
  }, [hours, hourlyRate, billingType, isAmountManual]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (billingType === 'hourly') {
      setIsAmountManual(true);
    }
  };

  const handleHoursOrRateChange = (field: 'hours' | 'rate', value: string) => {
    if (field === 'hours') {
      setHours(value);
    } else {
      setHourlyRate(value);
    }
    setIsAmountManual(false);
  };

  const handleBillingTypeChange = (value: 'fixed' | 'hourly') => {
    setBillingType(value);
    if (value === 'fixed') {
      setHours('');
      setHourlyRate('');
      setIsAmountManual(false);
    }
  };

  const handleSubmit = () => {
    if (!description || !amount || Number(amount) <= 0) return;

    onAdd({
      colleague_id: colleagueId,
      description,
      billing_type: billingType,
      amount: Number(amount),
      hours: billingType === 'hourly' && hours ? Number(hours) : null,
      hourly_rate: billingType === 'hourly' && hourlyRate ? Number(hourlyRate) : null,
      activity_date: activityDate,
    });
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setBillingType('fixed');
    setAmount('');
    setHours('');
    setHourlyRate('');
    setActivityDate(format(new Date(), 'yyyy-MM-dd'));
    setIsAmountManual(false);
    onOpenChange(false);
  };

  const isCalculated = billingType === 'hourly' && !isAmountManual && hours && hourlyRate;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat činnost k fakturaci</DialogTitle>
          <DialogDescription>
            Zadejte činnost, která není navázána na zakázku nebo vícepráci.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Popis činnosti</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Např. Marketing, interní projekt, školení..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityDate">Datum činnosti</Label>
            <Input
              id="activityDate"
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Typ fakturace</Label>
            <Select value={billingType} onValueChange={handleBillingTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixní odměna</SelectItem>
                <SelectItem value="hourly">Hodinová sazba</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {billingType === 'hourly' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="hours">Počet hodin</Label>
                <Input
                  id="hours"
                  type="number"
                  value={hours}
                  onChange={(e) => handleHoursOrRateChange('hours', e.target.value)}
                  placeholder="0"
                  min={0}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hodinová sazba (Kč)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => handleHoursOrRateChange('rate', e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-1.5">
              Celková částka (Kč)
              {isCalculated && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Calculator className="h-3 w-3" />
                  auto
                </span>
              )}
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Zrušit
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description || !amount || Number(amount) <= 0}
          >
            Přidat činnost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
