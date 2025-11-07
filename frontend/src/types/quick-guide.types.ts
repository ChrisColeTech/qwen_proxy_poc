export interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export interface Model {
  id: string;
  name?: string;
}

export interface ModelsStepProps {
  models: Model[];
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
}

export interface ChatCompletionStepProps {
  response: string;
  loading: boolean;
  onTest: () => void;
  providerRouterUrl: string;
}

export interface ProviderSwitchStepProps {
  providers: Provider[];
  activeProvider: string;
  loading: boolean;
  onSwitch: (providerId: string) => void;
  apiBaseUrl: string;
}

export interface CodeBlockProps {
  label: string;
  code: string;
}

export interface GuidePageProps {
  onNavigate: (route: string) => void;
}
