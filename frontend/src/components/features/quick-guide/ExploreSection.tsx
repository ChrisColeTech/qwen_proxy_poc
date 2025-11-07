import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Database, Zap, ArrowRight, Compass } from 'lucide-react';

interface ExploreSectionProps {
  onNavigate: (route: string) => void;
}

export function ExploreSection({ onNavigate }: ExploreSectionProps) {
  const features = [
    {
      icon: Network,
      title: 'Manage Providers',
      description: 'Switch between AI backends (Qwen, LM Studio, etc.) without restarting',
      route: '/providers',
      color: 'text-blue-500'
    },
    {
      icon: Database,
      title: 'Explore Models',
      description: 'View all available models from your active provider in real-time',
      route: '/models',
      color: 'text-purple-500'
    },
    {
      icon: Zap,
      title: 'Test Chat API',
      description: 'Interactive testing interface for chat completions with instant results',
      route: '/chat',
      color: 'text-green-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="h-4 w-4" />
          What You Can Do
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.route}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => onNavigate(feature.route)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
