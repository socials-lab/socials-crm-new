import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, ExternalLink, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useCRMData } from '@/hooks/useCRMData';
import { Link } from 'react-router-dom';

export function InvoiceHistory() {
  const { issuedInvoices, getIssuedInvoicesByYear } = useCRMData();
  const [selectedYear, setSelectedYear] = useState('2024');

  const formatCurrency = (amount: number, currency: string = 'CZK') => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    return format(new Date(2024, month - 1), 'LLLL', { locale: cs });
  };

  const filteredHistory = useMemo(() => {
    return getIssuedInvoicesByYear(parseInt(selectedYear))
      .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  }, [selectedYear, getIssuedInvoicesByYear]);

  // Group by month for summary
  const monthlyStats = useMemo(() => {
    const stats = new Map<number, { count: number; amount: number }>();
    
    filteredHistory.forEach(inv => {
      const existing = stats.get(inv.month) || { count: 0, amount: 0 };
      stats.set(inv.month, {
        count: existing.count + 1,
        amount: existing.amount + inv.total_amount,
      });
    });
    
    return stats;
  }, [filteredHistory]);

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set(issuedInvoices.map(inv => inv.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [issuedInvoices]);

  const totalYear = filteredHistory.reduce((sum, inv) => sum + inv.total_amount, 0);
  const avgMonthly = monthlyStats.size > 0 ? totalYear / monthlyStats.size : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Historie fakturace</h3>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.length > 0 ? (
              availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Žádná historie pro vybraný rok</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Celkem za rok {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalYear)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Průměr měsíčně
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(avgMonthly)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vystavených faktur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{filteredHistory.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* History table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo faktury</TableHead>
                  <TableHead>Zakázka</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Období</TableHead>
                  <TableHead className="text-right">Částka</TableHead>
                  <TableHead className="text-center">Datum vystavení</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.fakturoid_url ? (
                        <a 
                          href={invoice.fakturoid_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {invoice.invoice_number}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        invoice.invoice_number
                      )}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/engagements?highlight=${invoice.engagement_id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.engagement_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/clients?highlight=${invoice.client_id}`}
                        className="hover:underline"
                      >
                        {invoice.client_name}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">
                      {getMonthName(invoice.month)} {invoice.year}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      {format(new Date(invoice.issued_at), 'd.M.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {invoice.fakturoid_url && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => window.open(invoice.fakturoid_url!, '_blank')}
                            title="Otevřít ve Fakturoidu"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          title="Zobrazit detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Monthly summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Měsíční přehled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(monthNum => {
                  const stats = monthlyStats.get(monthNum);
                  return (
                    <div 
                      key={monthNum}
                      className={`p-3 rounded-lg border ${stats ? 'bg-green-50 border-green-200' : 'bg-muted/30 border-transparent'}`}
                    >
                      <p className="text-xs text-muted-foreground capitalize">
                        {getMonthName(monthNum)}
                      </p>
                      {stats ? (
                        <>
                          <p className="font-medium text-sm">{formatCurrency(stats.amount)}</p>
                          <p className="text-xs text-muted-foreground">{stats.count} faktur</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">-</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}