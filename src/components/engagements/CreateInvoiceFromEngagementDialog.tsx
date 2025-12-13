import { useState, useEffect, useMemo } from 'react';
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
import { Calculator, CalendarDays, FileText, Plus, Trash2 } from 'lucide-react';
import type { Engagement, Client, EngagementService } from '@/types/crm';
import { format, subMonths, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface InvoiceItemDraft {
  id: string;
  serviceId: string | null;
  serviceName: string;
  description: string;
  hours: string;
  hourlyRate: string;
  amount: string;
  currency: string;
  isReverseCharge: boolean;
  isAmountManual: boolean;
}

interface CreateInvoiceFromEngagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagement: Engagement;
  client: Client;
  engagementServices: EngagementService[];
  onCreateInvoice: (data: {
    engagementId: string;
    year: number;
    month: number;
    items: Array<{
      description: string;
      amount: number;
      hours: number | null;
      hourly_rate: number | null;
      currency: string;
      is_reverse_charge: boolean;
      service_id: string | null;
    }>;
  }) => void;
}

const CURRENCY_OPTIONS = [
  { value: 'CZK', label: 'CZK' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

const createEmptyItem = (currency: string): InvoiceItemDraft => ({
  id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  serviceId: null,
  serviceName: '',
  description: '',
  hours: '',
  hourlyRate: '',
  amount: '',
  currency,
  isReverseCharge: false,
  isAmountManual: true,
});

export function CreateInvoiceFromEngagementDialog({
  open,
  onOpenChange,
  engagement,
  client,
  engagementServices,
  onCreateInvoice,
}: CreateInvoiceFromEngagementDialogProps) {
  // Generate period options - past 6 months + current + next 2 months
  const periodOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string; year: number; month: number }[] = [];
    
    // Past 6 months
    for (let i = 6; i >= 1; i--) {
      const date = subMonths(now, i);
      options.push({
        value: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: format(date, 'LLLL yyyy', { locale: cs }),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }
    
    // Current month
    options.push({
      value: `${now.getFullYear()}-${now.getMonth() + 1}`,
      label: `${format(now, 'LLLL yyyy', { locale: cs })} (aktuální)`,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
    
    // Next 2 months
    for (let i = 1; i <= 2; i++) {
      const date = addMonths(now, i);
      options.push({
        value: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: format(date, 'LLLL yyyy', { locale: cs }),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }
    
    return options;
  }, []);

  // Default to current month
  const defaultPeriod = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }, []);

  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [items, setItems] = useState<InvoiceItemDraft[]>([]);

  // Get period label for descriptions
  const getPeriodLabel = (period: string) => {
    const option = periodOptions.find(p => p.value === period);
    if (!option) return '';
    return format(new Date(option.year, option.month - 1), 'LLLL yyyy', { locale: cs });
  };

  // Reset form and prefill items when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPeriod(defaultPeriod);
      
      const periodLabel = getPeriodLabel(defaultPeriod);
      const activeServices = engagementServices.filter(s => s.is_active);
      
      if (activeServices.length > 0) {
        const prefilled = activeServices.map(s => ({
          id: `item-${s.id}`,
          serviceId: s.id,
          serviceName: s.name,
          description: `${s.name} - ${periodLabel}`,
          hours: '',
          hourlyRate: '',
          amount: s.price.toString(),
          currency: s.currency,
          isReverseCharge: false,
          isAmountManual: true,
        }));
        setItems(prefilled);
      } else {
        setItems([createEmptyItem(engagement.currency || 'CZK')]);
      }
    }
  }, [open, engagementServices, engagement.currency, defaultPeriod]);

  // Update descriptions when period changes
  useEffect(() => {
    if (!open) return;
    
    const periodLabel = getPeriodLabel(selectedPeriod);
    setItems(prev => prev.map(item => {
      // Only auto-update description for service-based items
      if (item.serviceId && item.serviceName) {
        return {
          ...item,
          description: `${item.serviceName} - ${periodLabel}`,
        };
      }
      return item;
    }));
  }, [selectedPeriod]);

  const updateItem = (id: string, updates: Partial<InvoiceItemDraft>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, ...updates };
      
      // Auto-calculate amount if hours and rate are provided and not manual
      if (!updated.isAmountManual && updated.hours && updated.hourlyRate) {
        updated.amount = (Number(updated.hours) * Number(updated.hourlyRate)).toString();
      }
      
      return updated;
    }));
  };

  const handleHoursOrRateChange = (id: string, field: 'hours' | 'hourlyRate', value: string) => {
    updateItem(id, { [field]: value, isAmountManual: false });
  };

  const handleAmountChange = (id: string, value: string) => {
    updateItem(id, { amount: value, isAmountManual: true });
  };

  const addEmptyItem = () => {
    setItems(prev => [...prev, createEmptyItem(engagement.currency || 'CZK')]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    const validItems = items.filter(item => item.description && item.amount && Number(item.amount) > 0);
    if (validItems.length === 0 || !selectedPeriod) return;
    
    const selectedOption = periodOptions.find(p => p.value === selectedPeriod);
    if (!selectedOption) return;

    onCreateInvoice({
      engagementId: engagement.id,
      year: selectedOption.year,
      month: selectedOption.month,
      items: validItems.map(item => ({
        description: item.description,
        amount: Number(item.amount),
        hours: item.hours ? Number(item.hours) : null,
        hourly_rate: item.hourlyRate ? Number(item.hourlyRate) : null,
        currency: item.currency,
        is_reverse_charge: item.isReverseCharge,
        service_id: item.serviceId,
      })),
    });
    onOpenChange(false);
  };

  const selectedOption = periodOptions.find(p => p.value === selectedPeriod);
  const isPastMonth = selectedOption && (
    selectedOption.year < new Date().getFullYear() ||
    (selectedOption.year === new Date().getFullYear() && selectedOption.month < new Date().getMonth() + 1)
  );

  const validItemsCount = items.filter(item => item.description && item.amount && Number(item.amount) > 0).length;
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vytvořit fakturu
          </DialogTitle>
          <DialogDescription>
            Zkontrolujte a upravte položky faktury pro zakázku <span className="font-medium text-foreground">{engagement.name}</span> ({client.brand_name})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="period" className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Období fakturace
            </Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Vyberte období" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="capitalize">{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPastMonth && (
              <p className="text-xs text-amber-600">
                Vytváříte fakturu za minulé období - toto je záložní možnost pro případ omylem smazané faktury.
              </p>
            )}
          </div>

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <Label className="text-sm font-medium">Položky faktury ({items.length})</Label>
            
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-3">
                {items.map((item, index) => {
                  const isCalculated = !item.isAmountManual && item.hours && item.hourlyRate;
                  
                  return (
                    <Card key={item.id} className="p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {item.serviceName || `Položka ${index + 1}`}
                        </span>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Popis položky"
                          className="text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Hodiny</Label>
                          <Input
                            type="number"
                            value={item.hours}
                            onChange={(e) => handleHoursOrRateChange(item.id, 'hours', e.target.value)}
                            placeholder="Volitelné"
                            min={0}
                            step={0.5}
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Sazba</Label>
                          <Input
                            type="number"
                            value={item.hourlyRate}
                            onChange={(e) => handleHoursOrRateChange(item.id, 'hourlyRate', e.target.value)}
                            placeholder="Volitelné"
                            min={0}
                            className="text-sm h-8"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            Částka
                            {isCalculated && (
                              <span className="flex items-center gap-0.5 text-muted-foreground">
                                <Calculator className="h-3 w-3" />
                              </span>
                            )}
                          </Label>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleAmountChange(item.id, e.target.value)}
                            placeholder="0"
                            min={0}
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Měna</Label>
                          <Select value={item.currency} onValueChange={(v) => updateItem(item.id, { currency: v })}>
                            <SelectTrigger className="h-8 text-sm">
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

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`reverseCharge-${item.id}`}
                          checked={item.isReverseCharge}
                          onCheckedChange={(checked) => updateItem(item.id, { isReverseCharge: checked === true })}
                        />
                        <Label
                          htmlFor={`reverseCharge-${item.id}`}
                          className="text-xs font-normal cursor-pointer text-muted-foreground"
                        >
                          Přenesená DPH
                        </Label>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={addEmptyItem}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Přidat položku
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            Celkem: <span className="font-semibold text-foreground">{totalAmount.toLocaleString('cs-CZ')} {items[0]?.currency || 'CZK'}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={validItemsCount === 0}
            >
              Vytvořit fakturu ({validItemsCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
