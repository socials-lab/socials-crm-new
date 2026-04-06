import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TopPaidClient {
  clientId: string;
  clientName: string;
  paidTotalCzk: number;
  paidTotalEurOriginal: number;
  paidInvoiceCount: number;
  lastPaidAt: string | null;
}

interface LongTermAnalyticsProps {
  topPaidClientsAllTime: TopPaidClient[];
  avgClientRetentionMonths: number;
  avgClientLtvCzk: number;
  avgInvoicesPerClient: number;
  clientsWithInvoicesCount: number;
  firstInvoiceDate: string | null;
  lastInvoiceDate: string | null;
  totalInvoicesInScope: number;
  assumedMarginPercent: number;
  avgEstimatedProfitPerClientCzk: number;
}

export function LongTermAnalytics({
  topPaidClientsAllTime,
  avgClientRetentionMonths,
  avgClientLtvCzk,
  avgInvoicesPerClient,
  clientsWithInvoicesCount,
  firstInvoiceDate,
  lastInvoiceDate,
  totalInvoicesInScope,
  assumedMarginPercent,
  avgEstimatedProfitPerClientCzk,
}: LongTermAnalyticsProps) {
  const totalPaidAllTime = topPaidClientsAllTime.reduce((sum, client) => sum + client.paidTotalCzk, 0);
  const totalPaidInvoices = topPaidClientsAllTime.reduce((sum, client) => sum + client.paidInvoiceCount, 0);
  const formatDate = (isoDate: string | null) => (isoDate ? new Date(isoDate).toLocaleDateString('cs-CZ') : '—');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Dlouhodobé metriky klientů ve Fakturoidu</CardTitle>
          <p className="text-xs text-muted-foreground pt-1">
            Počítáno jen pro klienty s alespoň 3 vystavenými fakturami (jednorázové zakázky jsou vynechané).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Průměrná délka fakturační historie klienta</div>
              <div className="text-lg font-semibold">{avgClientRetentionMonths.toFixed(1)} měs.</div>
              <div className="text-[11px] text-muted-foreground">z {clientsWithInvoicesCount} klientů ve Fakturoidu</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Průměrné LTV</div>
              <div className="text-lg font-semibold">{Math.round(avgClientLtvCzk).toLocaleString('cs-CZ')} Kč</div>
              <div className="text-[11px] text-muted-foreground">z {clientsWithInvoicesCount} klientů ve Fakturoidu</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Průměrný počet vystavených faktur / klient</div>
              <div className="text-lg font-semibold">{avgInvoicesPerClient.toFixed(1)}</div>
              <div className="text-[11px] text-muted-foreground">z {clientsWithInvoicesCount} klientů ve Fakturoidu</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">
                Průměrný odhadovaný zisk na klienta (LTV × {assumedMarginPercent.toFixed(0)} %)
              </div>
              <div className="text-lg font-semibold">
                {Math.round(avgEstimatedProfitPerClientCzk).toLocaleString('cs-CZ')} Kč
              </div>
              <div className="text-[11px] text-muted-foreground">z {clientsWithInvoicesCount} klientů ve Fakturoidu</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Počítáno od: {formatDate(firstInvoiceDate)}</Badge>
            <Badge variant="outline">Data do: {formatDate(lastInvoiceDate)}</Badge>
            <Badge variant="outline">Faktur v rozsahu: {totalInvoicesInScope}</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            „Počítáno od“ odpovídá nejstarší vystavené faktuře, která je v CRM po synchronizaci z Fakturoidu.
            Pokud začíná až v roce 2023 nebo později, chybí vám v databázi starší roky — po úplné synchronizaci
            historie (Finance → Faktury → manuálně synchronizovat) se rozsah natáhne i na klienty od roku 2022
            a dříve, pokud je máte ve Fakturoidu.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-base font-medium">Nejhodnotnější klienti dlouhodobě (zaplaceno)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Stejně jako metriky výše — jen klienti s ≥ 3 vystavenými fakturami.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">All-time zaplaceno: {Math.round(totalPaidAllTime).toLocaleString('cs-CZ')} Kč</Badge>
              <Badge variant="outline">Zaplacených faktur: {totalPaidInvoices}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">Celkem zaplaceno</TableHead>
                  <TableHead className="text-right">Počet zaplacených faktur</TableHead>
                  <TableHead className="text-right">Poslední úhrada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPaidClientsAllTime.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Žádná data o zaplacených fakturách.
                    </TableCell>
                  </TableRow>
                ) : (
                  topPaidClientsAllTime.map((client) => (
                    <TableRow key={client.clientId}>
                      <TableCell className="font-medium">{client.clientName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span>{Math.round(client.paidTotalCzk).toLocaleString('cs-CZ')} Kč</span>
                          {client.paidTotalEurOriginal > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              z {client.paidTotalEurOriginal.toLocaleString('cs-CZ')} EUR
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{client.paidInvoiceCount}</TableCell>
                      <TableCell className="text-right">
                        {client.lastPaidAt ? new Date(client.lastPaidAt).toLocaleDateString('cs-CZ') : '—'}
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
