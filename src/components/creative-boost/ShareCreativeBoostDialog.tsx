import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, CheckCircle2, Loader2, Share2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface ShareCreativeBoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientMonthId: string;
  clientName: string;
  brandName?: string;
  year: number;
  month: number;
}

export function ShareCreativeBoostDialog({
  open,
  onOpenChange,
  clientMonthId,
  clientName,
  brandName,
  year,
  month,
}: ShareCreativeBoostDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const monthLabel = format(new Date(year, month - 1), 'LLLL yyyy', { locale: cs });

  const handleCreateShare = async () => {
    setIsCreating(true);

    try {
      const { data: token, error } = await supabase
        .rpc('create_creative_boost_share', { p_client_month_id: clientMonthId });

      if (error) {
        console.error('Error creating share:', error);
        toast.error('Nepodařilo se vytvořit sdílený odkaz');
        return;
      }

      const url = `${window.location.origin}/creative-boost-share/${token}`;
      setShareUrl(url);
      toast.success('Sdílený odkaz vytvořen');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Došlo k chybě');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success('Odkaz zkopírován do schránky');
  };

  const handleOpenLink = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank');
  };

  const handleClose = () => {
    setShareUrl(null);
    setLinkCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Sdílet Creative Boost
          </DialogTitle>
          <DialogDescription>
            Vytvoří veřejný odkaz pro klienta {brandName || clientName} pro {monthLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Klient bude moci vidět přehled využitých kreditů a odhadovanou fakturaci.
              </p>
              <Button onClick={handleCreateShare} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vytvářím odkaz...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Vytvořit sdílený odkaz
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Sdílený odkaz vytvořen</p>
              </div>

              <div className="space-y-2">
                <Label>Odkaz pro klienta</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Zkopírovat odkaz"
                  >
                    {linkCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleOpenLink}
                    title="Otevřít v novém okně"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Zavřít
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
