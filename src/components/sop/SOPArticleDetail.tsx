import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSOPData, SOPArticle as SOPArticleType } from '@/hooks/useSOPData';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { SOPArticleView } from '@/components/sop/SOPArticleView';
import { AddSOPArticleDialog } from '@/components/sop/AddSOPArticleDialog';
import { SuggestSOPUpdateDialog } from '@/components/sop/SuggestSOPUpdateDialog';
import { SOPUpdateSuggestions } from '@/components/sop/SOPUpdateSuggestions';
import { SOPAttachmentUpload, getAttachmentSignedUrl } from '@/components/sop/SOPAttachmentUpload';
import { SOPChangeLog } from '@/components/sop/SOPChangeLog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Edit, Trash2, MessageSquarePlus, User, Link2, Globe, Check, MoreVertical, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { SharedSOPData } from '@/pages/PublicSOPPage';

interface SOPArticleDetailProps {
  articleId: string;
  /** If true, renders inline (no max-width/padding wrapper) */
  inline?: boolean;
  onBack?: () => void;
}

export function SOPArticleDetail({ articleId, inline, onBack }: SOPArticleDetailProps) {
  const navigate = useNavigate();
  const { articles, categories, suggestions, deleteArticle, suggestUpdate, resolveSuggestion, incrementViewCount, updateArticle } = useSOPData();
  const { colleagues } = useCRMData();
  const { isSuperAdmin } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [publicLinkCopied, setPublicLinkCopied] = useState(false);

  const article = articles.find(a => a.id === articleId);
  const category = article ? categories.find(c => c.id === article.category_id) : null;
  const ownerColleague = article?.owner_id ? colleagues.find(c => c.profile_id === article.owner_id) : null;
  const ownerName = ownerColleague?.full_name || null;
  const articleSuggestions = article ? suggestions.filter(s => s.article_id === article.id) : [];
  const pendingCount = articleSuggestions.filter(s => s.status === 'pending').length;
  const isOwner = article?.owner_id === user?.id;
  const canManageSuggestions = isSuperAdmin || isOwner;

  useEffect(() => {
    if (articleId) incrementViewCount(articleId);
  }, [articleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/sop');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/sop/${articleId}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Odkaz zkopírován do schránky' });
  };

  const handleSharePublic = async () => {
    if (!article) return;

    // Generate signed URLs for attachments (valid for 7 days)
    const attachmentsWithUrls = await Promise.all(
      (article.attachments || []).map(async (att) => {
        const signedUrl = await getAttachmentSignedUrl(att.path, 604800); // 7 days
        return { ...att, signedUrl: signedUrl || undefined };
      })
    );

    const token = `sop-${article.id}-${Date.now().toString(36)}`;
    const shareData: SharedSOPData = {
      id: article.id,
      title: article.title,
      content: article.content,
      categoryName: category?.title || 'SOP',
      tags: article.tags,
      attachments: attachmentsWithUrls,
      sharedAt: new Date().toISOString(),
      updatedAt: article.updated_at,
    };
    localStorage.setItem(`sop-share-${token}`, JSON.stringify(shareData));
    const publicUrl = `${window.location.origin}/sop-share/${token}`;
    navigator.clipboard.writeText(publicUrl);
    setPublicLinkCopied(true);
    toast({ title: 'Veřejný odkaz zkopírován', description: 'Odkaz můžete sdílet s kýmkoliv bez přístupu do CRM.' });
    setTimeout(() => setPublicLinkCopied(false), 3000);
  };

  const handleDelete = async () => {
    if (!article) return;
    await deleteArticle(article.id);
    handleBack();
  };

  if (!article) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Článek nebyl nalezen</p>
        <Button variant="outline" onClick={handleBack}>Zpět na SOP</Button>
      </div>
    );
  }

  return (
    <div className={inline ? 'space-y-6 animate-fade-in' : 'p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-fade-in'}>
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSharePublic}>
              {publicLinkCopied ? <Check className="h-4 w-4 mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
              {publicLinkCopied ? 'Zkopírováno!' : 'Sdílet veřejně'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Link2 className="h-4 w-4 mr-2" /> Kopírovat odkaz
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSuggestOpen(true)}>
              <MessageSquarePlus className="h-4 w-4 mr-2" /> Navrhnout úpravu
            </DropdownMenuItem>
            {isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Upravit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Smazat
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        {category && <p className="text-sm text-muted-foreground mb-1">{category.title}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{article.title}</h1>
          {!article.is_published && (
            <Badge variant="secondary" className="text-xs">Draft</Badge>
          )}
          {pendingCount > 0 && canManageSuggestions && (
            <Badge variant="destructive" className="text-xs">{pendingCount} {pendingCount === 1 ? 'návrh' : 'návrhy'}</Badge>
          )}
        </div>
        {!article.is_published && isSuperAdmin && (
          <Button
            size="sm"
            className="mt-2"
            onClick={async () => {
              await updateArticle(article.id, { is_published: true });
              toast({ title: 'Článek publikován', description: 'Článek je nyní viditelný pro všechny členy týmu.' });
            }}
          >
            <Send className="h-4 w-4 mr-1.5" />
            Publikovat
          </Button>
        )}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>Zodpovědný:</span>
            {isSuperAdmin ? (
              <Select
                value={article.owner_id || 'none'}
                onValueChange={(val) => {
                  const newOwnerId = val === 'none' ? null : val;
                  updateArticle(article.id, { owner_id: newOwnerId });
                  toast({ title: 'Zodpovědná osoba změněna' });
                }}
              >
                <SelectTrigger className="h-7 w-auto min-w-[160px] text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nepřiřazeno</SelectItem>
                  {colleagues.filter(c => c.status === 'active').map(c => (
                    <SelectItem key={c.profile_id || c.id} value={c.profile_id || c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <strong className="text-foreground">{ownerName || 'Nepřiřazeno'}</strong>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <SOPArticleView content={article.content} />
      </div>

      {(article.attachments?.length ?? 0) > 0 && (
        <SOPAttachmentUpload
          articleId={article.id}
          attachments={article.attachments || []}
          onChange={() => {}}
          readOnly
        />
      )}

      <SOPChangeLog
        article={article}
        colleagueNameMap={Object.fromEntries(colleagues.map(c => [c.profile_id || c.id, c.full_name]))}
      />

      {canManageSuggestions && articleSuggestions.length > 0 && (
        <SOPUpdateSuggestions suggestions={articleSuggestions} onResolve={resolveSuggestion} />
      )}

      <AddSOPArticleDialog open={editOpen} onOpenChange={setEditOpen} editArticle={article} />
      <SuggestSOPUpdateDialog open={suggestOpen} onOpenChange={setSuggestOpen} articleTitle={article.title} onSubmit={(reason) => suggestUpdate(article.id, reason)} />

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteConfirm(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat SOP?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Pro potvrzení napište <strong>SMAZAT</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="Napište SMAZAT"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteConfirm !== 'SMAZAT'} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
