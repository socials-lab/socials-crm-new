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
import {
  ASSIGNMENT_ROLE_OPTIONS,
  canUsePerCreditCostModel,
  isPerCreditRole,
} from '@/lib/assignmentRoles';

// Default reward per credit when not configured
const DEFAULT_REWARD_PER_CREDIT = 80;
const DEFAULT_BANNER_REWARD_PER_CREDIT = 80;
const DEFAULT_VIDEO_REWARD_PER_CREDIT = 80;

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
    reward_per_credit_banner: number | null;
    reward_per_credit_video: number | null;
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
  const existingPerCreditReward = assignment.reward_per_credit ?? DEFAULT_REWARD_PER_CREDIT;
  const hasPersistedPerCreditReward = assignment.reward_per_credit !== null;
  const roleEligibleForPerCredit = isPerCreditRole(assignment.role_on_engagement);
  const canUsePerCreditForInitialRole = canUsePerCreditCostModel(assignment.role_on_engagement, isCreativeBoostService);

  const [costModel, setCostModel] = useState<ExtendedCostModel>(
    hasPersistedPerCreditReward || (roleEligibleForPerCredit && canUsePerCreditForInitialRole)
      ? 'per_credit'
      : assignment.cost_model
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
  const [perCreditReward, setPerCreditReward] = useState<string>(existingPerCreditReward.toString());
  const [bannerPerCreditReward, setBannerPerCreditReward] = useState<string>(
    (assignment.reward_per_credit_banner ?? assignment.reward_per_credit ?? DEFAULT_BANNER_REWARD_PER_CREDIT).toString()
  );
  const [videoPerCreditReward, setVideoPerCreditReward] = useState<string>(
    (assignment.reward_per_credit_video ?? assignment.reward_per_credit ?? DEFAULT_VIDEO_REWARD_PER_CREDIT).toString()
  );
  const [roleOnEngagement, setRoleOnEngagement] = useState<string>(
    assignment.role_on_engagement || ''
  );
  const canUsePerCreditForSelectedRole = canUsePerCreditCostModel(roleOnEngagement, isCreativeBoostService);
  const canShowPerCreditOption = hasPersistedPerCreditReward || canUsePerCreditForSelectedRole;

  function handleRoleChange(role: string) {
    setRoleOnEngagement(role);
    if (canUsePerCreditCostModel(role, isCreativeBoostService)) {
      setCostModel('per_credit');
      return;
    }
    if (!isPerCreditRole(role) && costModel === 'per_credit' && assignment.reward_per_credit === null) {
      setCostModel('fixed_monthly');
    }
  }

  // Reset form when assignment changes
  useEffect(() => {
    const reward = assignment.reward_per_credit ?? DEFAULT_REWARD_PER_CREDIT;
    const hasReward = assignment.reward_per_credit !== null;
    const canUsePerCredit = canUsePerCreditCostModel(assignment.role_on_engagement, isCreativeBoostService);
    const roleIsPerCredit = isPerCreditRole(assignment.role_on_engagement);

    setCostModel(hasReward || (roleIsPerCredit && canUsePerCredit) ? 'per_credit' : assignment.cost_model);
    setHourlyCost(assignment.hourly_cost?.toString() || '');
    setMonthlyCost(assignment.monthly_cost?.toString() || '');
    setPercentageOfRevenue(assignment.percentage_of_revenue?.toString() || '');
    setPerCreditReward(reward.toString());
    setBannerPerCreditReward(
      (assignment.reward_per_credit_banner ?? assignment.reward_per_credit ?? DEFAULT_BANNER_REWARD_PER_CREDIT).toString()
    );
    setVideoPerCreditReward(
      (assignment.reward_per_credit_video ?? assignment.reward_per_credit ?? DEFAULT_VIDEO_REWARD_PER_CREDIT).toString()
    );
    setRoleOnEngagement(assignment.role_on_engagement || '');
  }, [assignment, isCreativeBoostService]);

  const handleSave = () => {
    // If per_credit model, save reward_per_credit to DB
    if (costModel === 'per_credit') {
      if (!canShowPerCreditOption) {
        throw new Error('Model "Odměna za kredit" je dostupný pouze pro Creative Boost a role Graphic Designer/Video Editor.');
      }
      const bannerReward = toNullableNumber(bannerPerCreditReward);
      const videoReward = toNullableNumber(videoPerCreditReward);
      if (bannerReward === null) {
        throw new Error('Zadejte odměnu za kredit - Bannery.');
      }
      if (videoReward === null) {
        throw new Error('Zadejte odměnu za kredit - Videa.');
      }

      onSave({
        cost_model: 'fixed_monthly', // Store as fixed_monthly in DB
        hourly_cost: null,
        monthly_cost: null, // Will be calculated from credits * reward
        percentage_of_revenue: null,
        reward_per_credit: bannerReward,
        reward_per_credit_banner: bannerReward,
        reward_per_credit_video: videoReward,
        role_on_engagement: roleOnEngagement,
      });
    } else {
      onSave({
        cost_model: costModel as CostModel,
        hourly_cost: costModel === 'hourly' ? toNullableNumber(hourlyCost) : null,
        monthly_cost: costModel === 'fixed_monthly' ? toNullableNumber(monthlyCost) : null,
        percentage_of_revenue: costModel === 'percentage' ? toNullableNumber(percentageOfRevenue) : null,
        reward_per_credit: null,
        reward_per_credit_banner: null,
        reward_per_credit_video: null,
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
            <Select value={roleOnEngagement} onValueChange={handleRoleChange}>
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
            <Label>Model nákladů</Label>
            <Select value={costModel} onValueChange={(v) => setCostModel(v as ExtendedCostModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_monthly">Fixní měsíčně</SelectItem>
                <SelectItem value="hourly">Hodinová sazba</SelectItem>
                <SelectItem value="percentage">Procenta z revenue</SelectItem>
                {canShowPerCreditOption && (
                  <SelectItem value="per_credit">
                    <span className="flex items-center gap-2">
                      <Palette className="h-3.5 w-3.5" />
                    Za kredit (Creative Boost)
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!isCreativeBoostService && assignment.reward_per_credit === null && (
              <p className="text-xs text-muted-foreground">
                Model "Odměna za kredit" je dostupný jen u služby Creative Boost.
              </p>
            )}
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
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                <Palette className="h-4 w-4" />
                Odměna za kredit (Creative Boost)
              </div>
              <div className="space-y-2">
                <Label>Odměna za kredit - Bannery (CZK)</Label>
                <Input
                  type="number"
                  min={0}
                  value={bannerPerCreditReward}
                  onChange={(e) => setBannerPerCreditReward(e.target.value)}
                  placeholder="80"
                />
              </div>
              <div className="space-y-2">
                <Label>Odměna za kredit - Videa (CZK)</Label>
                <Input
                  type="number"
                  min={0}
                  value={videoPerCreditReward}
                  onChange={(e) => setVideoPerCreditReward(e.target.value)}
                  placeholder="80"
                />
              </div>
              <div className="hidden">
                <Label>Legacy reward_per_credit</Label>
                <Input
                  type="number"
                  min={0}
                  value={perCreditReward}
                  onChange={(e) => setPerCreditReward(e.target.value)}
                />
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
