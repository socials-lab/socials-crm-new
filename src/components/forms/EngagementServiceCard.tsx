import { useState } from 'react';
import { Pencil, Trash2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { EngagementService, EngagementAssignment, Colleague, Service, ServiceTier } from '@/types/crm';

const tierLabels: Record<ServiceTier, string> = {
  growth: 'GROWTH',
  pro: 'PRO',
  elite: 'ELITE',
};

interface EngagementServiceCardProps {
  engagementService: EngagementService;
  service: Service | undefined;
  assignments: (EngagementAssignment & { colleague: Colleague })[];
  canSeeFinancials: boolean;
  onAddAssignment: (serviceId: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onDeleteService: (serviceId: string) => void;
}

export function EngagementServiceCard({
  engagementService,
  service,
  assignments,
  canSeeFinancials,
  onAddAssignment,
  onRemoveAssignment,
  onDeleteService,
}: EngagementServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [assignmentToRemove, setAssignmentToRemove] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const totalAssignmentCost = assignments.reduce((sum, a) => sum + (a.monthly_cost || 0), 0);

  return (
    <>
      <Card className="border-border/50">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              {service?.code?.charAt(0) || engagementService.name.charAt(0)}
            </div>
            <div>
              <span className="font-medium text-sm">{engagementService.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs">
                  {engagementService.billing_type === 'monthly' ? 'Měsíčně' : 'Jednorázově'}
                </Badge>
                {service?.service_type === 'core' && engagementService.selected_tier && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {tierLabels[engagementService.selected_tier]}
                  </Badge>
                )}
                {canSeeFinancials && (
                  <span className="text-xs text-muted-foreground">
                    {assignments.length} kolegů
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSeeFinancials && (
              <span className="text-sm font-semibold whitespace-nowrap">
                {engagementService.price.toLocaleString()} {engagementService.currency}
                {engagementService.billing_type === 'monthly' && '/měs'}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <CardContent className="pt-0 pb-3 px-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Přiřazení kolegové:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAssignment(engagementService.id);
                }}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Přidat
              </Button>
            </div>

            {assignments.length > 0 ? (
              <div className="space-y-1.5">
                {assignments.map(assignment => (
                  <div 
                    key={assignment.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-background border"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {assignment.colleague.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{assignment.colleague.full_name}</p>
                        <p className="text-xs text-muted-foreground">{assignment.role_on_engagement}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canSeeFinancials && assignment.monthly_cost && (
                        <span className="text-xs text-muted-foreground">
                          {assignment.monthly_cost.toLocaleString()} CZK/měs
                        </span>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignmentToRemove(assignment.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">Žádní přiřazení kolegové</p>
            )}

            {canSeeFinancials && assignments.length > 0 && (
              <div className="pt-2 border-t flex justify-between text-xs">
                <span className="text-muted-foreground">Celkové náklady:</span>
                <span className="font-medium">{totalAssignmentCost.toLocaleString()} CZK/měs</span>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Remove assignment confirmation */}
      <AlertDialog open={!!assignmentToRemove} onOpenChange={() => setAssignmentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odebrat přiřazení?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete odebrat tohoto kolegu ze služby? Tuto akci nelze vrátit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (assignmentToRemove) {
                  onRemoveAssignment(assignmentToRemove);
                  setAssignmentToRemove(null);
                }
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Odebrat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete service confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat službu?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat službu "{engagementService.name}"? Budou odebrána i všechna přiřazení kolegů.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDeleteService(engagementService.id);
                setShowDeleteConfirm(false);
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
