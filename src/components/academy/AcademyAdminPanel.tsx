import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical,
  ChevronDown,
  ChevronRight,
  Video,
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAcademyData, AcademyModule, AcademyVideo } from '@/hooks/useAcademyData';
import { EditModuleDialog } from './EditModuleDialog';
import { EditVideoDialog } from './EditVideoDialog';

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
};

export function AcademyAdminPanel() {
  const { 
    modules, 
    createModule, 
    updateModule, 
    deleteModule,
    createVideo,
    updateVideo,
    deleteVideo,
  } = useAcademyData();

  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  // Module dialog state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  
  // Video dialog state
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AcademyVideo | null>(null);
  const [videoModuleId, setVideoModuleId] = useState<string>('');
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'module' | 'video'; id: string; title: string } | null>(null);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleCreateModule = () => {
    setEditingModule(null);
    setIsCreatingModule(true);
    setModuleDialogOpen(true);
  };

  const handleEditModule = (module: AcademyModule) => {
    setEditingModule(module);
    setIsCreatingModule(false);
    setModuleDialogOpen(true);
  };

  const handleSaveModule = async (data: Partial<AcademyModule>): Promise<boolean> => {
    if (isCreatingModule) {
      const result = await createModule(data);
      return result !== null;
    } else if (editingModule) {
      return await updateModule(editingModule.id, data);
    }
    return false;
  };

  const handleCreateVideo = (moduleId: string) => {
    setEditingVideo(null);
    setVideoModuleId(moduleId);
    setIsCreatingVideo(true);
    setVideoDialogOpen(true);
  };

  const handleEditVideo = (video: AcademyVideo, moduleId: string) => {
    setEditingVideo(video);
    setVideoModuleId(moduleId);
    setIsCreatingVideo(false);
    setVideoDialogOpen(true);
  };

  const handleSaveVideo = async (data: Partial<AcademyVideo>): Promise<boolean> => {
    if (isCreatingVideo) {
      const result = await createVideo({ ...data, module_id: videoModuleId });
      return result !== null;
    } else if (editingVideo) {
      return await updateVideo(editingVideo.id, data);
    }
    return false;
  };

  const handleDeleteRequest = (type: 'module' | 'video', id: string, title: string) => {
    setDeleteTarget({ type, id, title });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'module') {
      await deleteModule(deleteTarget.id);
    } else {
      await deleteVideo(deleteTarget.id);
    }
    
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Správa obsahu
          </CardTitle>
          <Button onClick={handleCreateModule} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nový modul
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {modules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Zatím nejsou žádné moduly</p>
            <Button onClick={handleCreateModule} variant="outline" className="mt-3">
              <Plus className="h-4 w-4 mr-1" />
              Vytvořit první modul
            </Button>
          </div>
        ) : (
          modules.map((module) => {
            const Icon = ICON_MAP[module.icon] || BookOpen;
            const isExpanded = expandedModules.includes(module.id);

            return (
              <Collapsible 
                key={module.id} 
                open={isExpanded}
                onOpenChange={() => toggleModule(module.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{module.title}</span>
                          {module.required && (
                            <Badge variant="secondary" className="text-xs">Povinné</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{module.videos.length} videí</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleEditModule(module); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDeleteRequest('module', module.id, module.title); }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20 p-3 space-y-2">
                      {module.videos.map((video) => (
                        <div 
                          key={video.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-background hover:bg-muted/50"
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{video.title}</p>
                            <p className="text-xs text-muted-foreground">{video.duration || 'bez délky'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditVideo(video, module.id)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteRequest('video', video.id, video.title)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCreateVideo(module.id)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Přidat video
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </CardContent>

      {/* Edit Module Dialog */}
      <EditModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        module={editingModule}
        onSave={handleSaveModule}
        isCreating={isCreatingModule}
      />

      {/* Edit Video Dialog */}
      <EditVideoDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        video={editingVideo}
        moduleId={videoModuleId}
        onSave={handleSaveVideo}
        isCreating={isCreatingVideo}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat {deleteTarget?.type === 'module' ? 'modul' : 'video'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat "{deleteTarget?.title}"?
              {deleteTarget?.type === 'module' && ' Tím smažete i všechna videa v tomto modulu.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
