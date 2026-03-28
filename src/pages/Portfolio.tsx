import { useState, useRef } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Pencil, Image, Video, Play, GripVertical, Plus, Filter } from 'lucide-react';
import { usePortfolioData, type PortfolioItem } from '@/hooks/usePortfolioData';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'image' | 'video';

const DEMO_ITEMS: PortfolioItem[] = [
  { id: 'demo-1', title: 'Teen Wear – kreativní banner', file_url: '/images/portfolio/banner1.jpg', type: 'image', sort_order: 0, is_active: true, created_at: '' },
  { id: 'demo-2', title: 'Super Zoo – doprava zdarma', file_url: '/images/portfolio/doprava_zdarma1.png', type: 'image', sort_order: 1, is_active: true, created_at: '' },
  { id: 'demo-3', title: 'SleepKing – produktová reklama', file_url: '/images/portfolio/sleepking.jpg', type: 'image', sort_order: 2, is_active: true, created_at: '' },
  { id: 'demo-4', title: 'Puella – vánoční kampaň', file_url: '/images/portfolio/puella.png', type: 'image', sort_order: 3, is_active: true, created_at: '' },
  { id: 'demo-5', title: 'Cyber Monday', file_url: '/images/portfolio/cyber_monday.png', type: 'image', sort_order: 4, is_active: true, created_at: '' },
  { id: 'demo-6', title: 'Online Medical – longevity', file_url: '/images/portfolio/onlinemedical.jpg', type: 'image', sort_order: 5, is_active: true, created_at: '' },
  { id: 'demo-7', title: 'Nut World – prémiové kešu', file_url: '/images/portfolio/nutworld.png', type: 'image', sort_order: 6, is_active: true, created_at: '' },
  { id: 'demo-8', title: 'Pontina – Essentials set', file_url: '/images/portfolio/naturapura.jpg', type: 'image', sort_order: 7, is_active: true, created_at: '' },
  { id: 'demo-9', title: 'Natima – Halloween kampaň', file_url: '/images/portfolio/halloween.png', type: 'image', sort_order: 8, is_active: true, created_at: '' },
  { id: 'demo-10', title: 'CBDway – Tutti Frutti', file_url: '/images/portfolio/cbdway.jpg', type: 'image', sort_order: 9, is_active: true, created_at: '' },
  { id: 'demo-11', title: 'Dmania – listopadová sleva', file_url: '/images/portfolio/dmania.jpg', type: 'image', sort_order: 10, is_active: true, created_at: '' },
  { id: 'demo-12', title: 'K2 Moto – airbagová vesta', file_url: '/images/portfolio/k2moto.png', type: 'image', sort_order: 11, is_active: true, created_at: '' },
  { id: 'demo-13', title: 'Beewood – dřevěné kryty', file_url: '/images/portfolio/beewood.png', type: 'image', sort_order: 12, is_active: true, created_at: '' },
  { id: 'demo-14', title: 'Magnesium duo', file_url: '/images/portfolio/magnesium.png', type: 'image', sort_order: 13, is_active: true, created_at: '' },
  { id: 'demo-15', title: 'Antistress – produktové video', file_url: '/images/portfolio/antistress.mp4', type: 'video', sort_order: 14, is_active: true, created_at: '' },
  { id: 'demo-16', title: 'Adobe Firefly – AI video', file_url: '/images/portfolio/firefly.mp4', type: 'video', sort_order: 15, is_active: true, created_at: '' },
  { id: 'demo-17', title: 'Hyundai IONIQ – reklama', file_url: '/images/portfolio/ioniq.mp4', type: 'video', sort_order: 16, is_active: true, created_at: '' },
  { id: 'demo-18', title: 'Hyundai – video spot', file_url: '/images/portfolio/hyundai.mp4', type: 'video', sort_order: 17, is_active: true, created_at: '' },
  { id: 'demo-19', title: 'CBDway Sleep – produkt', file_url: '/images/portfolio/cbdway_sleep.mp4', type: 'video', sort_order: 18, is_active: true, created_at: '' },
  { id: 'demo-20', title: 'Nut World – video reklama', file_url: '/images/portfolio/nutworld_video.mp4', type: 'video', sort_order: 19, is_active: true, created_at: '' },
  { id: 'demo-21', title: 'Teen Wear – video', file_url: '/images/portfolio/teenwear_video.mp4', type: 'video', sort_order: 20, is_active: true, created_at: '' },
  { id: 'demo-22', title: 'Natios – hook video', file_url: '/images/portfolio/natios-hook1.mp4', type: 'video', sort_order: 21, is_active: true, created_at: '' },
];

