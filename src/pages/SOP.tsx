import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { SOPSearch } from '@/components/sop/SOPSearch';
import { SOPCategoryCard } from '@/components/sop/SOPCategoryCard';
import { SOPArticleCard } from '@/components/sop/SOPArticleCard';
import { AddSOPArticleDialog } from '@/components/sop/AddSOPArticleDialog';
import { AddSOPCategoryDialog } from '@/components/sop/AddSOPCategoryDialog';
import { useSOPData } from '@/hooks/useSOPData';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SOP() {
  const navigate = useNavigate();
  const { categories, articles, isLoading, searchQuery, setSearchQuery, searchResults } = useSOPData();
  const { isSuperAdmin } = useUserRole();
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const isSearching = searchQuery.trim().length > 0;

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const categoryArticles = selectedCategoryId
    ? articles.filter(a => a.category_id === selectedCategoryId && a.is_published)
    : [];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="📖 SOP Databáze" description="Postupy a návody pro tým" />
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-1" /> Kategorie
            </Button>
            <Button size="sm" onClick={() => setArticleDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Vytvořit nové SOP
            </Button>
          </div>
        )}
      </div>

      <SOPSearch value={searchQuery} onChange={setSearchQuery} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : isSearching ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} {searchResults.length === 1 ? 'výsledek' : searchResults.length < 5 ? 'výsledky' : 'výsledků'} pro „{searchQuery}"
          </p>
          {searchResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Žádné výsledky</p>
          ) : (
            <div className="grid gap-2">
              {searchResults.map(article => (
                <SOPArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => navigate(`/sop/${article.id}`)}
                  highlightQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      ) : selectedCategoryId ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryId(null)}>← Zpět</Button>
            <h2 className="text-lg font-semibold">{selectedCategory?.title}</h2>
          </div>
          {categoryArticles.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">V této kategorii zatím nejsou žádné články</p>
          ) : (
            <div className="grid gap-2">
              {categoryArticles.map(article => (
                <SOPArticleCard key={article.id} article={article} onClick={() => navigate(`/sop/${article.id}`)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <SOPCategoryCard
              key={cat.id}
              category={cat}
              articleCount={articles.filter(a => a.category_id === cat.id && a.is_published).length}
              onClick={() => handleCategoryClick(cat.id)}
            />
          ))}
          {categories.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-12">Zatím nejsou vytvořeny žádné kategorie</p>
          )}
        </div>
      )}

      <AddSOPArticleDialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen} />
      <AddSOPCategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
    </div>
  );
}
