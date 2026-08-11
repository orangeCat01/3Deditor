import type { ShaderUniformType } from './ShaderComponent';

export interface ShaderUniformSchemaEntry {
  type: ShaderUniformType;
  defaultValue: unknown;
}

export interface ShaderAssetInput {
  name: string;
  vertexSource: string;
  fragmentSource: string;
  uniformSchema: Record<string, ShaderUniformSchemaEntry>;
  metadata?: Record<string, unknown>;
}

export interface ShaderAsset extends ShaderAssetInput {
  id: string;
  type: 'Shader';
  references: string[];
}
