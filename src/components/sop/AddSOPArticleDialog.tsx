import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SOPEditor } from './SOPEditor';
import { useSOPData, type SOPArticle, type SOPCategory } from '@/hooks/useSOPData';

interface AddSOPArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editArticle?: SOPArticle | null;
  defaultCategoryId?: string;
}

export function AddSOPArticleDialog({ open, onOpenChange, editArticle, defaultCategoryId }: AddSOPArticleDialogProps) {
  const { categories, addArticle, updateArticle } = useSOPData();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editArticle) {
      setTitle(editArticle.title);
      setContent(editArticle.content);
      setCategoryId(editArticle.category_id);
      setTags(editArticle.tags.join(', '));
    } else {
      setTitle('');
      setContent('');
      setCategoryId(defaultCategoryId || '');
      setTags('');
    }
  }, [editArticle, defaultCategoryId, open]);

  const handleSave = async () => {
    if (!title.trim() || !categoryId) return;
    setSaving(true);
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editArticle) {
      await updateArticle(editArticle.id, { title, content, category_id: categoryId, tags: tagArray });
    } else {
      await addArticle({ title, content, category_id: categoryId, tags: tagArray });
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
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Vyberte kategorii" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tagy (oddělené čárkou)</Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="onboarding, klient, smlouva..." />
          </div>

          <div className="space-y-2">
            <Label>Obsah</Label>
            <SOPEditor content={content} onChange={setContent} />
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
