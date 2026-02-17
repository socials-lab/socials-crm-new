interface SOPArticleViewProps {
  content: string;
}

export function SOPArticleView({ content }: SOPArticleViewProps) {
  // Transform loom embed divs into actual iframes for rendering
  const processedContent = content.replace(
    /<div data-loom-embed=""><iframe src="([^"]+)"[^>]*><\/iframe><\/div>/g,
    '<div class="aspect-video rounded-lg overflow-hidden border border-border my-4"><iframe src="$1" frameborder="0" allowfullscreen class="w-full h-full"></iframe></div>'
  );

  return (
    <div
      className="prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline [&_iframe]:w-full [&_iframe]:h-full"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
