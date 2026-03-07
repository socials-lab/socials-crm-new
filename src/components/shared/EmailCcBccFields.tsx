import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EmailCcBccFieldsProps {
  cc: string[];
  onCcChange: (cc: string[]) => void;
  bcc: string[];
  onBccChange: (bcc: string[]) => void;
  defaultExpanded?: boolean;
}

function EmailTagInput({
  label,
  emails,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  emails: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  function handleAdd() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Neplatný email');
      return;
    }
    if (emails.includes(trimmed)) {
      toast.error('Email už je v seznamu');
      return;
    }
    onAdd(trimmed);
    setInput('');
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {emails.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1 pr-1 font-normal text-xs">
              {email}
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="text-xs h-8"
        />
        <Button type="button" variant="outline" size="icon" className="shrink-0 h-8 w-8" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function EmailCcBccFields({
  cc,
  onCcChange,
  bcc,
  onBccChange,
  defaultExpanded = false,
}: EmailCcBccFieldsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || cc.length > 0 || bcc.length > 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        CC / BCC
        {(cc.length > 0 || bcc.length > 0) && (
          <span className="text-primary">({cc.length + bcc.length})</span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 pl-1">
          <EmailTagInput
            label="CC (kopie)"
            emails={cc}
            onAdd={(email) => onCcChange([...cc, email])}
            onRemove={(email) => onCcChange(cc.filter((item) => item !== email))}
            placeholder="Přidat CC..."
          />
          <EmailTagInput
            label="BCC (skrytá kopie)"
            emails={bcc}
            onAdd={(email) => onBccChange([...bcc, email])}
            onRemove={(email) => onBccChange(bcc.filter((item) => item !== email))}
            placeholder="Přidat BCC..."
          />
        </div>
      )}
    </div>
  );
}
