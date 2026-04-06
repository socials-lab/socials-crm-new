import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Redo } from 'lucide-react';

interface EmailSignatureRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function EmailSignatureRichEditor({
  value,
  onChange,
  placeholder = 'Napište podpis...',
}: EmailSignatureRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[180px] p-3 focus:outline-none [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || '<p></p>';
    if (current !== incoming) {
      editor.commands.setContent(incoming, false);
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const next = window.prompt('Vložte URL odkazu', previous || 'https://');
    if (next === null) return;
    const url = next.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b bg-muted/30">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
