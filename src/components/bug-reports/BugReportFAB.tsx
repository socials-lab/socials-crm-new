import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Lightbulb, Bug, Loader2, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBugReports } from '@/hooks/useBugReports';
import { toast } from 'sonner';
import type { BugReportType } from '@/types/bugReport';

export function BugReportFAB() {
  const { addReport } = useBugReports();
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<BugReportType>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setType('bug');
    setSubject('');
    setDescription('');
    setScreenshotDataUrl(null);
  };

  const handleFabClick = useCallback(async () => {
    setCapturing(true);
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: window.devicePixelRatio * 0.5,
      });
      setScreenshotDataUrl(canvas.toDataURL('image/png'));
    } catch {
      // Screenshot failed — continue without it
    }
    setPageUrl(window.location.href);
    setCapturing(false);
    setOpen(true);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshotDataUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);
    // TODO: replace with real backend call via onSubmit callback
    addReport({ type, subject: subject.trim(), description: description.trim(), pageUrl, screenshotDataUrl });
    toast.success(type === 'bug' ? 'Bug nahlášen' : 'Návrh odeslán');
    resetForm();
    setOpen(false);
    setSubmitting(false);
  };

  const isBug = type === 'bug';

  return (
    <>
      <Button
        onClick={handleFabClick}
        disabled={capturing}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg p-0"
        size="icon"
      >
        {capturing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lightbulb className="h-5 w-5" />}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
            <DialogDescription>Nahlaste problém nebo navrhněte vylepšení.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type switcher */}
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                type="button"
                onClick={() => setType('bug')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  isBug ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bug className="h-4 w-4" /> Bug Report
              </button>
              <button
                type="button"
                onClick={() => setType('feature')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  !isBug ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lightbulb className="h-4 w-4" /> Feature Request
              </button>
            </div>

            {/* URL */}
            <div>
              <Label className="text-xs text-muted-foreground">URL stránky</Label>
              <Input value={pageUrl} readOnly className="bg-muted text-xs text-muted-foreground mt-1" />
            </div>

            {/* Subject */}
            <div>
              <Label>{isBug ? 'Předmět *' : 'Název návrhu *'}</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value.slice(0, 200))}
                placeholder={isBug ? 'Stručný popis problému' : 'Co by mělo jít lépe?'}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Popis</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 2000))}
                rows={4}
                placeholder={isBug ? 'Popište kroky k reprodukci problému…' : 'Popište svůj návrh podrobněji…'}
                className="mt-1"
              />
            </div>

            {/* Screenshot */}
            <div>
              <Label className="text-xs text-muted-foreground">Screenshot</Label>
              {screenshotDataUrl ? (
                <div className="relative mt-1">
                  <img src={screenshotDataUrl} alt="Screenshot" className="max-h-40 w-full object-contain rounded-md border" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80"
                    onClick={() => setScreenshotDataUrl(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1.5" /> Nahrát obrázek
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Zrušit</Button>
            <Button onClick={handleSubmit} disabled={!subject.trim() || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Odeslat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
