import { useCallback, useRef, useState, type ChangeEvent } from "react";
import html2canvas from "html2canvas";
import { Lightbulb, Bug, Loader2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBugReports } from "@/hooks/useBugReports";
import { toast } from "sonner";
import type { BugReportType } from "@/types/bugReport";

export function BugReportFAB() {
  const { addReport } = useBugReports();
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<BugReportType>("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setType("bug");
    setSubject("");
    setDescription("");
    setPageUrl("");
    setScreenshotDataUrl(null);
  }

  const handleFabClick = useCallback(async () => {
    setCapturing(true);
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 1,
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });
      setScreenshotDataUrl(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error("Failed to capture bug report screenshot:", error);
      toast.error("Screenshot capture failed. Please upload an image manually.");
      setScreenshotDataUrl(null);
    } finally {
      setPageUrl(window.location.href);
      setCapturing(false);
      setOpen(true);
    }
  }, []);

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        throw new Error("Uploaded screenshot is not readable");
      }
      setScreenshotDataUrl(reader.result);
    };
    reader.onerror = (fileError) => {
      console.error("Failed to read uploaded screenshot:", fileError);
      toast.error("Image upload failed. Please try again.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSubmit() {
    if (!subject.trim()) return;

    setSubmitting(true);
    try {
      await addReport({
        type,
        subject: subject.trim(),
        description: description.trim(),
        pageUrl,
        screenshotDataUrl,
      });
      toast.success(type === "bug" ? "Bug report submitted" : "Feature request submitted");
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isBug = type === "bug";

  return (
    <>
      <Button
        onClick={handleFabClick}
        disabled={capturing}
        className="fixed z-[60] h-12 w-12 rounded-full p-0 shadow-lg bottom-[calc(env(safe-area-inset-bottom)+3.5rem+0.75rem)] right-4 md:bottom-5 md:right-5"
        size="icon"
      >
        {capturing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lightbulb className="h-5 w-5" />}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) resetForm();
          setOpen(nextOpen);
        }}
      >
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
            <DialogDescription>Report a bug or suggest an improvement.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-1 rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  isBug ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bug className="h-4 w-4" /> Bug Report
              </button>
              <button
                type="button"
                onClick={() => setType("feature")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  !isBug ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lightbulb className="h-4 w-4" /> Feature Request
              </button>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Page URL</Label>
              <Input value={pageUrl} readOnly className="mt-1 bg-muted text-xs text-muted-foreground" />
            </div>

            <div>
              <Label>{isBug ? "Subject *" : "Request title *"}</Label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value.slice(0, 200))}
                placeholder={isBug ? "Short problem summary" : "What should be improved?"}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 2000))}
                rows={4}
                placeholder={isBug ? "Describe steps to reproduce..." : "Describe your proposal in detail..."}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Screenshot</Label>
              {screenshotDataUrl ? (
                <div className="relative mt-1">
                  <img src={screenshotDataUrl} alt="Screenshot" className="max-h-40 w-full rounded-md border object-contain" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6 rounded-full bg-background/80"
                    onClick={() => setScreenshotDataUrl(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-1.5 h-4 w-4" /> Upload image
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={!subject.trim() || submitting}>
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
