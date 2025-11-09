import { Monitor, Zap, Shield, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface DesktopGuideProps {
  credentialsValid: boolean;
  proxyRunning: boolean;
}

// All Steps Combined in One Tab
export const buildDesktopGuideContent = ({
  credentialsValid,
  proxyRunning
}: DesktopGuideProps) => {
  const step1Complete = credentialsValid;
  const step2Complete = proxyRunning;

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
          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-500"
                style={{ width: `${((step1Complete ? 1 : 0) + (step2Complete ? 1 : 0)) / 2 * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {((step1Complete ? 1 : 0) + (step2Complete ? 1 : 0))} of 2 complete
            </span>
          </div>
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

          <div className={cn("space-y-4 pl-4 border-l-2 transition-colors", step1Complete ? "border-green-500/30" : "border-primary/30")}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm flex-shrink-0 transition-all",
                step1Complete
                  ? "bg-green-500/10 text-green-600 dark:text-green-500"
                  : "bg-primary/10 text-primary"
              )}>
                {step1Complete ? <CheckCircle className="h-5 w-5" /> : "1"}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={cn("text-sm font-medium", step1Complete && "text-green-600 dark:text-green-500")}>
                    Click <strong>Connect to Qwen</strong> on the dashboard
                  </p>
                  {step1Complete && <Badge variant="default" className="bg-green-600 text-xs">Done</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Opens a secure Electron window for authentication</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm flex-shrink-0 transition-all",
                step1Complete
                  ? step2Complete
                    ? "bg-green-500/10 text-green-600 dark:text-green-500"
                    : "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {step2Complete ? <CheckCircle className="h-5 w-5" /> : "2"}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={cn(
                    "text-sm font-medium",
                    step2Complete && "text-green-600 dark:text-green-500",
                    !step1Complete && "text-muted-foreground"
                  )}>
                    Start the proxy server
                  </p>
                  {step2Complete && <Badge variant="default" className="bg-green-600 text-xs">Done</Badge>}
                  {!step1Complete && <Badge variant="secondary" className="text-xs">Locked</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Click Start Proxy and wait for Running status</p>
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
