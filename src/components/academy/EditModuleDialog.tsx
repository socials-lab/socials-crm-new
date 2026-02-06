import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, FileText, BookOpen, Play, ExternalLink, Link2, GripVertical } from 'lucide-react';
import { AcademyModule, AcademyLink } from '@/hooks/useAcademyData';

const AVAILABLE_ICONS = [
  { value: 'Users', label: '👥 Tým / Lidé' },
  { value: 'Settings', label: '⚙️ Nastavení / Nástroje' },
  { value: 'Briefcase', label: '💼 Klienti / Práce' },
  { value: 'Target', label: '🎯 Cíle / Strategie' },
  { value: 'Sparkles', label: '✨ Kreativa' },
  { value: 'BookOpen', label: '📖 Vzdělávání' },
  { value: 'GraduationCap', label: '🎓 Akademie' },
  { value: 'Lightbulb', label: '💡 Nápady' },
  { value: 'Rocket', label: '🚀 Růst / Start' },
  { value: 'Heart', label: '❤️ Hodnoty' },
  { value: 'Coins', label: '💰 Finance / Provize' },
  { value: 'FileText', label: '📄 Dokumenty' },
  { value: 'ClipboardCheck', label: '✅ Procesy' },
  { value: 'Package', label: '📦 Služby' },
  { value: 'Search', label: '🔍 Analytika' },
  { value: 'Receipt', label: '🧾 Fakturace' },
  { value: 'BarChart3', label: '📊 Reporting' },
  { value: 'Calendar', label: '📅 Plánování' },
];

const LINK_TYPES: { value: AcademyLink['type']; label: string; icon: typeof FileText; color: string }[] = [
  { value: 'sop', label: 'SOP', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  { value: 'doc', label: 'Dokument', icon: BookOpen, color: 'bg-green-100 text-green-700' },
  { value: 'video', label: 'Video', icon: Play, color: 'bg-purple-100 text-purple-700' },
  { value: 'external', label: 'Externí odkaz', icon: ExternalLink, color: 'bg-orange-100 text-orange-700' },
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
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [links, setLinks] = useState<AcademyLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // New link form state
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<AcademyLink['type']>('doc');

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || '');
      setIcon(module.icon);
      setRequired(module.required);
      setIsActive(module.is_active);
      setSortOrder(module.sort_order);
      setLinks(module.links || []);
    } else {
      setTitle('');
      setDescription('');
      setIcon('BookOpen');
      setRequired(false);
      setIsActive(true);
      setSortOrder(1);
      setLinks([]);
    }
    // Reset new link form
    setNewLinkLabel('');
    setNewLinkUrl('');
    setNewLinkType('doc');
  }, [module, open]);

  const handleAddLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;

    setLinks([
      ...links,
      {
        label: newLinkLabel.trim(),
        url: newLinkUrl.trim(),
        type: newLinkType,
      }
    ]);
    setNewLinkLabel('');
    setNewLinkUrl('');
    setNewLinkType('doc');
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    const success = await onSave({
      title: title.trim(),
      description: description.trim() || null,
      icon,
      required,
      is_active: isActive,
      sort_order: sortOrder,
      links: links.length > 0 ? links : undefined,
    });
    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const getLinkTypeInfo = (type?: AcademyLink['type']) => {
    return LINK_TYPES.find(t => t.value === type) || LINK_TYPES[1]; // default to 'doc'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Nový modul' : 'Upravit modul'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Pořadí</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value) || 1)}
                  />
                </div>
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

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Aktivní</Label>
                  <p className="text-xs text-muted-foreground">Neaktivní moduly se nezobrazují</p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <Separator />

            {/* Links Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Odkazy a dokumenty</Label>
                  <p className="text-xs text-muted-foreground">SOP, dokumenty, videa a externí odkazy</p>
                </div>
                <Badge variant="secondary">{links.length}</Badge>
              </div>

              {/* Existing Links */}
              {links.length > 0 && (
                <div className="space-y-2">
                  {links.map((link, index) => {
                    const typeInfo = getLinkTypeInfo(link.type);
                    const IconComponent = typeInfo.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                        <Badge variant="outline" className={`${typeInfo.color} border-0 text-xs`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                        <span className="flex-1 text-sm truncate">{link.label}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary truncate max-w-[120px]"
                        >
                          {link.url}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveLink(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Link */}
              <div className="space-y-3 p-3 rounded-lg border border-dashed">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Přidat odkaz</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Typ</Label>
                    <Select value={newLinkType} onValueChange={(v) => setNewLinkType(v as AcademyLink['type'])}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINK_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value!}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-3 w-3" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Název</Label>
                    <Input
                      className="h-8"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="např. SOP: Onboarding"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">URL</Label>
                    <Input
                      className="h-8"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleAddLink}
                      disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

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
