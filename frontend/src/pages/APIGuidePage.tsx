import { useProxyStatus } from '@/hooks/useProxyStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Terminal, CheckCircle, AlertCircle } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { pythonExample, nodeExample, curlExample, healthCheckExample, commonIssues, supportedEndpoints } from '@/lib/api-guide-examples';
import type { GuidePageProps } from '@/types/quick-guide.types';

export function APIGuidePage({}: GuidePageProps) {
  useProxyStatus();

  return (
    <div className="page-container">
      <Card>
        <CardHeader>
          <CardTitle className="card-title-with-icon">
            <Code className="icon-sm" />
            API Integration - Use with Your Existing Code
          </CardTitle>
        </CardHeader>
        <CardContent className="vspace-md">
          <div className="quick-reference-grid">
            <div className="quick-reference-section">
              <div className="quick-reference-title">Base URL</div>
              <div className="quick-reference-list">
                <div className="quick-reference-item">http://localhost:3001/v1</div>
              </div>
            </div>
            <div className="quick-reference-section">
              <div className="quick-reference-title">API Key</div>
              <div className="quick-reference-list">
                <div className="quick-reference-item">Any value (not validated)</div>
              </div>
            </div>
          </div>

          <p className="step-description">
            The proxy provides an OpenAI-compatible API. Authentication happens through stored Qwen credentials,
            so you can use any string as the API key.
          </p>

          <div className="demo-container">
            <div className="demo-header">
              <div className="demo-label">
                <Code className="icon-sm-muted" />
                <span className="demo-label-text">Python (OpenAI SDK)</span>
              </div>
              <Badge variant="secondary">Most Popular</Badge>
            </div>
            <CodeBlock label="Basic Chat Completion" code={pythonExample} />
          </div>

          <div className="demo-container">
            <div className="demo-header">
              <div className="demo-label">
                <Code className="icon-sm-muted" />
                <span className="demo-label-text">Node.js (OpenAI SDK)</span>
              </div>
            </div>
            <CodeBlock label="ES Modules" code={nodeExample} />
          </div>

          <div className="demo-container">
            <div className="demo-header">
              <div className="demo-label">
                <Terminal className="icon-sm-muted" />
                <span className="demo-label-text">cURL (Direct HTTP)</span>
              </div>
            </div>
            <CodeBlock label="Command Line" code={curlExample} />
          </div>

          <div className="demo-container">
            <div className="demo-header">
              <div className="demo-label">
                <CheckCircle className="icon-sm-muted" />
                <span className="demo-label-text">Supported Endpoints</span>
              </div>
            </div>
            <div className="guide-step-list">
              {supportedEndpoints.map((item, i) => (
                <div key={i} className="guide-step-item">
                  <CheckCircle className="guide-step-icon" />
                  <div className="guide-step-text">
                    <span className="step-inline-code">{item.endpoint}</span> - {item.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="demo-container">
            <div className="demo-header">
              <div className="demo-label">
                <AlertCircle className="icon-sm-muted" />
                <span className="demo-label-text">Common Issues</span>
              </div>
            </div>
            <div className="guide-issues-list">
              {commonIssues.map((issue, i) => (
                <div key={i} className="demo-error-state">
                  <AlertCircle className="guide-alert-icon" />
                  <span>{issue.error} → {issue.solution}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="demo-container">
            <div className="demo-header">
              <div className="demo-label">
                <Terminal className="icon-sm-muted" />
                <span className="demo-label-text">Test Your Setup</span>
              </div>
            </div>
            <CodeBlock label="Quick Health Check" code={healthCheckExample} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
