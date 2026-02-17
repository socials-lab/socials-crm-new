interface SOPArticleViewProps {
  content: string;
}

export function SOPArticleView({ content }: SOPArticleViewProps) {
  // 1. Transform loom embed divs into styled iframes
  let processedContent = content.replace(
    /<div[^>]*data-loom-embed[^>]*>[\s\S]*?<iframe[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/iframe>[\s\S]*?<\/div>/gi,
    '<div class="aspect-video rounded-lg overflow-hidden border border-border my-4"><iframe src="$1" frameborder="0" allowfullscreen style="width:100%;height:100%"></iframe></div>'
  );

  // 2. Also handle bare loom iframes not yet wrapped
  processedContent = processedContent.replace(
    /<iframe[^>]*src="(https:\/\/www\.loom\.com\/embed\/[^"]+)"[^>]*><\/iframe>/gi,
    (match) => {
      if (match.includes('aspect-video') || match.includes('style="width:100%')) return match;
      return `<div class="aspect-video rounded-lg overflow-hidden border border-border my-4"><iframe src="$1" frameborder="0" allowfullscreen style="width:100%;height:100%"></iframe></div>`;
    }
  );

  // 3. Ensure images with inline width styles display correctly
  processedContent = processedContent.replace(
    /<img([^>]*)>/gi,
    (match, attrs) => {
      // Add max-width and auto height if not already present
      if (!attrs.includes('max-width')) {
        const hasStyle = attrs.includes('style=');
        if (hasStyle) {
          return match.replace(/style="([^"]*)"/, 'style="$1; max-width: 100%;"');
        } else {
          return `<img${attrs} style="max-width: 100%; height: auto;">`;
        }
      }
      return match;
    }
  );

  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline [&_iframe]:w-full [&_iframe]:h-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_img]:my-3"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
