import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supportedEndpoints } from '@/lib/api-guide-examples';
import { EndpointItem } from './EndpointItem';

export function SupportedEndpointsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="h-4 w-4" />
          OpenAI-Compatible Endpoints
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {supportedEndpoints.map((item, i) => (
            <EndpointItem
              key={i}
              endpoint={item.endpoint}
              description={item.description}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
