import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { StoredModificationRequest } from '@/data/modificationRequestsMockData';
import type { 
  AddServiceProposedChanges, 
  UpdateServicePriceProposedChanges,
  ModificationProposedChanges,
} from '@/types/crm';

interface EditModificationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: StoredModificationRequest | null;
  onSave: (requestId: string, updates: {
    proposed_changes?: ModificationProposedChanges;
    effective_from?: string | null;
    note?: string | null;
    upsell_commission_percent?: number;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function EditModificationRequestDialog({
  open,
  onOpenChange,
  request,
  onSave,
  isSaving,
}: EditModificationRequestDialogProps) {
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>();
  const [note, setNote] = useState('');
  const [commission, setCommission] = useState(10);
  
  // For add_service type
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  
  // For update_service_price type
  const [newPrice, setNewPrice] = useState(0);

  useEffect(() => {
    if (request) {
      setEffectiveFrom(request.effective_from ? new Date(request.effective_from) : undefined);
      setNote(request.note || '');
      setCommission(request.upsell_commission_percent || 10);
      
      if (request.request_type === 'add_service') {
        const changes = request.proposed_changes as AddServiceProposedChanges;
        setServiceName(changes.name);
        setServicePrice(changes.price);
      } else if (request.request_type === 'update_service_price') {
        const changes = request.proposed_changes as UpdateServicePriceProposedChanges;
        setNewPrice(changes.new_price);
      }
    }
  }, [request]);

  const handleSave = async () => {
    if (!request) return;
    
    let updatedChanges: ModificationProposedChanges | undefined;
    
    if (request.request_type === 'add_service') {
      const originalChanges = request.proposed_changes as AddServiceProposedChanges;
      updatedChanges = {
        ...originalChanges,
        name: serviceName,
        price: servicePrice,
      };
    } else if (request.request_type === 'update_service_price') {
      const originalChanges = request.proposed_changes as UpdateServicePriceProposedChanges;
      updatedChanges = {
        ...originalChanges,
        new_price: newPrice,
      };
    }
    
    await onSave(request.id, {
      proposed_changes: updatedChanges,
      effective_from: effectiveFrom ? effectiveFrom.toISOString().split('T')[0] : null,
      note: note || null,
      upsell_commission_percent: commission,
    });
    
    onOpenChange(false);
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upravit požadavek na změnu</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Service name and price for add_service */}
          {request.request_type === 'add_service' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="service-name">Název služby</Label>
                <Input
                  id="service-name"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-price">Cena (Kč)</Label>
                <Input
                  id="service-price"
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(Number(e.target.value))}
                />
              </div>
            </>
          )}
          
          {/* New price for update_service_price */}
          {request.request_type === 'update_service_price' && (
            <div className="space-y-2">
              <Label htmlFor="new-price">Nová cena (Kč)</Label>
              <Input
                id="new-price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
              />
            </div>
          )}
          
          {/* Effective from date */}
          <div className="space-y-2">
            <Label>Účinnost od</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !effectiveFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveFrom ? format(effectiveFrom, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={effectiveFrom}
                  onSelect={setEffectiveFrom}
                  initialFocus
                  locale={cs}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Commission percentage */}
          <div className="space-y-2">
            <Label htmlFor="commission">Provize (%)</Label>
            <Input
              id="commission"
              type="number"
              min={0}
              max={100}
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
            />
          </div>
          
          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Poznámka</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Interní poznámka k požadavku..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Ukládám...' : 'Uložit změny'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
