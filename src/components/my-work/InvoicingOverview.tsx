import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Copy, Plus, Briefcase, Building2, Sparkles, 
  CheckCircle, Megaphone, AlertCircle 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ActivityReward, ActivityCategory } from '@/hooks/useActivityRewards';
import { CATEGORY_LABELS } from '@/hooks/useActivityRewards';

// Invoice line item structure
export interface InvoiceLineItem {
  id: string;
  category: 'client' | 'creative_boost' | 'commission' | 'marketing' | 'overhead';
  invoiceName: string;
  amount: number;
  note?: string; // e.g. "od 15." for prorated
}

interface ClientRewardForInvoice {
  clientName: string;
  engagementId: string;
  amount: number;
  isProrated: boolean;
  startDay: number | null;
}

interface CreativeBoostForInvoice {
  clientName: string;
  credits: number;
  reward: number;
}

interface CommissionForInvoice {
  clientName: string;
  amount: number;
}

interface InvoicingOverviewProps {
  // Client work data
  clientRewards: ClientRewardForInvoice[];
  creativeBoostItems: CreativeBoostForInvoice[];
  commissionItems: CommissionForInvoice[];
  // Internal work data
  internalRewards: ActivityReward[];
  getRewardsByMonth: (year: number, month: number) => ActivityReward[];
  getRewardsByCategory: (year: number, month: number) => { marketing: ActivityReward[]; overhead: ActivityReward[] };
  // Actions
  onAddInternalWork: () => void;
}

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

function InvoiceLineItemRow({ 
  item, 
  onCopy 
}: { 
  item: InvoiceLineItem; 
  onCopy: (text: string) => void;
}) {
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'client': return Briefcase;
      case 'creative_boost': return Sparkles;
      case 'commission': return CheckCircle;
      case 'marketing': return Megaphone;
      case 'overhead': return Building2;
      default: return FileText;
    }
  };
  
  const Icon = getCategoryIcon();
  
  return (
    <div className="flex items-center gap-2 py-2 group hover:bg-muted/50 rounded px-2 -mx-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm truncate">{item.invoiceName}</span>
        {item.note && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {item.note}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={() => onCopy(item.invoiceName)}
          title="Kopírovat název položky"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <span className="font-medium whitespace-nowrap text-sm">
        {item.amount.toLocaleString('cs-CZ')} Kč
      </span>
    </div>
  );
}

