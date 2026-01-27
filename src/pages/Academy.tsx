import { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen,
  Users,
  Briefcase,
  Settings,
  Target,
  Sparkles,
  Lightbulb,
  Rocket,
  Heart,
  Trophy,
  Pencil,
  ExternalLink,
  FileText,
  Link2,
  Coins,
  ClipboardCheck,
  Package,
  Search,
  Receipt,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserRole } from '@/hooks/useUserRole';
import { useAcademyData, AcademyModule, AcademyVideo, AcademyLink } from '@/hooks/useAcademyData';
import { AcademyAdminPanel } from '@/components/academy/AcademyAdminPanel';

// Icon mapping
const ICON_MAP: Record<string, typeof BookOpen> = {
  Users,
  Settings,
  Briefcase,
  Target,
  Sparkles,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Rocket,
  Heart,
  Coins,
  FileText,
  ClipboardCheck,
  Package,
  Search,
  Receipt,
  BarChart3,
  Calendar,
};

// Link type styling
const getLinkStyle = (type?: AcademyLink['type']) => {
  switch (type) {
    case 'sop':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200';
    case 'doc':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200';
    case 'video':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200';
    case 'external':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200';
    default:
      return 'bg-muted hover:bg-muted/80';
  }
};

const getLinkIcon = (type?: AcademyLink['type']) => {
  switch (type) {
    case 'sop':
      return FileText;
    case 'doc':
      return BookOpen;
    case 'video':
      return Play;
    case 'external':
      return ExternalLink;
    default:
      return Link2;
  }
};

// Local storage for progress
const STORAGE_KEY = 'academy_progress';

function getWatchedVideos(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setVideoWatched(videoId: string): void {
  const watched = getWatchedVideos();
  if (!watched.includes(videoId)) {
    watched.push(videoId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watched));
  }
}

