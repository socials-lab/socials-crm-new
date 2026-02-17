import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SuggestSOPUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleTitle: string;
  onSubmit: (reason: string) => Promise<void>;
}

export function SuggestSOPUpdateDialog({ open, onOpenChange, articleTitle, onSubmit }: SuggestSOPUpdateDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    await onSubmit(reason.trim());
    setSubmitting(false);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Navrhnout úpravu SOP</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Článek: <strong>{articleTitle}</strong>
        </p>
        <div className="space-y-2">
          <Label>Co je neaktuální nebo chybí? *</Label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Popište, co je potřeba aktualizovat..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={handleSubmit} disabled={submitting || !reason.trim()}>
            {submitting ? 'Odesílám...' : 'Odeslat návrh'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
