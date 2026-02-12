import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, XCircle, Loader2, User, Building2, Briefcase, Mail, Clock } from 'lucide-react';
import socialsLogo from '@/assets/socials-logo.png';
import { getApprovalByToken, getStoredExtraWorks, updateStoredExtraWorkStatus } from '@/components/extra-work/SendApprovalDialog';
import type { ExtraWorkApprovalData } from '@/components/extra-work/SendApprovalDialog';
import { notifyExtraWorkColleague } from '@/services/notificationService';

export default function ExtraWorkApproval({ testMode = false }: { testMode?: boolean }) {
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

  useEffect(() => {
    if (testMode) {
      setData({
        id: 'test-mock',
        name: 'Redesign homepage banneru',
        description: 'Kompletní redesign hlavního banneru na homepage včetně responzivních variant pro mobil a tablet.',
        hours_worked: 5,
        hourly_rate: 1200,
        amount: 6000,
        currency: 'CZK',
        status: 'pending_approval',
        clientName: 'TechStart s.r.o.',
        engagementName: 'Social Media Management 2025',
        colleagueName: 'Jan Novák',
        colleagueEmail: 'jan.novak@socials.cz',
      });
      setIsLoading(false);
      return;
    }

    if (!token) { setIsLoading(false); return; }

    const approval = getApprovalByToken(token);
    if (!approval) { setIsLoading(false); return; }

    const works = getStoredExtraWorks();
    const work = works.find(w => w.id === approval.extraWorkId);
    if (work) {
      setData(work);
      if (work.status === 'in_progress' || work.status === 'ready_to_invoice' || work.status === 'invoiced') {
        setActionState('approved');
      } else if (work.status === 'rejected') {
        setActionState('rejected');
      }
    }
    setIsLoading(false);
  }, [token, testMode]);

  const handleApprove = async () => {
    if (!data || !email || !agreedToApproval) return;
    if (!testMode) updateStoredExtraWorkStatus(data.id, 'in_progress');
    const now = new Date().toISOString();
    setApprovalEmail(email);
    setApprovalTime(now);
    setActionState('approved');

    // Notify the assigned colleague
    if (data.colleagueId && !testMode) {
      notifyExtraWorkColleague(data.id, data.colleagueId, {
        type: 'extra_work_approved',
        title: 'Klient schválil vícepráci',
        message: `Vícepráce „${data.name}" pro ${data.clientName || 'klienta'} byla schválena. Můžete se pustit do práce!`,
        link: '/extra-work',
      });
    }
  };

  const handleReject = () => {
    if (!data) return;
    if (!testMode) updateStoredExtraWorkStatus(data.id, 'rejected');
    setRejectionTime(new Date().toISOString());
    setActionState('rejected');
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
              <h2 className="text-2xl font-bold text-green-700">Děkujeme za schválení! 🎉</h2>
              <p className="text-green-600">Vícepráce byla schválena a práce může začít.</p>
              <div className="mt-4 pt-4 border-t border-green-200 space-y-2 text-sm text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-muted-foreground">Schválil/a:</span>
                  <span className="font-medium">{approvalEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-muted-foreground">Datum:</span>
                  <span className="font-medium">{approvalTime ? new Date(approvalTime).toLocaleString('cs-CZ') : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {actionState === 'rejected' && (
          <Card className="mb-8 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <h2 className="text-2xl font-bold text-red-700">Vícepráce zamítnuta</h2>
              <p className="text-red-600">Děkujeme za vaši odpověď. Budeme vás kontaktovat.</p>
              {rejectionTime && (
                <div className="mt-4 pt-4 border-t border-red-200 text-sm">
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-muted-foreground">Zamítnuto:</span>
                    <span className="font-medium">{new Date(rejectionTime).toLocaleString('cs-CZ')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Schválení vícepráce</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Dobrý den, rádi bychom Vás požádali o schválení následující vícepráce
            {data.engagementName ? ` v rámci zakázky „${data.engagementName}"` : ''}.
            Prosím, prohlédněte si detaily níže a potvrďte svůj souhlas.
          </p>
        </div>

        {/* Context info */}
        {(data.clientName || data.engagementName || data.colleagueName) && (
          <Card className="mb-6">
            <CardContent className="pt-5 pb-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {data.clientName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Klient:</span>
                    <span className="font-medium">{data.clientName}</span>
                  </div>
                )}
                {data.engagementName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Zakázka:</span>
                    <span className="font-medium">{data.engagementName}</span>
                  </div>
                )}
                {data.colleagueName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Zpracoval/a:</span>
                    <span className="font-medium">{data.colleagueName}</span>
                  </div>
                )}
                {data.colleagueEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Kontakt:</span>
                    <a href={`mailto:${data.colleagueEmail}`} className="font-medium text-primary hover:underline">{data.colleagueEmail}</a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{data.name}</h3>
              {data.description && <p className="text-muted-foreground mt-1">{data.description}</p>}
            </div>
            <div className="space-y-2 pt-4 border-t">
              {data.hours_worked && data.hourly_rate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rozsah:</span>
                  <span>{data.hours_worked}h × {formatCurrency(data.hourly_rate)}/h</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Celkem:</span>
                <span className="font-semibold text-lg">{formatCurrency(data.amount, data.currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">Částka je uvedena bez DPH. Po dokončení bude přidána do nejbližší faktury.</p>
            </div>
          </CardContent>
        </Card>

        {actionState === 'idle' && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="approval-email">Váš e-mail <span className="text-destructive">*</span></Label>
                <Input
                  id="approval-email"
                  type="email"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Pro ověření identity zadejte svůj e-mail.</p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agree-approval"
                  checked={agreedToApproval}
                  onCheckedChange={(checked) => setAgreedToApproval(checked === true)}
                />
                <Label htmlFor="agree-approval" className="text-sm leading-snug cursor-pointer">
                  Souhlasím s provedením této vícepráce a jejím zařazením do fakturace.
                </Label>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleApprove}
                disabled={!email || !agreedToApproval}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" /> Schvaluji vícepráci
              </Button>

              {!showRejectForm ? (
                <button
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  onClick={() => setShowRejectForm(true)}
                >
                  Chci vícepráci zamítnout
                </button>
              ) : (
                <div className="space-y-3 pt-2 border-t">
                  <Label>Důvod zamítnutí (volitelné)</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Popište důvod zamítnutí..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleReject} className="flex-1">
                      Potvrdit zamítnutí
                    </Button>
                    <Button variant="outline" onClick={() => setShowRejectForm(false)}>Zpět</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
