import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, ExternalLink, Settings, Trash2, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import type { EngagementService } from '@/types/crm';
import type { ClientMonthSummary } from '@/types/creativeBoost';

interface CreativeBoostCreditOverviewProps {
  engagementService: EngagementService;
  summary: ClientMonthSummary | null | undefined;
  year: number;
  month: number;
  canSeeFinancials: boolean;
  onUpdateSettings: (updates: { maxCredits?: number; pricePerCredit?: number }) => void;
  onDelete: () => void;
}

const MONTH_NAMES = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

export function CreativeBoostCreditOverview({ 
  engagementService, 
  summary, 
  year, 
  month,
  canSeeFinancials,
  onUpdateSettings,
  onDelete
}: CreativeBoostCreditOverviewProps) {
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempMaxCredits, setTempMaxCredits] = useState('');
  const [tempPricePerCredit, setTempPricePerCredit] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const maxCredits = engagementService.creative_boost_max_credits ?? 0;
  const pricePerCredit = engagementService.creative_boost_price_per_credit ?? 0;
  
  const usedCredits = summary?.usedCredits ?? 0;
  const progressPercent = maxCredits > 0 ? Math.min((usedCredits / maxCredits) * 100, 100) : 0;
  const estimatedInvoice = summary?.estimatedInvoice ?? (usedCredits * pricePerCredit);
  
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempMaxCredits(String(maxCredits));
    setTempPricePerCredit(String(pricePerCredit));
    setIsEditing(true);
  };
  
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateSettings({
      maxCredits: parseInt(tempMaxCredits) || 0,
      pricePerCredit: parseInt(tempPricePerCredit) || 0,
    });
    setIsEditing(false);
  };
  
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  return (
    <>
      <div className="p-3 rounded-lg bg-muted/50 border space-y-3" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium">Creative Boost</span>
            <Badge variant="outline" className="text-[10px] h-5">
              {MONTH_NAMES[month - 1]} {year}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {canSeeFinancials && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleStartEdit}
                title="Nastavení"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
            {canSeeFinancials && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                title="Odebrat službu"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Settings edit mode - only for users with financial access */}
        {isEditing && canSeeFinancials && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-background border">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Max:</span>
              <Input
                type="number"
                value={tempMaxCredits}
                onChange={(e) => setTempMaxCredits(e.target.value)}
                className="h-7 w-16 text-xs"
                placeholder="0"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-muted-foreground">kr</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Cena:</span>
              <Input
                type="number"
                value={tempPricePerCredit}
                onChange={(e) => setTempPricePerCredit(e.target.value)}
                className="h-7 w-20 text-xs"
                placeholder="0"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-muted-foreground">Kč/kr</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-status-active"
              onClick={handleSave}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        
        {/* Credit usage */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Čerpání kreditů</span>
            <span className="font-medium">
              {usedCredits} / {maxCredits} kreditů
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs">
            <div className="flex gap-2">
              {summary && (
                <>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {summary.normalCredits} normální
                  </Badge>
                  {summary.expressCredits > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {summary.expressCredits} express
                    </Badge>
                  )}
                </>
              )}
            </div>
            {canSeeFinancials && (
              <span className="text-muted-foreground">
                Odhad: <span className="font-medium text-foreground">{estimatedInvoice.toLocaleString()} Kč</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">
            {maxCredits} kreditů{canSeeFinancials && ` • ${pricePerCredit.toLocaleString()} Kč/kredit`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => navigate('/creative-boost')}
          >
            <ExternalLink className="h-3 w-3" />
            Otevřít Creative Boost
          </Button>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Odebrat Creative Boost?</AlertDialogTitle>
            <AlertDialogDescription>
              Služba Creative Boost bude odebrána z této zakázky. Tuto akci nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
            >
              Odebrat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
