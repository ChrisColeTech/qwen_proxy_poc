import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export function NextStepsSection() {
  const steps = [
    {
      text: 'Explore the ',
      emphasis: 'Providers',
      rest: ' page to add, configure, and test different AI backends',
    },
    {
      text: 'Check the ',
      emphasis: 'Models',
      rest: ' page to see all available models and their capabilities',
    },
    {
      text: 'View the ',
      emphasis: 'Activity',
      rest: ' page to monitor requests, responses, and provider performance',
    },
    {
      text: 'Visit the ',
      emphasis: 'Settings',
      rest: ' page to customize server configuration and behavior',
    },
  ];

  return (
    <Card className="next-steps-card">
      <CardHeader>
        <CardTitle className="next-steps-title">
          <Settings className="h-4 w-4" />
          Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="next-steps-list">
        {steps.map((step, index) => (
          <div key={index} className="next-steps-item">
            <div className="next-steps-bullet" />
            <div className="next-steps-text">
              {step.text}
              <span className="next-steps-emphasis">{step.emphasis}</span>
              {step.rest}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
