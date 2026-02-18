import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Paperclip, X, Upload, FileText, FileSpreadsheet, File, Download, Loader2 } from 'lucide-react';

export interface SOPAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  signedUrl?: string; // Pre-signed URL for public sharing
}

interface SOPAttachmentUploadProps {
  articleId: string;
  attachments: SOPAttachment[];
  onChange: (attachments: SOPAttachment[]) => void;
  readOnly?: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const BUCKET_NAME = 'sop-attachments';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-destructive" />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (type.includes('image')) return <File className="h-4 w-4 text-blue-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

// Get a signed URL for downloading (works with private buckets)
export async function getAttachmentSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

export function SOPAttachmentUpload({ articleId, attachments, onChange, readOnly }: SOPAttachmentUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: SOPAttachment[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: překračuje limit 20 MB`);
        continue;
      }

      // Generate safe filename
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const safeName = `${timestamp}-${randomStr}.${ext}`;
      const path = `${articleId}/${safeName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error for', file.name, ':', uploadError);
          errors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        newAttachments.push({
          name: file.name,
          path,
          size: file.size,
          type: file.type || 'application/octet-stream',
        });
      } catch (err) {
        console.error('Upload exception for', file.name, ':', err);
        errors.push(`${file.name}: Neočekávaná chyba`);
      }
    }

    // Show results
    if (newAttachments.length > 0) {
      onChange([...attachments, ...newAttachments]);
      toast({
        title: `${newAttachments.length} ${newAttachments.length === 1 ? 'soubor nahrán' : 'soubory nahrány'}`,
      });
    }

    if (errors.length > 0) {
      toast({
        title: 'Některé soubory se nepodařilo nahrát',
        description: errors.join(', '),
        variant: 'destructive',
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async (index: number) => {
    const att = attachments[index];
    setRemovingIndex(index);

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([att.path]);

      if (error) {
        console.error('Remove error:', error);
        // Still remove from list even if storage delete fails (file might not exist)
      }

      onChange(attachments.filter((_, i) => i !== index));
      toast({ title: 'Příloha odebrána' });
    } catch (err) {
      console.error('Remove exception:', err);
      toast({ title: 'Chyba při odebírání přílohy', variant: 'destructive' });
    } finally {
      setRemovingIndex(null);
    }
  };

  const handleDownload = async (att: SOPAttachment, index: number) => {
    setDownloadingIndex(index);

    try {
      // Use pre-signed URL if available (for public sharing), otherwise generate one
      let downloadUrl = att.signedUrl;
      if (!downloadUrl) {
        downloadUrl = await getAttachmentSignedUrl(att.path);
      }

      if (!downloadUrl) {
        toast({ title: 'Nepodařilo se získat odkaz na soubor', variant: 'destructive' });
        return;
      }

      // Open in new tab or trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      toast({ title: 'Chyba při stahování souboru', variant: 'destructive' });
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5" />
        Přílohy
        {attachments.length > 0 && (
          <span className="text-muted-foreground font-normal">({attachments.length})</span>
        )}
      </Label>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att, i) => (
            <div
              key={`${att.path}-${i}`}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm group"
            >
              {getFileIcon(att.type)}
              <button
                type="button"
                className="flex-1 text-left truncate hover:underline text-foreground disabled:opacity-50"
                onClick={() => handleDownload(att, i)}
                disabled={downloadingIndex === i}
              >
                {att.name}
              </button>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatFileSize(att.size)}
              </span>
              {downloadingIndex === i ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDownload(att, i)}
                  title="Stáhnout"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(i)}
                  disabled={removingIndex === i}
                  title="Odebrat"
                >
                  {removingIndex === i ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg,.gif,.webp"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Nahrávám...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1.5" />
                Nahrát soubor
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1.5">
            PDF, Word, Excel, PowerPoint, obrázky, ZIP – max 20 MB na soubor
          </p>
        </div>
      )}
    </div>
  );
}
