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
import { Palette } from 'lucide-react';
import { getRewardPerCredit, setRewardPerCredit } from '@/data/creativeBoostRewardsMockData';
import type { EngagementAssignment, CostModel } from '@/types/crm';

// Extended cost model including per_credit for Creative Boost
type ExtendedCostModel = CostModel | 'per_credit';

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: EngagementAssignment;
  colleagueName: string;
  isCreativeBoostService?: boolean;
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
  isCreativeBoostService = false,
  onSave,
}: EditAssignmentDialogProps) {
  // Check if this assignment has per-credit reward configured
  const existingPerCreditReward = getRewardPerCredit(assignment.id);
  const hasPerCreditReward = existingPerCreditReward !== 80 || isCreativeBoostService;
  
  const [costModel, setCostModel] = useState<ExtendedCostModel>(
    hasPerCreditReward && isCreativeBoostService ? 'per_credit' : assignment.cost_model
  );
  const [hourlyCost, setHourlyCost] = useState<string>(
    assignment.hourly_cost?.toString() || ''
  );
  const [monthlyCost, setMonthlyCost] = useState<string>(
    assignment.monthly_cost?.toString() || ''
  );
  const [percentageOfRevenue, setPercentageOfRevenue] = useState<string>(
    assignment.percentage_of_revenue?.toString() || ''
  );
  const [perCreditReward, setPerCreditReward] = useState<string>(
    existingPerCreditReward.toString()
  );
  const [roleOnEngagement, setRoleOnEngagement] = useState<string>(
    assignment.role_on_engagement || ''
  );

  // Reset form when assignment changes
  useEffect(() => {
    const reward = getRewardPerCredit(assignment.id);
    const hasReward = reward !== 80 || isCreativeBoostService;
    
    setCostModel(hasReward && isCreativeBoostService ? 'per_credit' : assignment.cost_model);
    setHourlyCost(assignment.hourly_cost?.toString() || '');
    setMonthlyCost(assignment.monthly_cost?.toString() || '');
    setPercentageOfRevenue(assignment.percentage_of_revenue?.toString() || '');
    setPerCreditReward(reward.toString());
    setRoleOnEngagement(assignment.role_on_engagement || '');
  }, [assignment, isCreativeBoostService]);

  const handleSave = () => {
    // If per_credit model, save to mock data and use fixed_monthly as DB model
    if (costModel === 'per_credit') {
      const reward = parseFloat(perCreditReward) || 80;
      setRewardPerCredit(assignment.id, reward);
      
      onSave({
        cost_model: 'fixed_monthly', // Store as fixed_monthly in DB
        hourly_cost: null,
        monthly_cost: null, // Will be calculated from credits * reward
        percentage_of_revenue: null,
        role_on_engagement: roleOnEngagement,
      });
    } else {
      onSave({
        cost_model: costModel as CostModel,
        hourly_cost: costModel === 'hourly' ? parseFloat(hourlyCost) || null : null,
        monthly_cost: costModel === 'fixed_monthly' ? parseFloat(monthlyCost) || null : null,
        percentage_of_revenue: costModel === 'percentage' ? parseFloat(percentageOfRevenue) || null : null,
        role_on_engagement: roleOnEngagement,
      });
    }
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
            <Label>Model odměny</Label>
            <Select value={costModel} onValueChange={(v) => setCostModel(v as ExtendedCostModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_monthly">Fixní měsíčně</SelectItem>
                <SelectItem value="hourly">Hodinová sazba</SelectItem>
                <SelectItem value="percentage">Procenta z revenue</SelectItem>
                {isCreativeBoostService && (
                  <SelectItem value="per_credit">
                    <span className="flex items-center gap-2">
                      <Palette className="h-3.5 w-3.5" />
                      Odměna za kredit (Creative Boost)
                    </span>
                  </SelectItem>
                )}
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
              <Label>Měsíční odměna (Kč)</Label>
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

          {costModel === 'per_credit' && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Palette className="h-4 w-4 text-primary" />
                Creative Boost odměna
              </div>
              <div className="space-y-2">
                <Label>Odměna za kredit (Kč)</Label>
                <Input
                  type="number"
                  min={0}
                  value={perCreditReward}
                  onChange={(e) => setPerCreditReward(e.target.value)}
                  placeholder="80"
                />
                <p className="text-xs text-muted-foreground">
                  Kolega dostane tuto částku za každý odpracovaný kredit. Doporučená hodnota: 80 Kč
                </p>
              </div>
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
