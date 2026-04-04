import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Copy, Briefcase, Building2, Sparkles, 
  CheckCircle, Megaphone, Pencil, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityReward, ActivityCategory } from '@/hooks/useActivityRewards';
import { CATEGORY_LABELS } from '@/hooks/useActivityRewards';

// Invoice line item structure
export interface InvoiceLineItem {
  id: string;
  category: 'client' | 'creative_boost' | 'commission' | 'marketing' | 'overhead' | 'client_work';
  invoiceName: string;
  amount: number;
  note?: string; // e.g. "od 15." for prorated
  isEditable?: boolean;
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

interface ExtraWorkForInvoice {
  clientName: string;
  name: string;
  amount: number;
  hours?: number | null;
  hourlyRate?: number | null;
}

interface InvoicingOverviewProps {
  selectedYear: number;
  selectedMonth: number;
  // Client work data
  clientRewards: ClientRewardForInvoice[];
  creativeBoostItems: CreativeBoostForInvoice[];
  commissionItems: CommissionForInvoice[];
  extraWorkItems: ExtraWorkForInvoice[];
  // Internal work data
  internalRewards: ActivityReward[];
  getRewardsByCategory: (year: number, month: number) => { marketing: ActivityReward[]; overhead: ActivityReward[]; client_work: ActivityReward[] };
  // Actions
  onAddInternalWork: (year: number, month: number) => void;
  onEditReward?: (reward: ActivityReward) => void;
}

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

function InvoiceLineItemRow({ 
  item, 
  onCopy,
  onEdit,
}: { 
  item: InvoiceLineItem; 
  onCopy: (text: string) => void;
  onEdit?: () => void;
}) {
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'client': return Briefcase;
      case 'creative_boost': return Sparkles;
      case 'commission': return CheckCircle;
      case 'marketing': return Megaphone;
      case 'overhead': return Building2;
      case 'client_work': return Briefcase;
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
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => onCopy(item.invoiceName)}
            title="Kopírovat název položky"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {item.isEditable && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onEdit}
              title="Upravit položku"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <span className="font-medium whitespace-nowrap text-sm">
        {item.amount.toLocaleString('cs-CZ')} Kč
      </span>
    </div>
  );
}

