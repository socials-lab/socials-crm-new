import { useState, useEffect } from 'react';
import { toNullableNumber } from '@/lib/dbNormalize';
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
import type { EngagementAssignment, CostModel } from '@/types/crm';

// Default reward per credit when not configured
const DEFAULT_REWARD_PER_CREDIT = 80;
const PER_CREDIT_ROLES = ['Graphic Designer', 'Video Editor'] as const;
const ASSIGNMENT_ROLE_OPTIONS = [
  'Meta Ads Specialist',
  'PPC Specialist',
  'Graphic Designer',
  'Video Editor',
  'Sales Specialist',
  'Account Manager',
] as const;

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
    reward_per_credit: number | null;
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
  // Get reward from assignment (database) instead of mock data
  const existingPerCreditReward = assignment.reward_per_credit ?? DEFAULT_REWARD_PER_CREDIT;
  const hasPerCreditReward = assignment.reward_per_credit !== null || isCreativeBoostService;

  const [costModel, setCostModel] = useState<ExtendedCostModel>(
    hasPerCreditReward ? 'per_credit' : assignment.cost_model
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
    const reward = assignment.reward_per_credit ?? DEFAULT_REWARD_PER_CREDIT;
    const hasReward = assignment.reward_per_credit !== null || isCreativeBoostService;

    setCostModel(hasReward ? 'per_credit' : assignment.cost_model);
    setHourlyCost(assignment.hourly_cost?.toString() || '');
    setMonthlyCost(assignment.monthly_cost?.toString() || '');
    setPercentageOfRevenue(assignment.percentage_of_revenue?.toString() || '');
    setPerCreditReward(reward.toString());
    setRoleOnEngagement(assignment.role_on_engagement || '');
  }, [assignment, isCreativeBoostService]);

  useEffect(() => {
    if (!roleOnEngagement) return;
    const shouldUsePerCredit = PER_CREDIT_ROLES.includes(roleOnEngagement as typeof PER_CREDIT_ROLES[number]);
    if (shouldUsePerCredit && costModel !== 'per_credit') {
      setCostModel('per_credit');
      return;
    }
    if (!shouldUsePerCredit && costModel === 'per_credit') {
      setCostModel('fixed_monthly');
    }
  }, [roleOnEngagement, costModel]);

  const handleSave = () => {
    // If per_credit model, save reward_per_credit to DB
    if (costModel === 'per_credit') {
      const reward = toNullableNumber(perCreditReward) ?? DEFAULT_REWARD_PER_CREDIT;

      onSave({
        cost_model: 'fixed_monthly', // Store as fixed_monthly in DB
        hourly_cost: null,
        monthly_cost: null, // Will be calculated from credits * reward
        percentage_of_revenue: null,
        reward_per_credit: reward,
        role_on_engagement: roleOnEngagement,
      });
    } else {
      onSave({
        cost_model: costModel as CostModel,
        hourly_cost: costModel === 'hourly' ? toNullableNumber(hourlyCost) : null,
        monthly_cost: costModel === 'fixed_monthly' ? toNullableNumber(monthlyCost) : null,
        percentage_of_revenue: costModel === 'percentage' ? toNullableNumber(percentageOfRevenue) : null,
        reward_per_credit: null,
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
            <Select value={roleOnEngagement} onValueChange={setRoleOnEngagement}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte roli" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
                {roleOnEngagement && !ASSIGNMENT_ROLE_OPTIONS.includes(roleOnEngagement as typeof ASSIGNMENT_ROLE_OPTIONS[number]) && (
                  <SelectItem value={roleOnEngagement}>
                    {roleOnEngagement}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
                <SelectItem value="per_credit">
                  <span className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5" />
                    Odměna za kredit
                  </span>
                </SelectItem>
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
                Odměna za kredit
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
                  Pro roli Graphic Designer / Video Editor se odměna počítá za každý odpracovaný kredit.
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
