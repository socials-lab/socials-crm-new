import { useEditor, EditorContent } from '@tiptap/react';
import { useCallback, useEffect, useRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, ImagePlus, Undo, Redo } from 'lucide-react';
import { toast } from 'sonner';

interface AuditEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function AuditEditor({ content, onChange, placeholder = 'Popište zjištění z auditu...' }: AuditEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function convertFileToWebpDataUrl(file: File): Promise<string> {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek pro převod'));
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas není dostupný');
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error('Převod obrázku do WebP selhal'));
            return;
          }
          resolve(result);
        }, 'image/webp', 0.78);
      });

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          if (!dataUrl.startsWith('data:image/webp')) {
            reject(new Error('Výstup není WebP'));
            return;
          }
          resolve(dataUrl);
        };
        reader.onerror = () => reject(new Error('Nepodařilo se načíst převedený obrázek'));
        reader.readAsDataURL(blob);
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const handleUpdate = useCallback(({ editor: e }: { editor: { getHTML: () => string } }) => {
    onChange(e.getHTML());
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[150px] p-3 focus:outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_img]:border [&_img]:border-border [&_p]:my-1',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) insertImageFile(file);
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            insertImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = content || '';
    const current = editor.getHTML();
    if (incoming !== current) {
      // Keep editor in sync when parent preloads existing offer content.
      editor.commands.setContent(incoming || '<p></p>', false);
    }
  }, [editor, content]);

  const insertImageFile = async (file: File) => {
    if (!editor) return;
    try {
      const webpDataUrl = await convertFileToWebpDataUrl(file);
      editor.chain().focus().setImage({ src: webpDataUrl }).run();
    } catch (error) {
      console.error('Audit image conversion failed:', error);
      toast.error('Obrázek se nepodařilo převést do WebP');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      void insertImageFile(file);
    });
    e.target.value = '';
  };

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b bg-muted/30 flex-wrap">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive('bold')}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleItalic().run()} data-active={editor.isActive('italic')}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive('bulletList')}>
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive('orderedList')}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileInputRef.current?.click()} title="Přidat screenshot">
          <ImagePlus className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
