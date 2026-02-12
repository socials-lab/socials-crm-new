import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import socialsLogo from '@/assets/socials-logo.png';
import { supabase } from '@/integrations/supabase/client';

interface ExtraWorkData {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  hours_worked: number | null;
  hourly_rate: number | null;
  status: string;
  clients: { name: string; brand_name: string | null } | null;
  engagements: { name: string } | null;
  colleagues: { full_name: string } | null;
}

export default function ExtraWorkApproval() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ExtraWorkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<'idle' | 'approved' | 'rejected' | 'submitting'>('idle');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }

    const fetchData = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke('send-extra-work-approval', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: undefined,
        });

        // Edge function GET with query params isn't straightforward with invoke, so use fetch directly
        const res = await fetch(
          `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/send-extra-work-approval?action=get-by-token&token=${token}`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ',
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) { setIsLoading(false); return; }
        const json = await res.json();
        
        if (json.data) {
          setData(json.data);
          const s = json.data.status;
          if (s === 'in_progress' || s === 'ready_to_invoice' || s === 'invoiced') {
            setActionState('approved');
          } else if (s === 'rejected') {
            setActionState('rejected');
          }
        }
      } catch (err) {
        console.error('Error fetching extra work:', err);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [token]);

  const handleApprove = async () => {
    if (!token) return;
    setActionState('submitting');
    try {
      const res = await fetch(
        `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/send-extra-work-approval?action=approve`,
        {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }
      );
      if (res.ok) {
        setActionState('approved');
      } else {
        setActionState('idle');
      }
    } catch {
      setActionState('idle');
    }
  };

  const handleReject = async () => {
    if (!token) return;
    setActionState('submitting');
    try {
      const res = await fetch(
        `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/send-extra-work-approval?action=reject`,
        {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, reason: rejectionReason }),
        }
      );
      if (res.ok) {
        setActionState('rejected');
      } else {
        setActionState('idle');
      }
    } catch {
      setActionState('idle');
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

  const clientName = data.clients?.brand_name || data.clients?.name || '';
  const engagementName = data.engagements?.name || '';
  const colleagueName = data.colleagues?.full_name || '';

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
            Pro: <span className="font-medium text-foreground">{clientName}</span>
            {engagementName && (
              <> – <span className="font-medium text-foreground">{engagementName}</span></>
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
              {colleagueName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Řešitel:</span>
                  <span>{colleagueName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(actionState === 'idle' || actionState === 'submitting') && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <Button size="lg" className="flex-1" onClick={handleApprove} disabled={actionState === 'submitting'}>
                    {actionState === 'submitting' ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                    Schvaluji vícepráci
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1" onClick={() => setShowRejectForm(true)} disabled={actionState === 'submitting'}>
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
                    <Button variant="destructive" onClick={handleReject} className="flex-1" disabled={actionState === 'submitting'}>
                      {actionState === 'submitting' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Potvrdit zamítnutí
                    </Button>
                    <Button variant="outline" onClick={() => setShowRejectForm(false)} disabled={actionState === 'submitting'}>Zpět</Button>
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
