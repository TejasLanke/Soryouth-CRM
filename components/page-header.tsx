import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-primary" />}
          <h1 className="text-3xl font-bold tracking-tight font-headline">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {description && (
        typeof description === 'string' ?
        <p className="mt-2 text-muted-foreground">{description}</p> :
        <div className="mt-2 text-muted-foreground">{description}</div>
      )}
    </div>
  );
}
