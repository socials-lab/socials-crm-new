import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Colleague, EngagementAssignment, EngagementService } from '@/types/crm';
import { DEFAULT_BANNER_REWARD, DEFAULT_VIDEO_REWARD } from '@/data/creativeBoostRewardsMockData';
import { Palette } from 'lucide-react';

const CREATIVE_BOOST_SERVICE_ID = 'srv-3';

const assignmentSchema = z.object({
  colleague_id: z.string().min(1, 'Vyberte kolegu'),
  role_on_engagement: z.string().min(1, 'Role je povinná'),
  cost_model: z.enum(['hourly', 'fixed_monthly', 'percentage', 'per_credit'] as const),
  hourly_cost: z.coerce.number().min(0).nullable(),
  monthly_cost: z.coerce.number().min(0).nullable(),
  percentage_of_revenue: z.coerce.number().min(0).max(100).nullable(),
  banner_reward_per_credit: z.coerce.number().min(0).nullable(),
  video_reward_per_credit: z.coerce.number().min(0).nullable(),
  start_date: z.string().min(1, 'Datum je povinné'),
  notes: z.string(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export interface AssignmentFormSubmitData extends Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'> {
  _perCreditRewards?: {
    bannerRewardPerCredit: number;
    videoRewardPerCredit: number;
  };
}

interface AssignmentFormProps {
  engagementId: string;
  engagementServiceId?: string | null;
  colleagues: Colleague[];
  existingAssignments: EngagementAssignment[];
  engagementServices?: EngagementService[];
  onSubmit: (data: AssignmentFormSubmitData) => void;
  onCancel: () => void;
}

export function AssignmentForm({ 
  engagementId, 
  engagementServiceId,
  colleagues, 
  existingAssignments,
  engagementServices = [],
  onSubmit, 
  onCancel 
}: AssignmentFormProps) {
  // Check if engagement has a Creative Boost service
  const cbService = engagementServices.find(es => es.service_id === CREATIVE_BOOST_SERVICE_ID && es.is_active);
  const hasCreativeBoost = !!cbService;

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      colleague_id: '',
      role_on_engagement: '',
      cost_model: 'fixed_monthly',
      hourly_cost: null,
      monthly_cost: null,
      percentage_of_revenue: null,
      banner_reward_per_credit: DEFAULT_BANNER_REWARD,
      video_reward_per_credit: DEFAULT_VIDEO_REWARD,
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const costModel = form.watch('cost_model');
  const selectedColleagueId = form.watch('colleague_id');

  // Auto-detect designer position and switch to per_credit
  const selectedColleague = colleagues.find(c => c.id === selectedColleagueId);
  useEffect(() => {
    if (!hasCreativeBoost || !selectedColleague) return;
    const pos = selectedColleague.position.toLowerCase();
    if (pos.includes('design') || pos.includes('grafik') || pos.includes('video')) {
      form.setValue('cost_model', 'per_credit');
      form.setValue('role_on_engagement', 'Graphic Designer');
    }
  }, [selectedColleagueId, hasCreativeBoost, selectedColleague]);

  // Filter out already assigned colleagues
  const assignedColleagueIds = existingAssignments
    .filter(a => !a.end_date)
    .map(a => a.colleague_id);
  const availableColleagues = colleagues.filter(
    c => c.status === 'active' && !assignedColleagueIds.includes(c.id)
  );

  const handleSubmit = (data: AssignmentFormData) => {
    const isPerCredit = data.cost_model === 'per_credit';
    const submitData: AssignmentFormSubmitData = {
      engagement_id: engagementId,
      engagement_service_id: isPerCredit && cbService ? cbService.id : (engagementServiceId || null),
      colleague_id: data.colleague_id,
      role_on_engagement: data.role_on_engagement,
      cost_model: isPerCredit ? 'fixed_monthly' : data.cost_model as 'hourly' | 'fixed_monthly' | 'percentage',
      hourly_cost: data.cost_model === 'hourly' ? data.hourly_cost : null,
      monthly_cost: data.cost_model === 'fixed_monthly' ? data.monthly_cost : null,
      percentage_of_revenue: data.cost_model === 'percentage' ? data.percentage_of_revenue : null,
      start_date: data.start_date,
      end_date: null,
      notes: data.notes,
    };
    if (isPerCredit) {
      submitData._perCreditRewards = {
        bannerRewardPerCredit: data.banner_reward_per_credit ?? DEFAULT_BANNER_REWARD,
        videoRewardPerCredit: data.video_reward_per_credit ?? DEFAULT_VIDEO_REWARD,
      };
    }
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="colleague_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kolega</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kolegu" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableColleagues.map(colleague => (
                    <SelectItem key={colleague.id} value={colleague.id}>
                      {colleague.full_name} ({colleague.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableColleagues.length === 0 && (
                <p className="text-sm text-muted-foreground">Všichni kolegové jsou již přiřazeni</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role_on_engagement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role na zakázce</FormLabel>
              <FormControl>
                <Input placeholder="Account Manager, Specialist..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost_model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model nákladů</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fixed_monthly">Fixní měsíčně</SelectItem>
                  <SelectItem value="hourly">Hodinová sazba</SelectItem>
                  <SelectItem value="percentage">Procenta z revenue</SelectItem>
                  {hasCreativeBoost && (
                    <SelectItem value="per_credit">
                      <span className="flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5" />
                        Za kredit (Creative Boost)
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {costModel === 'hourly' && (
          <FormField
            control={form.control}
            name="hourly_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hodinová sazba (CZK)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    value={field.value ?? ''} 
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {costModel === 'fixed_monthly' && (
          <FormField
            control={form.control}
            name="monthly_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Měsíční náklad (CZK)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    value={field.value ?? ''} 
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {costModel === 'percentage' && (
          <FormField
            control={form.control}
            name="percentage_of_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Procenta z revenue (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    max={100}
                    value={field.value ?? ''} 
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {costModel === 'per_credit' && (
          <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Palette className="h-4 w-4" />
              Odměna za kredit (Creative Boost)
            </div>
            <FormField
              control={form.control}
              name="banner_reward_per_credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odměna za kredit – Bannery (CZK)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      value={field.value ?? DEFAULT_BANNER_REWARD} 
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="video_reward_per_credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odměna za kredit – Videa (CZK)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      value={field.value ?? DEFAULT_VIDEO_REWARD} 
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Začátek</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poznámky</FormLabel>
              <FormControl>
                <Textarea placeholder="Poznámky k přiřazení..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="submit" disabled={availableColleagues.length === 0}>
            Přiřadit
          </Button>
        </div>
      </form>
    </Form>
  );
}
