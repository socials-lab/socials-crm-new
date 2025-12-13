import { useState } from 'react';
import { format, startOfMonth, addMonths, isBefore, isAfter, subMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Check, Circle, FileText, ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import type { Engagement, MonthlyEngagementInvoice } from '@/types/crm';

interface InvoiceMonth {
  year: number;
  month: number;
  label: string;
  isInvoiced: boolean;
  isPending: boolean;
  amount: number | null;
  issuedAt: string | null;
}

interface EngagementInvoicingBadgesProps {
  engagement: Engagement;
  invoices: MonthlyEngagementInvoice[];
}

// Get last 3 months for badges display
export function getRecentMonths(engagement: Engagement, invoices: MonthlyEngagementInvoice[]): InvoiceMonth[] {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const engagementStart = startOfMonth(new Date(engagement.start_date));
  
  const months: InvoiceMonth[] = [];
  
  // Show last 3 months (current month and 2 previous)
  for (let i = 2; i >= 0; i--) {
    const monthDate = subMonths(currentMonth, i);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    
    // Skip if before engagement start
    if (isBefore(monthDate, engagementStart)) continue;
    
    // Skip if engagement ended before this month
    if (engagement.end_date) {
      const endDate = new Date(engagement.end_date);
      if (isAfter(monthDate, startOfMonth(endDate))) continue;
    }
    
    const invoice = invoices.find(inv => inv.year === year && inv.month === month);
    const isInvoiced = invoice?.status === 'issued' || invoice?.status === 'paid';
    const isPending = !isInvoiced && i === 0; // Current month is pending
    
    months.push({
      year,
      month,
      label: format(monthDate, 'MMM', { locale: cs }).toUpperCase().replace('.', ''),
      isInvoiced,
      isPending,
      amount: invoice?.total_amount || null,
      issuedAt: invoice?.issued_at || null,
    });
  }
  
  return months;
}

// Get all invoicing months for expanded section
export function getAllInvoicingMonths(engagement: Engagement, invoices: MonthlyEngagementInvoice[]): InvoiceMonth[] {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const engagementStart = startOfMonth(new Date(engagement.start_date));
  
  const months: InvoiceMonth[] = [];
  let monthDate = engagementStart;
  
  while (!isAfter(monthDate, currentMonth)) {
    // Skip if engagement ended before this month
    if (engagement.end_date) {
      const endDate = new Date(engagement.end_date);
      if (isAfter(monthDate, startOfMonth(endDate))) break;
    }
    
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    
    const invoice = invoices.find(inv => inv.year === year && inv.month === month);
    const isInvoiced = invoice?.status === 'issued' || invoice?.status === 'paid';
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const isPending = !isInvoiced && isCurrentMonth;
    
    months.unshift({
      year,
      month,
      label: format(monthDate, 'LLLL yyyy', { locale: cs }),
      isInvoiced,
      isPending,
      amount: invoice?.total_amount || null,
      issuedAt: invoice?.issued_at || null,
    });
    
    monthDate = addMonths(monthDate, 1);
  }
  
  return months;
}

export function EngagementInvoicingBadges({ engagement, invoices }: EngagementInvoicingBadgesProps) {
  const recentMonths = getRecentMonths(engagement, invoices);
  
  if (recentMonths.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1">
      {recentMonths.map((m) => (
        <Badge
          key={`${m.year}-${m.month}`}
          variant="outline"
          className={`h-5 text-[10px] px-1.5 gap-0.5 ${
            m.isInvoiced 
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' 
              : m.isPending
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                : 'bg-muted text-muted-foreground border-border'
          }`}
          title={m.isInvoiced ? `Vyfakturováno` : m.isPending ? 'Čeká na fakturaci' : 'Nevyfakturováno'}
        >
          {m.isInvoiced ? (
            <Check className="h-2.5 w-2.5" />
          ) : (
            <Circle className="h-2.5 w-2.5" />
          )}
          {m.label}
        </Badge>
      ))}
    </div>
  );
}

interface EngagementInvoicingSectionProps {
  engagement: Engagement;
  invoices: MonthlyEngagementInvoice[];
  currency: string;
}

export function EngagementInvoicingSection({ engagement, invoices, currency }: EngagementInvoicingSectionProps) {
  const navigate = useNavigate();
  const allMonths = getAllInvoicingMonths(engagement, invoices);
  
  // Filter only relevant months (invoiced or pending)
  const availableMonths = allMonths.filter(m => m.isInvoiced || m.isPending);
  
  // Default to first (most recent) available month
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  
  const selectedMonth = selectedMonthKey 
    ? availableMonths.find(m => `${m.year}-${m.month}` === selectedMonthKey)
    : availableMonths[0];
  
  const invoicedCount = allMonths.filter(m => m.isInvoiced).length;
  const totalCount = allMonths.length;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Fakturace ({invoicedCount}/{totalCount})
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/invoicing?engagement=${engagement.id}`);
          }}
        >
          Zobrazit vše
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
      
      {availableMonths.length > 0 ? (
        <Select 
          value={selectedMonthKey || (selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : undefined)} 
          onValueChange={setSelectedMonthKey}
        >
          <SelectTrigger className="h-9">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Vyberte měsíc" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(m => (
              <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                <div className="flex items-center gap-2">
                  {m.isInvoiced ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span className="capitalize">{m.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground">Žádná historie fakturace</p>
      )}
    </div>
  );
}
