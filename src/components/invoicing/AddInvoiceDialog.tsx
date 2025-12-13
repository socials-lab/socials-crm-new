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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCRMData } from '@/hooks/useCRMData';
import { FileText, Building2, Calculator } from 'lucide-react';

export interface NewInvoiceItemData {
  description: string;
  amount: number;
  hours: number | null;
  hourly_rate: number | null;
  currency: string;
  is_reverse_charge: boolean;
}

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (engagementId: string, item: NewInvoiceItemData) => void;
  existingEngagementIds: string[];
}

const CURRENCY_OPTIONS = [
  { value: 'CZK', label: 'CZK' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

export function AddInvoiceDialog({ 
  open, 
  onOpenChange, 
  onAdd,
  existingEngagementIds 
}: AddInvoiceDialogProps) {
  const { engagements, getClientById } = useCRMData();
  const [selectedEngagementId, setSelectedEngagementId] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('CZK');
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [isAmountManual, setIsAmountManual] = useState(false);

  // Sort engagements - active first, then by name
  const sortedEngagements = [...engagements]
    .filter(e => e.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'));

  // Auto-calculate amount when hours and hourly rate change
  useEffect(() => {
    if (!isAmountManual && hours && hourlyRate) {
      const calculated = Number(hours) * Number(hourlyRate);
      setAmount(calculated.toString());
    }
  }, [hours, hourlyRate, isAmountManual]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setIsAmountManual(true);
  };

  const handleHoursOrRateChange = (field: 'hours' | 'rate', value: string) => {
    if (field === 'hours') {
      setHours(value);
    } else {
      setHourlyRate(value);
    }
    // Reset manual flag when user modifies hours/rate
    setIsAmountManual(false);
  };

  const handleSubmit = () => {
    if (!selectedEngagementId || !description || !amount) return;
    
    onAdd(selectedEngagementId, {
      description,
      amount: Number(amount),
      hours: hours ? Number(hours) : null,
      hourly_rate: hourlyRate ? Number(hourlyRate) : null,
      currency,
      is_reverse_charge: isReverseCharge,
    });
    handleClose();
  };

  const handleClose = () => {
    setSelectedEngagementId('');
    setDescription('');
    setHours('');
    setHourlyRate('');
    setAmount('');
    setCurrency('CZK');
    setIsReverseCharge(false);
    setIsAmountManual(false);
    onOpenChange(false);
  };

  const selectedEngagement = engagements.find(e => e.id === selectedEngagementId);
  const selectedClient = selectedEngagement ? getClientById(selectedEngagement.client_id) : null;
  const isExistingEngagement = existingEngagementIds.includes(selectedEngagementId);

  const isCalculated = !isAmountManual && hours && hourlyRate;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat novou fakturu</DialogTitle>
          <DialogDescription>
            Vyberte zakázku a zadejte údaje pro první položku na nové faktuře.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="engagement">Zakázka</Label>
            <Select value={selectedEngagementId} onValueChange={setSelectedEngagementId}>
              <SelectTrigger id="engagement">
                <SelectValue placeholder="Vyberte zakázku" />
              </SelectTrigger>
              <SelectContent>
                {sortedEngagements.map(engagement => {
                  const client = getClientById(engagement.client_id);
                  return (
                    <SelectItem key={engagement.id} value={engagement.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{engagement.name}</span>
                        {client && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {client.brand_name || client.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedEngagement && selectedClient && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {selectedClient.brand_name || selectedClient.name}
                {isExistingEngagement ? (
                  <span className="ml-2 text-amber-600">• Pro tuto zakázku už existuje faktura - položka bude přidána k ní</span>
                ) : (
                  <span className="ml-2 text-green-600">• Bude vytvořena nová faktura</span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis položky</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Např. Jednorázová konzultace"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hours">Počet hodin</Label>
              <Input
                id="hours"
                type="number"
                value={hours}
                onChange={(e) => handleHoursOrRateChange('hours', e.target.value)}
                placeholder="Volitelné"
                min={0}
                step={0.5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hodinová sazba</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={(e) => handleHoursOrRateChange('rate', e.target.value)}
                placeholder="Volitelné"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-1.5">
                Fakturovaná částka
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
            <div className="space-y-2">
              <Label htmlFor="currency">Měna</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="reverseCharge" 
              checked={isReverseCharge}
              onCheckedChange={(checked) => setIsReverseCharge(checked === true)}
            />
            <Label 
              htmlFor="reverseCharge" 
              className="text-sm font-normal cursor-pointer"
            >
              Fakturovat v přenesené daňové odpovědnosti
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Zrušit
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedEngagementId || !description || !amount || Number(amount) <= 0}
          >
            {isExistingEngagement ? 'Přidat položku' : 'Vytvořit fakturu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
