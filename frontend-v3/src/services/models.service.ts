import type { Model, ParsedModel, Capability } from '@/types/models.types';

const API_BASE_URL = 'http://localhost:3002';

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

class ModelsService {
  // Get all models from API server database
  async getModels(): Promise<Model[]> {
    const response = await fetch(`${API_BASE_URL}/api/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  }

  // Get available models from Provider Router (OpenAI-compatible endpoint)
  async getAvailableModels(providerRouterUrl: string): Promise<Model[]> {
    const response = await fetch(`${providerRouterUrl}/v1/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch available models: ${response.statusText}`);
    }

    const data = await response.json();
    const openaiModels: OpenAIModel[] = data.data || [];

    // Convert OpenAI format to our Model format
    return openaiModels.map((model) => ({
      id: model.id,
      name: model.id,
      description: `Available via Provider Router`,
      capabilities: '[]',
      status: 'active',
      created_at: model.created,
      updated_at: model.created
    }));
  }

  parseModel(model: Model): ParsedModel {
    let capabilities: Capability[] = [];
    try {
      capabilities = JSON.parse(model.capabilities);
    } catch {
      capabilities = [];
    }

    const providerMatch = model.description.match(/Discovered from (.+)$/);
    const provider = providerMatch ? providerMatch[1] : 'Unknown';

    return {
      id: model.id,
      name: model.name,
      description: model.description.split(' - Discovered from')[0].trim(),
      capabilities,
      provider,
    };
  }

  getCapabilityDisplay(capability: Capability) {
    if (capability === 'chat' || capability === 'completion') {
      return { label: 'chat', color: 'models-capability-chat' };
    }
    if (capability === 'vision' || capability.includes('vl')) {
      return { label: 'vision', color: 'models-capability-vision' };
    }
    if (capability === 'tools' || capability === 'tool-call') {
      return { label: 'tool-call', color: 'models-capability-tools' };
    }
    if (capability === 'code') {
      return { label: 'code', color: 'models-capability-code' };
    }
    return null;
  }
}

export const modelsService = new ModelsService();
