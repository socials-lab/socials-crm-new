import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { LoomEmbed, parseLoomUrl } from './LoomEmbed';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Link as LinkIcon, Video, Undo, Redo } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SOPEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function SOPEditor({ content, onChange, placeholder = 'Začněte psát...' }: SOPEditorProps) {
  const [loomDialogOpen, setLoomDialogOpen] = useState(false);
  const [loomUrl, setLoomUrl] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      LoomEmbed,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline',
      },
    },
  });

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
        <ToolbarButton onClick={() => setLinkDialogOpen(true)} active={editor.isActive('link')} title="Odkaz">
          <LinkIcon className="h-4 w-4" />
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
