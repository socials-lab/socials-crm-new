import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

export interface Recipient {
  contact_id: string;
  contact_name: string;
  email: string;
  company: string;
  client_id: string;
}

interface RecipientSelectorProps {
  recipients: Recipient[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function RecipientSelector({ recipients, selected, onSelectionChange }: RecipientSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return recipients;
    const query = search.toLowerCase();
    return recipients.filter((recipient) =>
      recipient.contact_name.toLowerCase().includes(query) ||
      recipient.email.toLowerCase().includes(query) ||
      recipient.company.toLowerCase().includes(query),
    );
  }, [recipients, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { company: string; contacts: Recipient[] }>();
    for (const recipient of filtered) {
      if (!map.has(recipient.client_id)) {
        map.set(recipient.client_id, { company: recipient.company, contacts: [] });
      }
      map.get(recipient.client_id)!.contacts.push(recipient);
    }
    return Array.from(map.values()).sort((a, b) => a.company.localeCompare(b.company));
  }, [filtered]);

  const allFilteredIds = filtered.map((recipient) => recipient.contact_id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.includes(id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hledat kontakt nebo firmu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onSelectionChange(
              allSelected
                ? selected.filter((id) => !allFilteredIds.includes(id))
                : [...new Set([...selected, ...allFilteredIds])],
            )
          }
        >
          {allSelected ? 'Zrušit vše' : 'Vybrat vše'}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Vybráno: {selected.length} / {recipients.length} příjemců
      </div>

      <ScrollArea className="h-[300px] border rounded-md p-3">
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Žádné kontakty nenalezeny</p>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.company}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {group.company}
                </p>
                <div className="space-y-1.5">
                  {group.contacts.map((recipient) => (
                    <label
                      key={recipient.contact_id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1"
                    >
                      <Checkbox
                        checked={selected.includes(recipient.contact_id)}
                        onCheckedChange={(checked) => {
                          onSelectionChange(
                            checked
                              ? [...selected, recipient.contact_id]
                              : selected.filter((id) => id !== recipient.contact_id),
                          );
                        }}
                      />
                      <span className="text-sm">{recipient.contact_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{recipient.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
