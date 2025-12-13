import { useState, useMemo } from 'react';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useCRMData } from '@/hooks/useCRMData';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface AddClientToMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
}

export function AddClientToMonthDialog({ open, onOpenChange, year, month }: AddClientToMonthDialogProps) {
  const { getAvailableClientsForMonth, addClientToMonth, clients } = useCreativeBoostData();
  const { getClientById } = useCRMData();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [minCredits, setMinCredits] = useState<number>(30);
  const [maxCredits, setMaxCredits] = useState<number>(50);
  const [pricePerCredit, setPricePerCredit] = useState<number>(1500);

  const availableClients = useMemo(() => {
    return getAvailableClientsForMonth(year, month);
  }, [getAvailableClientsForMonth, year, month]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.clientId === clientId);
    if (client) {
      setMinCredits(client.defaultMinCredits);
      setMaxCredits(client.defaultMaxCredits);
      setPricePerCredit(client.defaultPricePerCredit);
    }
  };

  const handleSubmit = () => {
    if (!selectedClientId) {
      toast.error('Vyberte klienta');
      return;
    }

    addClientToMonth(selectedClientId, year, month, {
      minCredits,
      maxCredits,
      pricePerCredit,
    });

    const clientData = getClientById(selectedClientId);
    toast.success(`${clientData?.brand_name ?? 'Klient'} byl přidán do měsíce`);
    
    // Reset form
    setSelectedClientId('');
    setMinCredits(30);
    setMaxCredits(50);
    setPricePerCredit(1500);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat klienta do měsíce</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Klient</Label>
            <Select value={selectedClientId} onValueChange={handleClientSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte klienta..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {availableClients.length === 0 ? (
                  <SelectItem value="" disabled>Všichni klienti jsou již přidáni</SelectItem>
                ) : (
                  availableClients.map((client) => {
                    const clientData = getClientById(client.clientId);
                    return (
                      <SelectItem key={client.clientId} value={client.clientId}>
                        {clientData?.brand_name ?? client.clientId}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min. kredity</Label>
              <Input
                type="number"
                min="0"
                value={minCredits}
                onChange={(e) => setMinCredits(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max. kredity</Label>
              <Input
                type="number"
                min="0"
                value={maxCredits}
                onChange={(e) => setMaxCredits(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cena za kredit (Kč)</Label>
            <Input
              type="number"
              min="0"
              value={pricePerCredit}
              onChange={(e) => setPricePerCredit(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedClientId}>
            Přidat klienta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}