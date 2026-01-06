import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useFeedbackData } from '@/hooks/useFeedbackData';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useNotifications } from '@/hooks/useNotifications';
import { FEEDBACK_CATEGORY_CONFIG, type FeedbackCategory } from '@/types/feedback';
import { toast } from 'sonner';

interface AddFeedbackDialogProps {
  children?: React.ReactNode;
}

export function AddFeedbackDialog({ children }: AddFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('other');
  
  const { addIdea } = useFeedbackData();
  const { colleagues } = useCRMData();
  const { colleagueId } = useUserRole();
  const { addNotification } = useNotifications();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Vyplňte prosím název a popis nápadu');
      return;
    }

    const newIdea = addIdea({ title, description, category });
    
    // Get author name for notification
    const author = colleagues.find(c => c.id === colleagueId);
    const authorName = author?.full_name || 'Někdo';
    
    // Add notification
    addNotification({
      type: 'new_feedback_idea',
      title: 'Nový nápad!',
      message: `${authorName} přidal nápad: "${title}"`,
      link: '/feedback',
      metadata: {
        colleague_id: colleagueId || undefined,
        colleague_name: authorName,
      },
    });
    
    toast.success('Nápad byl přidán');
    setTitle('');
    setDescription('');
    setCategory('other');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Přidat nápad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nový nápad na vylepšení</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Název nápadu</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stručný název vašeho nápadu"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FEEDBACK_CATEGORY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Popište svůj nápad podrobněji - jaký problém řeší, jak by mohl fungovat..."
              rows={5}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušit
            </Button>
            <Button type="submit">
              Přidat nápad
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
