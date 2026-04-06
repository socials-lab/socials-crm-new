import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { invokeWithTimeout } from '@/lib/supabaseUtils';
import { toast } from 'sonner';

type PaymentState = 'paid' | 'unpaid' | 'overdue';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  fakturoidId: string | null;
  engagementName: string;
  clientName: string;
  totalAmount: number;
  currency: string;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  paymentState: PaymentState;
  sourceStatus: string;
  daysUnpaid: number;
  daysOverdue: number;
  fakturoidUrl: string | null;
}

interface ManualSyncResponse {
  success: boolean;
  inserted?: number;
  updated?: number;
  skipped?: number;
  fakturoid_invoices_fetched?: number;
  include_all_fakturoid_account?: boolean;
  errors?: Array<{ client_id: string; invoice_number?: string; message: string }>;
}

export default function FinanceInvoices() {
  const queryClient = useQueryClient();
  const { issuedInvoices, clients } = useCRMData();
  const { canAccessPage } = useUserRole();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentState>('all');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const getInvoiceSortValue = (invoiceNumber: string) => {
    // Fakturoid numeric format: 20260076
    if (/^\d+$/.test(invoiceNumber)) {
      return Number(invoiceNumber);
    }

    // Legacy/internal format: FV-2026-016
    const legacyMatch = invoiceNumber.match(/^FV-(\d{4})-(\d+)$/i);
    if (legacyMatch) {
      const year = Number(legacyMatch[1]);
      const sequence = Number(legacyMatch[2]);
      return year * 100000 + sequence;
    }

    return Number.NEGATIVE_INFINITY;
  };

  const invoices = useMemo<InvoiceRow[]>(() => {
    const latestInvoicesByExternalKey = new Map<string, (typeof issuedInvoices)[number]>();
    issuedInvoices.forEach((invoice) => {
      const externalKey = invoice.fakturoid_id
        ? `f-${invoice.fakturoid_id}`
        : `n-${invoice.invoice_number}`;
      const existing = latestInvoicesByExternalKey.get(externalKey);
      if (!existing) {
        latestInvoicesByExternalKey.set(externalKey, invoice);
        return;
      }
      const existingTime = new Date(existing.created_at || existing.issued_at).getTime();
      const invoiceTime = new Date(invoice.created_at || invoice.issued_at).getTime();
      if (!Number.isFinite(existingTime) || (Number.isFinite(invoiceTime) && invoiceTime > existingTime)) {
        latestInvoicesByExternalKey.set(externalKey, invoice);
      }
    });

    const now = new Date();
    return Array.from(latestInvoicesByExternalKey.values())
      .filter((invoice) => Boolean(invoice.fakturoid_id || invoice.fakturoid_url))
      .map((invoice) => {
        const issuedAtDate = new Date(invoice.issued_at);
        const issuedAtValid = Number.isFinite(issuedAtDate.getTime());
        const dueAtDate = issuedAtValid ? addDays(issuedAtDate, 14) : null;
        const paidAtDate = invoice.paid_at ? new Date(invoice.paid_at) : null;
        const paidAtValid = !!paidAtDate && Number.isFinite(paidAtDate.getTime());
        const normalizedStatus = String(invoice.status || '').toLowerCase();

        const isPaid = normalizedStatus === 'paid' || paidAtValid;
        const isOverdue = !isPaid && !!dueAtDate && now > dueAtDate;
        const paymentState: PaymentState = isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid';

        const unpaidUntil = isPaid && paidAtDate ? paidAtDate : now;
        const daysUnpaid = issuedAtValid ? Math.max(0, differenceInCalendarDays(unpaidUntil, issuedAtDate)) : 0;
        const daysOverdue = !isPaid && dueAtDate ? Math.max(0, differenceInCalendarDays(now, dueAtDate)) : 0;

        const legalClientName = invoice.client_id
          ? (clients.find((client) => client.id === invoice.client_id)?.name || null)
          : null;

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          fakturoidId: invoice.fakturoid_id || null,
          engagementName: invoice.engagement_name || 'Neznámá zakázka',
          clientName: legalClientName || invoice.client_name || 'Neznámý klient',
          totalAmount: invoice.total_amount,
          currency: invoice.currency,
          issuedAt: invoice.issued_at,
          dueAt: dueAtDate ? dueAtDate.toISOString() : invoice.issued_at,
          paidAt: invoice.paid_at || null,
          paymentState,
          sourceStatus: normalizedStatus || 'unknown',
          daysUnpaid,
          daysOverdue,
          fakturoidUrl: invoice.fakturoid_url || null,
        };
      })
      .sort((a, b) => {
        const aSort = getInvoiceSortValue(a.invoiceNumber);
        const bSort = getInvoiceSortValue(b.invoiceNumber);
        if (aSort !== bSort) return bSort - aSort;
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });
  }, [issuedInvoices, clients]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
        invoice.engagementName.toLowerCase().includes(normalizedSearch) ||
        invoice.clientName.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || invoice.paymentState === statusFilter;
      const matchesOverdueCheckbox = !onlyOverdue || invoice.paymentState === 'overdue';
      return matchesSearch && matchesStatus && matchesOverdueCheckbox;
    });
  }, [invoices, search, statusFilter, onlyOverdue]);

  const stats = useMemo(() => {
    const paid = invoices.filter((invoice) => invoice.paymentState === 'paid').length;
    const unpaid = invoices.filter((invoice) => invoice.paymentState === 'unpaid').length;
    const overdue = invoices.filter((invoice) => invoice.paymentState === 'overdue').length;
    return {
      total: invoices.length,
      paid,
      unpaid,
      overdue,
    };
  }, [invoices]);

  const paymentSpeedStats = useMemo(() => {
    const paidWithDates = invoices.filter((invoice) => {
      if (!invoice.paidAt) return false;
      const issued = new Date(invoice.issuedAt);
      const paid = new Date(invoice.paidAt);
      return Number.isFinite(issued.getTime()) && Number.isFinite(paid.getTime());
    });

    if (paidWithDates.length === 0) {
      return { averageDays: null as number | null, sampleSize: 0 };
    }

    const totalDays = paidWithDates.reduce((sum, invoice) => {
      const issued = new Date(invoice.issuedAt);
      const paid = new Date(invoice.paidAt!);
      return sum + Math.max(0, differenceInCalendarDays(paid, issued));
    }, 0);

    return {
      averageDays: totalDays / paidWithDates.length,
      sampleSize: paidWithDates.length,
    };
  }, [invoices]);

  const paymentSpeedByClient = useMemo(() => {
    const buckets = new Map<string, { totalDays: number; count: number }>();

    invoices.forEach((invoice) => {
      if (!invoice.paidAt) return;
      const issued = new Date(invoice.issuedAt);
      const paid = new Date(invoice.paidAt);
      if (!Number.isFinite(issued.getTime()) || !Number.isFinite(paid.getTime())) return;

      const days = Math.max(0, differenceInCalendarDays(paid, issued));
      const existing = buckets.get(invoice.clientName) || { totalDays: 0, count: 0 };
      existing.totalDays += days;
      existing.count += 1;
      buckets.set(invoice.clientName, existing);
    });

    const result = new Map<string, number>();
    buckets.forEach((value, key) => {
      if (value.count > 0) {
        result.set(key, value.totalDays / value.count);
      }
    });
    return result;
  }, [invoices]);

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    if (!Number.isFinite(date.getTime())) return '—';
    return date.toLocaleDateString('cs-CZ');
  };

  const renderPaymentBadge = (paymentState: PaymentState) => {
    if (paymentState === 'paid') {
      return <Badge className="bg-status-active text-white">Proplaceno</Badge>;
    }
    if (paymentState === 'overdue') {
      return <Badge variant="destructive">Po splatnosti</Badge>;
    }
    return <Badge variant="secondary">Neproplaceno</Badge>;
  };

  const getFakturoidEditUrl = (invoice: InvoiceRow) => {
    if (!invoice.fakturoidId) return invoice.fakturoidUrl;
    const slugMatch = invoice.fakturoidUrl?.match(/^https?:\/\/app\.fakturoid\.cz\/([^/]+)/i);
    const accountSlug = slugMatch?.[1] || 'socialsadvertising';
    return `https://app.fakturoid.cz/${accountSlug}/invoices/${invoice.fakturoidId}/edit`;
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const { data, error } = await invokeWithTimeout<ManualSyncResponse>('fakturoid-import-historical-invoices', {
        body: {
          dry_run: false,
          /** Celý účet Fakturoid + všechny klienti v CRM pro mapování (ne jen aktivní). */
          include_all_fakturoid_account: true,
          only_active_clients: false,
        },
      }, 600000);

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error('Synchronizace faktur selhala.');
      }

      const inserted = data.inserted || 0;
      const updated = data.updated || 0;
      const skipped = data.skipped || 0;
      const fetched = data.fakturoid_invoices_fetched;
      const errorsCount = data.errors?.length || 0;

      await queryClient.invalidateQueries({ queryKey: ['issued_invoices'] });

      const fetchedHint =
        typeof fetched === 'number' ? ` Načteno z Fakturoidu: ${fetched} dokladů.` : '';

      if (inserted === 0 && updated === 0) {
        toast.success(
          `Synchronizace dokončena: žádné změny v CRM (+0 nových, 0 aktualizací).${fetchedHint} Všechny tyto faktury už v databázi máte.`,
          { duration: 8000 },
        );
      } else {
        toast.success(
          `Synchronizace dokončena: +${inserted} nových, ${updated} aktualizovaných, ${skipped} beze změny.${fetchedHint}`,
        );
      }
      if (errorsCount > 0) {
        toast.error(`Synchronizace obsahuje ${errorsCount} chyb. Zkontroluj integration log.`);
      }
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : 'Synchronizace faktur selhala';
      const normalized = message.toLowerCase();
      if (normalized.includes('failed to send request to the edge function')) {
        toast.error('Synchronizaci se nepodařilo odeslat. Zkontrolujte připojení a zkuste to prosím znovu.', {
          description: 'Import běží dlouho; pokud chyba přetrvá, dejte vědět a spustím sync ručně.',
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsManualSyncing(false);
    }
  };

  if (!canAccessPage('finance-invoices')) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Přístup odepřen</h2>
          <p className="text-muted-foreground">Nemáte oprávnění k zobrazení tohoto modulu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in p-4 sm:space-y-6 sm:p-6">
      <PageHeader
        title="Finance"
        titleAccent="faktury"
        description="Všechny faktury z Fakturoidu navázané na zakázky a jejich stav úhrad."
      />

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base font-medium">Přehled úhrad faktur</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Celkem: {stats.total}</Badge>
                <Badge className="bg-status-active text-white">Proplacené: {stats.paid}</Badge>
                <Badge variant="secondary">Neproplacené: {stats.unpaid}</Badge>
                <Badge variant="destructive">Po splatnosti: {stats.overdue}</Badge>
                <Badge variant="outline">
                  Průměrná úhrada:{' '}
                  {paymentSpeedStats.averageDays === null
                    ? '—'
                    : `${paymentSpeedStats.averageDays.toFixed(1)} dne`}
                  {paymentSpeedStats.sampleSize > 0 ? ` (z ${paymentSpeedStats.sampleSize} faktur)` : ''}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="ml-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isManualSyncing ? 'animate-spin' : ''}`} />
                Manuálně synchronizovat faktury
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Hledat číslo faktury, zakázku nebo klienta..."
              className="sm:max-w-md"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | PaymentState)}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Stav úhrady" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Všechny</SelectItem>
                <SelectItem value="paid">Proplacené</SelectItem>
                <SelectItem value="unpaid">Neproplacené</SelectItem>
                <SelectItem value="overdue">Po splatnosti</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Checkbox
                id="only-overdue"
                checked={onlyOverdue}
                onCheckedChange={(checked) => setOnlyOverdue(Boolean(checked))}
              />
              <Label htmlFor="only-overdue" className="text-sm cursor-pointer">
                Jen po splatnosti
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faktura</TableHead>
                  <TableHead>Zakázka</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">Částka</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Vystaveno</TableHead>
                  <TableHead>Splatnost</TableHead>
                  <TableHead>Proplaceno</TableHead>
                  <TableHead className="text-right">Dní neproplaceno</TableHead>
                  <TableHead className="text-right">Dní po splatnosti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Žádné faktury pro zvolený filtr.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{invoice.invoiceNumber}</span>
                          {invoice.fakturoidUrl && (
                            <a
                              href={invoice.fakturoidUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="Otevřít ve Fakturoidu"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {getFakturoidEditUrl(invoice) && (
                            <Button variant="outline" size="sm" asChild className="h-7 px-2 text-xs">
                              <a href={getFakturoidEditUrl(invoice)!} target="_blank" rel="noreferrer">
                                Upravit fakturu
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.engagementName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex flex-col">
                          <span>
                            {invoice.clientName}
                            {(paymentSpeedByClient.get(invoice.clientName) || 0) > 20 ? ' ❗' : ''}
                          </span>
                          {paymentSpeedByClient.has(invoice.clientName) && (
                            <span className="text-[11px] text-muted-foreground">
                              (průměrně platí {paymentSpeedByClient.get(invoice.clientName)!.toFixed(1)} dnů po vystavení)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.totalAmount.toLocaleString('cs-CZ')} {invoice.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {renderPaymentBadge(invoice.paymentState)}
                          {invoice.sourceStatus && (
                            <span className="text-[11px] text-muted-foreground">Fakturoid: {invoice.sourceStatus}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                      <TableCell>{formatDate(invoice.dueAt)}</TableCell>
                      <TableCell>{formatDate(invoice.paidAt)}</TableCell>
                      <TableCell className="text-right">{invoice.paymentState === 'paid' ? '0' : invoice.daysUnpaid}</TableCell>
                      <TableCell className="text-right">
                        {invoice.paymentState === 'overdue' ? (
                          <span className="text-destructive font-medium">{invoice.daysOverdue}</span>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
