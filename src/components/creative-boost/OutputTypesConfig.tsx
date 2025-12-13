import { useState, useMemo } from 'react';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Image, Video, Languages, Sparkles, RotateCcw } from 'lucide-react';
import type { OutputType, OutputCategory } from '@/types/creativeBoost';
import { cn } from '@/lib/utils';

// Category labels
const categoryLabels: Record<OutputCategory, string> = {
  banner: 'Banner',
  banner_translation: 'Překlad',
  banner_revision: 'Revize',
  ai_photo: 'AI Fotka',
  video: 'Video',
  video_translation: 'Překlad',
  video_revision: 'Revize',
};

// Category icons
const categoryIcons: Record<OutputCategory, React.ReactNode> = {
  banner: <Image className="h-3.5 w-3.5" />,
  banner_translation: <Languages className="h-3.5 w-3.5" />,
  banner_revision: <RotateCcw className="h-3.5 w-3.5" />,
  ai_photo: <Sparkles className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  video_translation: <Languages className="h-3.5 w-3.5" />,
  video_revision: <RotateCcw className="h-3.5 w-3.5" />,
};

// Category colors - blue family for banners, purple family for videos
const categoryColors: Record<OutputCategory, string> = {
  banner: 'bg-blue-100 text-blue-700 border-blue-200',
  banner_translation: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  banner_revision: 'bg-blue-50 text-blue-600 border-blue-100',
  ai_photo: 'bg-amber-100 text-amber-700 border-amber-200',
  video: 'bg-purple-100 text-purple-700 border-purple-200',
  video_translation: 'bg-violet-100 text-violet-700 border-violet-200',
  video_revision: 'bg-purple-50 text-purple-600 border-purple-100',
};

// Category grouping
const categoryGroups = {
  banner_group: ['banner', 'banner_translation', 'banner_revision', 'ai_photo'] as OutputCategory[],
  video_group: ['video', 'video_translation', 'video_revision'] as OutputCategory[],
};

export function OutputTypesConfig() {
  const { outputTypes, addOutputType, updateOutputType } = useCreativeBoostData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<OutputType | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<OutputCategory>('banner');
  const [baseCredits, setBaseCredits] = useState(1);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Group output types
  const groupedOutputTypes = useMemo(() => {
    const bannerTypes = outputTypes.filter(t => categoryGroups.banner_group.includes(t.category));
    const videoTypes = outputTypes.filter(t => categoryGroups.video_group.includes(t.category));
    return { bannerTypes, videoTypes };
  }, [outputTypes]);

  const openAddDialog = () => {
    setEditingType(null);
    setName('');
    setCategory('banner');
    setBaseCredits(1);
    setDescription('');
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: OutputType) => {
    setEditingType(type);
    setName(type.name);
    setCategory(type.category);
    setBaseCredits(type.baseCredits);
    setDescription(type.description);
    setIsActive(type.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name) return;

    if (editingType) {
      updateOutputType(editingType.id, {
        name,
        category,
        baseCredits,
        description,
        isActive,
      });
    } else {
      addOutputType({
        name,
        category,
        baseCredits,
        description,
        isActive,
      });
    }

    setIsDialogOpen(false);
  };

  const handleToggleActive = (type: OutputType) => {
    updateOutputType(type.id, { isActive: !type.isActive });
  };

  const renderTypeRow = (type: OutputType) => (
    <TableRow key={type.id} className={!type.isActive ? 'opacity-50' : ''}>
      <TableCell className="font-medium">{type.name}</TableCell>
      <TableCell className="text-center">
        <Badge 
          variant="outline" 
          className={cn("gap-1 text-xs", categoryColors[type.category])}
        >
          {categoryIcons[type.category]}
          {categoryLabels[type.category]}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-semibold text-primary">{type.baseCredits}</span>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
        {type.description}
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={type.isActive}
          onCheckedChange={() => handleToggleActive(type)}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEditDialog(type)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Typy kreativních výstupů</h3>
          <p className="text-sm text-muted-foreground">
            Spravujte typy výstupů a jejich kreditové hodnoty
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Přidat typ
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Název</TableHead>
              <TableHead className="text-center">Kategorie</TableHead>
              <TableHead className="text-center">Kredity</TableHead>
              <TableHead>Popis</TableHead>
              <TableHead className="text-center">Aktivní</TableHead>
              <TableHead className="text-right">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Banner section */}
            <TableRow className="bg-blue-50/50 hover:bg-blue-50/50">
              <TableCell colSpan={6} className="py-2">
                <div className="flex items-center gap-2 font-semibold text-blue-700">
                  <Image className="h-4 w-4" />
                  BANNERY
                </div>
              </TableCell>
            </TableRow>
            {groupedOutputTypes.bannerTypes.map(renderTypeRow)}
            
            {/* Video section */}
            <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
              <TableCell colSpan={6} className="py-2">
                <div className="flex items-center gap-2 font-semibold text-purple-700">
                  <Video className="h-4 w-4" />
                  VIDEA
                </div>
              </TableCell>
            </TableRow>
            {groupedOutputTypes.videoTypes.map(renderTypeRow)}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Upravit typ výstupu' : 'Přidat nový typ výstupu'}
            </DialogTitle>
            <DialogDescription>
              {editingType 
                ? 'Změny ovlivní pouze nově vytvořené položky.' 
                : 'Definujte nový typ kreativního výstupu.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type-name">Název *</Label>
              <Input
                id="type-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Meta bannery – 2 rozměry"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as OutputCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="banner">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Banner
                      </span>
                    </SelectItem>
                    <SelectItem value="banner_translation">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500" />
                        Překlad banneru
                      </span>
                    </SelectItem>
                    <SelectItem value="banner_revision">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-300" />
                        Revize banneru
                      </span>
                    </SelectItem>
                    <SelectItem value="ai_photo">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        AI Fotka
                      </span>
                    </SelectItem>
                    <SelectItem value="video">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Video
                      </span>
                    </SelectItem>
                    <SelectItem value="video_translation">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        Překlad videa
                      </span>
                    </SelectItem>
                    <SelectItem value="video_revision">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-300" />
                        Revize videa
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-credits">Základní kredity *</Label>
                <Input
                  id="base-credits"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={baseCredits}
                  onChange={(e) => setBaseCredits(Math.max(0.5, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-description">Popis</Label>
              <Textarea
                id="type-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Volitelný popis typu výstupu"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="is-active">Aktivní</Label>
                <p className="text-xs text-muted-foreground">
                  Neaktivní typy se nezobrazí při vytváření položek
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSubmit} disabled={!name}>
              {editingType ? 'Uložit změny' : 'Přidat typ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
