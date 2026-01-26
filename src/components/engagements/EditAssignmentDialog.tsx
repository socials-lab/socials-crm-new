import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EngagementAssignment, CostModel } from '@/types/crm';

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: EngagementAssignment;
  colleagueName: string;
  onSave: (data: {
    cost_model: CostModel;
    hourly_cost: number | null;
    monthly_cost: number | null;
    percentage_of_revenue: number | null;
    role_on_engagement: string;
  }) => void;
}

export function EditAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  colleagueName,
  onSave,
}: EditAssignmentDialogProps) {
  const [costModel, setCostModel] = useState<CostModel>(assignment.cost_model);
  const [hourlyCost, setHourlyCost] = useState<string>(
    assignment.hourly_cost?.toString() || ''
  );
  const [monthlyCost, setMonthlyCost] = useState<string>(
    assignment.monthly_cost?.toString() || ''
  );
  const [percentageOfRevenue, setPercentageOfRevenue] = useState<string>(
    assignment.percentage_of_revenue?.toString() || ''
  );
  const [roleOnEngagement, setRoleOnEngagement] = useState<string>(
    assignment.role_on_engagement || ''
  );

  // Reset form when assignment changes
  useEffect(() => {
    setCostModel(assignment.cost_model);
    setHourlyCost(assignment.hourly_cost?.toString() || '');
    setMonthlyCost(assignment.monthly_cost?.toString() || '');
    setPercentageOfRevenue(assignment.percentage_of_revenue?.toString() || '');
    setRoleOnEngagement(assignment.role_on_engagement || '');
  }, [assignment]);

  const handleSave = () => {
    onSave({
      cost_model: costModel,
      hourly_cost: costModel === 'hourly' ? parseFloat(hourlyCost) || null : null,
      monthly_cost: costModel === 'fixed_monthly' ? parseFloat(monthlyCost) || null : null,
      percentage_of_revenue: costModel === 'percentage' ? parseFloat(percentageOfRevenue) || null : null,
      role_on_engagement: roleOnEngagement,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upravit odměnu</DialogTitle>
          <p className="text-sm text-muted-foreground">{colleagueName}</p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role na zakázce</Label>
            <Input
              value={roleOnEngagement}
              onChange={(e) => setRoleOnEngagement(e.target.value)}
              placeholder="Account Manager, Specialist..."
            />
          </div>

          <div className="space-y-2">
            <Label>Model nákladů</Label>
            <Select value={costModel} onValueChange={(v) => setCostModel(v as CostModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_monthly">Fixní měsíčně</SelectItem>
                <SelectItem value="hourly">Hodinová sazba</SelectItem>
                <SelectItem value="percentage">Procenta z revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {costModel === 'hourly' && (
            <div className="space-y-2">
              <Label>Hodinová sazba (Kč)</Label>
              <Input
                type="number"
                min={0}
                value={hourlyCost}
                onChange={(e) => setHourlyCost(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {costModel === 'fixed_monthly' && (
            <div className="space-y-2">
              <Label>Měsíční náklad (Kč)</Label>
              <Input
                type="number"
                min={0}
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {costModel === 'percentage' && (
            <div className="space-y-2">
              <Label>Procenta z revenue (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={percentageOfRevenue}
                onChange={(e) => setPercentageOfRevenue(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave}>
            Uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
