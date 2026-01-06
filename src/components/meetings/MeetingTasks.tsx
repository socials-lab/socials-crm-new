import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Plus, Trash2, Calendar as CalendarIcon, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { MeetingTask, MeetingTaskStatus, MeetingTaskPriority } from '@/types/meetings';
import type { Colleague } from '@/types/crm';

interface MeetingTasksProps {
  meetingId: string;
  tasks: MeetingTask[];
  colleagues: Colleague[];
}

const STATUS_ICONS: Record<MeetingTaskStatus, React.ReactNode> = {
  todo: <Circle className="h-4 w-4 text-gray-400" />,
  in_progress: <Clock className="h-4 w-4 text-amber-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const PRIORITY_CONFIG: Record<MeetingTaskPriority, { label: string; color: string }> = {
  low: { label: 'Nízká', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  medium: { label: 'Střední', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  high: { label: 'Vysoká', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export function MeetingTasks({ meetingId, tasks, colleagues }: MeetingTasksProps) {
  const { addTask, updateTask, deleteTask } = useMeetingsData();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: null as string | null,
    due_date: null as Date | null,
    priority: 'medium' as MeetingTaskPriority,
  });

  const activeColleagues = colleagues.filter(c => c.status === 'active');

  const handleAdd = async () => {
    if (!newTask.title.trim()) return;
    try {
      await addTask({
        meeting_id: meetingId,
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        due_date: newTask.due_date ? format(newTask.due_date, 'yyyy-MM-dd') : null,
        priority: newTask.priority,
        status: 'todo',
      });
      setNewTask({
        title: '',
        description: '',
        assigned_to: null,
        due_date: null,
        priority: 'medium',
      });
      setIsAdding(false);
      toast({ title: 'Úkol přidán' });
    } catch (error) {
      toast({ title: 'Chyba při přidávání', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (task: MeetingTask) => {
    const newStatus: MeetingTaskStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      toast({ title: 'Chyba při aktualizaci', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast({ title: 'Úkol smazán' });
    } catch (error) {
      toast({ title: 'Chyba při mazání', variant: 'destructive' });
    }
  };

  const getAssigneeName = (assignedTo: string | null) => {
    if (!assignedTo) return null;
    const colleague = colleagues.find(c => c.id === assignedTo);
    return colleague?.full_name;
  };

  // Sort: incomplete first, then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Úkoly z meetingu ({tasks.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nový úkol
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Task Form */}
        {isAdding && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <Input
              placeholder="Název úkolu *"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <Textarea
              placeholder="Popis (volitelné)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="min-h-[60px]"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={newTask.assigned_to || 'none'}
                onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v === 'none' ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Přiřadit komu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nepřiřazeno</SelectItem>
                  {activeColleagues.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(
                    'justify-start text-left font-normal',
                    !newTask.due_date && 'text-muted-foreground'
                  )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.due_date ? format(newTask.due_date, 'd.M.yyyy') : 'Termín'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newTask.due_date || undefined}
                    onSelect={(date) => setNewTask({ ...newTask, due_date: date || null })}
                    locale={cs}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={newTask.priority}
              onValueChange={(v) => setNewTask({ ...newTask, priority: v as MeetingTaskPriority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label} priorita</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Přidat úkol</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Zrušit</Button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {sortedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Zatím nebyly přidány žádné úkoly
          </p>
        ) : (
          sortedTasks.map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const assigneeName = getAssigneeName(task.assigned_to);
            
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border bg-card transition-opacity',
                  task.status === 'done' && 'opacity-60'
                )}
              >
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="mt-0.5 shrink-0"
                >
                  {STATUS_ICONS[task.status]}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    task.status === 'done' && 'line-through text-muted-foreground'
                  )}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={`${priorityConfig.color} text-xs`}>
                      {priorityConfig.label}
                    </Badge>
                    {assigneeName && (
                      <Badge variant="outline" className="text-xs">
                        {assigneeName}
                      </Badge>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(task.due_date), 'd.M.yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
