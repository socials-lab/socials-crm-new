import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSOPData } from '@/hooks/useSOPData';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { SOPArticleView } from '@/components/sop/SOPArticleView';
import { AddSOPArticleDialog } from '@/components/sop/AddSOPArticleDialog';
import { SuggestSOPUpdateDialog } from '@/components/sop/SuggestSOPUpdateDialog';
import { SOPUpdateSuggestions } from '@/components/sop/SOPUpdateSuggestions';
import { SOPAttachmentUpload } from '@/components/sop/SOPAttachmentUpload';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, MessageSquarePlus, User, Link2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SOPArticle() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { articles, categories, suggestions, deleteArticle, suggestUpdate, resolveSuggestion, incrementViewCount } = useSOPData();
  const { colleagues } = useCRMData();
  const { isSuperAdmin } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/sop/${articleId}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Odkaz zkopírován do schránky' });
  };
  const article = articles.find(a => a.id === articleId);

  useEffect(() => {
    if (articleId) incrementViewCount(articleId);
  }, [articleId]); // eslint-disable-line react-hooks/exhaustive-deps
  const category = article ? categories.find(c => c.id === article.category_id) : null;
  const ownerColleague = article?.owner_id ? colleagues.find(c => c.profile_id === article.owner_id) : null;
  const articleSuggestions = article ? suggestions.filter(s => s.article_id === article.id) : [];
  const pendingCount = articleSuggestions.filter(s => s.status === 'pending').length;
  const isOwner = article?.owner_id === user?.id;
  const canManageSuggestions = isSuperAdmin || isOwner;

  if (!article) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Článek nebyl nalezen</p>
        <Button variant="outline" onClick={() => navigate('/sop')}>Zpět na SOP</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteArticle(article.id);
    navigate('/sop');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sop')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Link2 className="h-4 w-4 mr-1" /> Kopírovat odkaz
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSuggestOpen(true)}>
            <MessageSquarePlus className="h-4 w-4 mr-1" /> Navrhnout úpravu
          </Button>
          {isSuperAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4 mr-1" /> Upravit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" /> Smazat
              </Button>
            </>
          )}
        </div>
      </div>

      <div>
        {category && <p className="text-sm text-muted-foreground mb-1">{category.title}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{article.title}</h1>
          {pendingCount > 0 && canManageSuggestions && (
            <Badge variant="destructive" className="text-xs">{pendingCount} {pendingCount === 1 ? 'návrh' : 'návrhy'}</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {ownerColleague && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>Zodpovědný: <strong className="text-foreground">{ownerColleague.full_name}</strong></span>
            </div>
          )}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <SOPArticleView content={article.content} />
      </div>

      {/* Attachments */}
      {(article.attachments?.length ?? 0) > 0 && (
        <SOPAttachmentUpload
          articleId={article.id}
          attachments={article.attachments || []}
          onChange={() => {}}
          readOnly
        />
      )}

      {/* Suggestions section for owner + admins */}
      {canManageSuggestions && articleSuggestions.length > 0 && (
        <SOPUpdateSuggestions suggestions={articleSuggestions} onResolve={resolveSuggestion} />
      )}

      <AddSOPArticleDialog open={editOpen} onOpenChange={setEditOpen} editArticle={article} />
      <SuggestSOPUpdateDialog open={suggestOpen} onOpenChange={setSuggestOpen} articleTitle={article.title} onSubmit={(reason) => suggestUpdate(article.id, reason)} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat článek?</AlertDialogTitle>
            <AlertDialogDescription>Tato akce je nevratná.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Smazat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
