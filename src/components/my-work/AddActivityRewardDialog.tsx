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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Info, Megaphone, Building2, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import type { ActivityReward, ActivityCategory } from '@/hooks/useActivityRewards';
import { CATEGORY_LABELS, generateInvoiceItemName } from '@/hooks/useActivityRewards';

interface AddActivityRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (reward: Omit<ActivityReward, 'id' | 'created_at' | 'invoice_item_name'>) => void;
  colleagueId: string;
  clientNames?: string[];
}

export function AddActivityRewardDialog({
  open,
  onOpenChange,
  onAdd,
  colleagueId,
  clientNames = [],
}: AddActivityRewardDialogProps) {
  const [category, setCategory] = useState<ActivityCategory>('marketing');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
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

  const invoiceItemName = description ? generateInvoiceItemName(category, description, category === 'client_work' ? clientName : undefined) : '';

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
    if (category === 'client_work' && !clientName) return;

    onAdd({
      colleague_id: colleagueId,
      category,
      description,
      billing_type: billingType,
      amount: Number(amount),
      hours: billingType === 'hourly' && hours ? Number(hours) : null,
      hourly_rate: billingType === 'hourly' && hourlyRate ? Number(hourlyRate) : null,
      activity_date: activityDate,
      client_name: category === 'client_work' ? clientName : undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setCategory('marketing');
    setDescription('');
    setClientName('');
    setBillingType('fixed');
    setAmount('');
    setHours('');
    setHourlyRate('');
    setActivityDate(format(new Date(), 'yyyy-MM-dd'));
    setIsAmountManual(false);
    onOpenChange(false);
  };

  const isCalculated = billingType === 'hourly' && !isAmountManual && hours && hourlyRate;

  const categoryDescriptions: Record<ActivityCategory, string> = {
    marketing: 'Content, videa, podcasty, webináře, brandové aktivity',
    overhead: 'Interní vývoj, sales, administrativa, optimalizace procesů',
    client_work: 'Manuálně přidaná práce na konkrétním klientovi',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat položku</DialogTitle>
          <DialogDescription>
            Manuální přidání položky pro fakturaci.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={category === 'marketing' ? 'default' : 'outline'}
                className="justify-start gap-1.5 text-xs px-2"
                onClick={() => setCategory('marketing')}
              >
                <Megaphone className="h-3.5 w-3.5" />
                Marketing
              </Button>
              <Button
                type="button"
                variant={category === 'overhead' ? 'default' : 'outline'}
                className="justify-start gap-1.5 text-xs px-2"
                onClick={() => setCategory('overhead')}
              >
                <Building2 className="h-3.5 w-3.5" />
                Interní
              </Button>
              <Button
                type="button"
                variant={category === 'client_work' ? 'default' : 'outline'}
                className="justify-start gap-1.5 text-xs px-2"
                onClick={() => setCategory('client_work')}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Klient
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryDescriptions[category]}
            </p>
          </div>

          {/* Client name for client_work */}
          {category === 'client_work' && (
            <div className="space-y-2">
              <Label htmlFor="clientName">Klient</Label>
              {clientNames.length > 0 ? (
                <Select value={clientName} onValueChange={setClientName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte klienta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Název klienta..."
                />
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Popis činnosti</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                category === 'marketing' 
                  ? 'Např. tvorba video obsahu, správa contentu Socials...'
                  : category === 'overhead'
                    ? 'Např. interní reportingová šablona, sales aktivity...'
                    : 'Např. extra analytika, ad-hoc konzultace...'
              }
              rows={2}
            />
          </div>

          {/* Generated Invoice Item Name Preview */}
          {description && (category !== 'client_work' || clientName) && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Název položky na faktuře:</p>
              <p className="text-sm font-medium text-primary">{invoiceItemName}</p>
            </div>
          )}

          {/* Activity Date */}
          <div className="space-y-2">
            <Label htmlFor="activityDate">Datum činnosti</Label>
            <Input
              id="activityDate"
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
            />
          </div>

          {/* Billing Type */}
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

          {/* Hours and Rate for hourly billing */}
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

          {/* Total Amount */}
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
            disabled={!description || !amount || Number(amount) <= 0 || (category === 'client_work' && !clientName)}
          >
            Přidat položku
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
