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
import { supabase } from '@/integrations/supabase/client';
import type { MonthlyEngagementInvoice, IssuedInvoice } from '@/types/crm';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

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
  fakturoid_url: string | null;
  fakturoid_failed: boolean;
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
    amount: number;
    issuedInvoices: IssuedInvoiceInfo[];
  } | null>(null);

  const periodDate = new Date(year, month - 1);
  const periodLabel = format(periodDate, 'LLLL yyyy', { locale: cs });

  const formatCurrency = (amount: number, currency: string = 'CZK') => {
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
    const count = invoices.length;
    const amount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    setIsSubmitting(true);

    const issuedInvoiceInfos: IssuedInvoiceInfo[] = [];
    let fakturoidFailures = 0;

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

      const createdInvoice = await createInvoiceWithLineItems(
        invoiceData,
        lineItemsWithoutInvoiceId,
        extraWorkIds,
        oneOffServiceIds,
        creativeBoostClientMonthIds
      );

      // Now push to Fakturoid
      let fakturoidUrl: string | null = null;
      let fakturoidFailed = false;

      try {
        const { data: fakturoidResult, error: fakturoidError } = await supabase.functions.invoke(
          'fakturoid-create-invoice',
          { body: { invoice_id: createdInvoice.id } }
        );

        if (fakturoidError || fakturoidResult?.error) {
          console.warn(`Fakturoid failed for invoice ${createdInvoice.invoice_number}:`, fakturoidError || fakturoidResult?.error);
          fakturoidFailed = true;
          fakturoidFailures++;
        } else if (fakturoidResult?.success) {
          fakturoidUrl = fakturoidResult.fakturoid_url;
        }
      } catch (err) {
        console.warn(`Fakturoid error for invoice ${createdInvoice.invoice_number}:`, err);
        fakturoidFailed = true;
        fakturoidFailures++;
      }

      issuedInvoiceInfos.push({
        invoice_number: createdInvoice.invoice_number,
        engagement_name: invoice.engagement_name,
        amount: invoice.total_amount,
        fakturoid_url: fakturoidUrl,
        fakturoid_failed: fakturoidFailed,
      });
    }

    setIsSubmitting(false);

    // Store data for success screen
    setSuccessData({ count, amount, issuedInvoices: issuedInvoiceInfos });
    setIsSuccess(true);

    // Call success callback with invoice IDs
    if (onIssueSuccess) {
      onIssueSuccess(invoices.map(inv => inv.id));
    }

    if (fakturoidFailures > 0) {
      toast({
        title: 'Faktury vystaveny s varováním',
        description: `Vystaveno ${count} faktur, ale ${fakturoidFailures} se nepodařilo odeslat do Fakturoid.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Faktury vystaveny',
        description: `Úspěšně vystaveno ${count} faktur do Fakturoid.`,
      });
    }
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
                {formatCurrency(successData.amount)}
              </p>
            </div>

            {/* List of issued invoices with Fakturoid links */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {successData.issuedInvoices.map((inv) => (
                <div
                  key={inv.invoice_number}
                  className={`flex items-center justify-between p-3 rounded-lg ${inv.fakturoid_failed ? 'bg-orange-50 border border-orange-200' : 'bg-muted/50'}`}
                >
                  <div>
                    <p className="font-medium text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.engagement_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{formatCurrency(inv.amount)}</span>
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
                        Nutno odeslat ručně
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
                <strong>{formatCurrency(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}</strong>.
              </AlertDescription>
            </Alert>

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
              <Button onClick={handleIssue} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vystavuji...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Potvrdit a vystavit
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