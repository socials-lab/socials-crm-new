import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, Sparkles, CheckCircle, Wrench, 
  Megaphone, Building2, FileText,
} from 'lucide-react';
import type { ColleagueInvoiceData } from './TeamInvoicingOverview';

interface ColleagueInvoiceSheetProps {
  data: ColleagueInvoiceData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthLabel: string;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="pl-2 border-l-2 border-primary/20 space-y-1">
        {children}
      </div>
    </div>
  );
}

function LineItem({ name, amount, note }: { name: string; amount: number; note?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50">
      <span className="text-sm flex-1 min-w-0 truncate">{name}</span>
      {note && <Badge variant="secondary" className="text-xs shrink-0">{note}</Badge>}
      <span className="font-medium text-sm whitespace-nowrap">{amount.toLocaleString('cs-CZ')} Kč</span>
    </div>
  );
}

export function ColleagueInvoiceSheet({ data, open, onOpenChange, monthLabel }: ColleagueInvoiceSheetProps) {
  if (!data) return null;

  const hasClient = data.clientItems.length > 0 || data.creativeBoostItems.length > 0 
    || data.commissionItems.length > 0 || data.extraWorkItems.length > 0
    || data.manualItems.some(i => i.category === 'client_work');
  
  const hasInternal = data.manualItems.some(i => i.category === 'marketing' || i.category === 'overhead');
  const marketingItems = data.manualItems.filter(i => i.category === 'marketing');
  const overheadItems = data.manualItems.filter(i => i.category === 'overhead');
  const clientWorkItems = data.manualItems.filter(i => i.category === 'client_work');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {data.colleague.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span className="block">{data.colleague.full_name}</span>
              <span className="block text-sm font-normal text-muted-foreground">{data.colleague.position} • {monthLabel}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Client work */}
          {hasClient && (
            <Section icon={Briefcase} title="Klientská práce">
              {data.clientItems.map((item, i) => (
                <LineItem key={`c-${i}`} name={item.name} amount={item.amount} note={item.note} />
              ))}
              {data.creativeBoostItems.map((item, i) => (
                <LineItem 
                  key={`cb-${i}`} 
                  name={`${item.name} – Creative Boost (${item.credits} kr.)`} 
                  amount={item.amount} 
                />
              ))}
              {data.commissionItems.map((item, i) => (
                <LineItem key={`com-${i}`} name={item.name} amount={item.amount} />
              ))}
              {data.extraWorkItems.map((item, i) => (
                <LineItem 
                  key={`ew-${i}`} 
                  name={item.name} 
                  amount={item.amount}
                  note={item.hours && item.rate ? `${item.hours}h × ${item.rate} Kč` : undefined}
                />
              ))}
              {clientWorkItems.map((item, i) => (
                <LineItem key={`cw-${i}`} name={item.name} amount={item.amount} />
              ))}
            </Section>
          )}

          {/* Internal work */}
          {hasInternal && (
            <Section icon={Building2} title="Režijní položky">
              {marketingItems.length > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                    <Megaphone className="h-3 w-3" /> Marketing
                  </div>
                  {marketingItems.map((item, i) => (
                    <LineItem key={`m-${i}`} name={item.name} amount={item.amount} />
                  ))}
                </div>
              )}
              {overheadItems.length > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                    <Building2 className="h-3 w-3" /> Interní práce
                  </div>
                  {overheadItems.map((item, i) => (
                    <LineItem key={`o-${i}`} name={item.name} amount={item.amount} />
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Totals */}
          <Separator />
          <div className="space-y-2">
            {data.clientTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Klientská práce</span>
                <span className="font-medium">{data.clientTotal.toLocaleString('cs-CZ')} Kč</span>
              </div>
            )}
            {data.internalTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Režijní položky</span>
                <span className="font-medium">{data.internalTotal.toLocaleString('cs-CZ')} Kč</span>
              </div>
            )}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Celkem k fakturaci</span>
                <span className="text-xl font-bold text-primary">
                  {data.grandTotal.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
