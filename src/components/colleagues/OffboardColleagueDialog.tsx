import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Colleague } from '@/types/crm';

interface OffboardColleagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colleague: Colleague;
  onOffboarded: (colleagueId: string) => void;
}

interface OffboardResults {
  google?: { success: boolean; forwarding?: boolean; error?: string };
  slack?: { success: boolean; error?: string };
  freelo?: { success: boolean; removedFromProjects?: number; error?: string };
}

export function OffboardColleagueDialog({
  open,
  onOpenChange,
  colleague,
  onOffboarded,
}: OffboardColleagueDialogProps) {
  const [deactivateGoogle, setDeactivateGoogle] = useState(true);
  const [deactivateSlack, setDeactivateSlack] = useState(true);
  const [removeFreelo, setRemoveFreelo] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OffboardResults | null>(null);

  const handleOffboard = async () => {
    setIsProcessing(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('offboard-colleague', {
        body: {
          email: colleague.email,
          deactivate_google: deactivateGoogle,
          deactivate_slack: deactivateSlack,
          remove_freelo: removeFreelo,
        },
      });

      if (error) throw error;

      setResults(data.results || {});

      // Update colleague status
      onOffboarded(colleague.id);

      if (data.success) {
        toast.success(`Spolupráce s ${colleague.full_name} ukončena`);
      } else {
        toast.warning('Spolupráce ukončena, ale některé systémy se nepodařilo deaktivovat');
      }
    } catch (error: any) {
      console.error('Offboard error:', error);
      toast.error(error.message || 'Nepodařilo se provést offboarding');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResults(null);
    setDeactivateGoogle(true);
    setDeactivateSlack(true);
    setRemoveFreelo(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Ukončit spolupráci
          </DialogTitle>
          <DialogDescription>
            Ukončení spolupráce s <strong>{colleague.full_name}</strong> ({colleague.email})
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Vyberte systémy, ze kterých bude kolega odebrán:
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={deactivateGoogle}
                    onCheckedChange={(c) => setDeactivateGoogle(!!c)}
                    disabled={isProcessing}
                  />
                  <div>
                    <p className="text-sm font-medium">Deaktivovat Google Workspace</p>
                    <p className="text-xs text-muted-foreground">Suspendování účtu + přesměrování e-mailů na hello@socials.cz</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={deactivateSlack}
                    onCheckedChange={(c) => setDeactivateSlack(!!c)}
                    disabled={isProcessing}
                  />
                  <div>
                    <p className="text-sm font-medium">Deaktivovat Slack</p>
                    <p className="text-xs text-muted-foreground">Deaktivace uživatele ve workspace</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={removeFreelo}
                    onCheckedChange={(c) => setRemoveFreelo(!!c)}
                    disabled={isProcessing}
                  />
                  <div>
                    <p className="text-sm font-medium">Odebrat z Freelo projektů</p>
                    <p className="text-xs text-muted-foreground">Odebrání ze všech projektů</p>
                  </div>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Zrušit
              </Button>
              <Button
                variant="destructive"
                onClick={handleOffboard}
                disabled={isProcessing || (!deactivateGoogle && !deactivateSlack && !removeFreelo)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Probíhá...
                  </>
                ) : (
                  'Ukončit spolupráci'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 py-4">
              <p className="text-sm font-medium">Výsledky:</p>

              {results.google && (
                <div className="p-3 rounded-lg border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Google Workspace</span>
                    {results.google.success ? (
                      <Badge className="bg-status-active/10 text-status-active border-status-active/20">
                        <Check className="h-3 w-3 mr-1" /> Deaktivováno
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" /> {results.google.error}
                      </Badge>
                    )}
                  </div>
                  {results.google.success && (
                    <p className="text-xs text-muted-foreground">
                      {results.google.forwarding
                        ? '✉️ E-maily přesměrovány na hello@socials.cz'
                        : '⚠️ Přesměrování e-mailů se nepodařilo nastavit – zkontrolujte ručně'}
                    </p>
                  )}
                </div>
              )}

              {results.slack && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">Slack</span>
                  {results.slack.success ? (
                    <Badge className="bg-status-active/10 text-status-active border-status-active/20">
                      <Check className="h-3 w-3 mr-1" /> Deaktivováno
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" /> {results.slack.error}
                    </Badge>
                  )}
                </div>
              )}

              {results.freelo && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">Freelo</span>
                  {results.freelo.success ? (
                    <Badge className="bg-status-active/10 text-status-active border-status-active/20">
                      <Check className="h-3 w-3 mr-1" /> Odebráno
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" /> {results.freelo.error}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Zavřít</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
