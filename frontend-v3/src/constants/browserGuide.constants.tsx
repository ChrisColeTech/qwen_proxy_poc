import { Globe, Chrome, CheckCircle, ArrowRight } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';

export const BROWSER_GUIDE_TABS = {
  GUIDE: {
    value: 'guide',
    label: 'Quick Start Guide',
    description: 'Get running in 60 seconds with the Chrome extension'
  },
  API_EXAMPLES: {
    value: 'api-examples',
    label: 'API Examples',
    description: 'Code examples for using the proxy'
  }
} as const;

export const BROWSER_GUIDE_TITLE = 'Browser Quick Start';
export const BROWSER_GUIDE_ICON = Globe;

// All Steps Combined in One Tab
export const buildBrowserGuideContent = () => {
  return (
    <ContentCard icon={Globe} title="Browser Quick Start Guide">
      <div className="vspace-md p-6">
        {/* Hero Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Get Started in 3 Simple Steps</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Chrome extension automatically extracts and manages your Qwen credentials.
            No manual configuration needed—just install, authenticate, and start building.
          </p>
        </div>

        <div className="divider-horizontal" />

        {/* Step 1 */}
        <div className="py-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Chrome className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="font-mono">Step 1</Badge>
                  <h4 className="text-base font-semibold">Install Chrome Extension</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  One-time setup that takes less than a minute. The extension runs securely in the background.
                </p>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    Navigate to <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">chrome://extensions/</code> in Chrome
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    Enable <strong>Developer mode</strong> using the toggle in the top right
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    Click <strong>Load unpacked</strong> and select the <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">/extension</code> folder
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    Extension is now active—you'll see the icon in your browser toolbar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-horizontal" />

        {/* Step 2 */}
        <div className="py-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="font-mono">Step 2</Badge>
                  <h4 className="text-base font-semibold">Authenticate with Qwen</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign in to your Qwen account. The extension automatically captures your credentials securely.
                </p>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    Click the <strong>Connect to Qwen</strong> button on the dashboard
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    Log in to <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">chat.qwen.ai</code> with your account
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    Extension extracts credentials automatically—dashboard updates within 5 seconds
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-horizontal" />

        {/* Step 3 */}
        <div className="py-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-500">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="font-mono">Step 3</Badge>
                  <h4 className="text-base font-semibold">Start Proxy & Build</h4>
                  <Badge variant="secondary" className="ml-auto">Ready to Use</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You're all set! Start the proxy server and point your application to the local endpoint.
                </p>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="font-medium">Local Endpoint:</span>
                      <code className="px-2 py-1 rounded bg-background text-xs font-mono">http://localhost:3001</code>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Use this as your OpenAI API base URL. Authentication happens automatically via stored credentials.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentCard>
  );
};

