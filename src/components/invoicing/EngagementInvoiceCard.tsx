import { useState } from 'react';
import { useCRMData } from '@/hooks/useCRMData';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Building2, Pencil, AlertTriangle, CheckCircle2, Send, Copy, MoreVertical, MessageSquare, FileText, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InvoiceLineItemCard } from './InvoiceLineItemCard';
import type { MonthlyEngagementInvoice, InvoiceLineItem } from '@/types/crm';
import { cn } from '@/lib/utils';

interface EngagementInvoiceCardProps {
  invoice: MonthlyEngagementInvoice;
  onUpdateLineItem: (lineItemId: string, updates: Partial<InvoiceLineItem>) => void;
  onAddManualItem: () => void;
  onRemoveLineItem: (lineItemId: string) => void;
  onDuplicateLineItem: (lineItemId: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onIssueInvoice?: (invoice: MonthlyEngagementInvoice) => void;
  onReissueInvoice?: (invoice: MonthlyEngagementInvoice) => void;
  onDuplicateInvoice?: (invoice: MonthlyEngagementInvoice) => void;
  onRemoveInvoice?: (invoice: MonthlyEngagementInvoice) => void;
  isIssued?: boolean;
  onApproveAllItems?: (invoiceId: string) => void;
}

export function EngagementInvoiceCard({ 
  invoice, 
  onUpdateLineItem, 
  onAddManualItem,
  onRemoveLineItem,
  onDuplicateLineItem,
  isSelected = false,
  onSelectionChange,
  onIssueInvoice,
  onReissueInvoice,
  onDuplicateInvoice,
  onRemoveInvoice,
  isIssued = false,
  onApproveAllItems,
}: EngagementInvoiceCardProps) {
  const { getClientById } = useCRMData();
  const [isOpen, setIsOpen] = useState(false);
  
  const client = getClientById(invoice.client_id);
  if (!client) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: invoice.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasProrated = invoice.line_items.some(
    item => item.prorated_days < item.total_days_in_month
  );

  const approvedCount = invoice.line_items.filter(item => item.is_approved).length;
  const allApproved = approvedCount === invoice.line_items.length;
  const hasAnyNotes = invoice.line_items.some(item => item.note && item.note.trim().length > 0);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="checkbox"]') ||
      target.closest('[data-radix-collection-item]')
    ) {
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all",
        !isIssued && "hover:bg-accent/5",
        isSelected && "ring-2 ring-primary",
        isSelected && !allApproved && "ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
        isIssued && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20 opacity-75"
      )}
      onClick={handleCardClick}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onSelectionChange && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              onSelectionChange(true);
                              // Při zaškrtnutí schválit všechny neschválené položky
                              if (!allApproved && onApproveAllItems) {
                                onApproveAllItems(invoice.id);
                              }
                            } else {
                              onSelectionChange(false);
                            }
                          }}
                          className={cn(
                            "shrink-0 h-4 w-4",
                            isSelected && !allApproved && "border-amber-500 data-[state=checked]:bg-amber-500",
                            isIssued && "border-destructive data-[state=checked]:bg-destructive"
                          )}
                        />
                        {isSelected && !allApproved && !isIssued && (
                          <AlertTriangle className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-500" />
                        )}
                      </div>
                    </TooltipTrigger>
                    {!allApproved && !isIssued && (
                      <TooltipContent>
                        <p>Faktura obsahuje neschválené položky</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              {isIssued ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              )}
              <div>
                <h3 className="font-medium text-sm flex items-center gap-1">
                  <Link 
                    to={`/engagements?highlight=${invoice.engagement_id}`}
                    className={cn("hover:underline", isIssued ? "text-green-600" : "text-primary")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {invoice.engagement_name}
                  </Link>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  {isIssued && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Vystaveno
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  <Link 
                    to={`/clients?highlight=${invoice.client_id}`}
                    className="hover:text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {client.brand_name || client.name}
                  </Link>
                  <span className="text-muted-foreground/50">•</span>
                  <span>
                    {invoice.line_items.length} {invoice.line_items.length === 1 ? 'položka' : 
                      invoice.line_items.length < 5 ? 'položky' : 'položek'}
                  </span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className={cn(
                    "flex items-center gap-0.5",
                    allApproved ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {allApproved && <CheckCircle2 className="h-3 w-3" />}
                    {approvedCount}/{invoice.line_items.length} schváleno
                  </span>
                  {hasAnyNotes && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-0.5 text-amber-600">
                        <MessageSquare className="h-3 w-3" />
                        Poznámky
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onIssueInvoice && !isIssued && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!allApproved}
                          onClick={(e) => {
                            e.stopPropagation();
                            onIssueInvoice(invoice);
                          }}
                          className="h-7 text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Vystavit
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!allApproved && (
                      <TooltipContent>
                        <p>Nejprve schvalte všechny položky</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              {isIssued && (
                <span className="text-xs text-green-600 font-medium px-2">
                  ✓ Odesláno
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsOpen(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Upravit
                  </DropdownMenuItem>
                  {isIssued && onReissueInvoice && (
                    <DropdownMenuItem onClick={() => onReissueInvoice(invoice)}>
                      <Send className="h-3.5 w-3.5 mr-2" />
                      Vystavit znovu
                    </DropdownMenuItem>
                  )}
                  {onDuplicateInvoice && (
                    <DropdownMenuItem onClick={() => onDuplicateInvoice(invoice)}>
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Duplikovat fakturu
                    </DropdownMenuItem>
                  )}
                  {onRemoveInvoice && (
                    <DropdownMenuItem 
                      onClick={() => onRemoveInvoice(invoice)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Odstranit fakturu
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="text-right min-w-[80px]">
                <p className={cn(
                  "font-semibold text-sm",
                  hasProrated && "text-amber-600"
                )}>
                  {formatCurrency(invoice.total_amount)}
                </p>
                {hasProrated && (
                  <p className="text-xs text-amber-600">Poměrně</p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Preview of line items when collapsed */}
        {!isOpen && (
          <CardContent className="pt-0 pb-2 px-3">
            <div className="space-y-0.5 pl-8">
              {invoice.line_items.map(item => {
                const itemHasNote = item.note && item.note.trim().length > 0;
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between text-xs py-1 border-b border-dashed last:border-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={item.is_approved}
                          onCheckedChange={(checked) => onUpdateLineItem(item.id, { is_approved: checked === true })}
                          className={cn(
                            "h-3.5 w-3.5",
                            isIssued && "border-destructive data-[state=checked]:bg-destructive"
                          )}
                        />
                      </div>
                      {item.source === 'manual' && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary">Extra</span>
                      )}
                      {item.prorated_days < item.total_days_in_month && (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                      {itemHasNote && (
                        <MessageSquare className="h-3 w-3 text-amber-500" />
                      )}
                      <span className="text-muted-foreground truncate max-w-[200px]">{item.source_description || item.line_description}</span>
                    </div>
                    <span className="font-medium shrink-0">{formatCurrency(item.final_amount)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}

        <CollapsibleContent>
          <CardContent className="pt-0 px-3 pb-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            {invoice.line_items.map(item => (
              <InvoiceLineItemCard
                key={item.id}
                item={item}
                currency={invoice.currency}
                onUpdate={(updates) => onUpdateLineItem(item.id, updates)}
                onRemove={item.source === 'manual' ? () => onRemoveLineItem(item.id) : undefined}
                onDuplicate={() => onDuplicateLineItem(item.id)}
              />
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAddManualItem();
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Přidat položku
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
