import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AcademyVideo } from '@/hooks/useAcademyData';

interface EditVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: AcademyVideo | null;
  moduleId: string;
  onSave: (data: Partial<AcademyVideo>) => Promise<boolean>;
  isCreating?: boolean;
}

export function EditVideoDialog({ 
  open, 
  onOpenChange, 
  video, 
  moduleId,
  onSave,
  isCreating = false
}: EditVideoDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description || '');
      setDuration(video.duration || '');
      setVideoUrl(video.video_url || '');
    } else {
      setTitle('');
      setDescription('');
      setDuration('');
      setVideoUrl('');
    }
  }, [video, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    const success = await onSave({
      module_id: moduleId,
      title: title.trim(),
      description: description.trim() || null,
      duration: duration.trim() || null,
      video_url: videoUrl.trim() || null,
    });
    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  // Convert regular YouTube URL to embed URL
  const convertToEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) return url;
    
    // Regular YouTube URL
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    return url;
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoUrl(convertToEmbedUrl(value));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Nové video' : 'Upravit video'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="video-title">Název videa *</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="např. Úvod do CRM systému"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-description">Popis</Label>
            <Textarea
              id="video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Stručný popis videa..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-duration">Délka</Label>
            <Input
              id="video-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="např. 5:30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-url">URL videa</Label>
            <Input
              id="video-url"
              value={videoUrl}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">
              Podporované: YouTube (automaticky převede na embed URL)
            </p>
          </div>

          {videoUrl && (
            <div className="space-y-2">
              <Label>Náhled</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <iframe
                  src={videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
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
