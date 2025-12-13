import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface InlineEditTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function InlineEditText({ value, onChange, className, placeholder }: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onChange(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-7 px-2 text-sm", className)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer px-2 py-1 rounded hover:bg-muted/50 transition-colors min-h-[28px] flex items-center",
        className
      )}
    >
      {value || <span className="text-muted-foreground">{placeholder || '—'}</span>}
    </div>
  );
}

interface InlineEditNumberProps {
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
  suffix?: string;
  placeholder?: string;
}

export function InlineEditNumber({ value, onChange, className, suffix, placeholder }: InlineEditNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  const handleSave = () => {
    const numValue = editValue ? parseFloat(editValue) : null;
    if (numValue !== value) {
      onChange(numValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value?.toString() || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-7 px-2 text-sm", className)}
        placeholder={placeholder}
      />
    );
  }

  const formatValue = () => {
    if (value === null || value === undefined) return placeholder || '—';
    return suffix ? `${value}${suffix}` : value.toString();
  };

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer px-2 py-1 rounded hover:bg-muted/50 transition-colors min-h-[28px] flex items-center",
        className
      )}
    >
      {value !== null ? formatValue() : <span className="text-muted-foreground">{placeholder || '—'}</span>}
    </div>
  );
}

interface InlineEditSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}

export function InlineEditSelect({ value, onChange, options, className, placeholder }: InlineEditSelectProps) {
  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-7 px-2 text-sm border-transparent hover:border-border", className)}>
        <SelectValue placeholder={placeholder}>
          {selectedLabel || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
