import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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
import { toDateOnlyString } from '@/lib/dbNormalize';
import {
  ASSIGNMENT_ROLE_OPTIONS,
  canonicalizeAssignmentRole,
  canUsePerCreditCostModel,
  isPerCreditRole,
} from '@/lib/assignmentRoles';
import { Palette } from 'lucide-react';

const DEFAULT_REWARD_PER_CREDIT = 80;
const DEFAULT_BANNER_REWARD_PER_CREDIT = 80;
const DEFAULT_VIDEO_REWARD_PER_CREDIT = 80;

const assignmentSchemaBase = z.object({
  colleague_id: z.string().min(1, 'Vyberte kolegu'),
  role_on_engagement: z.string().min(1, 'Role je povinná'),
  cost_model: z.enum(['hourly', 'fixed_monthly', 'percentage', 'per_credit'] as const),
  hourly_cost: z.coerce.number().min(0).nullable(),
  monthly_cost: z.coerce.number().min(0).nullable(),
  percentage_of_revenue: z.coerce.number().min(0).max(100).nullable(),
  reward_per_credit: z.coerce.number().min(0).nullable(),
  reward_per_credit_banner: z.coerce.number().min(0).nullable(),
  reward_per_credit_video: z.coerce.number().min(0).nullable(),
  start_date: z.string().min(1, 'Datum je povinné'),
  notes: z.string(),
});

type AssignmentFormData = z.infer<typeof assignmentSchemaBase>;

export interface AssignmentFormSubmitData extends Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'> {
  _creativeBoostRewards?: {
    engagementServiceId: string;
    bannerRewardPerCredit: number;
    videoRewardPerCredit: number;
  };
}

interface AssignmentFormProps {
  engagementId: string;
  engagementServiceId?: string | null;
  engagementServices?: EngagementService[];
  creativeBoostServiceId?: string | null;
  engagementStartDate: string;
  engagementEndDate?: string | null;
  colleagues: Colleague[];
  existingAssignments: EngagementAssignment[];
  onSubmit: (data: AssignmentFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
}

export function AssignmentForm({
  engagementId,
  engagementServiceId,
  engagementServices = [],
  creativeBoostServiceId = null,
  engagementStartDate,
  engagementEndDate,
  colleagues,
  existingAssignments,
  onSubmit,
  onCancel
}: AssignmentFormProps) {
  const cbService = useMemo(
    function getCreativeBoostServiceForEngagement() {
      const byServiceId = creativeBoostServiceId
        ? engagementServices.find(
            function isActiveCreativeBoostServiceById(engagementService) {
              return engagementService.service_id === creativeBoostServiceId && engagementService.is_active;
            }
          )
        : null;
      if (byServiceId) {
        return byServiceId;
      }

      return (
        engagementServices.find(function isActiveCreativeBoostServiceByPayload(engagementService) {
          if (!engagementService.is_active) {
            return false;
          }
          const lowerName = engagementService.name.toLowerCase();
          return (
            engagementService.creative_boost_price_per_credit !== null ||
            engagementService.creative_boost_min_credits !== null ||
            engagementService.creative_boost_max_credits !== null ||
            lowerName.includes('creative boost')
          );
        }) ?? null
      );
    },
    [engagementServices, creativeBoostServiceId]
  );
  const hasCreativeBoostService = cbService !== null;

  const todayDateOnly = toDateOnlyString(new Date());
  const defaultStartDate = engagementStartDate > todayDateOnly ? engagementStartDate : todayDateOnly;

  const assignmentSchema = useMemo(
    () =>
      assignmentSchemaBase.superRefine((data, ctx) => {
        if (data.start_date < engagementStartDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['start_date'],
            message: `Datum začátku musí být od ${engagementStartDate}.`,
          });
        }

        if (engagementEndDate && data.start_date > engagementEndDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['start_date'],
            message: `Datum začátku musí být v rozsahu zakázky (${engagementStartDate} až ${engagementEndDate}).`,
          });
        }

