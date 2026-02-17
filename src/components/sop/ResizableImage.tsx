import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import { useState, useRef, useCallback } from 'react';

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width } = node.attrs;
  const [resizing, setResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = imgRef.current?.offsetWidth || 300;

    const onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startXRef.current;
      const newWidth = Math.max(100, startWidthRef.current + diff);
      updateAttributes({ width: newWidth });
    };

    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes]);

  return (
    <NodeViewWrapper className="relative inline-block my-3" data-drag-handle>
      <div className={`relative inline-block group ${selected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}>
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          style={{ width: width ? `${width}px` : undefined }}
          className="max-w-full rounded-lg border border-border block"
          draggable={false}
        />
        {/* Resize handle - right edge */}
        <div
          onMouseDown={onMouseDown}
          className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center
            ${resizing ? 'bg-primary/20' : 'opacity-0 group-hover:opacity-100 hover:bg-primary/20'}
            transition-opacity`}
        >
          <div className="w-1 h-8 bg-primary/60 rounded-full" />
        </div>
        {/* Size preset buttons when selected */}
        {selected && (
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex gap-1 bg-popover border border-border rounded-md shadow-md p-1 z-10">
            {[
              { label: 'S', value: 200 },
              { label: 'M', value: 400 },
              { label: 'L', value: 600 },
              { label: '100%', value: null },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => updateAttributes({ width: preset.value })}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors
                  ${(!width && !preset.value) || width === preset.value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = { ...HTMLAttributes };
    if (attrs.width) {
      attrs.style = `width: ${attrs.width}px`;
      delete attrs.width;
    }
    return ['img', mergeAttributes(attrs)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      setImage: (options: { src: string; alt?: string; title?: string; width?: number }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    } as any;
  },
});
