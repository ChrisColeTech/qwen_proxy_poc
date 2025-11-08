import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ActionListItem {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionListProps {
  title?: string;
  icon?: LucideIcon;
  items: ActionListItem[];
}

export function ActionList({ title, icon: Icon, items }: ActionListProps) {
  const visibleItems = items.filter(item => !item.hidden);

  return (
    <div className="demo-container">
      {title && (
        <div className="demo-header">
          <div className="demo-label">
            {Icon && <Icon className="icon-primary" />}
            <span className="demo-label-text">{title}</span>
          </div>
        </div>
      )}

      <div className="provider-switch-list">
        {visibleItems.map((item, index) => (
          <div
            key={index}
            className="provider-switch-item"
            onClick={item.disabled ? undefined : item.onClick}
            style={{ cursor: item.disabled ? 'not-allowed' : item.onClick ? 'pointer' : 'default' }}
          >
            <div className="provider-switch-info">
              {item.icon}
              <div className="provider-switch-details">
                <div className="provider-switch-name">{item.title}</div>
                <div className="provider-switch-type">{item.description}</div>
              </div>
            </div>
            {item.actions && (
              <div className="provider-switch-actions">
                {item.actions}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
