import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useCRMData } from '@/hooks/useCRMData';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cs } from 'date-fns/locale';
import type { ExtraWork } from '@/types/crm';

interface AddExtraWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: Omit<ExtraWork, 'id' | 'created_at' | 'updated_at' | 'status' | 'approval_date' | 'approved_by' | 'invoice_id' | 'invoice_number' | 'invoiced_at'>) => void;
}

export function AddExtraWorkDialog({ open, onOpenChange, onAdd }: AddExtraWorkDialogProps) {
  const { engagements, colleagues, getClientById } = useCRMData();
  const { toast } = useToast();
  
  const [engagementId, setEngagementId] = useState('');
  const [colleagueId, setColleagueId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [workDate, setWorkDate] = useState<Date | undefined>(new Date());
  const [billingPeriod, setBillingPeriod] = useState('');
  const [notes, setNotes] = useState('');

  // Calculated amount
  const calculatedAmount = useMemo(() => {
    const hours = parseFloat(hoursWorked) || 0;
    const rate = parseFloat(hourlyRate) || 0;
    return Math.round(hours * rate);
  }, [hoursWorked, hourlyRate]);

  // Get active engagements
  const activeEngagements = useMemo(() => 
    engagements.filter(e => e.status === 'active'),
    [engagements]
  );

  // Get client from selected engagement
  const selectedEngagement = useMemo(() => 
    engagements.find(e => e.id === engagementId),
    [engagements, engagementId]
  );

  const client = useMemo(() => 
    selectedEngagement ? getClientById(selectedEngagement.client_id) : null,
    [selectedEngagement, getClientById]
  );

  const activeColleagues = useMemo(() => 
    colleagues.filter(c => c.status === 'active'),
    [colleagues]
  );

  const handleSubmit = () => {
    if (!engagementId || !colleagueId || !name || !workDate || !selectedEngagement) return;

    const effectiveBillingPeriod = billingPeriod || format(workDate, 'yyyy-MM');

    onAdd({
      client_id: selectedEngagement.client_id,
      engagement_id: engagementId,
      colleague_id: colleagueId,
      name,
      description,
      amount: calculatedAmount,
      currency: 'CZK',
      hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      work_date: format(workDate, 'yyyy-MM-dd'),
      billing_period: effectiveBillingPeriod,
      notes,
    });

    toast({
      title: 'Vícepráce přidána',
      description: `Vícepráce "${name}" byla úspěšně vytvořena.`,
    });

    // Reset form
    setEngagementId('');
    setColleagueId('');
    setName('');
    setDescription('');
    setHoursWorked('');
    setHourlyRate('');
    setWorkDate(new Date());
    setBillingPeriod('');
    setNotes('');
    onOpenChange(false);
  };

  // Engagement is required, colleague, name, and date are required
  const isValid = engagementId && colleagueId && name && workDate && (hoursWorked && hourlyRate);

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Přidat vícepráci</DialogTitle>
          <DialogDescription>
            Vytvořte novou vícepráci navázanou na zakázku.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="engagement">Zakázka *</Label>
            <Select value={engagementId} onValueChange={setEngagementId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte zakázku" />
              </SelectTrigger>
              <SelectContent>
                {activeEngagements.map(eng => {
                  const engClient = getClientById(eng.client_id);
                  return (
                    <SelectItem key={eng.id} value={eng.id}>
                      {eng.name} ({engClient?.brand_name})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Show client as readonly info */}
          {client && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Klient</Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm">
                {client.brand_name}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="colleague">Kolega *</Label>
            <Select 
              value={colleagueId} 
              onValueChange={setColleagueId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte kolegu" />
              </SelectTrigger>
              <SelectContent>
                {activeColleagues.map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.full_name} ({col.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Název *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Např. Extra kampaň Black Friday"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailní popis práce..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="hours">Hodiny *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="8"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">Sazba (Kč/h) *</Label>
              <Input
                id="rate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="1500"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Částka</Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm font-semibold">
                {formatCurrency(calculatedAmount)}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Datum práce *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !workDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {workDate ? format(workDate, "d. MMMM yyyy", { locale: cs }) : "Vyberte datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={workDate}
                  onSelect={setWorkDate}
                  initialFocus
                  className="pointer-events-auto"
                  locale={cs}
                />
            </PopoverContent>
          </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Fakturační období</Label>
            <Select value={billingPeriod || (workDate ? format(workDate, 'yyyy-MM') : '')} onValueChange={setBillingPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Automaticky dle data práce" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-10">Říjen 2024</SelectItem>
                <SelectItem value="2024-11">Listopad 2024</SelectItem>
                <SelectItem value="2024-12">Prosinec 2024</SelectItem>
                <SelectItem value="2025-01">Leden 2025</SelectItem>
                <SelectItem value="2025-02">Únor 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interní poznámky..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Přidat vícepráci
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}