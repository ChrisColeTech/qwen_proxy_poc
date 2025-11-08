import { Activity, Server, Key, Play, Square, LogIn, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useHomePage } from '@/hooks/useHomePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { ConnectionStatusBadge } from '@/components/features/home/ConnectionStatusBadge';
import { formatUptime, formatExpiryDate } from '@/utils/formatters';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';

export function HomePage() {
  const {
    wsProxyStatus,
    connected,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  } = useHomePage();

  const { extensionDetected, needsExtension } = useExtensionDetection();

  const running = wsProxyStatus?.providerRouter?.running || false;
  const port = wsProxyStatus?.providerRouter?.port;
  const uptime = wsProxyStatus?.providerRouter?.uptime;
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const expiresAt = wsProxyStatus?.credentials?.expiresAt;

  return (
    <div className="page-container">
      <Card>
        <CardHeader>
          <CardTitle className="card-title-with-icon-sm">
            <Activity className="icon-sm" />
            Proxy Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="tab-container">
            <TabsList className={`grid w-full ${running ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="control">Control Panel</TabsTrigger>
              {running && <TabsTrigger value="status">System Status</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="tab-content">
              <div className="vspace-md">
                <p className="step-description">
                  Real-time monitoring and quick actions for your proxy server and Qwen credentials:
                </p>

                <div className="demo-container">
                  <div className="demo-header">
                    <div className="demo-label">
                      <Gauge className="icon-primary" />
                      <span className="demo-label-text">System Overview</span>
                    </div>
                    <ConnectionStatusBadge status={connected ? 'connected' : 'disconnected'} />
                  </div>

                  <div className="provider-switch-list">
                    {/* Provider Router Status */}
                    <div className="provider-switch-item">
                      <div className="provider-switch-info">
                        <StatusIndicator status={running ? 'running' : 'stopped'} />
                        <div className="provider-switch-details">
                          <div className="provider-switch-name">Provider Router</div>
                          <div className="provider-switch-type">
                            {running ? `Port ${port} • Uptime ${uptime !== undefined ? formatUptime(uptime) : 'N/A'}` : 'Not running'}
                          </div>
                        </div>
                      </div>
                      <div className="provider-switch-actions">
                        <Badge variant={running ? 'default' : 'destructive'}>
                          {running ? 'Running' : 'Stopped'}
                        </Badge>
                      </div>
                    </div>

                    {/* Extension Status (Browser only) */}
                    {needsExtension && (
                      <div className="provider-switch-item">
                        <div className="provider-switch-info">
                          <StatusIndicator status={extensionDetected ? 'running' : 'stopped'} />
                          <div className="provider-switch-details">
                            <div className="provider-switch-name">Chrome Extension</div>
                            <div className="provider-switch-type">
                              {extensionDetected ? 'Ready for authentication' : 'Required for browser mode'}
                            </div>
                          </div>
                        </div>
                        <div className="provider-switch-actions">
                          <Badge variant={extensionDetected ? 'default' : 'destructive'}>
                            {extensionDetected ? 'Detected' : 'Not Detected'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Credentials Status */}
                    <div className="provider-switch-item">
                      <div className="provider-switch-info">
                        <StatusIndicator status={credentialsValid ? 'running' : 'stopped'} />
                        <div className="provider-switch-details">
                          <div className="provider-switch-name">Qwen Credentials</div>
                          <div className="provider-switch-type">
                            {credentialsValid ? `Expires ${formatExpiryDate(expiresAt ?? null)}` : 'No valid credentials'}
                          </div>
                        </div>
                      </div>
                      <div className="provider-switch-actions">
                        <Badge variant={credentialsValid ? 'default' : 'destructive'}>
                          {credentialsValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="control" className="tab-content">
              <div className="vspace-md">
                <p className="step-description">
                  Start and stop the Provider Router proxy server, and manage your Qwen authentication:
                </p>

                {/* Provider Router Controls */}
                <div className="demo-container">
                  <div className="demo-header">
                    <div className="demo-label">
                      <Server className="icon-primary" />
                      <span className="demo-label-text">Provider Router</span>
                    </div>
                    <Badge variant={running ? 'default' : 'destructive'}>
                      {running ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>

                  <div className="home-service-content">
                    <div className="home-service-row">
                      <span className="home-service-label">Port</span>
                      <span className="home-service-value">{port ?? 'N/A'}</span>
                    </div>
                    <div className="home-service-row">
                      <span className="home-service-label">Uptime</span>
                      <span className="home-service-value">
                        {uptime !== undefined ? formatUptime(uptime) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    {!running ? (
                      <Button onClick={handleStartProxy} disabled={proxyLoading} size="sm" variant="outline">
                        <Play className="icon-sm" />
                        Start Proxy
                      </Button>
                    ) : (
                      <Button onClick={handleStopProxy} disabled={proxyLoading} size="sm" variant="outline">
                        <Square className="icon-sm" />
                        Stop Proxy
                      </Button>
                    )}
                  </div>
                </div>

                {/* Qwen Credentials Controls */}
                <div className="demo-container">
                  <div className="demo-header">
                    <div className="demo-label">
                      <Key className="icon-primary" />
                      <span className="demo-label-text">Qwen Credentials</span>
                    </div>
                    <Badge variant={credentialsValid ? 'default' : 'destructive'}>
                      {credentialsValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>

                  <div className="home-service-content">
                    <div className="home-service-row">
                      <span className="home-service-label">Expires At</span>
                      <span className="home-service-value">
                        {formatExpiryDate(expiresAt ?? null)}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <Button onClick={handleQwenLogin} size="sm" variant="outline">
                      <LogIn className="icon-sm" />
                      {expiresAt ? 'Re-login to Qwen' : 'Login to Qwen'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {running && (
              <TabsContent value="status" className="tab-content">
                <div className="vspace-md">
                  <p className="step-description">
                    Test the OpenAI-compatible endpoints exposed by the Provider Router:
                  </p>

                  <CodeBlock
                    label="Check proxy health:"
                    code={`curl http://localhost:${port || 3001}/health`}
                  />

                  <CodeBlock
                    label="List available models:"
                    code={`curl http://localhost:${port || 3001}/v1/models`}
                  />

                  <CodeBlock
                    label="Send chat completion:"
                    code={`curl http://localhost:${port || 3001}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hello!"}]}'`}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
