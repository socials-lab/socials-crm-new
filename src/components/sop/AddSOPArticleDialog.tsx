import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { SOPEditor } from './SOPEditor';
import { SOPAttachmentUpload, type SOPAttachment } from './SOPAttachmentUpload';
import { useSOPData, type SOPArticle } from '@/hooks/useSOPData';
import { useCRMData } from '@/hooks/useCRMData';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const ICON_OPTIONS = [
  'BookOpen', 'Briefcase', 'BarChart3', 'Settings', 'Palette',
  'FileText', 'Target', 'Users', 'Zap', 'Star', 'Heart', 'Globe',
];

interface AddSOPArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editArticle?: SOPArticle | null;
  defaultCategoryId?: string;
}

interface DraftData {
  title: string;
  content: string;
  categoryId: string;
  ownerId: string;
  attachments: SOPAttachment[];
  isPublished: boolean;
  savedAt: number;
}

function getDraftKey(editArticle?: SOPArticle | null): string {
  return editArticle ? `sop-full-draft-edit-${editArticle.id}` : 'sop-full-draft-new';
}

function saveDraft(key: string, data: DraftData) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function loadDraft(key: string): DraftData | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as DraftData;
  } catch {}
  return null;
}

function clearDraft(key: string) {
  try { localStorage.removeItem(key); } catch {}
  // Also clear the old editor-only draft keys
  try {
    const editorKey = key.replace('sop-full-draft-', 'sop-draft-');
    localStorage.removeItem(editorKey);
  } catch {}
}

