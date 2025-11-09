import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentCard } from '@/components/ui/content-card';
import { useUIStore } from '@/stores/useUIStore';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Tab {
  value: string;
  label: string;
  content: ReactNode;
  description?: string;
  hidden?: boolean;
  contentCardTitle?: string;
  contentCardIcon?: LucideIcon;
  contentCardActions?: ReactNode;
}

interface TabCardProps {
  title: string;
  icon: LucideIcon;
  tabs: Tab[];
  defaultTab?: string;
  pageKey?: string; // Key to identify this page for tab persistence
}

export function TabCard({ title, icon: Icon, tabs, defaultTab, pageKey }: TabCardProps) {
  const visibleTabs = tabs.filter(tab => !tab.hidden);
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const currentRoute = useUIStore((state) => state.currentRoute);

  // Use stored tab if available and valid, otherwise use defaultTab or first visible tab
  const key = pageKey || currentRoute;
  const storedTab = activeTab[key];
  const isStoredTabValid = storedTab && visibleTabs.some(tab => tab.value === storedTab);
  const initialTab = isStoredTabValid ? storedTab : (defaultTab || visibleTabs[0]?.value);

  // Calculate grid columns based on number of visible tabs
  const getGridCols = () => {
    const count = visibleTabs.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const handleTabChange = (value: string) => {
    setActiveTab(key, value);
  };

  return (
    <Card className="page-card">
      <CardHeader>
        <CardTitle className="card-title-with-icon">
          <Icon className="icon-sm" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="page-card-content">
        <Tabs value={initialTab} onValueChange={handleTabChange} className="tab-container">
          <TabsList className={`grid w-full ${getGridCols()}`}>
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {visibleTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="tab-content">
              <div className="flex flex-col h-full gap-4">
                {tab.description && (
                  <p className="step-description flex-shrink-0">{tab.description}</p>
                )}
                <div className="flex-1 min-h-0 flex flex-col">
                  {tab.contentCardTitle ? (
                    <ContentCard
                      icon={tab.contentCardIcon}
                      title={tab.contentCardTitle}
                      actions={tab.contentCardActions}
                    >
                      {tab.content}
                    </ContentCard>
                  ) : (
                    tab.content
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
