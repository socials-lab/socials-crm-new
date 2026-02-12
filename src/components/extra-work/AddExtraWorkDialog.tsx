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
import { TrendingUp, Info } from 'lucide-react';
import type { ExtraWork } from '@/types/crm';

const EXTRA_WORK_TEMPLATES = [
  { name: 'Nastavení analytiky', rate: 1900 },
  { name: 'Tvorba videí', rate: 1600 },
];

const HOURLY_RATE_CHEATSHEET = [
  { position: 'Meta Ads', rate: 1800 },
  { position: 'PPC', rate: 1800 },
  { position: 'Analytika', rate: 1900 },
  { position: 'Grafika / video', rate: 1500 },
  { position: 'SEO', rate: 1500 },
  { position: 'Tvorba landing pages pomocí AI', rate: 2500 },
  { position: 'AI SEO', rate: 1900 },
];

function getRateForPosition(position: string): number | null {
  const p = position.toLowerCase();
  if (p.includes('ai seo')) return 1900;
  if (p.includes('landing') || (p.includes('ai') && !p.includes('seo'))) return 2500;
  if (p.includes('meta') || p.includes('facebook') || p.includes('socials')) return 1800;
  if (p.includes('ppc') || p.includes('google') || p.includes('search')) return 1800;
  if (p.includes('analytik') || p.includes('analytics') || p.includes('analytika')) return 1900;
  if (p.includes('grafi') || p.includes('video') || p.includes('design')) return 1500;
  if (p.includes('seo')) return 1500;
  return null;
}

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
  const [notes, setNotes] = useState('');
  const [upsoldById, setUpsoldById] = useState<string | null>(null);

  const calculatedAmount = useMemo(() => {
    const hours = parseFloat(hoursWorked) || 0;
    const rate = parseFloat(hourlyRate) || 0;
    return Math.round(hours * rate);
  }, [hoursWorked, hourlyRate]);

  const activeEngagements = useMemo(() => 
    engagements.filter(e => e.status === 'active'),
    [engagements]
  );

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

  const handleTemplateClick = (template: typeof EXTRA_WORK_TEMPLATES[0]) => {
    setName(template.name);
    setHourlyRate(String(template.rate));
  };

  const handleSubmit = () => {
    if (!engagementId || !colleagueId || !name || !selectedEngagement) return;

    const today = new Date();

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
      work_date: format(today, 'yyyy-MM-dd'),
      billing_period: format(today, 'yyyy-MM'),
      notes,
      upsold_by_id: upsoldById,
      upsell_commission_percent: upsoldById ? 10 : null,
      approval_token: null,
      client_approval_email: null,
      client_approved_at: null,
      client_rejected_at: null,
      client_rejection_reason: null,
    });

    toast({
      title: 'Vícepráce přidána',
      description: `Vícepráce "${name}" byla úspěšně vytvořena.`,
    });

    setEngagementId('');
    setColleagueId('');
    setName('');
    setDescription('');
    setHoursWorked('');
    setHourlyRate('');
    setNotes('');
    setUpsoldById(null);
    onOpenChange(false);
  };

  const isValid = engagementId && colleagueId && name && hoursWorked && hourlyRate;

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
            <Select value={colleagueId} onValueChange={(val) => {
              setColleagueId(val);
              const col = activeColleagues.find(c => c.id === val);
              if (col) {
                const rate = getRateForPosition(col.position);
                if (rate !== null) setHourlyRate(String(rate));
              }
            }}>
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

          {/* Templates */}
          <div className="grid gap-2">
            <Label>Vzory vícepráce</Label>
            <div className="flex flex-wrap gap-2">
              {EXTRA_WORK_TEMPLATES.map(t => (
                <Button
                  key={t.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateClick(t)}
                  className="text-xs"
                >
                  {t.name} ({formatCurrency(t.rate)}/h)
                </Button>
              ))}
            </div>
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs">💰 Částka klient</Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm font-semibold">
                {formatCurrency(calculatedAmount)}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs">🧑‍💻 Odměna kolega</Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm font-semibold">
                {(() => {
                  const col = activeColleagues.find(c => c.id === colleagueId);
                  const hours = parseFloat(hoursWorked) || 0;
                  if (col?.internal_hourly_cost && hours > 0) {
                    return formatCurrency(Math.round(hours * col.internal_hourly_cost));
                  }
                  return '—';
                })()}
              </div>
            </div>
          </div>

          {/* Hourly rate cheatsheet - always visible */}
          <div className="rounded-md border text-xs">
            <div className="px-3 py-1.5 bg-muted/50 border-b font-medium flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              Sazby dle pozice
            </div>
            <div className="grid grid-cols-2 gap-x-4 px-3 py-2">
              {HOURLY_RATE_CHEATSHEET.map(item => (
                <div key={item.position} className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">{item.position}</span>
                  <span className="font-medium">{formatCurrency(item.rate)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upsell section */}
          <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <Label className="font-medium">Upsell (volitelné)</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="upsold-by" className="text-sm text-muted-foreground">Prodal kolega</Label>
              <Select 
                value={upsoldById || ''} 
                onValueChange={(val) => setUpsoldById(val === 'none' ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Žádný upsell" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Žádný upsell</SelectItem>
                  {activeColleagues.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {upsoldById && calculatedAmount > 0 && (
              <p className="text-sm text-green-600 font-medium">
                💰 Provize 10%: {formatCurrency(Math.round(calculatedAmount * 0.1))}
              </p>
            )}
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
