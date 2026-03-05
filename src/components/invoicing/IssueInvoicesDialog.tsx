import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCRMData } from '@/hooks/useCRMData';
import type { MonthlyEngagementInvoice, IssuedInvoice } from '@/types/crm';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { invokeWithTimeout } from '@/lib/supabaseUtils';

interface IssueInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: MonthlyEngagementInvoice[];
  year: number;
  month: number;
  onIssueSuccess?: (invoiceIds: string[]) => void;
}

interface IssuedInvoiceInfo {
  invoice_number: string;
  engagement_name: string;
  amount: number;
  currency: string;
  fakturoid_url: string | null;
}

function withPromiseTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function requireCurrency(value: string | null | undefined, context: string): string {
  if (!value) {
    throw new Error(`Missing currency for ${context}`);
  }
  return value;
}

function formatAmountsByCurrency(items: Array<{ amount: number; currency: string }>) {
  if (items.length === 0) return '-';
  const byCurrency = new Map<string, number>();
  items.forEach((item) => {
    byCurrency.set(item.currency, (byCurrency.get(item.currency) ?? 0) + item.amount);
  });
  return Array.from(byCurrency.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) =>
      new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount),
    )
    .join(' + ');
}

export function IssueInvoicesDialog({ 
  open, 
  onOpenChange, 
  invoices,
  year,
  month,
  onIssueSuccess,
}: IssueInvoicesDialogProps) {
  const { toast } = useToast();
  const { createInvoiceWithLineItems, getClientById } = useCRMData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ 
    count: number; 
    totalsByCurrency: Array<{ amount: number; currency: string }>;
    issuedInvoices: IssuedInvoiceInfo[];
  } | null>(null);

  const periodDate = new Date(year, month - 1);
  const periodLabel = format(periodDate, 'LLLL yyyy', { locale: cs });
  const missingFakturoidClients = Array.from(new Set(
    invoices
      .filter((inv) => {
        const client = getClientById(inv.client_id);
        return !client?.fakturoid_subject_id;
      })
      .map((inv) => {
        const client = getClientById(inv.client_id);
        return client?.brand_name || client?.name || inv.engagement_name;
      }),
  ));

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInvoiceCountText = (count: number) => {
    if (count === 1) return '1 faktura byla odeslána';
    if (count >= 2 && count <= 4) return `${count} faktury byly odeslány`;
    return `${count} faktur bylo odesláno`;
  };

  const handleIssue = async () => {
    // Block if any invoice has mixed line-item currencies
    const hasMixedCurrency = invoices.some(inv => {
      const invCurrency = requireCurrency(inv.currency, `invoice ${inv.id}`);
      return inv.line_items.some(item => requireCurrency(item.currency, `line item ${item.id}`) !== invCurrency);
    });
    if (hasMixedCurrency) {
      toast({
        title: 'Smíšené měny',
        description: 'Každá faktura musí mít všechny položky ve stejné měně. Sjednoťte měny před vystavením.',
        variant: 'destructive',
      });
      return;
    }

    if (missingFakturoidClients.length > 0) {
      toast({
        title: 'Chybí propojení klienta s Fakturoid',
        description: `Nelze vystavit faktury, protože klient nemá fakturoid_subject_id: ${missingFakturoidClients.join(', ')}.`,
        variant: 'destructive',
      });
      return;
    }

    const count = invoices.length;
    const totalsByCurrency = invoices.map((inv) => ({
      amount: inv.total_amount,
      currency: requireCurrency(inv.currency, `invoice ${inv.id}`),
    }));

    setIsSubmitting(true);

    const issuedInvoiceInfos: IssuedInvoiceInfo[] = [];
    const successfullyIssuedDraftIds: string[] = [];

    try {
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      const client = getClientById(invoice.client_id);

      // Extract extra work IDs, one-off service IDs, and Creative Boost client month IDs from line items
      const extraWorkIds: string[] = [];
      const oneOffServiceIds: string[] = [];
      const creativeBoostClientMonthIds: string[] = [];

      invoice.line_items.forEach(item => {
        if (item.extra_work_id) {
          extraWorkIds.push(item.extra_work_id);
        }
        if (item.engagement_service_id) {
          oneOffServiceIds.push(item.engagement_service_id);
        }
        if (item.creative_boost_client_month_id) {
          creativeBoostClientMonthIds.push(item.creative_boost_client_month_id);
        }
      });

      // Prepare line items without invoice_id (will be set by createInvoiceWithLineItems)
      const lineItemsWithoutInvoiceId = invoice.line_items.map(item => {
        const { id, invoice_id, created_at, updated_at, ...rest } = item;
        return rest;
      });

      // First create the invoice locally (without Fakturoid IDs yet)
      const invoiceData: Omit<IssuedInvoice, 'id' | 'created_at' | 'invoice_number'> = {
        engagement_id: invoice.engagement_id,
        engagement_name: invoice.engagement_name,
        client_id: invoice.client_id,
        client_name: client?.brand_name || client?.name || 'Neznámý klient',
        year: invoice.year,
        month: invoice.month,
        fakturoid_id: null,
        fakturoid_url: null,
        line_items: invoice.line_items,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        issued_at: new Date().toISOString(),
        issued_by: null,
      };

      const createdInvoice = await withPromiseTimeout(
        createInvoiceWithLineItems(
          invoiceData,
          lineItemsWithoutInvoiceId,
          extraWorkIds,
          oneOffServiceIds,
          creativeBoostClientMonthIds
        ),
        30000,
        'createInvoiceWithLineItems',
      );

      // Push to Fakturoid (blocking).
      const { data: fakturoidResult, error: fakturoidError } = await invokeWithTimeout<{
        success?: boolean;
        partial_success?: boolean;
        fakturoid_url?: string;
        error?: string;
      }>(
        'fakturoid-create-invoice',
        { body: { invoice_id: createdInvoice.id } },
        30000,
      );

      const isFakturoidFailure = !!fakturoidError || !!fakturoidResult?.error || !fakturoidResult?.success;
      if (isFakturoidFailure) {
        // Roll back local invoice to keep "issued" state strictly tied to successful export.
        const { data: rollbackResult, error: rollbackError } = await invokeWithTimeout<{
          success?: boolean;
          error?: string;
        }>(
          'rollback-issued-invoice',
          { body: { invoice_id: createdInvoice.id, reason: 'fakturoid_export_failed' } },
          30000,
        );

        const fakturoidDetail = fakturoidResult?.error || fakturoidError?.message || 'Neznámá chyba';
        if (rollbackError || rollbackResult?.error || !rollbackResult?.success) {
          const rollbackDetail = rollbackResult?.error || rollbackError?.message || 'Neznámá chyba rollbacku';
          throw new Error(
            `Fakturoid export selhal u faktury ${createdInvoice.invoice_number} (${fakturoidDetail}) a rollback také selhal (${rollbackDetail}).`,
          );
        }

        throw new Error(
          `Fakturoid export selhal u faktury ${createdInvoice.invoice_number} (${fakturoidDetail}). Lokální vystavení bylo vráceno zpět.`,
        );
      }

      issuedInvoiceInfos.push({
        invoice_number: createdInvoice.invoice_number,
        engagement_name: invoice.engagement_name,
        amount: invoice.total_amount,
        currency: requireCurrency(invoice.currency, `invoice ${invoice.id}`),
        fakturoid_url: fakturoidResult.fakturoid_url ?? null,
      });
      successfullyIssuedDraftIds.push(invoice.id);
    }
    } catch (error: unknown) {
      console.error('Failed to issue invoices:', error);
      setIsSubmitting(false);

      // Check for duplicate key error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isDuplicateKey = errorMessage.includes('duplicate key') || errorMessage.includes('23505');

      if (isDuplicateKey) {
        toast({
          title: 'Duplicitní číslo faktury',
          description: 'Číslo faktury již existuje. Obnovte stránku a zkuste to znovu.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Chyba při vystavování faktur',
          description: errorMessage || 'Nepodařilo se vystavit faktury.',
          variant: 'destructive',
        });
      }
      return;
    }

    setIsSubmitting(false);

    // Store data for success screen
    setSuccessData({ count, totalsByCurrency, issuedInvoices: issuedInvoiceInfos });
    setIsSuccess(true);

    // Call success callback with invoice IDs
    if (onIssueSuccess) {
      onIssueSuccess(successfullyIssuedDraftIds);
    }

    toast({
      title: 'Faktury vystaveny',
      description: `Úspěšně vystaveno ${count} faktur do Fakturoid.`,
    });
  };

  const handleClose = () => {
    setIsSuccess(false);
    setSuccessData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vystavit faktury</DialogTitle>
          <DialogDescription>
            Vystavení faktur za období {periodLabel}
          </DialogDescription>
        </DialogHeader>

        {isSuccess && successData ? (
          <div className="py-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3 animate-bounce">
                🎉
              </div>
              
              <div className="animate-scale-in">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              </div>
              
              <h3 className="text-lg font-semibold mb-1">
                Faktury úspěšně vystaveny!
              </h3>
              
              <p className="text-muted-foreground text-sm">
                {getInvoiceCountText(successData.count)} do fakturačního systému.
              </p>
              
              <p className="text-lg font-medium mt-2 text-green-600">
                {formatAmountsByCurrency(successData.totalsByCurrency)}
              </p>
            </div>

            {/* List of issued invoices with Fakturoid links */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {successData.issuedInvoices.map((inv) => (
                <div
                  key={inv.invoice_number}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.engagement_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{formatCurrency(inv.amount, inv.currency)}</span>
                    {inv.fakturoid_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => window.open(inv.fakturoid_url!, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Fakturoid
                      </Button>
                    ) : (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Chybí odkaz
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                Bude vystaveno <strong>{invoices.length} faktur</strong> v celkové hodnotě{' '}
                <strong>{formatAmountsByCurrency(
                  invoices.map((inv) => ({
                    amount: inv.total_amount,
                    currency: requireCurrency(inv.currency, `invoice ${inv.id}`),
                  })),
                )}</strong>.
              </AlertDescription>
            </Alert>
            {missingFakturoidClients.length > 0 && (
              <Alert className="border-destructive/30 bg-destructive/5">
                <AlertDescription className="text-destructive">
                  Nelze pokračovat: klient nemá propojení na Fakturoid (`fakturoid_subject_id`): {missingFakturoidClients.join(', ')}.
                  Nejprve propojte klienta ve Fakturoid.
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Opravdu chcete vystavit tyto faktury? Budou uloženy do historie s propojením na Fakturoid.
            </p>
          </div>
        )}

        <DialogFooter>
          {isSuccess ? (
            <Button onClick={handleClose}>Zavřít</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Zrušit
              </Button>
              <Button onClick={handleIssue} disabled={isSubmitting || missingFakturoidClients.length > 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vystavuji...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {missingFakturoidClients.length > 0 ? 'Nelze vystavit' : 'Potvrdit a vystavit'}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}