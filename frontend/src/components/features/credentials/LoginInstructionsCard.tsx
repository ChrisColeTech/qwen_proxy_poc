import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function LoginInstructionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Log In</CardTitle>
        <CardDescription>Follow these steps to authenticate with Qwen</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="credentials-instructions-list">
          <li>Click "Login to Qwen" button above</li>
          <li>Follow extension installation instructions (one-time setup)</li>
          <li>Log in at chat.qwen.ai with your Qwen account</li>
          <li>Extension captures credentials automatically</li>
        </ol>
        <div className="credentials-instructions-footer">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/yourusername/qwen-extension"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install Extension
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
