import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  titleAccent?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, titleAccent, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
          {title}
          {titleAccent && (
            <span className="font-serif italic text-primary"> {titleAccent}</span>
          )}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {actions}
        </div>
      )}
    </div>
  );
}