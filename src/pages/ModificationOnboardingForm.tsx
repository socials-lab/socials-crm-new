import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle2, MapPin, Loader2, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import socialsLogoDark from '@/assets/socials-logo-dark.svg';
import { 
  getModificationRequestById, 
  getModificationRequests,
  type StoredModificationRequest,
  type OnboardingData,
} from '@/data/modificationRequestsMockData';
import type { NewEngagementProposedChanges } from '@/types/crm';

const onboardingSchema = z.object({
  company_name: z.string().min(1, 'Název společnosti je povinný'),
  ico: z.string().min(1, 'IČO je povinné'),
  dic: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  billing_street: z.string().optional(),
  billing_city: z.string().optional(),
  billing_zip: z.string().optional(),
  billing_country: z.string().optional(),
  billing_email: z.string().email('Neplatný formát').optional().or(z.literal('')),
  contact_name: z.string().min(1, 'Jméno je povinné'),
  contact_email: z.string().email('Neplatný formát e-mailu'),
  contact_phone: z.string().optional(),
  contact_position: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function ModificationOnboardingForm() {
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<StoredModificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aresQuery, setAresQuery] = useState('');
  const [aresResults, setAresResults] = useState<Array<{ ico: string; name: string; city: string | null }>>([]);
  const [isSearchingAres, setIsSearchingAres] = useState(false);
  const [showAresResults, setShowAresResults] = useState(false);
  const [aresValidated, setAresValidated] = useState(false);
  const aresSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      company_name: '',
      ico: '',
      dic: '',
      website: '',
      industry: '',
      billing_street: '',
      billing_city: '',
      billing_zip: '',
      billing_country: 'Česká republika',
      billing_email: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_position: '',
    },
  });

  useEffect(() => {
    if (!requestId) {
      setIsLoading(false);
      return;
    }
    const req = getModificationRequestById(requestId);
    if (req && req.request_type === 'new_engagement') {
      setRequest(req);
      // Pre-fill from proposed changes
      const c = req.proposed_changes as unknown as NewEngagementProposedChanges;
      if (c.new_client_data?.company_name) {
        form.setValue('company_name', c.new_client_data.company_name);
        setAresQuery(c.new_client_data.company_name);
      }
      // If already filled
      if (req.onboarding_data) {
        setIsSubmitted(true);
      }
    }
    setIsLoading(false);
  }, [requestId]);

  // ARES search
  const searchARES = useCallback(async (query: string) => {
    if (query.length < 3) { setAresResults([]); setShowAresResults(false); return; }
    setIsSearchingAres(true);
    try {
      const res = await fetch('https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obchodniJmeno: query, start: 0, pocet: 8 }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items = (data.ekonomickeSubjekty || []).map((s: any) => ({
        ico: s.ico, name: s.obchodniJmeno || s.nazev || '', city: s.sidlo?.nazevObce || null,
      }));
      setAresResults(items);
      setShowAresResults(items.length > 0);
    } catch { setAresResults([]); }
    finally { setIsSearchingAres(false); }
  }, []);

  const handleAresQueryChange = (value: string) => {
    setAresQuery(value);
    setAresValidated(false);
    if (aresSearchTimeout.current) clearTimeout(aresSearchTimeout.current);
    aresSearchTimeout.current = setTimeout(() => searchARES(value), 400);
  };

  const validateAresIco = async (ico: string) => {
    if (ico.length !== 8) return;
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      form.setValue('company_name', data.obchodniJmeno || '', { shouldValidate: true });
      form.setValue('dic', data.dic || '', { shouldValidate: true });
      form.setValue('billing_street', data.sidlo?.textovaAdresa?.split(',')[0] || '', { shouldValidate: true });
      form.setValue('billing_city', data.sidlo?.nazevObce || '', { shouldValidate: true });
      form.setValue('billing_zip', data.sidlo?.psc?.toString() || '', { shouldValidate: true });
      form.setValue('billing_country', 'Česká republika', { shouldValidate: true });
      form.setValue('ico', ico, { shouldValidate: true });
      setAresValidated(true);
    } catch {}
  };

  const handleSelectAresResult = async (result: { ico: string; name: string }) => {
    setShowAresResults(false);
    setAresQuery(result.name);
    await validateAresIco(result.ico);
  };

  const onSubmit = (data: OnboardingFormData) => {
    if (!request || !requestId) return;
    setIsSubmitting(true);

    const onboardingData: OnboardingData = {
      company_name: data.company_name,
      ico: data.ico,
      dic: data.dic,
      website: data.website,
      industry: data.industry,
      billing_street: data.billing_street,
      billing_city: data.billing_city,
      billing_zip: data.billing_zip,
      billing_country: data.billing_country,
      billing_email: data.billing_email,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      contact_position: data.contact_position,
      filled_at: new Date().toISOString(),
    };

    // Save to localStorage
    const STORAGE_KEY = 'modification_requests';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const requests: StoredModificationRequest[] = JSON.parse(stored);
        const idx = requests.findIndex(r => r.id === requestId);
        if (idx !== -1) {
          requests[idx] = { ...requests[idx], onboarding_data: onboardingData, updated_at: new Date().toISOString() };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
        }
      } catch {}
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Údaje byly úspěšně odeslány!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Formulář nenalezen</h1>
            <p className="text-muted-foreground">Tento odkaz není platný nebo formulář již byl vyplněn.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    const c = request.proposed_changes as unknown as NewEngagementProposedChanges;
    return (
      <div className="min-h-screen bg-[hsl(var(--muted))]">
        <header className="bg-background border-b">
          <div className="container max-w-2xl mx-auto px-4 py-5 flex items-center justify-center">
            <img src={socialsLogoDark} alt="Socials.cz" className="h-8" />
          </div>
        </header>
        <main className="container max-w-2xl mx-auto px-4 py-12">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Děkujeme! 🎉</h2>
              <p className="text-green-600 mb-4">
                Vaše fakturační údaje byly úspěšně zaznamenány. Náš tým se s vámi brzy spojí ohledně dalších kroků pro spuštění zakázky <strong>{c.engagement_name}</strong>.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const changes = request.proposed_changes as unknown as NewEngagementProposedChanges;

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]">
      <header className="bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-5 flex items-center justify-center">
          <img src={socialsLogoDark} alt="Socials.cz" className="h-8" />
        </div>
      </header>

      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container max-w-2xl mx-auto px-4 py-6 text-center">
          <h1 className="text-xl font-bold mb-2">Fakturační údaje pro novou spolupráci</h1>
          <p className="text-muted-foreground text-sm">
            Pro zakázku <strong>{changes.engagement_name}</strong> potřebujeme fakturační údaje a kontaktní osobu.
          </p>
        </div>
      </div>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ARES lookup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Vyhledání firmy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Zadejte název firmy pro vyhledání v ARES..."
                    value={aresQuery}
                    onChange={(e) => handleAresQueryChange(e.target.value)}
                  />
                  {isSearchingAres && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {showAresResults && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {aresResults.map((r) => (
                        <button
                          key={r.ico}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                          onClick={() => handleSelectAresResult(r)}
                        >
                          <span className="font-medium">{r.name}</span>
                          <span className="text-muted-foreground text-xs">IČO: {r.ico}{r.city ? `, ${r.city}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {aresValidated && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 text-sm">
                      Firma ověřena v registru ARES. Údaje byly vyplněny automaticky.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Company details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Údaje společnosti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="company_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název společnosti *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="ico" render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dic" render={({ field }) => (
                    <FormItem>
                      <FormLabel>DIČ</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Web</FormLabel>
                      <FormControl><Input {...field} placeholder="https://" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Billing address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Fakturační adresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="billing_street" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ulice</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="billing_city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Město</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="billing_zip" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PSČ</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="billing_email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fakturační email</FormLabel>
                    <FormControl><Input {...field} type="email" placeholder="fakturace@firma.cz" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Contact person */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Kontaktní osoba
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contact_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jméno *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contact_position" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pozice</FormLabel>
                      <FormControl><Input {...field} placeholder="Jednatel" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contact_email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl><Input {...field} type="email" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contact_phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl><Input {...field} placeholder="+420" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Odesílám...</>
              ) : (
                'Odeslat údaje'
              )}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
