import { useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cs } from 'date-fns/locale';
import { AlertTriangle, Receipt, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCRMData } from '@/hooks/useCRMData';
import type { EngagementService } from '@/types/crm';

interface UnbilledItemsSectionProps {
  year: number;
  month: number;
  onAddToInvoice: (engagementService: EngagementService, period: string) => void;
}

export function UnbilledItemsSection({ year, month, onAddToInvoice }: UnbilledItemsSectionProps) {
  const { 
    getUnbilledOneOffServices, 
    engagements, 
    clients, 
    getEngagementById, 
    getClientById 
  } = useCRMData();

  const unbilledItems = getUnbilledOneOffServices();

  // Generate period options (current month + next 2 months)
  const periodOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(year, month - 1 + i, 1);
      const periodValue = format(date, 'yyyy-MM');
      const periodLabel = format(date, 'LLLL yyyy', { locale: cs });
      options.push({
        value: periodValue,
        label: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1),
      });
    }
    return options;
  }, [year, month]);

  const itemsWithDetails = useMemo(() => {
    return unbilledItems.map(item => {
      const engagement = getEngagementById(item.engagement_id);
      const client = engagement ? getClientById(engagement.client_id) : null;
      const createdDate = parseISO(item.created_at);
      const daysSinceCreated = differenceInDays(new Date(), createdDate);
      
      return {
        ...item,
        engagement,
        client,
        daysSinceCreated,
        isOld: daysSinceCreated > 60,
      };
    }).sort((a, b) => b.daysSinceCreated - a.daysSinceCreated); // Oldest first
  }, [unbilledItems, getEngagementById, getClientById]);

  if (itemsWithDetails.length === 0) {
    return null;
  }

  const oldItemsCount = itemsWithDetails.filter(i => i.isOld).length;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base text-amber-900">
              Nevyfakturované jednorázové položky ({itemsWithDetails.length})
            </CardTitle>
          </div>
          {oldItemsCount > 0 && (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
              {oldItemsCount} položek čeká přes 60 dní
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {itemsWithDetails.map(item => (
          <div 
            key={item.id} 
            className={`flex items-center justify-between p-3 rounded-lg bg-background border ${
              item.isOld ? 'border-red-200' : 'border-border'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{item.name}</span>
                {item.isOld && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 gap-1">
                    <Clock className="h-3 w-3" />
                    {item.daysSinceCreated} dní
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {item.client?.brand_name || 'Neznámý klient'} - {item.engagement?.name || 'Neznámá zakázka'}
                </span>
                <span>
                  od {format(parseISO(item.created_at), 'd.M.yyyy')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-semibold text-sm whitespace-nowrap">
                {item.price.toLocaleString()} {item.currency}
              </span>
              
              <Select 
                onValueChange={(period) => onAddToInvoice(item, period)}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Přidat do období..." />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}