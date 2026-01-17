import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreateColleagueForUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    profileId: string;
    email: string;
    fullName: string;
  };
  onSuccess: () => void;
}

export function CreateColleagueForUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: CreateColleagueForUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [seniority, setSeniority] = useState<'junior' | 'mid' | 'senior' | 'partner'>('mid');
  const [phone, setPhone] = useState('');
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [hourlyCost, setHourlyCost] = useState('');
  const [monthlyFixedCost, setMonthlyFixedCost] = useState('');
  const [capacityHours, setCapacityHours] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (open) {
      setFullName(user.fullName);
      setPosition('');
      setSeniority('mid');
      setPhone('');
      setIsFreelancer(false);
      setHourlyCost('');
      setMonthlyFixedCost('');
      setCapacityHours('');
      setNotes('');
    }
  }, [open, user.profileId, user.fullName]);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Jméno je povinné');
      return;
    }

    if (!position.trim()) {
      toast.error('Pozice je povinná');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const colleagueData = {
        full_name: fullName.trim(),
        email: user.email,
        phone: phone || null,
        position: position.trim(),
        seniority,
        status: 'active',
        is_freelancer: isFreelancer,
        internal_hourly_cost: hourlyCost ? Number(hourlyCost) : 0,
        monthly_fixed_cost: monthlyFixedCost ? Number(monthlyFixedCost) : null,
        capacity_hours_per_month: capacityHours ? Number(capacityHours) : null,
        notes: notes || '',
        profile_id: user.profileId,
        birthday: null,
      };

      const { error } = await supabase
        .from('colleagues')
        .insert(colleagueData);
      
      if (error) {
        throw error;
      }
      
      toast.success('Kolega byl vytvořen a propojen s uživatelem');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFullName('');
      setPosition('');
      setSeniority('mid');
      setPhone('');
      setIsFreelancer(false);
      setHourlyCost('');
      setMonthlyFixedCost('');
      setCapacityHours('');
      setNotes('');
    } catch (error) {
      console.error('Error creating colleague:', error);
      const message = error instanceof Error ? error.message : 'Nepodařilo se vytvořit kolegu';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vytvořit kolegu pro uživatele</DialogTitle>
          <DialogDescription>
            Vytvořte kolegu a automaticky ho propojte s uživatelským účtem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pre-filled fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Jméno *</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan Novák"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+420 602 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Pozice *</Label>
              <Input
                id="position"
                placeholder="Meta Ads Specialist"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seniority">Seniority</Label>
              <Select value={seniority} onValueChange={(v) => setSeniority(v as typeof seniority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-3 h-10">
                <Checkbox
                  id="is_freelancer"
                  checked={isFreelancer}
                  onCheckedChange={(checked) => setIsFreelancer(checked === true)}
                />
                <Label htmlFor="is_freelancer" className="cursor-pointer">
                  Freelancer
                </Label>
              </div>
            </div>
          </div>

          {/* Financial details */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Finanční údaje</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hourly_cost">Hodinová sazba (CZK)</Label>
                <Input
                  id="hourly_cost"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={hourlyCost}
                  onChange={(e) => setHourlyCost(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_cost">Fixní měsíční náklad</Label>
                <Input
                  id="monthly_cost"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={monthlyFixedCost}
                  onChange={(e) => setMonthlyFixedCost(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapacita (hod/měs)</Label>
                <Input
                  id="capacity"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={capacityHours}
                  onChange={(e) => setCapacityHours(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              placeholder="Interní poznámky..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !position.trim() || !fullName.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vytváření...
              </>
            ) : (
              'Vytvořit kolegu'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
