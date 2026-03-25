import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useProspectsData } from '@/hooks/useProspectsData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ProspectWithInteractions } from '@/types/prospect';

interface Props {
  prospect: ProspectWithInteractions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertProspectDialog({ prospect, open, onOpenChange }: Props) {
  const { markConverted } = useProspectsData();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!prospect) return null;

  const handleConvert = async () => {
    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          company_name: prospect.company || prospect.name,
          contact_name: prospect.name,
          contact_email: prospect.email,
          contact_phone: prospect.phone || '',
          source: 'inbound' as const,
          summary: `Převedeno ze zájemců. Interakce: ${prospect.interactions.map(i => i.title).join(', ')}`,
          stage: 'new_lead' as const,
          created_by: user?.id || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      await markConverted(prospect.id, newLead.id);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Convert error:', error);
      toast.error('Nepodařilo se převést na lead');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
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
