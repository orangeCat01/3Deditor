import type { Component } from '../types';

export type ShaderUniformType = 'number' | 'boolean' | 'color' | 'vector2' | 'vector3' | 'vector4' | 'texture';

export interface ShaderUniformValue {
  type: ShaderUniformType;
  value: unknown;
}

export interface ShaderCompileStatus {
  success: boolean;
  error?: string;
  compiledAt?: number;
}

export interface ShaderComponent extends Component {
  type: 'shader';
  shaderAssetId: string | null;
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, ShaderUniformValue>;
  defines: Record<string, boolean | number | string>;
  enabled: boolean;
  compileStatus?: ShaderCompileStatus;
}

export type ShaderComponentPatch = Partial<Omit<ShaderComponent, 'type'>>;

export function cloneShaderComponent(shader: ShaderComponent): ShaderComponent {
  return structuredClone(shader);
}
