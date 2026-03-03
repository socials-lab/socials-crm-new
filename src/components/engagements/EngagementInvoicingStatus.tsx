import { useState } from 'react';
import { format, startOfMonth, addMonths, isBefore, isAfter, subMonths } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Check, Circle, FileText, ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import type { Engagement, MonthlyEngagementInvoice, IssuedInvoice } from '@/types/crm';

interface InvoiceMonth {
  year: number;
  month: number;
  label: string;
  isInvoiced: boolean;
  isPending: boolean;
  amount: number | null;
  currency: string | null;
  issuedAt: string | null;
  fakturoidUrl: string | null;
  invoiceNumber: string | null;
}

interface EngagementInvoicingBadgesProps {
  engagement: Engagement;
  invoices: IssuedInvoice[];
}

// Get last 3 months for badges display
export function getRecentMonths(engagement: Engagement, invoices: IssuedInvoice[]): InvoiceMonth[] {
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
    const isInvoiced = !!invoice;
    const isPending = !isInvoiced && i === 0; // Current month is pending

    months.push({
      year,
      month,
      label: format(monthDate, 'MMM', { locale: cs }).toUpperCase().replace('.', ''),
      isInvoiced,
      isPending,
      amount: invoice?.total_amount || null,
      currency: invoice?.currency ?? null,
      issuedAt: invoice?.issued_at || null,
      fakturoidUrl: invoice?.fakturoid_url || null,
      invoiceNumber: invoice?.invoice_number || null,
    });
  }

  return months;
}

// Get all invoicing months for expanded section
export function getAllInvoicingMonths(engagement: Engagement, invoices: IssuedInvoice[]): InvoiceMonth[] {
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
    const isInvoiced = !!invoice;
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const isPending = !isInvoiced && isCurrentMonth;

    months.unshift({
      year,
      month,
      label: format(monthDate, 'LLLL yyyy', { locale: cs }),
      isInvoiced,
      isPending,
      amount: invoice?.total_amount || null,
      currency: invoice?.currency ?? null,
      issuedAt: invoice?.issued_at || null,
      fakturoidUrl: invoice?.fakturoid_url || null,
      invoiceNumber: invoice?.invoice_number || null,
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
  invoices: IssuedInvoice[];
  currency: string;
}

export function EngagementInvoicingSection({ engagement, invoices, currency }: EngagementInvoicingSectionProps) {
  const navigate = useNavigate();
  const allMonths = getAllInvoicingMonths(engagement, invoices);

  // Filter only invoiced months
  const invoicedMonths = allMonths.filter(m => m.isInvoiced);

  const invoicedCount = invoicedMonths.length;
  const totalCount = allMonths.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRowAmount = (amount: number, invoiceCurrency: string | null) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: invoiceCurrency || currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Faktury ({invoicedCount})
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

      {invoicedMonths.length > 0 ? (
        <div className="space-y-2">
          {invoicedMonths.slice(0, 5).map(m => (
            <div
              key={`${m.year}-${m.month}`}
              className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/50"
            >
              <div className="flex items-center gap-2">
                {m.fakturoidUrl ? (
                  <a
                    href={m.fakturoidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {m.invoiceNumber || `${m.month}/${m.year}`}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">
                    {m.invoiceNumber || `${m.month}/${m.year}`}
                  </span>
                )}
                <span className="text-xs text-muted-foreground capitalize">
                  ({m.label})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {m.amount ? formatRowAmount(m.amount, m.currency) : '-'}
                </span>
                {m.fakturoidUrl ? (
                  <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200">
                    <Check className="h-2.5 w-2.5 mr-0.5" />
                    Fakturoid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200">
                    Lokální
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {invoicedMonths.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{invoicedMonths.length - 5} dalších faktur
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Žádné vystavené faktury</p>
      )}
    </div>
  );
}
