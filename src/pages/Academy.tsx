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
  ChevronRight,
  Trophy,
  Star,
  Lock,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserRole } from '@/hooks/useUserRole';

// Types
interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string; // YouTube embed URL or video link
  thumbnail?: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: typeof GraduationCap;
  videos: Video[];
  required: boolean;
  order: number;
}

// Mock data for academy modules
const ACADEMY_MODULES: Module[] = [
  {
    id: 'welcome',
    title: 'Vítej v Socials! 👋',
    description: 'Úvod do naší agentury, kultury a hodnot',
    icon: Users,
    required: true,
    order: 1,
    videos: [
      {
        id: 'welcome-1',
        title: 'Kdo jsme a co děláme',
        description: 'Seznámení s agenturou Socials, naše mise a vize',
        duration: '5:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'welcome-2',
        title: 'Naše hodnoty a kultura',
        description: 'Jak u nás pracujeme a co je pro nás důležité',
        duration: '4:15',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'welcome-3',
        title: 'Seznámení s týmem',
        description: 'Kdo je kdo a na koho se obrátit',
        duration: '6:00',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    ],
  },
  {
    id: 'tools',
    title: 'Nástroje a procesy 🛠️',
    description: 'Všechny nástroje které používáme denně',
    icon: Settings,
    required: true,
    order: 2,
    videos: [
      {
        id: 'tools-1',
        title: 'CRM systém - základy',
        description: 'Jak používat Socials CRM pro správu klientů',
        duration: '8:20',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'tools-2',
        title: 'Freelo - projektové řízení',
        description: 'Práce s úkoly a projekty ve Freelu',
        duration: '7:45',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'tools-3',
        title: 'Slack komunikace',
        description: 'Pravidla komunikace a kanály',
        duration: '4:00',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'tools-4',
        title: 'Google Workspace',
        description: 'Dokumenty, kalendář a další Google nástroje',
        duration: '5:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    ],
  },
  {
    id: 'clients',
    title: 'Práce s klienty 🤝',
    description: 'Jak komunikovat a pracovat s našimi klienty',
    icon: Briefcase,
    required: true,
    order: 3,
    videos: [
      {
        id: 'clients-1',
        title: 'Onboarding nového klienta',
        description: 'Proces nástupu nového klienta krok za krokem',
        duration: '10:15',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'clients-2',
        title: 'Pravidelná komunikace',
        description: 'Jak a kdy komunikovat s klienty',
        duration: '6:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'clients-3',
        title: 'Řešení problémů',
        description: 'Co dělat když něco nejde podle plánu',
        duration: '7:00',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    ],
  },
  {
    id: 'performance',
    title: 'Performance marketing 📈',
    description: 'Základy výkonnostní reklamy',
    icon: Target,
    required: false,
    order: 4,
    videos: [
      {
        id: 'perf-1',
        title: 'Meta Ads základy',
        description: 'Úvod do Facebook a Instagram reklamy',
        duration: '12:00',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'perf-2',
        title: 'Google Ads základy',
        description: 'Úvod do Google vyhledávání a PMax',
        duration: '11:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'perf-3',
        title: 'Reporting a analýza',
        description: 'Jak číst data a připravit report',
        duration: '9:45',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    ],
  },
  {
    id: 'creative',
    title: 'Creative Boost 🎨',
    description: 'Vše o naší kreativní službě',
    icon: Sparkles,
    required: false,
    order: 5,
    videos: [
      {
        id: 'creative-1',
        title: 'Co je Creative Boost',
        description: 'Představení služby a jak funguje',
        duration: '5:00',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'creative-2',
        title: 'Kreditový systém',
        description: 'Jak fungují kredity a odměny',
        duration: '6:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    ],
  },
];

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
  const { colleagueId } = useUserRole();
  const [watchedVideos, setWatchedVideos] = useState<string[]>(getWatchedVideos);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Calculate progress
  const progress = useMemo(() => {
    const totalVideos = ACADEMY_MODULES.reduce((sum, m) => sum + m.videos.length, 0);
    const requiredVideos = ACADEMY_MODULES.filter(m => m.required).reduce((sum, m) => sum + m.videos.length, 0);
    const watchedCount = watchedVideos.length;
    const watchedRequired = ACADEMY_MODULES
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
  }, [watchedVideos]);

  // Module progress
  const getModuleProgress = (module: Module) => {
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
  const openVideo = (video: Video, module: Module) => {
    setSelectedVideo(video);
    setSelectedModule(module);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🎓 Akademie" 
        titleAccent="Socials"
        description="Vzdělávací centrum pro všechny členy týmu"
      />

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
        {ACADEMY_MODULES.sort((a, b) => a.order - b.order).map((module) => {
          const moduleProgress = getModuleProgress(module);
          const Icon = module.icon;
          
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
              {selectedVideo?.videoUrl ? (
                <iframe
                  src={selectedVideo.videoUrl}
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
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isActive ? 'font-medium' : ''}`}>
                              {video.title}
                            </p>
                          </div>
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
