import { Dialog, DialogContent } from '@/components/ui/dialog';

interface BugReportImageDialogProps {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportImageDialog({ imageUrl, open, onOpenChange }: BugReportImageDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-2">
        <img src={imageUrl} alt="Screenshot" className="w-full rounded-md" />
      </DialogContent>
    </Dialog>
  );
}
