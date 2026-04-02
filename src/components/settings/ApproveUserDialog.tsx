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
import { Loader2, ShieldCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { invokeWithTimeout } from '@/lib/supabaseUtils';

type AppRole = Database['public']['Enums']['app_role'];

interface PendingUser {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface ApproveUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PendingUser | null;
  onSuccess: () => void;
}

export function ApproveUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ApproveUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>('specialist');
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
    if (open && user) {
      setFullName(user.full_name || user.email || '');
      setRole('specialist');
      setPosition('');
      setSeniority('mid');
      setPhone('');
      setIsFreelancer(false);
      setHourlyCost('');
      setMonthlyFixedCost('');
      setCapacityHours('');
      setNotes('');
    }
  }, [open, user?.id]);

  async function handleSubmit() {
    if (!user) return;

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
      const { data, error } = await invokeWithTimeout<{ error?: string }>('approve-user', {
        body: {
          user_id: user.id,
          role,
          full_name: fullName.trim(),
          position: position.trim(),
          seniority,
          phone: phone || undefined,
          notes: notes || undefined,
          is_freelancer: isFreelancer,
          internal_hourly_cost: hourlyCost ? Number(hourlyCost) : undefined,
          monthly_fixed_cost: monthlyFixedCost ? Number(monthlyFixedCost) : undefined,
          capacity_hours_per_month: capacityHours ? Number(capacityHours) : undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Uživatel ${fullName.trim()} byl schválen`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Chyba při schvalování uživatele');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Schválit uživatele
          </DialogTitle>
          <DialogDescription>
            Přidělte roli a vyplňte údaje kolegy pro {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Identity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="approve_full_name">Jméno *</Label>
              <Input
                id="approve_full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan Novák"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email || ''} disabled className="bg-muted" />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role v CRM *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="specialist">Specialista</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position & details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="approve_position">Pozice *</Label>
              <Input
                id="approve_position"
                placeholder="Meta Ads Specialist"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approve_phone">Telefon</Label>
              <Input
                id="approve_phone"
                type="tel"
                placeholder="+420 602 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Seniority</Label>
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
                  id="approve_freelancer"
                  checked={isFreelancer}
                  onCheckedChange={(checked) => setIsFreelancer(checked === true)}
                />
                <Label htmlFor="approve_freelancer" className="cursor-pointer">
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
                <Label htmlFor="approve_hourly_cost">Hodinová sazba (CZK)</Label>
                <Input
                  id="approve_hourly_cost"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={hourlyCost}
                  onChange={(e) => setHourlyCost(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approve_monthly_cost">Fixní měsíční náklad</Label>
                <Input
                  id="approve_monthly_cost"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={monthlyFixedCost}
                  onChange={(e) => setMonthlyFixedCost(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approve_capacity">Kapacita (hod/měs)</Label>
                <Input
                  id="approve_capacity"
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
            <Label htmlFor="approve_notes">Poznámky</Label>
            <Textarea
              id="approve_notes"
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
                Schvalování...
              </>
            ) : (
              'Schválit a přidat'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
