import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
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
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

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

    // Loom URL
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }

    // Vimeo URL
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  // Fetch video info (title, duration) from noembed
  const fetchVideoInfo = async (url: string) => {
    if (!url) return;

    // Extract original URL for API call
    let originalUrl = url;

    // If it's already an embed URL, convert back to watch URL for API
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) {
      originalUrl = `https://www.youtube.com/watch?v=${embedMatch[1]}`;
    }

    setIsFetchingInfo(true);
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(originalUrl)}`);
      const data = await response.json();

      if (data && !data.error) {
        // Auto-fill title if empty
        if (!title && data.title) {
          setTitle(data.title);
        }

        // For YouTube, we need to use YouTube API to get duration
        // noembed doesn't provide duration, so let's try youtube-nocookie oEmbed
        const videoId = embedMatch?.[1] || url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];

        if (videoId) {
          // Try to get duration via a different approach - use the video page
          try {
            const ytResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const ytData = await ytResponse.json();
            // YouTube oEmbed doesn't include duration unfortunately
            // But we got the title at least
            if (!title && ytData.title) {
              setTitle(ytData.title);
            }
          } catch {
            // Ignore errors
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch video info:', error);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleVideoUrlChange = (value: string) => {
    const embedUrl = convertToEmbedUrl(value);
    setVideoUrl(embedUrl);

    // Auto-fetch video info when URL changes
    if (embedUrl && embedUrl !== videoUrl) {
      fetchVideoInfo(value);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Nové video' : 'Upravit video'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="video-title">Název videa *</Label>
            <div className="relative">
              <Input
                id="video-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="např. Úvod do CRM systému"
              />
              {isFetchingInfo && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-url">YouTube / Loom / Vimeo odkaz *</Label>
            <Input
              id="video-url"
              value={videoUrl}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">
              Vlož odkaz na video - automaticky se převede na embed
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-duration">Délka</Label>
              <Input
                id="video-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="např. 5:30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-description">Popis (volitelné)</Label>
            <Textarea
              id="video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Stručný popis videa..."
              rows={2}
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
