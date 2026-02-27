import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useCallback } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { ResizableImage } from './ResizableImage';
import Placeholder from '@tiptap/extension-placeholder';
import { LoomEmbed, parseLoomUrl } from './LoomEmbed';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Video, Undo, Redo, ImagePlus, Quote, Code, Minus, Table as TableIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SOPEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  storageKey?: string;
}

export function SOPEditor({ content, onChange, placeholder = 'Začněte psát...', storageKey }: SOPEditorProps) {
  const [loomDialogOpen, setLoomDialogOpen] = useState(false);
  const [loomUrl, setLoomUrl] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cacheKey = storageKey ? `sop-draft-${storageKey}` : null;

  // Restore draft from localStorage on mount
  const initialContent = (() => {
    if (cacheKey) {
      try {
        const draft = localStorage.getItem(cacheKey);
        if (draft) return draft;
      } catch {}
    }
    return content;
  })();

  const handleUpdate = useCallback(({ editor: e }: any) => {
    const html = e.getHTML();
    onChange(html);
    if (cacheKey) {
      try { localStorage.setItem(cacheKey, html); } catch {}
    }
  }, [onChange, cacheKey]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ResizableImage,
      Placeholder.configure({ placeholder }),
      LoomEmbed,
    ],
    content: initialContent,
    onUpdate: handleUpdate,
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-base max-w-none min-h-[300px] p-4 focus:outline-none dark:prose-invert [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-border [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:my-6 [&_hr]:border-border [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_img]:border [&_img]:border-border [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2',
      },
      handlePaste(view, event) {
        // Check for Loom URL in pasted text
        const text = event.clipboardData?.getData('text/plain')?.trim();
        if (text) {
          const embedUrl = parseLoomUrl(text);
          if (embedUrl) {
            event.preventDefault();
            view.dispatch(view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.loomEmbed.create({ src: embedUrl })
            ));
            return true;
          }
        }
        // Check for pasted images
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

  // Sync editor content when content prop changes (e.g., when dialog loads article data)
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      // Only update if content is different and not from localStorage draft
      const currentContent = editor.getHTML();
      const hasLocalDraft = cacheKey && localStorage.getItem(cacheKey);

      // If no local draft and content changed significantly, update editor
      if (!hasLocalDraft && content !== currentContent && content !== '<p></p>') {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content, cacheKey]);

  const insertImageFile = (file: File) => {
    if (!editor) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) (editor.chain().focus() as any).setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  };

  if (!editor) return null;

  const insertLoom = () => {
    const embedUrl = parseLoomUrl(loomUrl);
    if (embedUrl) {
      editor.chain().focus().insertContent({ type: 'loomEmbed', attrs: { src: embedUrl } }).run();
      setLoomUrl('');
      setLoomDialogOpen(false);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  };

  const insertImageFromUrl = () => {
    if (imageUrl) {
      (editor.chain().focus() as any).setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageDialogOpen(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      insertImageFile(file);
      setImageDialogOpen(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Nadpis 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Nadpis 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Nadpis 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Tučné">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kurzíva">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Odrážky">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Číslovaný seznam">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citace">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Blok kódu">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Oddělovač">
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Vložit tabulku">
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-border mx-1" />
        <ToolbarButton onClick={() => setLinkDialogOpen(true)} active={editor.isActive('link')} title="Odkaz">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => setImageDialogOpen(true)} active={editor.isActive('image')} title="Obrázek">
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => setLoomDialogOpen(true)} title="Loom video">
          <Video className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Zpět">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Vpřed">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vložit obrázek</DialogTitle></DialogHeader>
          <Tabs defaultValue="upload">
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1">Nahrát soubor</TabsTrigger>
              <TabsTrigger value="url" className="flex-1">Z URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">Vyberte obrázek ze souboru nebo použijte Ctrl+V pro vložení screenshotu přímo do editoru.</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <ImagePlus className="h-4 w-4 mr-2" /> Vybrat soubor
              </Button>
            </TabsContent>
            <TabsContent value="url" className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>URL obrázku</Label>
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <DialogFooter>
                <Button onClick={insertImageFromUrl} disabled={!imageUrl}>Vložit</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={loomDialogOpen} onOpenChange={setLoomDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vložit Loom video</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Loom URL</Label>
            <Input value={loomUrl} onChange={e => setLoomUrl(e.target.value)} placeholder="https://www.loom.com/share/..." />
          </div>
          <DialogFooter>
            <Button onClick={insertLoom} disabled={!parseLoomUrl(loomUrl)}>Vložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vložit odkaz</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
          </div>
          <DialogFooter>
            <Button onClick={insertLink} disabled={!linkUrl}>Vložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
