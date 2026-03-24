import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useProspectsData } from '@/hooks/useProspectsData';
import { toast } from 'sonner';
import type { ProspectWithInteractions } from '@/types/prospect';

interface Props {
  prospect: ProspectWithInteractions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertProspectDialog({ prospect, open, onOpenChange }: Props) {
  const { addLead } = useLeadsData();
  const { markConverted } = useProspectsData();

  if (!prospect) return null;

  const handleConvert = async () => {
    try {
      const leadData = {
        company_name: prospect.company || prospect.name,
        contact_name: prospect.name,
        contact_email: prospect.email,
        contact_phone: prospect.phone || '',
        source: 'inbound' as const,
        summary: `Převedeno ze zájemců. Interakce: ${prospect.interactions.map(i => i.title).join(', ')}`,
      };

      const newLead = await addLead(leadData);
      if (newLead?.id) {
        await markConverted(prospect.id, newLead.id);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Nepodařilo se převést na lead');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Převést na lead</DialogTitle>
          <DialogDescription>
            Vytvoří nový lead s předvyplněnými údaji ze zájemce <strong>{prospect.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
            <div><span className="text-muted-foreground">Firma:</span> {prospect.company || prospect.name}</div>
            <div><span className="text-muted-foreground">Kontakt:</span> {prospect.name}</div>
            <div><span className="text-muted-foreground">E-mail:</span> {prospect.email}</div>
            {prospect.phone && <div><span className="text-muted-foreground">Telefon:</span> {prospect.phone}</div>}
            <div><span className="text-muted-foreground">Interakcí:</span> {prospect.interaction_count}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={handleConvert} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Převést na lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
