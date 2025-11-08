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
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {title && (
        <div className="demo-header" style={{ flexShrink: 0 }}>
          <div className="demo-label">
            {Icon && <Icon className="icon-primary" />}
            <span className="demo-label-text">{title}</span>
          </div>
        </div>
      )}

      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
