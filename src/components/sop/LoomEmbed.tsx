import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

function LoomEmbedView({ node }: any) {
  return (
    <NodeViewWrapper className="my-4">
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        <iframe
          src={node.attrs.src}
          frameBorder="0"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const LoomEmbed = Node.create({
  name: 'loomEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-loom-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-loom-embed': '' }), ['iframe', { src: HTMLAttributes.src, frameborder: '0', allowfullscreen: 'true', class: 'w-full h-full' }]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LoomEmbedView);
  },
});

export function parseLoomUrl(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (match) return `https://www.loom.com/embed/${match[1]}`;
  const embedMatch = url.match(/loom\.com\/embed\/([a-zA-Z0-9]+)/);
  if (embedMatch) return url;
  return null;
}
