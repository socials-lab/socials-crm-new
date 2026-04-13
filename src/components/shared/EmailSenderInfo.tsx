import { Mail, User } from 'lucide-react';

interface SenderLike {
  full_name?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface EmailSenderInfoProps {
  colleague: SenderLike | null | undefined;
}

export function EmailSenderInfo({ colleague }: EmailSenderInfoProps) {
  if (!colleague) return null;

  return (
    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <div className="flex items-center gap-1.5">
        <User className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">{colleague.full_name || 'Neznámý odesílatel'}</span>
        {colleague.position ? (
          <span className="text-muted-foreground">– {colleague.position}</span>
        ) : null}
      </div>
      {colleague.email ? (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          <span className="text-xs">{colleague.email}</span>
        </div>
      ) : null}
      {colleague.phone ? (
        <div className="text-muted-foreground text-xs">{colleague.phone}</div>
      ) : null}
    </div>
  );
}

