import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditFieldProps {
  value: string | number | null | undefined;
  onSave: (value: string) => void;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'url';
  options?: SelectOption[];
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  displayClassName?: string;
  emptyText?: string;
}

export function InlineEditField({
  value,
  onSave,
  type = 'text',
  options,
  placeholder,
  prefix,
  suffix,
  className,
  displayClassName,
  emptyText = 'Klikni pro přidání...',
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Sync when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value ?? ''));
    }
  }, [value, isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    const original = String(value ?? '').trim();
    if (trimmed !== original) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ''));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Select variant
  if (type === 'select' && options) {
    const selectedOption = options.find(o => o.value === String(value ?? ''));
    return (
      <Select
        value={String(value ?? '')}
        onValueChange={(v) => onSave(v)}
      >
        <SelectTrigger className={cn("h-7 w-auto text-sm border-dashed", className)}>
          <SelectValue placeholder={placeholder || emptyText} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Display mode
  if (!isEditing) {
    const displayValue = String(value ?? '');
    const isEmpty = !displayValue;

    return (
      <span
        onClick={() => setIsEditing(true)}
        className={cn(
          "inline-flex items-center gap-1 cursor-pointer group/edit rounded px-1 -mx-1 py-0.5 transition-colors",
          "hover:bg-muted/60",
          "border-b border-dashed border-transparent hover:border-muted-foreground/30",
          isEmpty && "text-muted-foreground/50 italic",
          displayClassName,
          className,
        )}
        title="Klikni pro úpravu"
      >
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        {isEmpty ? emptyText : displayValue}
        {suffix && !isEmpty && <span className="text-muted-foreground text-xs">{suffix}</span>}
        <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover/edit:text-muted-foreground/60 transition-colors" />
      </span>
    );
  }

  // Edit mode
  if (type === 'textarea') {
    return (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
        placeholder={placeholder}
        className={cn("min-h-[60px] text-sm", className)}
        rows={3}
      />
    );
  }

  return (
    <Input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type === 'number' ? 'number' : type === 'url' ? 'url' : 'text'}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn("h-7 text-sm", className)}
    />
  );
}
