import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Eye, Wrench, Cpu } from 'lucide-react';
import { modelsService } from '@/services/models.service';
import type { ParsedModel, Capability } from '@/types/models.types';

interface ModelCardProps {
  model: ParsedModel;
}

const CAPABILITY_ICONS = {
  chat: MessageSquare,
  vision: Eye,
  'tool-call': Wrench,
  code: Cpu,
};

export function ModelCard({ model }: ModelCardProps) {
  const getUniqueCapabilities = (capabilities: Capability[]) => {
    const uniqueDisplays = new Map();

    capabilities.forEach((cap) => {
      const display = modelsService.getCapabilityDisplay(cap);
      if (display && !uniqueDisplays.has(display.label)) {
        uniqueDisplays.set(display.label, display);
      }
    });

    return Array.from(uniqueDisplays.values());
  };

  const capabilities = getUniqueCapabilities(model.capabilities);

  return (
    <Card className="models-card">
      <CardHeader>
        <CardTitle className="models-card-title">{model.name}</CardTitle>
        <CardDescription className="models-card-description">{model.description}</CardDescription>
      </CardHeader>
      <CardContent className="models-card-content">
        <div className="models-card-capabilities">
          {capabilities.map((display) => {
            const Icon = CAPABILITY_ICONS[display.label as keyof typeof CAPABILITY_ICONS];
            return (
              <Badge key={display.label} variant="outline" className="models-capability-badge">
                {Icon && <Icon className={`icon-xs ${display.color}`} />}
                <span className="models-capability-label">{display.label}</span>
              </Badge>
            );
          })}
        </div>

        <div className="models-card-provider">
          <p className="models-card-provider-text">via {model.provider}</p>
        </div>
      </CardContent>
    </Card>
  );
}
