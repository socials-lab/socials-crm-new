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
import type { Colleague, EngagementAssignment } from '@/types/crm';
import { toDateOnlyString } from '@/lib/dbNormalize';

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

const assignmentSchemaBase = z.object({
  colleague_id: z.string().min(1, 'Vyberte kolegu'),
  role_on_engagement: z.string().min(1, 'Role je povinná'),
  cost_model: z.enum(['hourly', 'fixed_monthly', 'percentage', 'per_credit'] as const),
  hourly_cost: z.coerce.number().min(0).nullable(),
  monthly_cost: z.coerce.number().min(0).nullable(),
  percentage_of_revenue: z.coerce.number().min(0).max(100).nullable(),
  reward_per_credit: z.coerce.number().min(0).nullable(),
  start_date: z.string().min(1, 'Datum je povinné'),
  notes: z.string(),
});

type AssignmentFormData = z.infer<typeof assignmentSchemaBase>;

interface AssignmentFormProps {
  engagementId: string;
  engagementServiceId?: string | null;
  engagementStartDate: string;
  engagementEndDate?: string | null;
  colleagues: Colleague[];
  existingAssignments: EngagementAssignment[];
  onSubmit: (data: Omit<EngagementAssignment, 'id' | 'created_at' | 'updated_at'>) => void | Promise<void>;
  onCancel: () => void;
}

export function AssignmentForm({
  engagementId,
  engagementServiceId,
  engagementStartDate,
  engagementEndDate,
  colleagues,
  existingAssignments,
  onSubmit,
  onCancel
}: AssignmentFormProps) {
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
      }),
    [engagementStartDate, engagementEndDate]
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
      start_date: defaultStartDate,
      notes: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const costModel = form.watch('cost_model');
  const roleOnEngagement = form.watch('role_on_engagement');

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
    const position = selectedColleague.position.toLowerCase();
    if (position.includes('video')) {
      form.setValue('role_on_engagement', 'Video Editor', { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (position.includes('design') || position.includes('grafik')) {
      form.setValue('role_on_engagement', 'Graphic Designer', { shouldValidate: true, shouldDirty: true });
      return;
    }
    form.setValue('role_on_engagement', '', { shouldValidate: true, shouldDirty: true });
  }

  useEffect(() => {
    if (!roleOnEngagement) return;
    const shouldUsePerCredit = PER_CREDIT_ROLES.includes(roleOnEngagement as typeof PER_CREDIT_ROLES[number]);
    if (shouldUsePerCredit && costModel !== 'per_credit') {
      form.setValue('cost_model', 'per_credit', { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (!shouldUsePerCredit && costModel === 'per_credit') {
      form.setValue('cost_model', 'fixed_monthly', { shouldValidate: true, shouldDirty: true });
    }
  }, [roleOnEngagement, costModel, form]);

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
      await Promise.race([
        onSubmit({
          engagement_id: engagementId,
          engagement_service_id: engagementServiceId || null,
          colleague_id: data.colleague_id,
          role_on_engagement: data.role_on_engagement,
          cost_model: data.cost_model === 'per_credit' ? 'fixed_monthly' : data.cost_model,
          hourly_cost: data.cost_model === 'hourly' ? data.hourly_cost : null,
          monthly_cost: data.cost_model === 'fixed_monthly' ? data.monthly_cost : null,
          percentage_of_revenue: data.cost_model === 'percentage' ? data.percentage_of_revenue : null,
          reward_per_credit: data.cost_model === 'per_credit' ? (data.reward_per_credit ?? DEFAULT_REWARD_PER_CREDIT) : null,
          start_date: data.start_date,
          end_date: null,
          notes: data.notes,
        }),
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
              <Select onValueChange={field.onChange} value={field.value}>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fixed_monthly">Fixní měsíčně</SelectItem>
                  <SelectItem value="hourly">Hodinová sazba</SelectItem>
                  <SelectItem value="percentage">Procenta z revenue</SelectItem>
                  <SelectItem value="per_credit">Odměna za kredit</SelectItem>
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
          <FormField
            control={form.control}
            name="reward_per_credit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Odměna za kredit (Kč)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Pro roli Graphic Designer / Video Editor se odměna počítá za každý odpracovaný kredit.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
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
