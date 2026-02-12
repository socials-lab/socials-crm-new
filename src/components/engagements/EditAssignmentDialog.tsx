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
import { Palette, Image, Video } from 'lucide-react';
import { getRewards, setRewards, type CreativeBoostRewards } from '@/data/creativeBoostRewardsMockData';
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
  const existingRewards = getRewards(assignment.id);
  const hasPerCreditReward = isCreativeBoostService;
  
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
  const [bannerReward, setBannerReward] = useState<string>(
    existingRewards.bannerRewardPerCredit.toString()
  );
  const [videoReward, setVideoReward] = useState<string>(
    existingRewards.videoRewardPerCredit.toString()
  );
  const [roleOnEngagement, setRoleOnEngagement] = useState<string>(
    assignment.role_on_engagement || ''
  );

  // Reset form when assignment changes
  useEffect(() => {
    const rewards = getRewards(assignment.id);
    const hasReward = isCreativeBoostService;
    
    setCostModel(hasReward && isCreativeBoostService ? 'per_credit' : assignment.cost_model);
    setHourlyCost(assignment.hourly_cost?.toString() || '');
    setMonthlyCost(assignment.monthly_cost?.toString() || '');
    setPercentageOfRevenue(assignment.percentage_of_revenue?.toString() || '');
    setBannerReward(rewards.bannerRewardPerCredit.toString());
    setVideoReward(rewards.videoRewardPerCredit.toString());
    setRoleOnEngagement(assignment.role_on_engagement || '');
  }, [assignment, isCreativeBoostService]);

  const handleSave = () => {
    // If per_credit model, save to mock data and use fixed_monthly as DB model
    if (costModel === 'per_credit') {
      const bReward = parseFloat(bannerReward) || 80;
      const vReward = parseFloat(videoReward) || 80;
      setRewards(assignment.id, { bannerRewardPerCredit: bReward, videoRewardPerCredit: vReward });
      
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
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Image className="h-3.5 w-3.5 text-blue-600" />
                    Bannery (Kč/kredit)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={bannerReward}
                    onChange={(e) => setBannerReward(e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Video className="h-3.5 w-3.5 text-purple-600" />
                    Videa (Kč/kredit)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={videoReward}
                    onChange={(e) => setVideoReward(e.target.value)}
                    placeholder="80"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Odměna za každý odpracovaný kredit dle typu výstupu.
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
