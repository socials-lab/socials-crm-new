import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailTagInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function EmailTagInput({
  value,
  onChange,
  placeholder = 'Type email and press Enter',
  disabled = false,
}: EmailTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addEmails = (raw: string) => {
    const parsed = splitEmails(raw);
    if (parsed.length === 0) return;

    const valid = parsed.filter((email) => EMAIL_REGEX.test(email));
    if (valid.length === 0) return;

    const next = [...value];
    for (const email of valid) {
      if (!next.includes(email)) {
        next.push(email);
      }
    }
    onChange(next);
  };

  const commitInput = () => {
    if (!inputValue.trim()) return;
    addEmails(inputValue);
    setInputValue('');
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter((email) => email !== emailToRemove));
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'min-h-10 w-full rounded-md border border-input bg-background px-2 py-1',
          'flex flex-wrap items-center gap-1.5',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
          disabled && 'opacity-60 pointer-events-none'
        )}
      >
        {value.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-800"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(email)}
              className="rounded-sm hover:bg-blue-100"
              aria-label={`Remove ${email}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            const next = e.target.value;
            if (next.includes(',') || next.includes(';') || next.includes('\n')) {
              addEmails(next);
              setInputValue('');
              return;
            }
            setInputValue(next);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
              e.preventDefault();
              commitInput();
            } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={commitInput}
          placeholder={value.length === 0 ? placeholder : 'Add another email'}
          className="h-7 min-w-[160px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter (or use comma) to add each email.</p>
    </div>
  );
}
