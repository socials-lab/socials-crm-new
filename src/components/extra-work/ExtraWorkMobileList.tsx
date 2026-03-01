import { useState } from 'react';
import { ExtraWorkMobileCard } from './ExtraWorkMobileCard';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import type { ExtraWork, ExtraWorkStatus } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

interface ExtraWorkMobileListProps {
  extraWorks: ExtraWork[];
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
  onDelete: (id: string) => void;
}

export function ExtraWorkMobileList({
  extraWorks,
  onUpdate,
  onDelete,
}: ExtraWorkMobileListProps) {
  const { getClientById, getEngagementById, getColleagueById, approveExtraWork, completeExtraWork } = useCRMData();
  const { isSuperAdmin, role } = useUserRole();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Permission check: only admin/management can approve extra work
  const canApprove = isSuperAdmin || role === 'admin' || role === 'management';

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStatusChange = async (work: ExtraWork, newStatus: ExtraWorkStatus) => {
    try {
      // Use proper status transition helpers
      if (newStatus === 'in_progress' && work.status === 'pending_approval') {
        // Permission check for approval actions
        if (!canApprove) {
          toast({
            title: 'Nedostatečná oprávnění',
            description: 'Pouze admin nebo management může schvalovat vícepráce.',
            variant: 'destructive',
          });
          return;
        }
        await approveExtraWork(work.id);
        toast({
          title: 'Schváleno',
          description: 'Vícepráce byla schválena.',
        });
        return;
      }

      if (newStatus === 'ready_to_invoice' && work.status === 'in_progress') {
        await completeExtraWork(work.id);
        toast({
          title: 'K fakturaci',
          description: 'Vícepráce je připravena k fakturaci.',
        });
        return;
      }

      // For other status changes (shouldn't happen with current flow)
      onUpdate(work.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to change status:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se změnit stav vícepráce.',
        variant: 'destructive',
      });
    }
  };

  if (extraWorks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Žádné vícepráce k zobrazení
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {extraWorks.map(work => {
        const client = getClientById(work.client_id);
        const engagement = work.engagement_id ? getEngagementById(work.engagement_id) : null;
        const colleague = getColleagueById(work.colleague_id);

        return (
          <ExtraWorkMobileCard
            key={work.id}
            work={work}
            clientName={client?.brand_name}
            engagementName={engagement?.name}
            colleagueName={colleague?.full_name}
            isSelected={selectedIds.has(work.id)}
            canApprove={canApprove}
            onSelect={() => handleSelect(work.id)}
            onStatusChange={(status) => handleStatusChange(work, status)}
            onDelete={() => onDelete(work.id)}
          />
        );
      })}
    </div>
  );
}