export function InvoicingOverview({
  clientRewards,
  creativeBoostItems,
  commissionItems,
  internalRewards,
  getRewardsByMonth,
  getRewardsByCategory,
  onAddInternalWork,
}: InvoicingOverviewProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set(internalRewards.map(r => parseISO(r.activity_date).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [internalRewards]);

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  // Build all invoice line items for the selected month
  const invoiceLineItems = useMemo(() => {
    const items: InvoiceLineItem[] = [];
    
    // Only show client work for current month (we don't have historical client data)
    if (isCurrentMonth) {
      // 1. Client rewards - fixed monthly fees
      clientRewards.forEach((cr) => {
        const invoiceName = cr.isProrated 
          ? `${cr.clientName} – správa účtu (poměrná část od ${cr.startDay}.)`
          : `${cr.clientName} – správa účtu`;
        
        items.push({
          id: `client-${cr.engagementId}`,
          category: 'client',
          invoiceName,
          amount: cr.amount,
          note: cr.isProrated ? `od ${cr.startDay}.` : undefined,
        });
      });

      // 2. Creative Boost rewards
      creativeBoostItems.forEach((cb, idx) => {
        items.push({
          id: `cb-${idx}`,
          category: 'creative_boost',
          invoiceName: `${cb.clientName} – Creative Boost (${cb.credits} kr.)`,
          amount: cb.reward,
        });
      });

      // 3. Approved commissions
      commissionItems.forEach((comm, idx) => {
        items.push({
          id: `comm-${idx}`,
          category: 'commission',
          invoiceName: `${comm.clientName} – provize za upsell`,
          amount: comm.amount,
        });
      });
    }

    // 4. Internal work (marketing + overhead) - from activity rewards
    const categorized = getRewardsByCategory(selectedYear, selectedMonth);
    
    categorized.marketing.forEach((r) => {
      items.push({
        id: r.id,
        category: 'marketing',
        invoiceName: r.invoice_item_name,
        amount: r.amount,
      });
    });
    
    categorized.overhead.forEach((r) => {
      items.push({
        id: r.id,
        category: 'overhead',
        invoiceName: r.invoice_item_name,
        amount: r.amount,
      });
    });

    return items;
  }, [clientRewards, creativeBoostItems, commissionItems, getRewardsByCategory, selectedYear, selectedMonth, isCurrentMonth]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    return {
      client: invoiceLineItems.filter(i => i.category === 'client'),
      creativeBoost: invoiceLineItems.filter(i => i.category === 'creative_boost'),
      commission: invoiceLineItems.filter(i => i.category === 'commission'),
      marketing: invoiceLineItems.filter(i => i.category === 'marketing'),
      overhead: invoiceLineItems.filter(i => i.category === 'overhead'),
    };
  }, [invoiceLineItems]);

  // Totals
  const clientTotal = useMemo(() => {
    return [...groupedItems.client, ...groupedItems.creativeBoost, ...groupedItems.commission]
      .reduce((sum, i) => sum + i.amount, 0);
  }, [groupedItems]);

  const internalTotal = useMemo(() => {
    return [...groupedItems.marketing, ...groupedItems.overhead]
      .reduce((sum, i) => sum + i.amount, 0);
  }, [groupedItems]);

  const grandTotal = clientTotal + internalTotal;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Zkopírováno do schránky');
    } catch {
      toast.error('Nepodařilo se zkopírovat');
    }
  };

  const hasClientWork = groupedItems.client.length > 0 || groupedItems.creativeBoost.length > 0 || groupedItems.commission.length > 0;
  const hasInternalWork = groupedItems.marketing.length > 0 || groupedItems.overhead.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Fakturace – položky pro fakturu
          </CardTitle>
          <Button size="sm" onClick={onAddInternalWork} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Přidat interní práci
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month/Year filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Fakturovat za</span>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grand total */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {isCurrentMonth ? 'Celkem k fakturaci tento měsíc' : `Celkem za ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
            </span>
            <span className="text-xl font-bold text-primary">
              {grandTotal.toLocaleString('cs-CZ')} Kč
            </span>
          </div>
        </div>

        {/* Invoice line items */}
        <div className="space-y-4 max-h-[450px] overflow-y-auto">
          {invoiceLineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Žádné položky k fakturaci v tomto měsíci
            </p>
          ) : (
            <>
              {/* CLIENT WORK SECTION */}
              {hasClientWork && isCurrentMonth && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Klientská práce</span>
                    </div>
                    <span className="text-sm font-semibold">{clientTotal.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                  <div className="pl-2 border-l-2 border-primary/20 space-y-0.5">
                    {groupedItems.client.map((item) => (
                      <InvoiceLineItemRow key={item.id} item={item} onCopy={handleCopy} />
                    ))}
                    {groupedItems.creativeBoost.map((item) => (
                      <InvoiceLineItemRow key={item.id} item={item} onCopy={handleCopy} />
                    ))}
                    {groupedItems.commission.map((item) => (
                      <InvoiceLineItemRow key={item.id} item={item} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              )}

              {/* Info for non-current months */}
              {!isCurrentMonth && hasInternalWork && (
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Klientská práce se zobrazuje pouze pro aktuální měsíc</span>
                </div>
              )}

              {/* INTERNAL WORK SECTION */}
              {hasInternalWork && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Interní práce</span>
                    </div>
                    <span className="text-sm font-semibold">{internalTotal.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                  
                  {/* Marketing */}
                  {groupedItems.marketing.length > 0 && (
                    <div className="pl-2 border-l-2 border-primary/20">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 px-2">
                        <Megaphone className="h-3 w-3" />
                        {CATEGORY_LABELS.marketing}
                      </div>
                      {groupedItems.marketing.map((item) => (
                        <InvoiceLineItemRow key={item.id} item={item} onCopy={handleCopy} />
                      ))}
                    </div>
                  )}
                  
                  {/* Overhead */}
                  {groupedItems.overhead.length > 0 && (
                    <div className="pl-2 border-l-2 border-primary/20">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 px-2">
                        <Building2 className="h-3 w-3" />
                        {CATEGORY_LABELS.overhead}
                      </div>
                      {groupedItems.overhead.map((item) => (
                        <InvoiceLineItemRow key={item.id} item={item} onCopy={handleCopy} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary footer */}
        {invoiceLineItems.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              {isCurrentMonth && hasClientWork && (
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Klientská práce:</span>
                  <span className="font-medium">{clientTotal.toLocaleString('cs-CZ')} Kč</span>
                </div>
              )}
              {hasInternalWork && (
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Interní práce:</span>
                  <span className="font-medium">{internalTotal.toLocaleString('cs-CZ')} Kč</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
