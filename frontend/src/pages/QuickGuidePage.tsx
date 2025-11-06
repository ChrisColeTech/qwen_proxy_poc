import { BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api.service';
import { API_BASE_URL } from '@/lib/constants';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { Provider, Model } from '@/types/quick-guide.types';
import { ModelsStep } from '@/components/features/quick-guide/ModelsStep';
import { ChatCompletionStep } from '@/components/features/quick-guide/ChatCompletionStep';
import { ProviderSwitchStep } from '@/components/features/quick-guide/ProviderSwitchStep';
import { NextStepsSection } from '@/components/features/quick-guide/NextStepsSection';
import { QuickReferenceSection } from '@/components/features/quick-guide/QuickReferenceSection';

export function QuickGuidePage() {
  const { providerRouterUrl, settings, fetchSettings } = useSettingsStore();
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [testResponse, setTestResponse] = useState<string>('');
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
    loadProviders();
  }, [fetchSettings]);

  useEffect(() => {
    if (providerRouterUrl) {
      loadModels();
    }
  }, [providerRouterUrl]);

  useEffect(() => {
    if (settings.active_provider) {
      setActiveProvider(settings.active_provider as string);
    }
  }, [settings.active_provider]);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const result = await apiService.getProviders();
      if (result.success && result.data) {
        setProviders(result.data);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadModels = async () => {
    if (!providerRouterUrl) return;
    setLoadingModels(true);
    try {
      const response = await fetch(`${providerRouterUrl}/v1/models`);
      const data = await response.json();
      if (data.data) {
        setModels(data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTestChat = async () => {
    if (!providerRouterUrl) return;
    setLoadingTest(true);
    setTestResponse('');
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Say hello in one sentence' }]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setTestResponse(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('Failed to test chat:', error);
      setTestResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoadingTest(false);
    }
  };

  const handleSwitchProvider = async (providerId: string) => {
    try {
      await apiService.updateSetting('active_provider', providerId);
      setActiveProvider(providerId);
      setTestResponse('');
    } catch (error) {
      console.error('Failed to switch provider:', error);
    }
  };

  return (
    <div className="quick-guide-container">
      <div className="quick-guide-header">
        <h1 className="quick-guide-title">
          <BookOpen className="h-8 w-8 text-primary" />
          Quick Start Guide
        </h1>
        <p className="quick-guide-subtitle">
          Learn how to use the Provider Router with interactive examples
        </p>
      </div>

      <ModelsStep
        models={models}
        loading={loadingModels}
        onRefresh={loadModels}
        providerRouterUrl={providerRouterUrl}
      />

      <ChatCompletionStep
        response={testResponse}
        loading={loadingTest}
        onTest={handleTestChat}
        providerRouterUrl={providerRouterUrl}
      />

      <ProviderSwitchStep
        providers={providers}
        activeProvider={activeProvider}
        loading={loadingProviders}
        onSwitch={handleSwitchProvider}
        apiBaseUrl={API_BASE_URL}
      />

      <NextStepsSection />

      <QuickReferenceSection />
    </div>
  );
}
