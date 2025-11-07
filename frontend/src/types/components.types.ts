/**
 * Component Props Type Definitions
 * Centralized type definitions for component props
 */

import type { Model } from './proxy.types';

export interface ChatTestCardProps {
  providerRouterUrl: string;
  activeModel?: string;
}

export interface ModelsCardProps {
  models: Array<{
    id: string;
    name?: string;
    providerId?: string;
  }>;
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}

export interface QuickTestTabProps {
  providerRouterUrl: string;
  model: string;
}

export interface CustomChatTabProps {
  providerRouterUrl: string;
  model: string;
}

export interface CurlTabProps {
  providerRouterUrl: string;
  model: string;
}

export interface ThinkingSectionProps {
  thinking: string;
}

export interface ResponseSectionProps {
  mainResponse: string;
  loading: boolean;
}

export interface BrowseModelsTabProps {
  models: Model[];
  loading: boolean;
  onRefresh: () => void;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}

export interface ModelsCurlTabProps {
  providerRouterUrl: string;
}
