import { useMemo } from 'react';

interface SOPArticleViewProps {
  content: string;
}

// Loom embed as a React component (same as editor uses)
function LoomEmbedView({ src }: { src: string }) {
  return (
    <div className="my-4">
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        <iframe
          src={src}
          frameBorder="0"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

export function SOPArticleView({ content }: SOPArticleViewProps) {
  // Extract Loom embeds and split content into parts
  const { parts, loomUrls } = useMemo(() => {
    const loomRegex = /<div[^>]*data-loom-embed[^>]*>[\s\S]*?<iframe[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/iframe>[\s\S]*?<\/div>/gi;
    const urls: string[] = [];
    let match;

    // Find all Loom URLs
    const contentCopy = content;
    while ((match = loomRegex.exec(contentCopy)) !== null) {
      urls.push(match[1]);
    }

    // Split content by Loom embeds
    const splitParts = content.split(loomRegex).filter((_, i) => i % 2 === 0);

    return { parts: splitParts, loomUrls: urls };
  }, [content]);

  // Process HTML content (links, images)
  const processHtml = (html: string) => {
    let processed = html;

    // Make external links open in new tab
    processed = processed.replace(
      /<a\s+href="(https?:\/\/[^"]+)"([^>]*)>/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer"$2>'
    );

    // Ensure images display correctly
    processed = processed.replace(
      /<img([^>]*)>/gi,
      (match, attrs) => {
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

    return processed;
  };

  const proseClasses = `prose prose-base max-w-none dark:prose-invert
    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-border
    [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-foreground
    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-foreground
    [&_p]:my-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground
    [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2
    [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2
    [&_li]:text-muted-foreground [&_li]:leading-relaxed
    [&_li_p]:my-1
    [&_strong]:text-foreground [&_strong]:font-semibold
    [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:cursor-pointer [&_a]:pointer-events-auto hover:[&_a]:text-primary/80
    [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
    [&_hr]:my-8 [&_hr]:border-border
    [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
    [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto
    [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_img]:my-4
    [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
    [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold
    [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2`;

  // If no Loom embeds, render simple HTML
  if (loomUrls.length === 0) {
    return (
      <div
        className={proseClasses}
        dangerouslySetInnerHTML={{ __html: processHtml(content) }}
      />
    );
  }

  // Render content with Loom embeds as React components
  return (
    <div className={proseClasses}>
      {parts.map((part, index) => (
        <div key={index}>
          {part && (
            <div dangerouslySetInnerHTML={{ __html: processHtml(part) }} />
          )}
          {loomUrls[index] && <LoomEmbedView src={loomUrls[index]} />}
        </div>
      ))}
    </div>
  );
}
