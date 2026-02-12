import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import socialsLogo from '@/assets/socials-logo.png';
import { getApprovalByToken } from '@/components/extra-work/SendApprovalDialog';

// Read extra works from the react-query cache via a global helper
// Since this is a public page without CRM context, we read from localStorage
const EXTRA_WORKS_CACHE_KEY = 'extra_work_approval_data';

interface ExtraWorkApprovalData {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  hours_worked: number | null;
  hourly_rate: number | null;
  status: string;
  client_name: string;
  engagement_name: string;
  colleague_name: string;
}

// Store extra work data for public page access
export function storeExtraWorkForApproval(data: ExtraWorkApprovalData) {
  const stored = getStoredExtraWorks();
  const idx = stored.findIndex(s => s.id === data.id);
  if (idx >= 0) stored[idx] = data;
  else stored.push(data);
  localStorage.setItem(EXTRA_WORKS_CACHE_KEY, JSON.stringify(stored));
}

function getStoredExtraWorks(): ExtraWorkApprovalData[] {
  try {
    return JSON.parse(localStorage.getItem(EXTRA_WORKS_CACHE_KEY) || '[]');
  } catch { return []; }
}

function updateStoredExtraWorkStatus(id: string, status: string, rejectionReason?: string) {
  const stored = getStoredExtraWorks();
  const idx = stored.findIndex(s => s.id === id);
  if (idx >= 0) {
    stored[idx].status = status;
    localStorage.setItem(EXTRA_WORKS_CACHE_KEY, JSON.stringify(stored));
  }
}

export default function ExtraWorkApproval() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ExtraWorkApprovalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
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
  }, [token]);

  const handleApprove = () => {
    if (!data) return;
    updateStoredExtraWorkStatus(data.id, 'in_progress');
    setActionState('approved');
  };

  const handleReject = () => {
    if (!data) return;
    updateStoredExtraWorkStatus(data.id, 'rejected', rejectionReason);
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
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Děkujeme za schválení! 🎉</h2>
              <p className="text-green-600">Vícepráce byla schválena a práce může začít.</p>
            </CardContent>
          </Card>
        )}

        {actionState === 'rejected' && (
          <Card className="mb-8 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
            <CardContent className="pt-8 pb-8 text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-2">Vícepráce zamítnuta</h2>
              <p className="text-red-600">Děkujeme za vaši odpověď. Budeme vás kontaktovat.</p>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Schválení vícepráce</h1>
          <p className="text-muted-foreground">
            Pro: <span className="font-medium text-foreground">{data.client_name}</span>
            {data.engagement_name && (
              <> – <span className="font-medium text-foreground">{data.engagement_name}</span></>
            )}
          </p>
        </div>

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
              {data.colleague_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Řešitel:</span>
                  <span>{data.colleague_name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {actionState === 'idle' && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <Button size="lg" className="flex-1" onClick={handleApprove}>
                    <CheckCircle2 className="h-5 w-5 mr-2" /> Schvaluji vícepráci
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1" onClick={() => setShowRejectForm(true)}>
                    <XCircle className="h-5 w-5 mr-2" /> Zamítnout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
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
