import { useMemo, useState } from 'react';
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

const assignmentSchemaBase = z.object({
  colleague_id: z.string().min(1, 'Vyberte kolegu'),
  role_on_engagement: z.string().min(1, 'Role je povinná'),
  cost_model: z.enum(['hourly', 'fixed_monthly', 'percentage'] as const),
  hourly_cost: z.coerce.number().min(0).nullable(),
  monthly_cost: z.coerce.number().min(0).nullable(),
  percentage_of_revenue: z.coerce.number().min(0).max(100).nullable(),
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
      start_date: defaultStartDate,
      notes: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const costModel = form.watch('cost_model');

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
    form.setValue('role_on_engagement', selectedColleague.position, { shouldValidate: true, shouldDirty: true });
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
      await Promise.race([
        onSubmit({
          engagement_id: engagementId,
          engagement_service_id: engagementServiceId || null,
          colleague_id: data.colleague_id,
          role_on_engagement: data.role_on_engagement,
          cost_model: data.cost_model,
          hourly_cost: data.cost_model === 'hourly' ? data.hourly_cost : null,
          monthly_cost: data.cost_model === 'fixed_monthly' ? data.monthly_cost : null,
          percentage_of_revenue: data.cost_model === 'percentage' ? data.percentage_of_revenue : null,
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
