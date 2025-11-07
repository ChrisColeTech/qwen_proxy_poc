import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Provider } from '@/types/providers.types';

interface ProvidersSummaryProps {
  providers: Provider[];
}

export function ProvidersSummary({ providers }: ProvidersSummaryProps) {
  const enabledCount = providers.filter((p) => p.enabled).length;
  const disabledCount = providers.length - enabledCount;

  return (
    <div className="providers-summary-grid">
      <Card>
        <CardHeader className="providers-summary-header">
          <CardTitle className="providers-summary-title">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="providers-summary-value">{providers.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="providers-summary-header">
          <CardTitle className="providers-summary-title">Enabled</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="providers-summary-value-enabled">{enabledCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="providers-summary-header">
          <CardTitle className="providers-summary-title">Disabled</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="providers-summary-value-disabled">{disabledCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
