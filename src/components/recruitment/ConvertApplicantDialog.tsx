import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Search, CheckCircle, AlertCircle, UserPlus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Applicant } from '@/types/applicant';
import { useApplicantsData } from '@/hooks/useApplicantsData';

const formSchema = z.object({
  birthday: z.date({ required_error: 'Datum narození je povinné' }),
  personal_email: z.string().email('Neplatný email').optional().or(z.literal('')),
  ico: z.string().min(8, 'IČO musí mít 8 číslic').max(8, 'IČO musí mít 8 číslic'),
  company_name: z.string().min(1, 'Název firmy je povinný'),
  dic: z.string().optional(),
  hourly_rate: z.coerce.number().min(100, 'Minimální hodinová sazba je 100 Kč'),
  billing_street: z.string().min(1, 'Ulice je povinná'),
  billing_city: z.string().min(1, 'Město je povinné'),
  billing_zip: z.string().min(5, 'PSČ je povinné'),
  bank_account: z.string().min(1, 'Číslo účtu je povinné'),
});

type FormData = z.infer<typeof formSchema>;

interface ConvertApplicantDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertApplicantDialog({ 
  applicant, 
  open, 
  onOpenChange 
}: ConvertApplicantDialogProps) {
  const { completeOnboarding } = useApplicantsData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingARES, setIsValidatingARES] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [aresValidated, setAresValidated] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      birthday: undefined,
      personal_email: '',
      ico: '',
      company_name: '',
      dic: '',
      hourly_rate: 500,
      billing_street: '',
      billing_city: '',
      billing_zip: '',
      bank_account: '',
    },
  });

  const validateARES = async (ico: string) => {
    if (ico.length !== 8) {
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
      toast.success(`Údaje načteny z ARES: ${data.obchodniJmeno}`);
    } catch (error) {
      setAresError(error instanceof Error ? error.message : 'Chyba při validaci IČO');
      setAresValidated(false);
    } finally {
      setIsValidatingARES(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const colleague = completeOnboarding(applicant.id, {
        full_name: applicant.full_name,
        email: applicant.email,
        phone: applicant.phone || '',
        position: applicant.position,
        birthday: data.birthday ? data.birthday.toISOString().split('T')[0] : undefined,
        personal_email: data.personal_email || undefined,
        ico: data.ico,
        company_name: data.company_name,
        dic: data.dic,
        hourly_rate: data.hourly_rate,
        billing_street: data.billing_street,
        billing_city: data.billing_city,
        billing_zip: data.billing_zip,
        bank_account: data.bank_account,
      });

      toast.success(`${applicant.full_name} byl přidán do kolegů`);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Nepodařilo se převést uchazeče');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Převést na kolegu
          </DialogTitle>
          <DialogDescription>
            Zadejte fakturační údaje pro {applicant.full_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal info section */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum narození *</FormLabel>
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
                              format(field.value, "d. M. yyyy", { locale: cs })
                            ) : (
                              <span>Vybrat</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
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
              <FormField
                control={form.control}
                name="personal_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soukromý email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jan@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* IČO with ARES validation */}
            <FormField
              control={form.control}
              name="ico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IČO *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="12345678"
                        maxLength={8}
                        onChange={(e) => {
                          field.onChange(e);
                          setAresValidated(false);
                          setAresError(null);
                        }}
                      />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => validateARES(field.value)}
                      disabled={isValidatingARES || field.value.length !== 8}
                    >
                      {isValidatingARES ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-1" />
                          ARES
                        </>
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
                      IČO ověřeno v ARES
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Název firmy *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} placeholder="CZ12345678" />
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
                <FormItem>
                  <FormLabel>Ulice a číslo *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Město *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>PSČ *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hodinová sazba (Kč) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Číslo účtu *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123456789/0100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušit
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Převést na kolegu
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
