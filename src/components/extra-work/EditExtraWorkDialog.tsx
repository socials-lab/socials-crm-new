import { useState, useMemo, useEffect } from 'react';
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
import type { ExtraWork } from '@/types/crm';

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

interface EditExtraWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraWork: ExtraWork;
  onSave: (id: string, data: Partial<ExtraWork>) => void;
}

export function EditExtraWorkDialog({ open, onOpenChange, extraWork, onSave }: EditExtraWorkDialogProps) {
  const { colleagues } = useCRMData();
  const { toast } = useToast();

  const [colleagueId, setColleagueId] = useState(extraWork.colleague_id);
  const [name, setName] = useState(extraWork.name);
  const [description, setDescription] = useState(extraWork.description);
  const [hoursWorked, setHoursWorked] = useState(extraWork.hours_worked?.toString() || '');
  const [hourlyRate, setHourlyRate] = useState(extraWork.hourly_rate?.toString() || '');
  const [notes, setNotes] = useState(extraWork.notes);

  useEffect(() => {
    if (open) {
      setColleagueId(extraWork.colleague_id);
      setName(extraWork.name);
      setDescription(extraWork.description);
      setHoursWorked(extraWork.hours_worked?.toString() || '');
      setHourlyRate(extraWork.hourly_rate?.toString() || '');
      setNotes(extraWork.notes);
    }
  }, [open, extraWork]);

  const calculatedAmount = useMemo(() => {
    const hours = parseFloat(hoursWorked) || 0;
    const rate = parseFloat(hourlyRate) || 0;
    return Math.round(hours * rate);
  }, [hoursWorked, hourlyRate]);

  const activeColleagues = useMemo(() =>
    colleagues.filter(c => c.status === 'active'),
    [colleagues]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const handleSubmit = () => {
    if (!colleagueId || !name) return;

    onSave(extraWork.id, {
      colleague_id: colleagueId,
      name,
      description,
      hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      amount: calculatedAmount,
      notes,
    });

    toast({
      title: 'Vícepráce upravena',
      description: `Vícepráce "${name}" byla úspěšně aktualizována.`,
    });

    onOpenChange(false);
  };

  const isValid = colleagueId && name && hoursWorked && hourlyRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upravit vícepráci</DialogTitle>
          <DialogDescription>
            Změňte detaily vícepráce. Nelze editovat vyfakturované vícepráce.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Kolega *</Label>
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

          <div className="grid gap-2">
            <Label>Název *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Popis</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Hodiny *</Label>
              <Input type="number" step="0.5" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Sazba (Kč/h) *</Label>
              <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Částka</Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm font-semibold">
                {formatCurrency(calculatedAmount)}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Poznámky</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>Uložit změny</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
