import { useParams, useNavigate } from 'react-router-dom';
import { useSOPData } from '@/hooks/useSOPData';
import { useUserRole } from '@/hooks/useUserRole';
import { SOPArticleView } from '@/components/sop/SOPArticleView';
import { AddSOPArticleDialog } from '@/components/sop/AddSOPArticleDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SOPArticle() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { articles, categories, deleteArticle } = useSOPData();
  const { isSuperAdmin } = useUserRole();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const article = articles.find(a => a.id === articleId);
  const category = article ? categories.find(c => c.id === article.category_id) : null;

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sop')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
        </Button>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" /> Upravit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Smazat
            </Button>
          </div>
        )}
      </div>

      <div>
        {category && <p className="text-sm text-muted-foreground mb-1">{category.title}</p>}
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {article.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <SOPArticleView content={article.content} />
      </div>

      <AddSOPArticleDialog open={editOpen} onOpenChange={setEditOpen} editArticle={article} />

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