export function AddSOPArticleDialog({ open, onOpenChange, editArticle, defaultCategoryId }: AddSOPArticleDialogProps) {
  const { categories, addArticle, updateArticle, addCategory } = useSOPData();
  const { colleagues } = useCRMData();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [attachments, setAttachments] = useState<SOPAttachment[]>([]);
  const [isPublished, setIsPublished] = useState(true); // Default to published
  const [saving, setSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Inline new category state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('BookOpen');
  const [creatingCat, setCreatingCat] = useState(false);

  const draftKey = getDraftKey(editArticle);
  const initializedRef = useRef(false);

  // On open: restore draft or load from editArticle
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    
    const draft = loadDraft(draftKey);
    
    if (draft && draft.title) {
      // Restore draft
      setTitle(draft.title);
      setContent(draft.content);
      setCategoryId(draft.categoryId);
      setOwnerId(draft.ownerId);
      setAttachments(draft.attachments || []);
      setIsPublished(draft.isPublished ?? true); // Default to published
      setHasDraft(true);
    } else if (editArticle) {
      setTitle(editArticle.title);
      setContent(editArticle.content);
      setCategoryId(editArticle.category_id);
      setOwnerId(editArticle.owner_id || '');
      setAttachments((editArticle.attachments as SOPAttachment[]) || []);
      setIsPublished(editArticle.is_published);
      setHasDraft(false);
    } else {
      setTitle('');
      setContent('');
      setCategoryId(defaultCategoryId || '');
      setOwnerId('');
      setAttachments([]);
      setIsPublished(true); // Default new articles to published
      setHasDraft(false);
    }
    setShowNewCategory(false);
    setNewCatTitle('');
    setNewCatDescription('');
    setNewCatIcon('BookOpen');
    initializedRef.current = true;
  }, [editArticle, defaultCategoryId, open, draftKey]);

  // Auto-save draft on every field change
  const saveDraftDebounced = useCallback(() => {
    if (!initializedRef.current) return;
    saveDraft(draftKey, {
      title,
      content,
      categoryId,
      ownerId,
      attachments,
      isPublished,
      savedAt: Date.now(),
    });
  }, [draftKey, title, content, categoryId, ownerId, attachments, isPublished]);

  useEffect(() => {
    if (!open || !initializedRef.current) return;
    const timer = setTimeout(saveDraftDebounced, 500);
    return () => clearTimeout(timer);
  }, [saveDraftDebounced, open]);

  // Save draft on page unload
  useEffect(() => {
    if (!open || !initializedRef.current) return;
    const handleBeforeUnload = () => {
      saveDraft(draftKey, { title, content, categoryId, ownerId, attachments, isPublished, savedAt: Date.now() });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [open, draftKey, title, content, categoryId, ownerId, attachments, isPublished]);

  const handleDiscardDraft = () => {
    clearDraft(draftKey);
    setHasDraft(false);
    if (editArticle) {
      setTitle(editArticle.title);
      setContent(editArticle.content);
      setCategoryId(editArticle.category_id);
      setOwnerId(editArticle.owner_id || '');
      setAttachments((editArticle.attachments as SOPAttachment[]) || []);
      setIsPublished(editArticle.is_published);
    } else {
      setTitle('');
      setContent('');
      setCategoryId(defaultCategoryId || '');
      setOwnerId('');
      setAttachments([]);
      setIsPublished(true);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setShowNewCategory(true);
      setCategoryId('');
    } else {
      setCategoryId(value);
      setShowNewCategory(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatTitle.trim()) return;
    setCreatingCat(true);
    const newId = await addCategory({
      title: newCatTitle.trim(),
      description: newCatDescription.trim(),
      icon: newCatIcon,
    });
    setCreatingCat(false);
    if (newId) {
      setCategoryId(newId);
      setShowNewCategory(false);
      setNewCatTitle('');
      setNewCatDescription('');
      setNewCatIcon('BookOpen');
    }
  };

  const handleCancelNewCategory = () => {
    setShowNewCategory(false);
    setNewCatTitle('');
    setNewCatDescription('');
    setNewCatIcon('BookOpen');
  };

  const handleSave = async () => {
    if (!title.trim() || !categoryId) return;
    setSaving(true);

    // Timeout to prevent infinite loading - max 15 seconds
    const timeoutId = setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Ukládání trvá příliš dlouho',
        description: 'Zkuste to prosím znovu.',
        variant: 'destructive',
      });
    }, 15000);

    try {
      const ownerValue = ownerId || null;
      if (editArticle) {
        await updateArticle(editArticle.id, { title, content, category_id: categoryId, tags: [], owner_id: ownerValue, attachments: attachments as any, is_published: isPublished });
      } else {
        await addArticle({ title, content, category_id: categoryId, tags: [], owner_id: ownerValue, attachments: attachments as any, is_published: isPublished });
      }
      // Clear all drafts
      clearDraft(draftKey);
      setHasDraft(false);
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving SOP:', err);
      toast({
        title: 'Chyba při ukládání',
        description: 'Nepodařilo se uložit článek. Zkuste to znovu.',
        variant: 'destructive',
      });
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editArticle ? 'Upravit SOP' : 'Nové SOP'}</DialogTitle>
        </DialogHeader>

        {hasDraft && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted border border-border">
            <Badge variant="secondary" className="text-xs">Obnovený draft</Badge>
            <span className="text-xs text-muted-foreground flex-1">Rozpracovaný obsah byl automaticky obnoven.</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleDiscardDraft}>
              Zahodit draft
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Název *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Název postupu..." />
            </div>
            <div className="space-y-2">
              <Label>Kategorie *</Label>
              <Select value={categoryId || undefined} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue placeholder="Vyberte kategorii" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="__new__">
                    <span className="flex items-center gap-1.5 text-primary font-medium">
                      <Plus className="h-3.5 w-3.5" />
                      Vytvořit novou kategorii
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {showNewCategory && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3 mt-2">
                  <p className="text-sm font-medium text-foreground">Nová kategorie</p>
                  <div className="space-y-2">
                    <Label className="text-xs">Název *</Label>
                    <Input
                      value={newCatTitle}
                      onChange={e => setNewCatTitle(e.target.value)}
                      placeholder="Název kategorie..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Popis</Label>
                    <Input
                      value={newCatDescription}
                      onChange={e => setNewCatDescription(e.target.value)}
                      placeholder="Krátký popis..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Ikona</Label>
                    <Select value={newCatIcon} onValueChange={setNewCatIcon}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map(icon => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={creatingCat || !newCatTitle.trim()}
                    >
                      {creatingCat ? 'Vytvářím...' : 'Vytvořit'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelNewCategory}>
                      Zrušit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
              <Label>Zodpovědná osoba</Label>
              <Select value={ownerId || undefined} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue placeholder="Vyberte vlastníka SOP" /></SelectTrigger>
                <SelectContent>
                  {colleagues.filter(c => c.profile_id).map(c => (
                    <SelectItem key={c.profile_id!} value={c.profile_id!}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <div className="space-y-2">
            <Label>Obsah</Label>
            <SOPEditor content={content} onChange={setContent} storageKey={editArticle ? `edit-${editArticle.id}` : 'new-article'} />
          </div>

          <SOPAttachmentUpload
            articleId={editArticle?.id || `new-${Date.now()}`}
            attachments={attachments}
            onChange={setAttachments}
          />

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="space-y-0.5">
              <Label htmlFor="publish-toggle" className="cursor-pointer">Publikovat</Label>
              <p className="text-xs text-muted-foreground">
                {isPublished ? 'Článek bude viditelný pro všechny členy týmu' : 'Článek zůstane jako draft (viditelný jen pro adminy)'}
              </p>
            </div>
            <Switch
              id="publish-toggle"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !categoryId}>
            {saving ? 'Ukládám...' : editArticle ? 'Uložit' : 'Vytvořit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