        if (data.cost_model === 'per_credit') {
          if (!hasCreativeBoostService) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['cost_model'],
              message: 'Model "Odměna za kredit" je dostupný pouze pokud má zakázka aktivní službu Creative Boost.',
            });
          }
          if (!isPerCreditRole(data.role_on_engagement)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['cost_model'],
              message: 'Model "Odměna za kredit" je dostupný pouze pro role Graphic Designer/Video Editor.',
            });
          }
          if (data.reward_per_credit === null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['reward_per_credit'],
              message: 'Zadejte odměnu za kredit.',
            });
          }
          if (data.reward_per_credit_banner === null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['reward_per_credit_banner'],
              message: 'Zadejte odměnu za kredit - Bannery.',
            });
          }
          if (data.reward_per_credit_video === null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['reward_per_credit_video'],
              message: 'Zadejte odměnu za kredit - Videa.',
            });
          }
        }
      }),
    [engagementStartDate, engagementEndDate, hasCreativeBoostService]
  );

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      colleague_id: '',
      role_on_engagement: '',
      cost_model: 'fixed_monthly',
      hourly_cost: null,
      monthly_cost: null,
      percentage_of_revenue: null,
      reward_per_credit: DEFAULT_REWARD_PER_CREDIT,
      reward_per_credit_banner: DEFAULT_BANNER_REWARD_PER_CREDIT,
      reward_per_credit_video: DEFAULT_VIDEO_REWARD_PER_CREDIT,
      start_date: defaultStartDate,
      notes: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const costModel = form.watch('cost_model');
  const roleOnEngagement = form.watch('role_on_engagement');
  const isPerCreditEligibleRole = isPerCreditRole(roleOnEngagement);

  useEffect(() => {
    if (!cbService) return;
    const bannerReward = cbService.creative_boost_reward_per_credit_banner ?? DEFAULT_BANNER_REWARD_PER_CREDIT;
    const videoReward = cbService.creative_boost_reward_per_credit_video ?? DEFAULT_VIDEO_REWARD_PER_CREDIT;
    form.setValue('reward_per_credit', bannerReward);
    form.setValue('reward_per_credit_banner', bannerReward);
    form.setValue('reward_per_credit_video', videoReward);
  }, [cbService, form]);

  // Filter out already assigned colleagues
  const assignedColleagueIds = existingAssignments
    .filter(a => !a.end_date)
    .map(a => a.colleague_id);
  const availableColleagues = colleagues.filter(
    c => c.status === 'active' && !assignedColleagueIds.includes(c.id)
  );

  function handleColleagueChange(colleagueId: string) {
    form.setValue('colleague_id', colleagueId, { shouldValidate: true, shouldDirty: true });
    const selectedColleague = availableColleagues.find(colleague => colleague.id === colleagueId);
    if (!selectedColleague) {
      throw new Error(`Selected colleague ${colleagueId} is not available for assignment.`);
    }
    const canonicalRole = canonicalizeAssignmentRole(selectedColleague.position);
    if (canonicalRole === 'Video Editor' || canonicalRole === 'Graphic Designer') {
      form.setValue('role_on_engagement', canonicalRole, { shouldValidate: true, shouldDirty: true });
      if (canUsePerCreditCostModel(canonicalRole, hasCreativeBoostService)) {
        form.setValue('cost_model', 'per_credit', { shouldValidate: true, shouldDirty: true });
      } else if (form.getValues('cost_model') === 'per_credit') {
        form.setValue('cost_model', 'fixed_monthly', { shouldValidate: true, shouldDirty: true });
      }
      return;
    }
    form.setValue('role_on_engagement', '', { shouldValidate: true, shouldDirty: true });
  }

  function handleRoleChange(role: string) {
    form.setValue('role_on_engagement', role, { shouldValidate: true, shouldDirty: true });
    if (canUsePerCreditCostModel(role, hasCreativeBoostService)) {
      form.setValue('cost_model', 'per_credit', { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (form.getValues('cost_model') === 'per_credit') {
      form.setValue('cost_model', 'fixed_monthly', { shouldValidate: true, shouldDirty: true });
    }
  }

  const handleManualSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${(error as { message?: string })?.message || 'Neplatné'}`)
        .join(', ');
      toast.error(`Formulář obsahuje chyby: ${errorMessages}`);
      return;
    }

    const data = form.getValues();
    setIsSubmitting(true);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: operace trvala příliš dlouho')), 30000)
    );

    try {
      if (data.cost_model === 'per_credit' && !hasCreativeBoostService) {
        throw new Error('Model "Odměna za kredit" je dostupný pouze pokud má zakázka aktivní službu Creative Boost.');
      }
      if (data.cost_model === 'per_credit' && !isPerCreditRole(data.role_on_engagement)) {
        throw new Error('Model "Odměna za kredit" je dostupný pouze pro role Graphic Designer/Video Editor.');
      }
      if (data.cost_model === 'per_credit' && data.reward_per_credit === null) {
        throw new Error('Zadejte odměnu za kredit.');
      }
      if (data.cost_model === 'per_credit' && data.reward_per_credit_banner === null) {
        throw new Error('Zadejte odměnu za kredit - Bannery.');
      }
      if (data.cost_model === 'per_credit' && data.reward_per_credit_video === null) {
        throw new Error('Zadejte odměnu za kredit - Videa.');
      }
      const submitData: AssignmentFormSubmitData = {
          engagement_id: engagementId,
          engagement_service_id:
            data.cost_model === 'per_credit'
              ? cbService?.id ?? engagementServiceId ?? null
              : engagementServiceId || null,
          colleague_id: data.colleague_id,
          role_on_engagement: data.role_on_engagement,
          cost_model: data.cost_model === 'per_credit' ? 'fixed_monthly' : data.cost_model,
          hourly_cost: data.cost_model === 'hourly' ? data.hourly_cost : null,
          monthly_cost: data.cost_model === 'fixed_monthly' ? data.monthly_cost : null,
          percentage_of_revenue: data.cost_model === 'percentage' ? data.percentage_of_revenue : null,
          reward_per_credit: null,
          reward_per_credit_banner: null,
          reward_per_credit_video: null,
          start_date: data.start_date,
          end_date: null,
          notes: data.notes,
      };

      if (data.cost_model === 'per_credit') {
        const targetServiceId = cbService?.id ?? engagementServiceId ?? null;
        if (!targetServiceId) {
          throw new Error('Aktivní služba Creative Boost nebyla nalezena pro uložení odměny za kredit.');
        }
        submitData._creativeBoostRewards = {
          engagementServiceId: targetServiceId,
          bannerRewardPerCredit: data.reward_per_credit_banner ?? DEFAULT_BANNER_REWARD_PER_CREDIT,
          videoRewardPerCredit: data.reward_per_credit_video ?? DEFAULT_VIDEO_REWARD_PER_CREDIT,
        };
      }

      await Promise.race([
        onSubmit(submitData),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Chyba: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="colleague_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kolega</FormLabel>
              <Select onValueChange={handleColleagueChange} value={field.value}>
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
              <Select onValueChange={handleRoleChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte roli" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ASSIGNMENT_ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select onValueChange={field.onChange} value={field.value ?? 'fixed_monthly'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fixed_monthly">Fixní měsíčně</SelectItem>
                  <SelectItem value="hourly">Hodinová sazba</SelectItem>
                  <SelectItem value="percentage">Procenta z revenue</SelectItem>
                  <SelectItem value="per_credit" disabled={!hasCreativeBoostService}>
                    <span className="flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5" />
                      Za kredit (Creative Boost)
                    </span>
                  </SelectItem>
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
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/30 p-3">
            <div className="flex items-center gap-2 text-red-500 text-lg font-semibold">
              <Palette className="h-4 w-4" />
              Odměna za kredit (Creative Boost)
            </div>
            <FormField
              control={form.control}
              name="reward_per_credit_banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odměna za kredit - Bannery (CZK)</FormLabel>
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
            <FormField
              control={form.control}
              name="reward_per_credit_video"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odměna za kredit - Videa (CZK)</FormLabel>
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
            <FormField
              control={form.control}
              name="reward_per_credit"
              render={({ field }) => (
                <FormItem className="hidden">
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
          </div>
        )}

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Začátek</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={engagementStartDate}
                  max={engagementEndDate || undefined}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Povolený rozsah: {engagementStartDate}
                {engagementEndDate ? ` až ${engagementEndDate}` : ' a dále'}
              </p>
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Zrušit
          </Button>
          <Button
            type="button"
            disabled={availableColleagues.length === 0 || isSubmitting}
            onClick={handleManualSubmit}
          >
            {isSubmitting ? 'Přiřazuji...' : 'Přiřadit'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
