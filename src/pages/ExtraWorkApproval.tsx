import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Building2, Briefcase, Clock, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import socialsLogo from '@/assets/socials-logo.png';

interface ExtraWorkApprovalData {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  hours_worked: number | null;
  hourly_rate: number | null;
  status: string;
  client_name: string | null;
  engagement_name: string | null;
  colleague_name: string | null;
  client_approved_at: string | null;
  client_rejected_at: string | null;
  client_rejection_reason: string | null;
}

export default function ExtraWorkApproval() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ExtraWorkApprovalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [email, setEmail] = useState('');
  const [agreedToApproval, setAgreedToApproval] = useState(false);
  const [approvalEmail, setApprovalEmail] = useState('');
  const [approvalTime, setApprovalTime] = useState<string | null>(null);
  const [rejectionTime, setRejectionTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: result, error: fetchError } = await supabase
          .rpc('get_extra_work_by_approval_token', { p_token: token });

        if (fetchError) {
          console.error('Error fetching extra work:', fetchError);
          setError('Nepodařilo se načíst data');
          setIsLoading(false);
          return;
        }

        if (!result || result.length === 0) {
          setIsLoading(false);
          return;
        }

        const work = result[0] as ExtraWorkApprovalData;
        setData(work);

        // Set initial state based on status
        if (work.client_approved_at || work.status === 'in_progress' || work.status === 'ready_to_invoice' || work.status === 'invoiced') {
          setActionState('approved');
          setApprovalTime(work.client_approved_at);
        } else if (work.client_rejected_at || work.status === 'rejected') {
          setActionState('rejected');
          setRejectionTime(work.client_rejected_at);
          setRejectionReason(work.client_rejection_reason || '');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Došlo k chybě');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleApprove = async () => {
    if (!data || !email || !agreedToApproval || !token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: result, error: approveError } = await supabase
        .rpc('approve_extra_work_by_token', {
          p_token: token,
          p_email: email,
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });

      if (approveError) {
        console.error('Error approving:', approveError);
        setError('Nepodařilo se schválit vícepráci');
        return;
      }

      const response = result as { success: boolean; error?: string };
      if (!response.success) {
        setError(response.error || 'Nepodařilo se schválit vícepráci');
        return;
      }

      const now = new Date().toISOString();
      setApprovalEmail(email);
      setApprovalTime(now);
      setActionState('approved');
    } catch (err) {
      console.error('Error:', err);
      setError('Došlo k chybě při schvalování');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!data || !token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: result, error: rejectError } = await supabase
        .rpc('reject_extra_work_by_token', {
          p_token: token,
          p_email: email || 'anonymous',
          p_reason: rejectionReason,
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });

      if (rejectError) {
        console.error('Error rejecting:', rejectError);
        setError('Nepodařilo se zamítnout vícepráci');
        return;
      }

      const response = result as { success: boolean; error?: string };
      if (!response.success) {
        setError(response.error || 'Nepodařilo se zamítnout vícepráci');
        return;
      }

      setRejectionTime(new Date().toISOString());
      setActionState('rejected');
    } catch (err) {
      console.error('Error:', err);
      setError('Došlo k chybě při zamítání');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CZK') =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Vícepráce nenalezena</h1>
            <p className="text-muted-foreground">Tento odkaz je neplatný nebo vícepráce neexistuje.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-center">
          <img src={socialsLogo} alt="Socials.cz" className="h-8" />
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        {actionState === 'approved' && (
          <Card className="mb-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-700">Vícepráce schválena</h2>
              <p className="text-green-600">Práce může začít. Budeme Vás informovat o průběhu.</p>
              {approvalTime && (
                <div className="mt-4 pt-4 border-t border-green-200 space-y-2 text-sm text-left max-w-xs mx-auto">
                  {approvalEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-muted-foreground">Schválil/a:</span>
                      <span className="font-medium">{approvalEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-muted-foreground">Datum:</span>
                    <span className="font-medium">{new Date(approvalTime).toLocaleString('cs-CZ')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {actionState === 'rejected' && (
          <Card className="mb-8 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <h2 className="text-2xl font-bold text-red-700">Vícepráce zamítnuta</h2>
              <p className="text-red-600">Budeme Vás kontaktovat s dalšími kroky.</p>
              {rejectionReason && (
                <div className="mt-4 pt-4 border-t border-red-200 text-left max-w-md mx-auto">
                  <p className="text-sm text-muted-foreground mb-1">Důvod zamítnutí:</p>
                  <p className="text-sm">{rejectionReason}</p>
                </div>
              )}
              {rejectionTime && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(rejectionTime).toLocaleString('cs-CZ')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Extra work details */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold mb-6">{data.name}</h1>

            {/* Context info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {data.client_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Klient:</span>
                  <span className="font-medium">{data.client_name}</span>
                </div>
              )}
              {data.engagement_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Zakázka:</span>
                  <span className="font-medium">{data.engagement_name}</span>
                </div>
              )}
              {data.colleague_name && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Zpracoval/a:</span>
                  <span className="font-medium">{data.colleague_name}</span>
                </div>
              )}
            </div>

            {data.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Popis</h3>
                <p className="text-sm whitespace-pre-wrap">{data.description}</p>
              </div>
            )}

            {/* Pricing */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              {data.hours_worked && data.hourly_rate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rozsah práce:</span>
                  <span>{data.hours_worked}h × {data.hourly_rate.toLocaleString('cs-CZ')} {data.currency}/h</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium">Celková částka:</span>
                <span className="text-2xl font-bold">{formatCurrency(data.amount, data.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval form - only show if not already actioned */}
        {actionState === 'idle' && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!showRejectForm ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Váš email (pro potvrzení)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="vas@email.cz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="agree"
                        checked={agreedToApproval}
                        onCheckedChange={(checked) => setAgreedToApproval(checked === true)}
                      />
                      <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
                        Souhlasím se schválením výše uvedené vícepráce a potvrzuji, že jsem oprávněn/a toto rozhodnutí učinit za klienta.
                      </Label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={!email || !agreedToApproval || isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Schválit vícepráci
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isSubmitting}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Zamítnout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="font-medium">Zamítnutí vícepráce</h3>
                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Důvod zamítnutí</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Prosím uveďte důvod zamítnutí..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(false)}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Zpět
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Potvrdit zamítnutí
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Socials.cz. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}