export function InvoicingOverview({
  selectedYear,
  selectedMonth,
  clientRewards,
  creativeBoostItems,
  commissionItems,
  extraWorkItems,
  internalRewards,
  getRewardsByCategory,
  onAddInternalWork,
  onEditReward,
}: InvoicingOverviewProps) {
  // Build all invoice line items for the selected month
  const invoiceLineItems = useMemo(() => {
    const items: InvoiceLineItem[] = [];

    // 1. Client rewards - fixed monthly fees (format: "Přímá služba – [klient] – správa účtu")
    clientRewards.forEach((cr) => {
      const invoiceName = cr.isProrated
        ? `Přímá služba – ${cr.clientName} – správa účtu (poměrná část od ${cr.startDay}.)`
        : `Přímá služba – ${cr.clientName} – správa účtu`;

      items.push({
        id: `client-${cr.engagementId}`,
        category: 'client',
        invoiceName,
        amount: cr.amount,
        note: cr.isProrated ? `od ${cr.startDay}.` : undefined,
      });
    });

    // 2. Creative Boost rewards (format: "Přímá služba – [klient] – Creative Boost")
    creativeBoostItems.forEach((cb, idx) => {
      items.push({
        id: `cb-${idx}`,
        category: 'creative_boost',
        invoiceName: `Přímá služba – ${cb.clientName} – Creative Boost (${cb.credits} kr.)`,
        amount: cb.reward,
      });
    });

    // 3. Approved commissions (format: "Přímá služba – [klient] – provize za upsell")
    commissionItems.forEach((comm, idx) => {
      items.push({
        id: `comm-${idx}`,
        category: 'commission',
        invoiceName: `Přímá služba – ${comm.clientName} – provize za upsell`,
        amount: comm.amount,
      });
    });

    // 4. Extra work (format: "Přímá služba – [klient] – [název práce]")
    extraWorkItems.forEach((ew, idx) => {
      const hoursNote = ew.hours && ew.hourlyRate
        ? ` (${ew.hours}h × ${ew.hourlyRate} Kč)`
        : '';
      items.push({
        id: `extra-${idx}`,
        category: 'client',
        invoiceName: `Přímá služba – ${ew.clientName} – ${ew.name}${hoursNote}`,
        amount: ew.amount,
      });
    });

    // 4. Internal work (marketing + overhead) - from activity rewards
    const categorized = getRewardsByCategory(selectedYear, selectedMonth);
    
    categorized.marketing.forEach((r) => {
      items.push({
        id: r.id,
        category: 'marketing',
        invoiceName: `Režijní služba – ${r.invoice_item_name}`,
        amount: r.amount,
        isEditable: true,
      });
    });
    
    categorized.overhead.forEach((r) => {
      items.push({
        id: r.id,
        category: 'overhead',
        invoiceName: `Režijní služba – ${r.invoice_item_name}`,
        amount: r.amount,
        isEditable: true,
      });
    });

    // Client work (manual client-specific items)
    categorized.client_work.forEach((r) => {
      items.push({
        id: r.id,
        category: 'client_work',
        invoiceName: r.invoice_item_name,
        amount: r.amount,
        isEditable: true,
      });
    });

    return items;
  }, [clientRewards, creativeBoostItems, commissionItems, extraWorkItems, getRewardsByCategory, selectedYear, selectedMonth]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    return {
      client: invoiceLineItems.filter(i => i.category === 'client'),
      creativeBoost: invoiceLineItems.filter(i => i.category === 'creative_boost'),
      commission: invoiceLineItems.filter(i => i.category === 'commission'),
      marketing: invoiceLineItems.filter(i => i.category === 'marketing'),
      overhead: invoiceLineItems.filter(i => i.category === 'overhead'),
      client_work: invoiceLineItems.filter(i => i.category === 'client_work'),
    };
  }, [invoiceLineItems]);

  // Totals
  const clientTotal = useMemo(() => {
    return [...groupedItems.client, ...groupedItems.client_work, ...groupedItems.creativeBoost, ...groupedItems.commission]
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

  const hasClientWork = groupedItems.client.length > 0 || groupedItems.client_work.length > 0 || groupedItems.creativeBoost.length > 0 || groupedItems.commission.length > 0;

  // Helper to find reward by ID for editing
  const getRewardById = (id: string): ActivityReward | undefined => {
    return internalRewards.find(r => r.id === id);
  };

  const handleEditReward = (itemId: string) => {
    const reward = getRewardById(itemId);
    if (reward && onEditReward) {
      onEditReward(reward);
    }
  };

  return (
    <Card>
  <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Fakturace – položky pro fakturu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected month comes from the page-level month selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">Fakturovat za</span>
          <Badge variant="outline" className="text-sm font-normal">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Badge>
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
              {hasClientWork && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Klientská práce</span>
                  </div>
                  <div className="pl-2 border-l-2 border-primary/20 space-y-0.5">
                    {groupedItems.client.map((item) => (
                      <InvoiceLineItemRow key={item.id} item={item} onCopy={handleCopy} />
                    ))}
                    {groupedItems.client_work.map((item) => (
                      <InvoiceLineItemRow
                        key={item.id}
                        item={item}
                        onCopy={handleCopy}
                        onEdit={() => handleEditReward(item.id)}
                      />
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

              {/* INTERNAL WORK SECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Režijní položky</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => onAddInternalWork(selectedYear, selectedMonth)}
                  >
                    <Plus className="h-3 w-3" />
                    Přidat položku
                  </Button>
                </div>

                {/* Marketing */}
                {groupedItems.marketing.length > 0 && (
                  <div className="pl-2 border-l-2 border-primary/20">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 px-2">
                      <Megaphone className="h-3 w-3" />
                      {CATEGORY_LABELS.marketing}
                    </div>
                    {groupedItems.marketing.map((item) => (
                      <InvoiceLineItemRow 
                        key={item.id} 
                        item={item} 
                        onCopy={handleCopy} 
                        onEdit={() => handleEditReward(item.id)}
                      />
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
                      <InvoiceLineItemRow
                        key={item.id}
                        item={item}
                        onCopy={handleCopy}
                        onEdit={() => handleEditReward(item.id)}
                      />
                    ))}
                  </div>
                )}

              </div>
            </>
          )}
        </div>

        {/* Grand total at the bottom */}
        {invoiceLineItems.length > 0 && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Celkem za {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
                <span className="text-xl font-bold text-primary">
                  {grandTotal.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
