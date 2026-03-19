import { Link } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { ModificationRequestCard } from '@/components/engagements/ModificationRequestCard';
import { toast } from 'sonner';
import type { StoredModificationRequest } from '@/hooks/useModificationRequests';

export function PendingModificationsSection() {
  const { 
    pendingRequests, 
    isLoadingPending,
    approveRequest,
    rejectRequest,
    isApproving,
    isRejecting,
  } = useModificationRequests();

  const pendingOnly = pendingRequests.filter((request) => request.status === 'pending');

  // Approval should only move workflow state.
  // Actual activation must happen from the dedicated activation step.
  const handleApprove = async (request: StoredModificationRequest) => {
    try {
      await approveRequest(request.id);
      toast.success('Požadavek byl schválen');
    } catch (error) {
      console.error('Error approving modification:', error);
      toast.error('Nepodařilo se schválit změnu');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    await rejectRequest({ requestId, reason });
  };

  if (isLoadingPending) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Návrhy změn k schválení
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (pendingOnly.length === 0) {
    return null; // Don't show section if no pending requests
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            ⏳ Návrhy změn k schválení ({pendingOnly.length})
          </CardTitle>
          {pendingOnly.length > 3 && (
            <Link to="/engagements">
              <Button variant="ghost" size="sm" className="text-xs">
                Zobrazit vše
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingOnly.slice(0, 3).map((request) => (
          <ModificationRequestCard
            key={request.id}
            request={request}
            onApprove={() => handleApprove(request)}
            onReject={handleReject}
            isApproving={isApproving}
            isRejecting={isRejecting}
          />
        ))}
        {pendingOnly.length > 3 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <AlertCircle className="h-4 w-4" />
            <span>+ {pendingOnly.length - 3} dalších požadavků</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
