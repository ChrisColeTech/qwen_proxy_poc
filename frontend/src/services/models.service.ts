import { apiService } from './api.service';

export interface Model {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  providers?: string[];
}

export interface ModelsResponse {
  models: Model[];
  total: number;
}

export interface CreateModelRequest {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
}

export interface UpdateModelRequest {
  name?: string;
  description?: string;
  capabilities?: string[];
}

class ModelsService {
  async listModels(params?: { capability?: string; provider?: string }): Promise<ModelsResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return apiService.get<ModelsResponse>(`/api/models${queryString}`);
  }

  async getModel(id: string): Promise<{ model: Model }> {
    return apiService.get<{ model: Model }>(`/api/models/${id}`);
  }

  async createModel(data: CreateModelRequest): Promise<{ model: Model }> {
    return apiService.post<{ model: Model }>('/api/models', data);
  }

  async updateModel(id: string, data: UpdateModelRequest): Promise<{ model: Model }> {
    return apiService.put<{ model: Model }>(`/api/models/${id}`, data);
  }

  async deleteModel(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(`/api/models/${id}`);
  }
}

export const modelsService = new ModelsService();
