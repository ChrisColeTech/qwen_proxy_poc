import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import type { ModelsStepProps } from '@/types/quick-guide.types';
import { CodeBlock } from './CodeBlock';

export function ModelsStep({ models, loading, onRefresh, providerRouterUrl }: ModelsStepProps) {
  return (
    <Card>
      <CardHeader>
        <div className="step-card-header-row">
          <CardTitle className="step-card-title">
            <div className="step-number-badge">1</div>
            Get Available Models
          </CardTitle>
          <Button
            onClick={onRefresh}
            disabled={loading}
            size="icon"
            variant="outline"
            title="Refresh models"
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="step-description">
          The Provider Router exposes an OpenAI-compatible endpoint at{' '}
          <code className="step-inline-code">http://localhost:3001/v1</code>.
          First, check which models are available:
        </p>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <Database className="h-4 w-4 text-primary" />
              <span className="demo-label-text">Available Models</span>
            </div>
            {loading && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </Badge>
            )}
            {!loading && models.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 status-icon-success" />
                {models.length} models
              </Badge>
            )}
          </div>
          {models.length > 0 && (
            <div className="model-list-container">
              {models.map((model) => (
                <div key={model.id} className="model-item">
                  <code className="model-item-code">{model.id}</code>
                  <Badge variant="outline" className="text-xs">Ready</Badge>
                </div>
              ))}
            </div>
          )}
          {!loading && models.length === 0 && (
            <div className="demo-error-state">
              <XCircle className="h-4 w-4" />
              <span>No models available. Make sure the Provider Router is running.</span>
            </div>
          )}
        </div>

        <CodeBlock
          label="Try it yourself:"
          code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/models \\
  -H "Authorization: Bearer any-key"`}
        />
      </CardContent>
    </Card>
  );
}
