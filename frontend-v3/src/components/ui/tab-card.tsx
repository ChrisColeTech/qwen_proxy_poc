import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentCard } from '@/components/ui/content-card';
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
  gridCols?: 'grid-cols-2' | 'grid-cols-3' | 'grid-cols-4';
}

export function TabCard({ title, icon: Icon, tabs, defaultTab, gridCols = 'grid-cols-3' }: TabCardProps) {
  const visibleTabs = tabs.filter(tab => !tab.hidden);

  return (
    <Card className="page-card">
      <CardHeader>
        <CardTitle className="card-title-with-icon">
          <Icon className="icon-sm" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="page-card-content">
        <Tabs defaultValue={defaultTab || visibleTabs[0]?.value} className="tab-container">
          <TabsList className={`grid w-full ${gridCols}`}>
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
