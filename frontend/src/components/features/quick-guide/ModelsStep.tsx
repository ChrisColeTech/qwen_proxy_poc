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
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          Available Models
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CodeBlock
          label="Try it yourself:"
          code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/models \\
  -H "Authorization: Bearer any-key"`}
        />

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
            <div className="flex items-center gap-2">
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
              <Button
                onClick={onRefresh}
                disabled={loading}
                size="icon"
                variant="outline"
                title="Refresh models"
                className="h-7 w-7"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
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
      </CardContent>
    </Card>
  );
}
