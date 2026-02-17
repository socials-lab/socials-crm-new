import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { SOPEditor } from './SOPEditor';
import { SOPAttachmentUpload, type SOPAttachment } from './SOPAttachmentUpload';
import { useSOPData, type SOPArticle } from '@/hooks/useSOPData';
import { useCRMData } from '@/hooks/useCRMData';
import { Plus } from 'lucide-react';

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

export function AddSOPArticleDialog({ open, onOpenChange, editArticle, defaultCategoryId }: AddSOPArticleDialogProps) {
  const { categories, addArticle, updateArticle, addCategory } = useSOPData();
  const { colleagues } = useCRMData();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [attachments, setAttachments] = useState<SOPAttachment[]>([]);
  const [saving, setSaving] = useState(false);

  // Inline new category state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('BookOpen');
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => {
    if (editArticle) {
      setTitle(editArticle.title);
      setContent(editArticle.content);
      setCategoryId(editArticle.category_id);
      setTags(editArticle.tags.join(', '));
      setOwnerId(editArticle.owner_id || '');
      setAttachments((editArticle.attachments as SOPAttachment[]) || []);
    } else {
      setTitle('');
      setContent('');
      setCategoryId(defaultCategoryId || '');
      setTags('');
      setOwnerId('');
      setAttachments([]);
    }
    setShowNewCategory(false);
    setNewCatTitle('');
    setNewCatDescription('');
    setNewCatIcon('BookOpen');
  }, [editArticle, defaultCategoryId, open]);

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
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    const ownerValue = ownerId || null;
    if (editArticle) {
      await updateArticle(editArticle.id, { title, content, category_id: categoryId, tags: tagArray, owner_id: ownerValue, attachments: attachments as any });
    } else {
      await addArticle({ title, content, category_id: categoryId, tags: tagArray, owner_id: ownerValue, attachments: attachments as any });
    }
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editArticle ? 'Upravit článek' : 'Nový SOP článek'}</DialogTitle>
        </DialogHeader>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tagy (oddělené čárkou)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="onboarding, klient, smlouva..." />
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
          </div>

          <div className="space-y-2">
            <Label>Obsah</Label>
            <SOPEditor content={content} onChange={setContent} />
          </div>

          <SOPAttachmentUpload
            articleId={editArticle?.id || `new-${Date.now()}`}
            attachments={attachments}
            onChange={setAttachments}
          />
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
