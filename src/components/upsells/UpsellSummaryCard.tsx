import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, Building2, Briefcase, User, Coins, FileText, Sparkles, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUpsellApprovals, UpsellItem } from '@/hooks/useUpsellApprovals';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface UpsellSummaryCardProps {
  className?: string;
}

export function UpsellSummaryCard({ className }: UpsellSummaryCardProps) {
  const { isSuperAdmin, role, colleagueId } = useUserRole();
  const { engagements, colleagues } = useCRMData();
  const { getUpsellsForMonth, approveCommission, addManualCommission } = useUpsellApprovals();
  
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  
  const canApprove = isSuperAdmin || role === 'admin';
  const canAddManualCommission = isSuperAdmin || role === 'admin';
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualEngagementId, setManualEngagementId] = useState('');
  const [manualColleagueId, setManualColleagueId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  
  const upsells = getUpsellsForMonth(year, month);
  
  const totalCommission = upsells.reduce((sum, u) => sum + u.commissionAmount, 0);
  const approvedCommission = upsells
    .filter(u => u.isApproved)
    .reduce((sum, u) => sum + u.commissionAmount, 0);
  const pendingCommission = totalCommission - approvedCommission;

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthLabel = format(new Date(year, month - 1), 'LLLL yyyy', { locale: cs });
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const handleApprove = (item: UpsellItem) => {
    if (!colleagueId) return;
    approveCommission(item.type, item.id, colleagueId);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'd.M.yyyy', { locale: cs });
  };

  const engagementOptions = useMemo(
    () => engagements
      .filter((engagement) => engagement.status !== 'cancelled')
      .sort((left, right) => left.name.localeCompare(right.name, 'cs')),
    [engagements],
  );

  const colleagueOptions = useMemo(
    () => colleagues
      .filter((colleague) => colleague.status === 'active')
      .sort((left, right) => left.full_name.localeCompare(right.full_name, 'cs')),
    [colleagues],
  );

  const resetManualForm = () => {
    setManualEngagementId('');
    setManualColleagueId('');
    setManualAmount('');
    setManualNote('');
  };

  const handleManualSubmit = async () => {
    if (!canAddManualCommission) {
      toast.error('Manuální provizi může přidat pouze administrátor');
      return;
    }
    const parsedAmount = Number(manualAmount);
    if (!manualEngagementId || !manualColleagueId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Vyberte zakázku, kolegu a zadejte platnou výši odměny');
      return;
    }

    setIsSubmittingManual(true);
    try {
      await addManualCommission({
        engagementId: manualEngagementId,
        colleagueId: manualColleagueId,
        amount: parsedAmount,
        note: manualNote,
        year,
        month,
      });
      setManualDialogOpen(false);
      resetManualForm();
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            💰 Přehled upsellů
          </CardTitle>
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            {canAddManualCommission && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setManualDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Přidat provizi
              </Button>
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[100px] sm:min-w-[120px] text-center text-xs sm:text-sm font-medium">{capitalizedMonthLabel}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upsells.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Coins className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Žádné upselly v tomto měsíci</p>
          </div>
        ) : (
          <>
            {/* Upsell items */}
            <div className="space-y-3">
              {upsells.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-lg border bg-card p-4 space-y-3"
                >
                  {/* Header - Client & Engagement */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.brandName}</p>
                        <p className="text-xs text-muted-foreground">{item.engagementName}</p>
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    {item.isApproved ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        ✅ Schváleno {item.approvedAt && formatDate(item.approvedAt)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Clock className="h-3 w-3 mr-1" />
                        Čeká na schválení
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {item.type === 'extra_work' ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : item.type === 'service' ? (
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Coins className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">
                        {item.type === 'extra_work' ? 'Vícepráce:' : item.type === 'service' ? 'Nová služba:' : 'Manuální provize:'}
                      </span>
                      <span className="font-medium">{item.itemName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Částka:</span>
                      <span className="font-medium">{item.amount.toLocaleString()} {item.currency}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Prodal:</span>
                      <span className="font-medium">{item.upsoldByName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span className="text-muted-foreground">Provize:</span>
                      <span className="font-bold text-amber-600">
                        {item.commissionAmount.toLocaleString()} {item.currency} ({item.commissionPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Approve button for admins */}
                  {!item.isApproved && canApprove && (
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleApprove(item)}
                      >
                        <Check className="h-4 w-4" />
                        Schválit provizi
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <Separator />
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Celkem provize:</span>
                <span className="font-bold">{totalCommission.toLocaleString()} CZK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Schváleno:</span>
                <span className="font-bold text-green-600">{approvedCommission.toLocaleString()} CZK</span>
              </div>
              {pendingCommission > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Čeká na schválení:</span>
                  <span className="font-bold text-amber-600">{pendingCommission.toLocaleString()} CZK</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Přidat manuální provizi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Zakázka *</Label>
              <Select value={manualEngagementId} onValueChange={setManualEngagementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte zakázku" />
                </SelectTrigger>
                <SelectContent>
                  {engagementOptions.map((engagement) => (
                    <SelectItem key={engagement.id} value={engagement.id}>
                      {engagement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kolega *</Label>
              <Select value={manualColleagueId} onValueChange={setManualColleagueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte kolegu" />
                </SelectTrigger>
                <SelectContent>
                  {colleagueOptions.map((colleague) => (
                    <SelectItem key={colleague.id} value={colleague.id}>
                      {colleague.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Výše odměny (CZK) *</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={manualAmount}
                onChange={(event) => setManualAmount(event.target.value)}
                placeholder="Např. 5000"
              />
            </div>

            <div className="space-y-2">
              <Label>Poznámka</Label>
              <Textarea
                value={manualNote}
                onChange={(event) => setManualNote(event.target.value)}
                placeholder="Volitelný popis provize"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setManualDialogOpen(false);
                  resetManualForm();
                }}
                disabled={isSubmittingManual}
              >
                Zrušit
              </Button>
              <Button
                type="button"
                onClick={() => void handleManualSubmit()}
                disabled={isSubmittingManual}
              >
                {isSubmittingManual ? 'Ukládám...' : 'Přidat provizi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
