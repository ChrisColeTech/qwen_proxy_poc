import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ContentCardProps {
  icon?: LucideIcon;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ContentCard({ icon: Icon, title, actions, children }: ContentCardProps) {
  return (
    <div className="demo-container flex-1 flex flex-col overflow-hidden">
      <div className="demo-header">
        <div className="demo-label">
          {Icon && <Icon className="icon-primary" />}
          <span className="demo-label-text">{title}</span>
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
