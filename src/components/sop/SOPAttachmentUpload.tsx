import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Paperclip, X, Upload, FileText, FileSpreadsheet, File } from 'lucide-react';

export interface SOPAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface SOPAttachmentUploadProps {
  articleId: string;
  attachments: SOPAttachment[];
  onChange: (attachments: SOPAttachment[]) => void;
  readOnly?: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-destructive" />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function getAttachmentUrl(path: string): string {
  const { data } = supabase.storage.from('sop-attachments').getPublicUrl(path);
  return data.publicUrl;
}

export function SOPAttachmentUpload({ articleId, attachments, onChange, readOnly }: SOPAttachmentUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: SOPAttachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Soubor je příliš velký', description: `${file.name} překračuje limit 20 MB`, variant: 'destructive' });
        continue;
      }

      const ext = file.name.split('.').pop() || '';
      const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const path = `${articleId}/${safeName}`;

      const { error } = await supabase.storage.from('sop-attachments').upload(path, file);
      if (error) {
        console.error('Upload error:', error);
        toast({ title: 'Chyba při nahrávání', description: error.message, variant: 'destructive' });
        continue;
      }

      newAttachments.push({ name: file.name, path, size: file.size, type: file.type });
    }

    if (newAttachments.length > 0) {
      onChange([...attachments, ...newAttachments]);
      toast({ title: `${newAttachments.length} ${newAttachments.length === 1 ? 'soubor nahrán' : 'soubory nahrány'}` });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async (index: number) => {
    const att = attachments[index];
    await supabase.storage.from('sop-attachments').remove([att.path]);
    onChange(attachments.filter((_, i) => i !== index));
  };

  const handleDownload = (att: SOPAttachment) => {
    const url = getAttachmentUrl(att.path);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5" />
        Přílohy
      </Label>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
              {getFileIcon(att.type)}
              <button
                type="button"
                className="flex-1 text-left truncate hover:underline text-foreground"
                onClick={() => handleDownload(att)}
              >
                {att.name}
              </button>
              <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(att.size)}</span>
              {!readOnly && (
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemove(i)}>
                  <X className="h-3.5 w-3.5" />
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
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? 'Nahrávám...' : 'Nahrát soubor'}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, obrázky, ZIP – max 20 MB</p>
        </div>
      )}
    </div>
  );
}
