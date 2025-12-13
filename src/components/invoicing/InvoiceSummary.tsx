import { Card, CardContent } from '@/components/ui/card';
import { Building2, FileText, Banknote } from 'lucide-react';

interface InvoiceSummaryProps {
  totalClients: number;
  totalItems: number;
  totalAmount: number;
  currency: string;
  previousAmount?: number;
}

export function InvoiceSummary({ 
  totalClients, 
  totalItems, 
  totalAmount, 
  currency,
  previousAmount 
}: InvoiceSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const change = previousAmount ? totalAmount - previousAmount : null;
  const changePercent = previousAmount && previousAmount > 0 
    ? ((totalAmount - previousAmount) / previousAmount) * 100 
    : null;

  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Klientů</p>
              <p className="text-2xl font-semibold">{totalClients}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Položek</p>
              <p className="text-2xl font-semibold">{totalItems}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Celkem k fakturaci</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
              {change !== null && changePercent !== null && (
                <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{formatCurrency(change)} ({change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%) vs. minulý měsíc
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
