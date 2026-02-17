import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSOPData, type SOPCategory } from '@/hooks/useSOPData';

const ICONS = ['BookOpen', 'Briefcase', 'BarChart3', 'Users', 'Settings', 'Zap', 'FileText', 'Target', 'Palette'];

interface AddSOPCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCategory?: SOPCategory | null;
}

export function AddSOPCategoryDialog({ open, onOpenChange, editCategory }: AddSOPCategoryDialogProps) {
  const { addCategory, updateCategory } = useSOPData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editCategory) {
      setTitle(editCategory.title);
      setDescription(editCategory.description);
      setIcon(editCategory.icon);
    } else {
      setTitle(''); setDescription(''); setIcon('BookOpen');
    }
  }, [editCategory, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    if (editCategory) {
      await updateCategory(editCategory.id, { title, description, icon });
    } else {
      await addCategory({ title, description, icon });
    }
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editCategory ? 'Upravit kategorii' : 'Nová kategorie'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Název *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Název kategorie..." />
          </div>
          <div className="space-y-2">
            <Label>Popis</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Krátký popis..." />
          </div>
          <div className="space-y-2">
            <Label>Ikona</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Ukládám...' : editCategory ? 'Uložit' : 'Vytvořit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
