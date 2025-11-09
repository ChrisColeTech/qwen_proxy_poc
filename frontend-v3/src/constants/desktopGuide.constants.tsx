import { Monitor, Zap, Shield, Clock, ArrowRight } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';

export const DESKTOP_GUIDE_TABS = {
  GUIDE: {
    value: 'guide',
    label: 'Quick Start Guide',
    description: 'Faster native authentication with Electron'
  },
  API_EXAMPLES: {
    value: 'api-examples',
    label: 'API Examples',
    description: 'Code examples for using the proxy'
  }
} as const;

export const DESKTOP_GUIDE_TITLE = 'Desktop Quick Start';
export const DESKTOP_GUIDE_ICON = Monitor;

// All Steps Combined in One Tab
export const buildDesktopGuideContent = () => {
  return (
    <ContentCard icon={Monitor} title="Desktop Quick Start Guide">
      <div className="vspace-md p-6">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold">The Recommended Approach</h3>
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Recommended</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Native Electron integration provides instant credential extraction without browser extensions.
            Faster, more secure, and simpler to use—authentication happens directly in a secure window.
          </p>
        </div>

        <div className="divider-horizontal" />

        {/* Benefits Section */}
        <div className="py-6">
          <div className="mb-4">
            <h4 className="text-base font-semibold mb-2">Why Choose Desktop?</h4>
            <p className="text-sm text-muted-foreground">
              Built-in advantages that make development smoother and more secure.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h5 className="font-semibold text-sm">No Extension</h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Native Electron integration means no Chrome extension installation or management needed.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Clock className="h-5 w-5" />
                </div>
                <h5 className="font-semibold text-sm">Instant Extraction</h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Credentials are captured immediately with no polling delay or waiting period.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <Shield className="h-5 w-5" />
                </div>
                <h5 className="font-semibold text-sm">More Secure</h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Credentials never leave the Electron process—everything stays local and encrypted.
              </p>
            </div>
          </div>
        </div>

        <div className="divider-horizontal" />

        {/* Authentication Steps */}
        <div className="py-6">
          <div className="mb-6">
            <h4 className="text-base font-semibold mb-2">Quick Setup</h4>
            <p className="text-sm text-muted-foreground">
              Get up and running in under 60 seconds with these simple steps.
            </p>
          </div>

          <div className="space-y-4 pl-4 border-l-2 border-primary/30">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium mb-1">Click <strong>Connect to Qwen</strong> on the dashboard</p>
                <p className="text-xs text-muted-foreground">Opens a secure Electron window for authentication</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium mb-1">Log in to <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">chat.qwen.ai</code></p>
                <p className="text-xs text-muted-foreground">Use your existing Qwen account credentials</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-500 font-semibold text-sm flex-shrink-0">
                ✓
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium mb-1">Done! Window closes automatically</p>
                <p className="text-xs text-muted-foreground">Credentials are saved instantly and securely</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Next: Start Building</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Click</span>
                    <code className="px-2 py-0.5 rounded bg-background text-xs font-mono">Start Proxy</code>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Point your app to</span>
                    <code className="px-2 py-1 rounded bg-background text-xs font-mono">http://localhost:3001</code>
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
