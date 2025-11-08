import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { BrowserGuideStep } from '@/components/features/quick-guide/BrowserGuideStep';
import { DesktopGuideStep } from '@/components/features/quick-guide/DesktopGuideStep';
import { ProviderSwitchStep } from '@/components/features/quick-guide/ProviderSwitchStep';
import { ModelsStep } from '@/components/features/quick-guide/ModelsStep';
import { ChatCompletionStep } from '@/components/features/quick-guide/ChatCompletionStep';
import { QuickGuideSuccess } from '@/components/features/quick-guide/QuickGuideSuccess';
import { useProviders } from '@/hooks/useProviders';
import { useModels } from '@/hooks/useModels';
import { useChatTest } from '@/hooks/useChatTest';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
const PROVIDER_ROUTER_URL = import.meta.env.VITE_PROVIDER_ROUTER_URL || 'http://localhost:3001';

export function QuickGuidePage() {
  const { providers, loading: providersLoading } = useProviders();
  const { models, loading: modelsLoading, refresh: refreshModels } = useModels();
  const { testing, testChat } = useChatTest();

  const [activeModel, setActiveModel] = useState<string>('qwen3-max');
  const [chatResponse, setChatResponse] = useState<string>('');

  const activeProvider = providers.find(p => p.enabled)?.id || providers[0]?.id || '';

  const handleTestChat = async () => {
    setChatResponse('');
    const result = await testChat(activeModel);
    if (result.success && result.response) {
      const message = result.response.choices[0]?.message?.content || 'No response';
      setChatResponse(message);
    } else {
      setChatResponse(`Error: ${result.error || 'Unknown error'}`);
    }
  };

  const handleSwitchProvider = async (providerId: string) => {
    console.log('Switch provider to:', providerId);
    refreshModels();
  };

  return (
    <div className="quick-guide-container">
      <div className="quick-guide-header">
        <div className="quick-guide-title-row">
          <BookOpen className="icon-lg" />
          <h1 className="quick-guide-title">Quick Start Guide</h1>
        </div>
        <p className="quick-guide-description">
          Get up and running with Qwen Proxy in minutes. Follow the steps below to authenticate,
          configure providers, and test API requests.
        </p>
      </div>

      <div className="quick-guide-steps">
        <div>
          <div className="quick-guide-step-header">
            <h2 className="quick-guide-step-title">Step 1: Authenticate with Qwen</h2>
            <p className="quick-guide-step-description">
              Choose your authentication method based on your environment
            </p>
          </div>
          <div className="quick-guide-step-cards">
            <DesktopGuideStep />
            <BrowserGuideStep />
          </div>
        </div>

        <div>
          <div className="quick-guide-step-header">
            <h2 className="quick-guide-step-title">Step 2: Configure Provider</h2>
            <p className="quick-guide-step-description">
              Switch between different AI providers dynamically
            </p>
          </div>
          <ProviderSwitchStep
            providers={providers}
            activeProvider={activeProvider}
            loading={providersLoading}
            onSwitch={handleSwitchProvider}
            apiBaseUrl={API_BASE_URL}
          />
        </div>

        <div>
          <div className="quick-guide-step-header">
            <h2 className="quick-guide-step-title">Step 3: Browse Available Models</h2>
            <p className="quick-guide-step-description">
              View and select models from your active provider
            </p>
          </div>
          <ModelsStep
            models={models}
            loading={modelsLoading}
            onRefresh={refreshModels}
            providerRouterUrl={PROVIDER_ROUTER_URL}
            activeModel={activeModel}
            onSelectModel={setActiveModel}
          />
        </div>

        <div>
          <div className="quick-guide-step-header">
            <h2 className="quick-guide-step-title">Step 4: Test Chat Completion</h2>
            <p className="quick-guide-step-description">
              Send a test request to verify everything is working
            </p>
          </div>
          <ChatCompletionStep
            response={chatResponse}
            loading={testing}
            onTest={handleTestChat}
            providerRouterUrl={PROVIDER_ROUTER_URL}
            activeModel={activeModel}
          />
        </div>

        {chatResponse && !testing && !chatResponse.startsWith('Error:') && (
          <QuickGuideSuccess providerRouterUrl={PROVIDER_ROUTER_URL} />
        )}
      </div>
    </div>
  );
}
