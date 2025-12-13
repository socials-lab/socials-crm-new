import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Colleague } from '@/types/crm';

const colleagueSchema = z.object({
  full_name: z.string().min(1, 'Jméno je povinné'),
  email: z.string().email('Zadejte platný email'),
  phone: z.string().nullable(),
  position: z.string().min(1, 'Pozice je povinná'),
  seniority: z.enum(['junior', 'mid', 'senior', 'partner'] as const),
  is_freelancer: z.boolean(),
  internal_hourly_cost: z.coerce.number().min(0, 'Hodinová sazba musí být kladná'),
  monthly_fixed_cost: z.coerce.number().min(0).nullable(),
  capacity_hours_per_month: z.coerce.number().min(0).nullable(),
  status: z.enum(['active', 'on_hold', 'left'] as const),
  notes: z.string(),
});

type ColleagueFormData = z.infer<typeof colleagueSchema>;

interface ColleagueFormProps {
  colleague?: Colleague;
  onSubmit: (data: ColleagueFormData & { profile_id: string | null }) => void;
  onCancel: () => void;
}

export function ColleagueForm({ colleague, onSubmit, onCancel }: ColleagueFormProps) {
  const form = useForm<ColleagueFormData>({
    resolver: zodResolver(colleagueSchema),
    defaultValues: {
      full_name: colleague?.full_name || '',
      email: colleague?.email || '',
      phone: colleague?.phone || null,
      position: colleague?.position || '',
      seniority: colleague?.seniority || 'mid',
      is_freelancer: colleague?.is_freelancer || false,
      internal_hourly_cost: colleague?.internal_hourly_cost || 0,
      monthly_fixed_cost: colleague?.monthly_fixed_cost ?? null,
      capacity_hours_per_month: colleague?.capacity_hours_per_month ?? null,
      status: colleague?.status || 'active',
      notes: colleague?.notes || '',
    },
  });

  const handleSubmit = (data: ColleagueFormData) => {
    onSubmit({
      ...data,
      profile_id: colleague?.profile_id || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jméno</FormLabel>
                <FormControl>
                  <Input placeholder="Jan Novák" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jan@firma.cz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl>
                <Input 
                  type="tel" 
                  placeholder="+420 602 123 456" 
                  {...field} 
                  value={field.value || ''} 
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pozice</FormLabel>
                <FormControl>
                  <Input placeholder="Meta Ads Specialist" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seniority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seniority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Aktivní</SelectItem>
                    <SelectItem value="on_hold">Pozastaveno</SelectItem>
                    <SelectItem value="left">Odešel/la</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_freelancer"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 pt-8">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">Freelancer</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-3">Finanční údaje</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="internal_hourly_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hodinová sazba (CZK)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthly_fixed_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fixní měsíční náklad</FormLabel>
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
              name="capacity_hours_per_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapacita (hod/měs)</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poznámky</FormLabel>
              <FormControl>
                <Textarea placeholder="Interní poznámky..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="submit">
            {colleague ? 'Uložit změny' : 'Vytvořit kolegu'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
