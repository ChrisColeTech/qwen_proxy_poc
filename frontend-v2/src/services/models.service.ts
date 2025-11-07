import type { Model, ParsedModel, Capability } from '@/types/models.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ModelsService {
  async getModels(): Promise<Model[]> {
    const response = await fetch(`${API_BASE_URL}/api/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
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
