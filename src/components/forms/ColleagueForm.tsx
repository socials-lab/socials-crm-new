import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Colleague } from '@/types/crm';
import { 
  SERVICE_SLOT_LABELS, 
  SERVICE_SLOT_TYPES,
  DEFAULT_CAPACITY_SLOTS,
  getCapacitySlots,
  type CapacitySlots 
} from '@/constants/serviceSlotTypes';

const capacitySlotsSchema = z.object({
  meta: z.coerce.number().min(0),
  google: z.coerce.number().min(0),
  graphics: z.coerce.number().min(0),
});

const colleagueSchema = z.object({
  full_name: z.string().min(1, 'Jméno je povinné'),
  email: z.string().email('Zadejte platný email'),
  phone: z.string().nullable(),
  position: z.string().min(1, 'Pozice je povinná'),
  seniority: z.enum(['junior', 'mid', 'senior', 'partner'] as const),
  is_freelancer: z.boolean(),
  internal_hourly_cost: z.coerce.number().min(0, 'Hodinová sazba musí být kladná'),
  monthly_fixed_cost: z.coerce.number().min(0).nullable(),
  max_engagements: z.coerce.number().min(0).nullable(),
  capacity_slots: capacitySlotsSchema,
  status: z.enum(['active', 'on_hold', 'left'] as const),
  notes: z.string(),
  birthday: z.date().nullable(),
  invite_to_crm: z.boolean(),
  role: z.enum(['admin', 'management', 'project_manager', 'specialist', 'finance'] as const).optional(),
  // New personal & billing fields
  personal_email: z.string().email('Neplatný email').optional().or(z.literal('')).nullable(),
  ico: z.string().nullable(),
  dic: z.string().nullable(),
  company_name: z.string().nullable(),
  billing_street: z.string().nullable(),
  billing_city: z.string().nullable(),
  billing_zip: z.string().nullable(),
  bank_account: z.string().nullable(),
});

type ColleagueFormData = z.infer<typeof colleagueSchema>;

interface ColleagueFormProps {
  colleague?: Colleague;
  onSubmit: (data: ColleagueFormData & { profile_id: string | null }) => void;
  onCancel: () => void;
  showInviteOption?: boolean;
}

export function ColleagueForm({ colleague, onSubmit, onCancel, showInviteOption = false }: ColleagueFormProps) {
  // Get existing capacity slots or defaults
  const existingSlots = colleague?.capacity_slots 
    ? getCapacitySlots(colleague.capacity_slots)
    : DEFAULT_CAPACITY_SLOTS;

  const [isValidatingARES, setIsValidatingARES] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [aresValidated, setAresValidated] = useState(false);

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
      max_engagements: colleague?.max_engagements ?? 5,
      capacity_slots: existingSlots,
      status: colleague?.status || 'active',
      notes: colleague?.notes || '',
      birthday: colleague?.birthday ? new Date(colleague.birthday) : null,
      invite_to_crm: showInviteOption,
      role: 'specialist',
      // New personal & billing fields
      personal_email: colleague?.personal_email || null,
      ico: colleague?.ico || null,
      dic: colleague?.dic || null,
      company_name: colleague?.company_name || null,
      billing_street: colleague?.billing_street || null,
      billing_city: colleague?.billing_city || null,
      billing_zip: colleague?.billing_zip || null,
      bank_account: colleague?.bank_account || null,
    },
  });

  // ARES validation function
  const validateARES = async (ico: string) => {
    if (!ico || ico.length !== 8) {
      setAresError('IČO musí mít přesně 8 číslic');
      return;
    }

    setIsValidatingARES(true);
    setAresError(null);

    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
      
      if (!response.ok) {
        throw new Error('Subjekt nebyl nalezen v ARES');
      }

      const data = await response.json();
      
      form.setValue('company_name', data.obchodniJmeno || '');
      if (data.dic) form.setValue('dic', data.dic);
      if (data.sidlo?.textovaAdresa) {
        form.setValue('billing_street', data.sidlo.textovaAdresa.split(',')[0] || '');
      }
      if (data.sidlo?.nazevObce) form.setValue('billing_city', data.sidlo.nazevObce);
      if (data.sidlo?.psc) form.setValue('billing_zip', data.sidlo.psc.toString());

      setAresValidated(true);
    } catch (error) {
      setAresError(error instanceof Error ? error.message : 'Chyba při validaci IČO');
      setAresValidated(false);
    } finally {
      setIsValidatingARES(false);
    }
  };

  const inviteToCrm = form.watch('invite_to_crm');

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

        <div className="grid gap-4 sm:grid-cols-2">
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

          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Datum narození</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "d. MMMM yyyy", { locale: cs })
                        ) : (
                          <span>Vybrat datum</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          <h4 className="font-medium text-sm mb-3">Kapacita podle typu služby</h4>
          <FormDescription className="mb-3">
            Počet zakázek, které může kolega vést pro každý typ služby
          </FormDescription>
          <div className="grid gap-4 sm:grid-cols-3">
            {SERVICE_SLOT_TYPES.map((slotType) => (
              <FormField
                key={slotType}
                control={form.control}
                name={`capacity_slots.${slotType}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{SERVICE_SLOT_LABELS[slotType]}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        max={10}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-3">Finanční údaje</h4>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-3">Osobní a fakturační údaje</h4>
          <FormDescription className="mb-3">
            Pro freelancery a fakturaci (volitelné)
          </FormDescription>
          
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <FormField
              control={form.control}
              name="personal_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soukromý email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="jan@gmail.com" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IČO</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="12345678"
                        maxLength={8}
                        value={field.value || ''} 
                        onChange={(e) => {
                          field.onChange(e.target.value || null);
                          setAresValidated(false);
                          setAresError(null);
                        }}
                      />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => validateARES(field.value || '')}
                      disabled={isValidatingARES || (field.value?.length || 0) !== 8}
                    >
                      {isValidatingARES ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {aresError && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {aresError}
                    </div>
                  )}
                  {aresValidated && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      ARES OK
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název firmy</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Jan Novák OSVČ" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DIČ</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="CZ12345678" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="billing_street"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Ulice a číslo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Příkladná 123" 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <FormField
              control={form.control}
              name="billing_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Město</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Praha" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PSČ</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="110 00" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bank_account"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Číslo účtu</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123456789/0100" 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

        {showInviteOption && !colleague && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-sm">Přístup do CRM</h4>
            <FormField
              control={form.control}
              name="invite_to_crm"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Pozvat jako uživatele CRM (pošle email s pozvánkou)
                  </FormLabel>
                </FormItem>
              )}
            />
            
            {inviteToCrm && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role v systému</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="specialist">Specialista</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

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
