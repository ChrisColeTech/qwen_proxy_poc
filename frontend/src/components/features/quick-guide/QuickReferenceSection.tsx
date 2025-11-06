import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function QuickReferenceSection() {
  const endpoints = [
    'Provider Router: :3001',
    'API Server: :3002',
    'Qwen Proxy: :3000',
  ];

  const paths = [
    '/v1/models',
    '/v1/chat/completions',
    '/v1/providers',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="next-steps-title">
          <BookOpen className="h-4 w-4" />
          Quick Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="quick-reference-grid">
          <div className="quick-reference-section">
            <div className="quick-reference-title">Endpoints</div>
            <div className="quick-reference-list">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="quick-reference-item">{endpoint}</div>
              ))}
            </div>
          </div>
          <div className="quick-reference-section">
            <div className="quick-reference-title">Key Paths</div>
            <div className="quick-reference-list">
              {paths.map((path, index) => (
                <div key={index} className="quick-reference-item">{path}</div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
