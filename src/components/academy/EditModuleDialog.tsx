import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcademyModule } from '@/hooks/useAcademyData';

const AVAILABLE_ICONS = [
  { value: 'Users', label: '👥 Users' },
  { value: 'Settings', label: '⚙️ Settings' },
  { value: 'Briefcase', label: '💼 Briefcase' },
  { value: 'Target', label: '🎯 Target' },
  { value: 'Sparkles', label: '✨ Sparkles' },
  { value: 'BookOpen', label: '📖 BookOpen' },
  { value: 'GraduationCap', label: '🎓 GraduationCap' },
  { value: 'Lightbulb', label: '💡 Lightbulb' },
  { value: 'Rocket', label: '🚀 Rocket' },
  { value: 'Heart', label: '❤️ Heart' },
];

interface EditModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: AcademyModule | null;
  onSave: (data: Partial<AcademyModule>) => Promise<boolean>;
  isCreating?: boolean;
}

export function EditModuleDialog({ 
  open, 
  onOpenChange, 
  module, 
  onSave,
  isCreating = false
}: EditModuleDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [required, setRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || '');
      setIcon(module.icon);
      setRequired(module.required);
    } else {
      setTitle('');
      setDescription('');
      setIcon('BookOpen');
      setRequired(false);
    }
  }, [module, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    const success = await onSave({
      title: title.trim(),
      description: description.trim() || null,
      icon,
      required,
    });
    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Nový modul' : 'Upravit modul'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Název modulu *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="např. Vítej v Socials! 👋"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Stručný popis modulu..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ikona</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ICONS.map((iconOption) => (
                  <SelectItem key={iconOption.value} value={iconOption.value}>
                    {iconOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="required">Povinný modul</Label>
              <p className="text-xs text-muted-foreground">Označí modul jako povinný pro všechny</p>
            </div>
            <Switch
              id="required"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? 'Ukládám...' : 'Uložit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
