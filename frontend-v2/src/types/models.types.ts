// Model types for the Models page

export interface Model {
  id: string;
  name: string;
  description: string;
  capabilities: string; // JSON string array from backend
  status: string;
  created_at: number;
  updated_at: number;
}

export interface ParsedModel {
  id: string;
  name: string;
  description: string;
  capabilities: Capability[];
  provider: string; // Extracted from description
}

export type Capability = 'chat' | 'vision' | 'tool-call' | 'completion' | 'code' | 'tools';

export type CapabilityFilter = 'all' | 'vision' | 'tool-call' | 'chat';
