import type { Component } from '../types';

export type MaterialBlendMode = 'normal' | 'additive' | 'multiply';
export type MaterialSideMode = 'front' | 'back' | 'double';

export interface MeshComponent extends Component {
  type: 'mesh';
  geometryId: string;
  materialId: string;
  modelAssetId?: string;
  materialAssetId?: string;
}

export interface GeometryComponent extends Component {
  type: 'geometry';
  id: string;
  kind: 'box' | 'sphere' | 'custom';
  parameters: Record<string, number | string | boolean>;
  runtimeGeometryId?: string;
}

export interface MaterialComponent extends Component {
  type: 'material';
  id: string;
  name: string;
  color: string;
  textureAssetId?: string;
  normalMapAssetId?: string;
  aoMapAssetId?: string;
  emissive: string;
  opacity: number;
  transparent: boolean;
  alphaTest: number;
  blendMode: MaterialBlendMode;
  side: MaterialSideMode;
  depthTest: boolean;
  depthWrite: boolean;
  roughness: number;
  metalness: number;
  runtimeMaterialId?: string;
}

export type MaterialPatch = Partial<Omit<MaterialComponent, 'type' | 'id'>>;