export default function Academy() {
  const { isSuperAdmin, canEditAcademy } = useUserRole();
  const { modules, isLoading, isUsingDatabase } = useAcademyData();
  
  const [watchedVideos, setWatchedVideos] = useState<string[]>(getWatchedVideos);
  const [selectedVideo, setSelectedVideo] = useState<AcademyVideo | null>(null);
  const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Check if user can edit
  const canEdit = isSuperAdmin || canEditAcademy;

  // Calculate progress
  const progress = useMemo(() => {
    const totalVideos = modules.reduce((sum, m) => sum + m.videos.length, 0);
    const requiredVideos = modules.filter(m => m.required).reduce((sum, m) => sum + m.videos.length, 0);
    const watchedCount = watchedVideos.length;
    const watchedRequired = modules
      .filter(m => m.required)
      .reduce((sum, m) => sum + m.videos.filter(v => watchedVideos.includes(v.id)).length, 0);

    return {
      total: totalVideos,
      watched: watchedCount,
      percentage: totalVideos > 0 ? (watchedCount / totalVideos) * 100 : 0,
      requiredTotal: requiredVideos,
      requiredWatched: watchedRequired,
      requiredComplete: watchedRequired >= requiredVideos,
    };
  }, [watchedVideos, modules]);

  // Module progress
  const getModuleProgress = (module: AcademyModule) => {
    const watched = module.videos.filter(v => watchedVideos.includes(v.id)).length;
    return {
      watched,
      total: module.videos.length,
      percentage: module.videos.length > 0 ? (watched / module.videos.length) * 100 : 0,
      complete: watched >= module.videos.length,
    };
  };

  // Handle video completion
  const handleVideoComplete = (videoId: string) => {
    setVideoWatched(videoId);
    setWatchedVideos(getWatchedVideos());
  };

  // Open video player
  const openVideo = (video: AcademyVideo, module: AcademyModule) => {
    setSelectedVideo(video);
    setSelectedModule(module);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Načítám akademii...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="🎓 Akademie" 
          titleAccent="Socials"
          description="Vzdělávací centrum pro všechny členy týmu"
        />
        
        {canEdit && (
          <Button 
            variant={showAdminPanel ? "default" : "outline"}
            onClick={() => setShowAdminPanel(!showAdminPanel)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {showAdminPanel ? 'Skrýt správu' : 'Upravit obsah'}
          </Button>
        )}
      </div>

      {/* Admin info about database */}
      {canEdit && !isUsingDatabase && (
        <Alert>
          <AlertDescription>
            ⚠️ Databázové tabulky ještě nebyly vytvořeny. Data se zobrazují z výchozí konfigurace. 
            Pro aktivaci editace spusťte migraci z <code className="bg-muted px-1 rounded">docs/supabase-migration-academy.sql</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Panel */}
      {canEdit && showAdminPanel && (
        <AcademyAdminPanel />
      )}

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Tvůj pokrok</h2>
                <p className="text-sm text-muted-foreground">
                  {progress.watched} z {progress.total} videí dokončeno
                </p>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Celkový postup</span>
                <span className="font-medium">{progress.percentage.toFixed(0)}%</span>
              </div>
              <Progress value={progress.percentage} className="h-3" />
            </div>

            {progress.requiredComplete ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <Trophy className="h-5 w-5" />
                <span className="font-medium">Povinná část dokončena!</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{progress.requiredWatched}/{progress.requiredTotal}</span> povinných videí
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.sort((a, b) => a.sort_order - b.sort_order).map((module) => {
          const moduleProgress = getModuleProgress(module);
          const Icon = ICON_MAP[module.icon] || BookOpen;
          
          return (
            <Card 
              key={module.id} 
              className={`overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 ${
                moduleProgress.complete ? 'border-green-200 dark:border-green-800' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      moduleProgress.complete 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-primary/10'
                    }`}>
                      {moduleProgress.complete ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{module.videos.length} videí</p>
                    </div>
                  </div>
                  {module.required && (
                    <Badge variant="secondary" className="text-xs">
                      Povinné
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{module.description}</p>

                {/* Module links (SOP, docs) */}
                {module.links && module.links.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {module.links.slice(0, 3).map((link, idx) => {
                      const LinkIcon = getLinkIcon(link.type);
                      return (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${getLinkStyle(link.type)}`}
                        >
                          <LinkIcon className="h-3 w-3" />
                          {link.label}
                        </a>
                      );
                    })}
                    {module.links.length > 3 && (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        +{module.links.length - 3} další
                      </span>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Postup</span>
                    <span className="font-medium">{moduleProgress.watched}/{moduleProgress.total}</span>
                  </div>
                  <Progress value={moduleProgress.percentage} className="h-2" />
                </div>

                {/* Video list preview */}
                <div className="space-y-1.5">
                  {module.videos.slice(0, 3).map((video) => {
                    const isWatched = watchedVideos.includes(video.id);
                    return (
                      <button
                        key={video.id}
                        onClick={() => openVideo(video, module)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className={`p-1.5 rounded-full ${
                          isWatched 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-muted group-hover:bg-primary/10'
                        }`}>
                          {isWatched ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Play className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                          )}
                        </div>
                        <span className={`text-sm flex-1 truncate ${isWatched ? 'text-muted-foreground' : ''}`}>
                          {video.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{video.duration}</span>
                      </button>
                    );
                  })}
                  {module.videos.length > 3 && (
                    <button
                      onClick={() => openVideo(module.videos[0], module)}
                      className="w-full text-xs text-primary hover:underline text-center py-1"
                    >
                      + {module.videos.length - 3} dalších videí
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedModule && (
                <Badge variant="outline" className="text-xs">
                  {selectedModule.title}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg">{selectedVideo?.title}</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedVideo?.description}</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video embed placeholder */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              {selectedVideo?.video_url ? (
                <iframe
                  src={selectedVideo.video_url}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center">
                  <Play className="h-16 w-16 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground">Video není k dispozici</p>
                </div>
              )}
            </div>

            {/* Video links */}
            {selectedVideo?.links && selectedVideo.links.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground mr-2">📎 Materiály:</span>
                {selectedVideo.links.map((link, idx) => {
                  const LinkIcon = getLinkIcon(link.type);
                  return (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${getLinkStyle(link.type)}`}
                    >
                      <LinkIcon className="h-3 w-3" />
                      {link.label}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Video info and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedVideo?.duration}
                </span>
              </div>
              
              {selectedVideo && !watchedVideos.includes(selectedVideo.id) ? (
                <Button onClick={() => handleVideoComplete(selectedVideo.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Označit jako zhlédnuté
                </Button>
              ) : (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Zhlédnuto
                </Badge>
              )}
            </div>

            {/* Other videos in module */}
            {selectedModule && selectedModule.videos.length > 1 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Další videa v tomto modulu</p>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-1">
                    {selectedModule.videos.map((video) => {
                      const isWatched = watchedVideos.includes(video.id);
                      const isActive = video.id === selectedVideo?.id;
                      return (
                        <button
                          key={video.id}
                          onClick={() => setSelectedVideo(video)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                            isActive 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className={`p-1.5 rounded-full ${
                            isWatched 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-muted'
                          }`}>
                            {isWatched ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Play className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <span className={`text-sm flex-1 truncate ${isWatched && !isActive ? 'text-muted-foreground' : ''}`}>
                            {video.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{video.duration}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