export default function Portfolio({ embedded }: { embedded?: boolean }) {
  const { items, isLoading, addItem, updateItem, deleteItem } = usePortfolioData();
  const [filter, setFilter] = useState<FilterType>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOrder, setEditOrder] = useState(0);

  // Show demo items when DB is empty (not loading)
  const displayItems = !isLoading && items.length === 0 ? DEMO_ITEMS : items;
  const isDemo = !isLoading && items.length === 0;
  const filteredItems = displayItems.filter(item => filter === 'all' || item.type === filter);

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    for (const file of uploadFiles) {
      const title = uploadFiles.length === 1 && uploadTitle ? uploadTitle : file.name.split('.')[0];
      await addItem(file, title);
    }
    setUploading(false);
    setUploadOpen(false);
    setUploadFiles([]);
    setUploadTitle('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (files.length > 0) {
      setUploadFiles(files);
      setUploadOpen(true);
    }
  };

  const openEdit = (item: PortfolioItem) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditOrder(item.sort_order);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    await updateItem(editItem.id, { title: editTitle, sort_order: editOrder });
    setEditItem(null);
  };

  const imageCount = displayItems.filter(i => i.type === 'image').length;
  const videoCount = displayItems.filter(i => i.type === 'video').length;

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title="Portfolio"
          description="Správa bannerů a videí zobrazených ve veřejných nabídkách"
        />
      )}

      {isDemo && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary flex items-center gap-2">
          <Image className="h-4 w-4 shrink-0" />
          <span>Zobrazují se vzorová data. Nahrajte vlastní položky do Supabase storage pro reálný obsah.</span>
        </div>
      )}

      {/* Stats + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1"><Image className="h-3 w-3" />{imageCount} obrázků</Badge>
          <Badge variant="secondary" className="gap-1"><Video className="h-3 w-3" />{videoCount} videí</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden text-sm">
            {(['all', 'image', 'video'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  filter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                {f === 'all' ? 'Vše' : f === 'image' ? 'Obrázky' : 'Videa'}
              </button>
            ))}
          </div>
          <Button onClick={() => setUploadOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Přidat
          </Button>
        </div>
      </div>

      {/* Drop zone + grid */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="min-h-[200px]"
      >
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
            <Upload className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Přetáhněte sem soubory nebo klikněte na „Přidat"</p>
            <p className="text-xs mt-1">Podporované formáty: JPG, PNG, MP4</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  'group relative aspect-square rounded-xl overflow-hidden border bg-muted/30 transition-all hover:shadow-lg hover:border-primary/30',
                  !item.is_active && 'opacity-50'
                )}
              >
                {item.type === 'video' ? (
                  <div className="relative w-full h-full bg-black/10 flex items-center justify-center">
                    <video
                      src={item.file_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-2 rounded-full bg-background/80 backdrop-blur-sm">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={item.file_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-2">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 bg-background/60 backdrop-blur-sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 bg-background/60 backdrop-blur-sm text-destructive" onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium truncate flex-1">{item.title || '—'}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        #{item.sort_order}
                      </Badge>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={val => updateItem(item.id, { is_active: val })}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>

                {/* Type badge */}
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 text-[10px] px-1.5 py-0 opacity-80"
                >
                  {item.type === 'video' ? '🎬' : '🖼️'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nahrát soubory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Soubory</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4"
                className="mt-1 block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                onChange={e => setUploadFiles(Array.from(e.target.files || []))}
              />
              {uploadFiles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{uploadFiles.length} souborů vybráno</p>
              )}
            </div>
            {uploadFiles.length === 1 && (
              <div>
                <Label>Popisek (alt text)</Label>
                <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Název kreativy" className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Zrušit</Button>
            <Button onClick={handleUpload} disabled={uploadFiles.length === 0 || uploading}>
              {uploading ? 'Nahrávání...' : 'Nahrát'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit položku</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Popisek</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Pořadí</Label>
              <Input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Zrušit</Button>
            <Button onClick={saveEdit}>Uložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat položku?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce smaže soubor ze storage i záznam z databáze. Nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteItem(deleteTarget);
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
