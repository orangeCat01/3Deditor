import type { ComponentType } from '../types';

export type InspectorFieldType = 'vector3' | 'quaternion' | 'string' | 'number' | 'boolean';

export interface InspectorFieldSchema { path: string; label: string; type: InspectorFieldType; resetValue?: unknown; }
export interface InspectorComponentSchema { componentType: ComponentType; label: string; fields: InspectorFieldSchema[]; }

export class InspectorSchemaRegistry {
  private schemas = new Map<ComponentType, InspectorComponentSchema>();

  constructor() {
    this.registerTransformSchema();
    this.registerMaterialSchema();
    this.registerAnimationSchema();
    this.registerTimerSchema();
    this.registerShaderSchema();
    this.registerPhysicsSchema();
    this.registerColliderSchema();
  }

  register(schema: InspectorComponentSchema): void { this.schemas.set(schema.componentType, schema); }
  get(componentType: ComponentType): InspectorComponentSchema | undefined { return this.schemas.get(componentType); }
  getAll(): InspectorComponentSchema[] { return [...this.schemas.values()]; }

  registerTransformSchema(): void { this.register({ componentType: 'transform', label: 'transform.title', fields: [
    { path: 'position', label: 'transform.position', type: 'vector3', resetValue: { x: 0, y: 0.5, z: 0 } },
    { path: 'rotation', label: 'transform.rotation', type: 'quaternion', resetValue: { x: 0, y: 0, z: 0 } },
    { path: 'scale', label: 'transform.scale', type: 'vector3', resetValue: { x: 1, y: 1, z: 1 } }
  ] }); }

  registerMaterialSchema(): void { this.register({ componentType: 'material', label: 'material.title', fields: [
    { path: 'color', label: 'material.color', type: 'string', resetValue: '#d98b48' },
    { path: 'textureAssetId', label: 'material.textureAssetId', type: 'string' },
    { path: 'normalMapAssetId', label: 'material.normalMapAssetId', type: 'string' },
    { path: 'aoMapAssetId', label: 'material.aoMapAssetId', type: 'string' },
    { path: 'emissive', label: 'material.emissive', type: 'string', resetValue: '#000000' },
    { path: 'metalness', label: 'material.metalness', type: 'number', resetValue: 0.05 },
    { path: 'roughness', label: 'material.roughness', type: 'number', resetValue: 0.65 },
    { path: 'opacity', label: 'material.opacity', type: 'number', resetValue: 1 },
    { path: 'transparent', label: 'material.transparent', type: 'boolean', resetValue: false },
    { path: 'alphaTest', label: 'material.alphaTest', type: 'number', resetValue: 0 },
    { path: 'blendMode', label: 'material.blendMode', type: 'string', resetValue: 'normal' },
    { path: 'side', label: 'material.side', type: 'string', resetValue: 'front' },
    { path: 'depthTest', label: 'material.depthTest', type: 'boolean', resetValue: true },
    { path: 'depthWrite', label: 'material.depthWrite', type: 'boolean', resetValue: true }
  ] }); }

  registerAnimationSchema(): void { this.register({ componentType: 'animation', label: 'animation.title', fields: [
    { path: 'activeClipId', label: 'animation.activeClip', type: 'string' },
    { path: 'autoplay', label: 'animation.autoplay', type: 'boolean', resetValue: false },
    { path: 'playing', label: 'animation.playing', type: 'boolean', resetValue: false },
    { path: 'speed', label: 'animation.speed', type: 'number', resetValue: 1 },
    { path: 'duration', label: 'animation.duration', type: 'number', resetValue: 1000 },
    { path: 'delay', label: 'animation.delay', type: 'number', resetValue: 0 },
    { path: 'loop', label: 'animation.loop', type: 'boolean', resetValue: false },
    { path: 'easing', label: 'animation.easing', type: 'string', resetValue: 'linear' },
    { path: 'autoStart', label: 'animation.autoStart', type: 'boolean', resetValue: true }
  ] }); }

  registerTimerSchema(): void { this.register({ componentType: 'timer', label: 'timer.title', fields: [
    { path: 'delay', label: 'timer.delay', type: 'number', resetValue: 1000 },
    { path: 'repeat', label: 'timer.repeat', type: 'boolean', resetValue: false },
    { path: 'repeatCount', label: 'timer.repeatCount', type: 'number', resetValue: 1 },
    { path: 'autoStart', label: 'timer.autoStart', type: 'boolean', resetValue: true },
    { path: 'paused', label: 'timer.paused', type: 'boolean', resetValue: false }
  ] }); }

  registerShaderSchema(): void { this.register({ componentType: 'shader', label: 'shader.title', fields: [
    { path: 'enabled', label: 'shader.enabled', type: 'boolean', resetValue: true },
    { path: 'shaderAssetId', label: 'shader.shaderAssetId', type: 'string' },
    { path: 'vertexShader', label: 'shader.vertexShader', type: 'string', resetValue: '' },
    { path: 'fragmentShader', label: 'shader.fragmentShader', type: 'string', resetValue: '' }
  ] }); }

  registerPhysicsSchema(): void { this.register({ componentType: 'physics', label: 'physics.title', fields: [
    { path: 'mass', label: 'physics.mass', type: 'number', resetValue: 1 },
    { path: 'friction', label: 'physics.friction', type: 'number', resetValue: 0.5 },
    { path: 'restitution', label: 'physics.restitution', type: 'number', resetValue: 0.1 },
    { path: 'enabled', label: 'shader.enabled', type: 'boolean', resetValue: true }
  ] }); }

  registerColliderSchema(): void { this.register({ componentType: 'collider', label: 'physics.collider', fields: [
    { path: 'shape', label: 'physics.shape', type: 'string', resetValue: 'box' },
    { path: 'radius', label: 'physics.radius', type: 'number', resetValue: 0.5 },
    { path: 'height', label: 'physics.height', type: 'number', resetValue: 1 },
    { path: 'isTrigger', label: 'physics.isTrigger', type: 'boolean', resetValue: false }
  ] }); }
}

