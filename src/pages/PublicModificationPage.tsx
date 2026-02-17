import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  ArrowRight,
  Loader2,
  Plus,
  Minus,
  RefreshCw,
  UserPlus,
  UserMinus,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import socialsLogo from '@/assets/socials-logo.png';
import {
  getModificationRequestByToken,
  clientAcceptOffer,
  type StoredModificationRequest
} from '@/hooks/useModificationRequests';
import type {
  AddServiceProposedChanges,
  UpdateServicePriceProposedChanges,
  DeactivateServiceProposedChanges,
  AddAssignmentProposedChanges,
  UpdateAssignmentProposedChanges,
  RemoveAssignmentProposedChanges,
} from '@/types/crm';

const REQUEST_TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  add_service: {
    label: 'Přidání nové služby',
    icon: Plus,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  update_service_price: {
    label: 'Změna ceny služby',
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  deactivate_service: {
    label: 'Ukončení služby',
    icon: Minus,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  add_assignment: {
    label: 'Přidání člena týmu',
    icon: UserPlus,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  update_assignment: {
    label: 'Změna přiřazení',
    icon: Edit,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  remove_assignment: {
    label: 'Odebrání člena týmu',
    icon: UserMinus,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

function ChangeDetails({ request }: { request: StoredModificationRequest }) {
  const config = REQUEST_TYPE_CONFIG[request.request_type];
  const Icon = config?.icon || RefreshCw;

  switch (request.request_type) {
    case 'add_service': {
      const changes = request.proposed_changes as AddServiceProposedChanges;
      return (
        <div className={`p-4 rounded-lg ${config?.bgColor || 'bg-muted'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`h-5 w-5 ${config?.color || ''}`} />
            <span className="font-medium">{config?.label || 'Změna'}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Služba:</span>
              <span className="font-medium">{changes.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cena:</span>
              <span className="font-medium">
                {changes.price.toLocaleString('cs-CZ')} {changes.currency}
                {changes.billing_type === 'monthly' ? '/měs' : ' (jednorázově)'}
              </span>
            </div>
            {changes.selected_tier && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Úroveň:</span>
                <Badge variant="outline" className="uppercase text-xs">
                  {changes.selected_tier}
                </Badge>
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'update_service_price': {
      const changes = request.proposed_changes as UpdateServicePriceProposedChanges;
      return (
        <div className={`p-4 rounded-lg ${config?.bgColor || 'bg-muted'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`h-5 w-5 ${config?.color || ''}`} />
            <span className="font-medium">{config?.label || 'Změna'}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Služba:</span>
              <span className="font-medium">{changes.service_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Aktuální cena:</span>
              <span className="line-through text-muted-foreground">
                {changes.old_price.toLocaleString('cs-CZ')} {changes.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nová cena:</span>
              <span className="font-medium text-primary">
                {changes.new_price.toLocaleString('cs-CZ')} {changes.currency}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case 'deactivate_service': {
      const changes = request.proposed_changes as DeactivateServiceProposedChanges;
      return (
        <div className={`p-4 rounded-lg ${config?.bgColor || 'bg-muted'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`h-5 w-5 ${config?.color || ''}`} />
            <span className="font-medium">{config?.label || 'Změna'}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Služba:</span>
              <span className="font-medium">{changes.service_name}</span>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Tato služba bude ukončena po potvrzení této změny.
            </p>
          </div>
        </div>
      );
    }

    case 'add_assignment': {
      const changes = request.proposed_changes as AddAssignmentProposedChanges;
      return (
        <div className={`p-4 rounded-lg ${config?.bgColor || 'bg-muted'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`h-5 w-5 ${config?.color || ''}`} />
            <span className="font-medium">{config?.label || 'Změna'}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Člen týmu:</span>
              <span className="font-medium">{changes.colleague_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium">{changes.role_on_engagement}</span>
            </div>
          </div>
        </div>
      );
    }

    case 'update_assignment': {
      const changes = request.proposed_changes as UpdateAssignmentProposedChanges;
      return (
        <div className={`p-4 rounded-lg ${config?.bgColor || 'bg-muted'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`h-5 w-5 ${config?.color || ''}`} />
            <span className="font-medium">{config?.label || 'Změna'}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Člen týmu:</span>
              <span className="font-medium">{changes.colleague_name}</span>
            </div>
            {changes.new_role && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nová role:</span>
                <span className="font-medium">{changes.new_role}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'remove_assignment': {
      const changes = request.proposed_changes as RemoveAssignmentProposedChanges;
      return (
        <div className={`p-4 rounded-lg ${config?.bgColor || 'bg-muted'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`h-5 w-5 ${config?.color || ''}`} />
            <span className="font-medium">{config?.label || 'Změna'}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Člen týmu:</span>
              <span className="font-medium">{changes.colleague_name}</span>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Toto přiřazení bude odebráno po potvrzení této změny.
            </p>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            Detaily změny nejsou dostupné.
          </p>
        </div>
      );
  }
}

export default function PublicModificationPage() {
  const { token } = useParams<{ token: string }>();

  const [request, setRequest] = useState<StoredModificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequest() {
      if (!token) {
        setError('Neplatný odkaz');
        setLoading(false);
        return;
      }

      try {
        const data = await getModificationRequestByToken(token);

        if (!data) {
          setError('Odkaz není platný nebo již vypršela jeho platnost.');
          setLoading(false);
          return;
        }

        // Check if already accepted/applied
        if (data.status === 'client_approved' || data.status === 'applied') {
          setRequest(data);
          setSubmitted(true);
          setLoading(false);
          return;
        }

        // Check if rejected
        if (data.status === 'rejected') {
          setError('Tento návrh změny byl zamítnut.');
          setLoading(false);
          return;
        }

        // Check validity
        if (data.upgrade_offer_valid_until && new Date(data.upgrade_offer_valid_until) < new Date()) {
          setError('Platnost tohoto odkazu vypršela.');
          setLoading(false);
          return;
        }

        setRequest(data);
        // Pre-fill email if we have client email
        if (data.client_email) {
          setEmail(data.client_email);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching modification request:', err);
        setError('Nepodařilo se načíst návrh změny.');
        setLoading(false);
      }
    }

    fetchRequest();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email.trim()) {
      setSubmitError('Zadejte prosím váš email.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitError('Zadejte platný email.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await clientAcceptOffer(token, email);

      if (!result.success) {
        setSubmitError(result.error || 'Nepodařilo se potvrdit změnu.');
        setIsSubmitting(false);
        return;
      }

      if (result.request) {
        setRequest(result.request);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error accepting modification:', err);
      setSubmitError('Nepodařilo se potvrdit změnu. Zkuste to prosím znovu.');
    }

    setIsSubmitting(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="flex justify-center mb-8">
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mb-6">
            <img src={socialsLogo} alt="Socials" className="h-10 mx-auto" />
          </div>
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Odkaz není platný</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Success state (already submitted or just submitted)
  if (submitted && request) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/80 backdrop-blur-sm">
          <div className="max-w-lg mx-auto px-4 py-4 flex justify-center">
            <img src={socialsLogo} alt="Socials" className="h-8" />
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Změna potvrzena</h1>
            <p className="text-muted-foreground">
              Děkujeme za potvrzení. Změna bude aplikována.
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {request.client_brand_name || request.client_name}
              </CardTitle>
              <CardDescription>{request.engagement_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangeDetails request={request} />

              {request.effective_from && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Platnost od: {format(new Date(request.effective_from), 'd. MMMM yyyy', { locale: cs })}
                  </span>
                </div>
              )}

              {request.client_approved_at && (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Potvrzeno: {format(new Date(request.client_approved_at), "d. MMMM yyyy 'v' HH:mm", { locale: cs })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Normal state - show form
  if (!request) return null;

  const validUntil = request.upgrade_offer_valid_until
    ? format(new Date(request.upgrade_offer_valid_until), 'd. MMMM yyyy', { locale: cs })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-center">
          <img src={socialsLogo} alt="Socials" className="h-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1">Návrh změny ke schválení</h1>
          <p className="text-muted-foreground text-sm">
            Prosím potvrďte navrhovanou změnu
          </p>
        </div>

        {/* Client info card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {request.client_brand_name || request.client_name}
            </CardTitle>
            <CardDescription>{request.engagement_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change details */}
            <ChangeDetails request={request} />

            {/* Effective from */}
            {request.effective_from && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Platnost od: {format(new Date(request.effective_from), 'd. MMMM yyyy', { locale: cs })}
                </span>
              </div>
            )}

            {/* Note */}
            {request.note && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="text-muted-foreground">{request.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Potvrdit změnu</CardTitle>
            <CardDescription>
              Pro potvrzení zadejte prosím váš email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Váš email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@spolecnost.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-600">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Potvrzuji...
                  </>
                ) : (
                  <>
                    Potvrdit změnu
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              {validUntil && (
                <p className="text-xs text-center text-muted-foreground">
                  Odkaz platný do: {validUntil}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          <img src={socialsLogo} alt="Socials" className="h-5 mx-auto opacity-50" />
        </div>
      </footer>
    </div>
  );
}
