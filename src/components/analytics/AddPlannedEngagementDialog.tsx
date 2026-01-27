import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon, Plus, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { PlannedEngagement } from '@/hooks/usePlannedEngagements';
import { Colleague } from '@/types/crm';

interface AddPlannedEngagementDialogProps {
  colleagues: Colleague[];
  onAdd: (engagement: Omit<PlannedEngagement, 'id' | 'created_at'>) => void;
  defaultStartDate?: Date;
}

export function AddPlannedEngagementDialog({ 
  colleagues, 
  onAdd, 
  defaultStartDate 
}: AddPlannedEngagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [selectedColleagues, setSelectedColleagues] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [probability, setProbability] = useState(100);

  const activeColleagues = colleagues.filter(c => c.status === 'active');

  const handleSubmit = () => {
    if (!name.trim() || !clientName.trim() || !monthlyFee || !startDate) return;

    onAdd({
      name: name.trim(),
      client_name: clientName.trim(),
      monthly_fee: parseFloat(monthlyFee),
      start_date: startDate.toISOString(),
      assigned_colleague_ids: selectedColleagues,
      notes: notes.trim(),
      probability_percent: probability,
    });

    // Reset form
    setName('');
    setClientName('');
    setMonthlyFee('');
    setStartDate(defaultStartDate);
    setSelectedColleagues([]);
    setNotes('');
    setProbability(100);
    setOpen(false);
  };

  const toggleColleague = (id: string) => {
    setSelectedColleagues(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const isValid = name.trim() && clientName.trim() && monthlyFee && startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Přidat plánovanou zakázku
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nová plánovaná zakázka</DialogTitle>
          <DialogDescription>
            Přidejte zakázku, o které víte, že začne v budoucnu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client name */}
          <div className="space-y-2">
            <Label htmlFor="client_name">Název klienta *</Label>
            <Input
              id="client_name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="např. NewCorp s.r.o."
            />
          </div>

          {/* Engagement name */}
          <div className="space-y-2">
            <Label htmlFor="name">Název zakázky *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. PPC Management"
            />
          </div>

          {/* Monthly fee */}
          <div className="space-y-2">
            <Label htmlFor="monthly_fee">Měsíční fee (CZK) *</Label>
            <Input
              id="monthly_fee"
              type="number"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              placeholder="např. 50000"
            />
          </div>

          {/* Start date */}
          <div className="space-y-2">
            <Label>Datum zahájení *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Probability */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pravděpodobnost</Label>
              <span className="text-sm font-medium">{probability}%</span>
            </div>
            <Slider
              value={[probability]}
              onValueChange={([value]) => setProbability(value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Ovlivní výpočet očekávaného MRR
            </p>
          </div>

          {/* Assigned colleagues */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Přiřazení kolegové
            </Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {activeColleagues.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádní aktivní kolegové</p>
              ) : (
                activeColleagues.map(colleague => (
                  <div key={colleague.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={colleague.id}
                      checked={selectedColleagues.includes(colleague.id)}
                      onCheckedChange={() => toggleColleague(colleague.id)}
                    />
                    <label 
                      htmlFor={colleague.id} 
                      className="text-sm cursor-pointer flex-1"
                    >
                      {colleague.full_name}
                      <span className="text-muted-foreground ml-1">
                        ({colleague.position})
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Volitelné poznámky..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Přidat zakázku
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
