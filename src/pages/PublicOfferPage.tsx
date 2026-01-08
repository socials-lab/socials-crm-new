import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ExternalLink, Calendar, FileText, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicOfferService } from '@/types/publicOffer';
import socialsLogo from '@/assets/socials-logo.png';

interface PublicOfferData {
  id: string;
  lead_id: string;
  token: string;
  company_name: string;
  contact_name: string;
  audit_summary: string | null;
  custom_note: string | null;
  notion_url: string | null;
  services: PublicOfferService[];
  total_price: number;
  currency: string;
  offer_type: 'retainer' | 'one_off';
  valid_until: string | null;
  is_active: boolean;
  viewed_at: string | null;
  view_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function ServiceCard({ service }: { service: PublicOfferService }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasDescription = service.offer_description && service.offer_description.trim().length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger className="w-full" disabled={!hasDescription}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{service.name}</p>
                  {service.selected_tier && (
                    <Badge variant="outline" className="text-xs uppercase">
                      {service.selected_tier}
                    </Badge>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="font-semibold text-lg">
                  {service.price.toLocaleString('cs-CZ')} {service.currency}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  {service.billing_type === 'monthly' ? '/měs' : ''}
                </span>
              </div>
              {hasDescription && (
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        {hasDescription && (
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                <p className="text-sm font-medium mb-2">Co zahrnuje:</p>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {service.offer_description}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

export default function PublicOfferPage() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<PublicOfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffer() {
      if (!token) {
        setError('Neplatný odkaz na nabídku');
        setLoading(false);
        return;
      }

      try {
        // Fetch offer using raw SQL to bypass type restrictions
        const { data, error: fetchError } = await supabase
          .from('public_offers' as any)
          .select('*')
          .eq('token', token)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Nabídka nebyla nalezena nebo již není platná');
          setLoading(false);
          return;
        }

        // Parse the data
        const offerData = data as any;
        const parsedOffer: PublicOfferData = {
          id: offerData.id,
          lead_id: offerData.lead_id,
          token: offerData.token,
          company_name: offerData.company_name,
          contact_name: offerData.contact_name,
          audit_summary: offerData.audit_summary,
          custom_note: offerData.custom_note,
          notion_url: offerData.notion_url,
          services: (offerData.services as PublicOfferService[]) || [],
          total_price: offerData.total_price,
          currency: offerData.currency || 'CZK',
          offer_type: offerData.offer_type || 'retainer',
          valid_until: offerData.valid_until,
          is_active: offerData.is_active,
          viewed_at: offerData.viewed_at,
          view_count: offerData.view_count || 0,
          created_by: offerData.created_by,
          created_at: offerData.created_at,
          updated_at: offerData.updated_at,
        };

        setOffer(parsedOffer);

        // Track view - try to call the RPC function, ignore errors if it doesn't exist
        try {
          await supabase.rpc('increment_offer_view' as any, { offer_token: token });
        } catch {
          // Function might not exist yet, silently ignore
        }
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Chyba při načítání nabídky');
      } finally {
        setLoading(false);
      }
    }

    fetchOffer();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex justify-center mb-8">
            <Skeleton className="h-12 w-32" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-12 w-64 mx-auto mb-8" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="mb-6">
            <img src={socialsLogo} alt="Socials" className="h-10 mx-auto" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Nabídka není dostupná</h1>
          <p className="text-muted-foreground">
            {error || 'Tato nabídka neexistuje nebo již není platná.'}
          </p>
        </div>
      </div>
    );
  }

  const isExpired = offer.valid_until && new Date(offer.valid_until) < new Date();
  const totalMonthly = offer.services
    .filter(s => s.billing_type === 'monthly')
    .reduce((sum, s) => sum + s.price, 0);
  const totalOneOff = offer.services
    .filter(s => s.billing_type === 'one_off')
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center">
          <img src={socialsLogo} alt="Socials" className="h-8" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-1">Nabídka pro</p>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            {offer.company_name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Připraveno pro: {offer.contact_name}
          </p>
        </div>

        {/* Validity warning */}
        {isExpired && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-center">
            <p className="text-destructive font-medium">
              ⚠️ Platnost této nabídky vypršela
            </p>
          </div>
        )}

        {/* Audit Summary */}
        {offer.audit_summary && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              📊 Výstup z auditu
            </h2>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-muted-foreground whitespace-pre-line">
                {offer.audit_summary}
              </p>
            </div>
          </section>
        )}

        {/* Services */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            📦 Služby v nabídce
          </h2>
          <div className="space-y-3">
            {offer.services.map((service, idx) => (
              <ServiceCard key={service.id || idx} service={service} />
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        {/* Pricing Summary */}
        <section className="mb-8">
          <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
            <div className="space-y-3">
              {totalMonthly > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Měsíční poplatek:</span>
                  <span className="text-2xl font-bold">
                    {totalMonthly.toLocaleString('cs-CZ')} {offer.currency}
                    <span className="text-base font-normal text-muted-foreground">/měs</span>
                  </span>
                </div>
              )}
              {totalOneOff > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Jednorázově:</span>
                  <span className="text-xl font-semibold">
                    {totalOneOff.toLocaleString('cs-CZ')} {offer.currency}
                  </span>
                </div>
              )}
            </div>

            {offer.valid_until && !isExpired && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Nabídka platí do: {new Date(offer.valid_until).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        </section>

        {/* Custom Note */}
        {offer.custom_note && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              📝 Poznámka
            </h2>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-muted-foreground whitespace-pre-line">
                {offer.custom_note}
              </p>
            </div>
          </section>
        )}

        {/* Notion Link */}
        {offer.notion_url && (
          <section className="mb-8">
            <a
              href={offer.notion_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">Detailní nabídka a vysvětlení</span>
              <ExternalLink className="h-4 w-4 text-primary" />
            </a>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t">
          <img src={socialsLogo} alt="Socials" className="h-6 mx-auto mb-3 opacity-50" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Socials. Všechna práva vyhrazena.
          </p>
        </footer>
      </main>
    </div>
  );
}
