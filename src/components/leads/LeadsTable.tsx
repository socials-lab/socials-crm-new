import { ExternalLink, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Lead, LeadStage } from '@/types/crm';
import { useCRMData } from '@/hooks/useCRMData';
import { useIsMobile } from '@/hooks/use-mobile';
import { LeadMobileCard } from './LeadMobileCard';
import { cn } from '@/lib/utils';
import { getLeadLastActivity } from '@/utils/leadActivityUtils';

interface LeadsTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka proběhla',
  waiting_access: 'Čekáme na přístupy',
  access_received: 'Přístupy přijaty',
  preparing_offer: 'Příprava nabídky',
  offer_sent: 'Nabídka odeslána',
  won: 'Vyhráno',
  lost: 'Prohráno',
  postponed: 'Odloženo',
};

const STAGE_COLORS: Record<LeadStage, string> = {
  new_lead: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
  meeting_done: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  waiting_access: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  access_received: 'bg-green-500/10 text-green-700 border-green-500/30',
  preparing_offer: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  offer_sent: 'bg-pink-500/10 text-pink-700 border-pink-500/30',
  won: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  lost: 'bg-red-500/10 text-red-700 border-red-500/30',
  postponed: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
};

export function LeadsTable({ leads, onLeadClick }: LeadsTableProps) {
  const { colleagues } = useCRMData();
  const isMobile = useIsMobile();

  const getOwnerName = (ownerId: string) => {
    const owner = colleagues.find(c => c.id === ownerId);
    return owner?.full_name || 'Neznámý';
  };

  // Mobile view: Card stack
  if (isMobile) {
    return (
      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Žádné leady neodpovídají vašim kritériím
          </div>
        ) : (
          leads.map(lead => (
            <LeadMobileCard
              key={lead.id}
              lead={lead}
              ownerName={getOwnerName(lead.owner_id)}
              onClick={() => onLeadClick(lead)}
            />
          ))
        )}
      </div>
    );
  }

  // Desktop view: Table
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Firma</TableHead>
            <TableHead>IČO</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead>Odpovědná osoba</TableHead>
            <TableHead>Služba</TableHead>
            <TableHead className="text-right">Cena</TableHead>
            <TableHead>Nabídka</TableHead>
            <TableHead>Poslední aktivita</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map(lead => {
            const activityInfo = getLeadLastActivity(lead);
            
            return (
              <TableRow 
                key={lead.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onLeadClick(lead)}
              >
                <TableCell className="font-medium">{lead.company_name}</TableCell>
                <TableCell className="text-muted-foreground">{lead.ico}</TableCell>
                <TableCell>
                  <div className="truncate max-w-[150px]">
                    {lead.contact_name}
                    {lead.contact_position && (
                      <span className="text-muted-foreground text-xs block">
                        {lead.contact_position}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", STAGE_COLORS[lead.stage])}
                  >
                    {STAGE_LABELS[lead.stage]}
                  </Badge>
                </TableCell>
                <TableCell>{getOwnerName(lead.owner_id)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {lead.potential_service}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {lead.estimated_price.toLocaleString()} {lead.currency}
                </TableCell>
                <TableCell>
                  {lead.offer_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(lead.offer_url!, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className={cn(
                    "flex items-center gap-1.5 text-sm",
                    activityInfo.isStale ? "text-amber-600 font-medium" : "text-muted-foreground"
                  )}>
                    {activityInfo.isStale && (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span>{activityInfo.activityLabel}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Žádné leady neodpovídají vašim kritériím
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
