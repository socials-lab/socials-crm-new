import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Engagement } from '@/types/crm';

interface EndEngagementDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (endDate: string) => void;
}

export function EndEngagementDialog({
  engagement,
  open,
  onOpenChange,
  onConfirm,
}: EndEngagementDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    engagement?.end_date ? new Date(engagement.end_date) : undefined
  );

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate.toISOString().split('T')[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ukončit spolupráci</DialogTitle>
          <DialogDescription>
            Vyberte datum, ke kterému bude zakázka "{engagement?.name}" ukončena.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "d. MMMM yyyy", { locale: cs })
                ) : (
                  <span>Vyberte datum ukončení</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={cs}
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedDate}>
            Potvrdit ukončení
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
