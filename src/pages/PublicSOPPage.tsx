import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SOPArticleView } from '@/components/sop/SOPArticleView';
import { SOPAttachmentUpload } from '@/components/sop/SOPAttachmentUpload';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import socialsLogo from '@/assets/socials-logo.svg';

export interface SharedSOPData {
  id: string;
  title: string;
  content: string;
  categoryName: string;
  tags: string[];
  attachments: Array<{ name: string; path: string; size: number; type: string }>;
  sharedAt: string;
  updatedAt: string;
}

export default function PublicSOPPage({ testToken }: { testToken?: string }) {
  const { token } = useParams();
  const activeToken = testToken || token;
  const [data, setData] = useState<SharedSOPData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!activeToken) { setNotFound(true); return; }
    const stored = localStorage.getItem(`sop-share-${activeToken}`);
    if (!stored) { setNotFound(true); return; }
    try {
      setData(JSON.parse(stored));
    } catch {
      setNotFound(true);
    }
  }, [activeToken]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">Článek nenalezen</h1>
          <p className="text-muted-foreground">Tento sdílený odkaz není platný nebo vypršel.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={socialsLogo} alt="Socials" className="h-8 w-8 rounded" />
            <span className="font-semibold text-sm">Socials SOP</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Sdílený článek
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Meta */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">{data.categoryName}</p>
          <h1 className="text-2xl md:text-3xl font-bold">{data.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Aktualizováno: {format(new Date(data.updatedAt), 'd. MMMM yyyy', { locale: cs })}</span>
            </div>
          </div>
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {data.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Content */}
        <div className="bg-card border border-border rounded-lg p-6">
          <SOPArticleView content={data.content} />
        </div>

        {/* Attachments */}
        {(data.attachments?.length ?? 0) > 0 && (
          <SOPAttachmentUpload
            articleId={data.id}
            attachments={data.attachments}
            onChange={() => {}}
            readOnly
          />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 pb-4">
          <p>Sdíleno ze Socials CRM • {format(new Date(data.sharedAt), 'd. MMMM yyyy', { locale: cs })}</p>
        </div>
      </main>
    </div>
  );
}
