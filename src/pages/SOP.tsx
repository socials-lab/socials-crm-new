import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { SOPSearch } from '@/components/sop/SOPSearch';
import { SOPCategoryCard } from '@/components/sop/SOPCategoryCard';
import { SOPArticleCard } from '@/components/sop/SOPArticleCard';
import { SOPArticleDetail } from '@/components/sop/SOPArticleDetail';
import { AddSOPArticleDialog } from '@/components/sop/AddSOPArticleDialog';
import { AddSOPCategoryDialog } from '@/components/sop/AddSOPCategoryDialog';
import { useSOPData } from '@/hooks/useSOPData';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, ArrowLeft, FilePenLine } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function SOP() {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const isMobile = useIsMobile();
  const {
    categories, articles, isLoading, searchQuery, setSearchQuery,
    searchResults, suggestions,
  } = useSOPData();
  const { isSuperAdmin } = useUserRole();
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const isFiltering = searchQuery.trim().length > 0;
  const isViewingArticle = !!articleId && !isMobile;

  const categoryArticleCount = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach(c => {
      map[c.id] = articles.filter(a => a.category_id === c.id && a.is_published).length;
    });
    return map;
  }, [categories, articles]);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => { map[c.id] = c.title; });
    return map;
  }, [categories]);

  const pendingSuggestionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    suggestions.filter(s => s.status === 'pending').forEach(s => {
      map[s.article_id] = (map[s.article_id] || 0) + 1;
    });
    return map;
  }, [suggestions]);

  const groupedResults = useMemo(() => {
    if (!isFiltering) return {};
    const groups: Record<string, typeof searchResults> = {};
    searchResults.forEach(a => {
      if (!groups[a.category_id]) groups[a.category_id] = [];
      groups[a.category_id].push(a);
    });
    return groups;
  }, [searchResults, isFiltering]);

  const categoryArticles = selectedCategoryId
    ? articles.filter(a => a.category_id === selectedCategoryId && a.is_published)
    : [];

  const allArticlesByViews = useMemo(() => {
    return [...articles].filter(a => a.is_published).sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  }, [articles]);

  const draftArticles = useMemo(() => {
    return articles.filter(a => !a.is_published);
  }, [articles]);

  const viewingArticle = articleId ? articles.find(a => a.id === articleId) : null;

  // Mobile with articleId: render fullscreen detail
  if (isMobile && articleId) {
    return <SOPArticleDetail articleId={articleId} />;
  }

  const handleArticleClick = (id: string) => {
    navigate(`/sop/${id}`);
  };

  const handleBackFromArticle = () => {
    navigate('/sop');
  };

  // Render article list content (reused in both list-only and master-detail modes)
  const renderArticleList = () => {
    if (isFiltering) {
      return (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} {searchResults.length === 1 ? 'výsledek' : searchResults.length < 5 ? 'výsledky' : 'výsledků'}
            {searchQuery.trim() && <> pro „{searchQuery}"</>}
          </p>
          {searchResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Žádné výsledky</p>
          ) : (
            Object.entries(groupedResults).map(([catId, arts]) => (
              <div key={catId} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {categoryNameMap[catId] || 'Bez kategorie'} ({arts.length})
                </h3>
                <div className="grid gap-2">
                  {arts.map(article => (
                    <SOPArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => handleArticleClick(article.id)}
                      highlightQuery={searchQuery}
                      categoryName={categoryNameMap[article.category_id]}
                      pendingSuggestionCount={pendingSuggestionCounts[article.id]}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    if (selectedCategoryId === '__drafts__') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryId(null)} className="mr-1">
              <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
            </Button>
            <h2 className="text-lg font-semibold">Drafty</h2>
            <span className="text-sm text-muted-foreground">({draftArticles.length} SOP)</span>
          </div>
          {draftArticles.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Žádné rozpracované SOP</p>
          ) : (
            <div className="grid gap-2">
              {draftArticles.map(article => (
                <SOPArticleCard key={article.id} article={article} onClick={() => handleArticleClick(article.id)} categoryName={categoryNameMap[article.category_id]} pendingSuggestionCount={pendingSuggestionCounts[article.id]} />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (selectedCategoryId) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryId(null)} className="mr-1">
              <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
            </Button>
            <h2 className="text-lg font-semibold">{categoryNameMap[selectedCategoryId]}</h2>
            <span className="text-sm text-muted-foreground">({categoryArticles.length} SOP)</span>
          </div>
          {categoryArticles.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">V této kategorii zatím nejsou žádné SOP</p>
          ) : (
            <div className="grid gap-2">
              {categoryArticles.map(article => (
                <SOPArticleCard key={article.id} article={article} onClick={() => handleArticleClick(article.id)} pendingSuggestionCount={pendingSuggestionCounts[article.id]} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Všechny SOP</h2>
        {allArticlesByViews.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Zatím nejsou vytvořeny žádné SOP</p>
        ) : (
          <div className="grid gap-2">
            {allArticlesByViews.map(article => (
              <SOPArticleCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article.id)}
                categoryName={categoryNameMap[article.category_id]}
                pendingSuggestionCount={pendingSuggestionCounts[article.id]}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] animate-fade-in overflow-hidden">
      {/* Fixed header + search area */}
      <div className="shrink-0 space-y-6 p-4 pb-0 md:p-6">
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

        {!isViewingArticle && (
          <SOPSearch
            value={searchQuery}
            onChange={setSearchQuery}
            allTags={[]}
            selectedTags={[]}
            onToggleTag={() => {}}
          />
        )}
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 p-4 pt-6 md:grid-cols-2 md:p-6 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : isMobile ? (
        /* Mobile: single column, no master-detail */
        <div className="flex-1 space-y-4 overflow-y-auto p-4 pt-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-1">
              <Badge
                variant={selectedCategoryId === null ? 'default' : 'outline'}
                className="cursor-pointer shrink-0 select-none"
                onClick={() => setSelectedCategoryId(null)}
              >
                Vše
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                  className="cursor-pointer shrink-0 select-none"
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.title} ({categoryArticleCount[cat.id] || 0})
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="grid gap-2">
            {selectedCategoryId === null ? (
              allArticlesByViews.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Zatím nejsou vytvořeny žádné SOP</p>
              ) : (
                allArticlesByViews.map(article => (
                  <SOPArticleCard key={article.id} article={article} onClick={() => navigate(`/sop/${article.id}`)} categoryName={categoryNameMap[article.category_id]} pendingSuggestionCount={pendingSuggestionCounts[article.id]} />
                ))
              )
            ) : (
              <div className="space-y-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategoryId(null)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Všechny kategorie
                </Button>
                {categoryArticles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">V této kategorii zatím nejsou žádné SOP</p>
                ) : (
                  categoryArticles.map(article => (
                    <SOPArticleCard key={article.id} article={article} onClick={() => navigate(`/sop/${article.id}`)} pendingSuggestionCount={pendingSuggestionCounts[article.id]} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop: master-detail layout */
        <div className="flex-1 flex min-h-0 gap-6 px-6 pt-6">
          {/* Left sidebar - categories */}
          <div className="w-[250px] shrink-0 sticky top-0 self-start max-h-[calc(100vh-10rem)] overflow-y-auto pb-6 space-y-1">
            <button
              onClick={() => { setSelectedCategoryId(null); if (isViewingArticle) navigate('/sop'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                selectedCategoryId === null && !isViewingArticle ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
              }`}
            >
              <span className="flex-1">Všechny kategorie</span>
              <span className="text-xs text-muted-foreground shrink-0">{articles.filter(a => a.is_published).length}</span>
            </button>
            {categories.map(cat => (
              <SOPCategoryCard
                key={cat.id}
                category={cat}
                articleCount={categoryArticleCount[cat.id] || 0}
                onClick={() => { setSelectedCategoryId(cat.id); if (isViewingArticle) navigate('/sop'); }}
                compact
                isActive={selectedCategoryId === cat.id && !isViewingArticle || (isViewingArticle && viewingArticle?.category_id === cat.id)}
              />
            ))}
            {isSuperAdmin && draftArticles.length > 0 && (
              <>
                <div className="border-t border-border my-2" />
                <button
                  onClick={() => { setSelectedCategoryId('__drafts__'); if (isViewingArticle) navigate('/sop'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                    selectedCategoryId === '__drafts__' && !isViewingArticle ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <FilePenLine className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Koncepty</span>
                  <span className="text-xs text-muted-foreground shrink-0">{draftArticles.length}</span>
                </button>
              </>
            )}
          </div>

          {/* Right content - article list or article detail */}
          <div className="flex-1 min-w-0 overflow-y-auto pb-6">
            {isViewingArticle && articleId ? (
              <SOPArticleDetail articleId={articleId} inline onBack={handleBackFromArticle} />
            ) : (
              renderArticleList()
            )}
          </div>
        </div>
      )}

      <AddSOPArticleDialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen} />
      <AddSOPCategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
    </div>
  );
}
