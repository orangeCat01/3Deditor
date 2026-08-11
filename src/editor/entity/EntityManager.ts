import type { EntityId, EditorEntity } from '../types';
import type { TransformComponent, TransformPatch } from '../components/TransformComponent';
import { applyTransformPatch, cloneTransform } from '../components/TransformComponent';
import type { MaterialComponent, MeshComponent } from '../components/RenderComponents';
import type { AnimationComponent } from '../animation/AnimationComponent';
import type { TimerComponent } from '../timer/TimerComponent';
import type { ShaderComponent } from '../shader/ShaderComponent';
import type { PhysicsComponent } from '../physics/PhysicsComponent';
import type { ColliderComponent } from '../physics/ColliderComponent';

export class EntityManager {
  private entities = new Map<EntityId, EditorEntity>();

  get all(): EditorEntity[] {
    return [...this.entities.values()];
  }

  get(id: EntityId): EditorEntity | undefined {
    return this.entities.get(id);
  }

  add(entity: EditorEntity): void {
    this.entities.set(entity.id, cloneEntity(entity));
  }

  addMany(entities: EditorEntity[]): void {
    entities.forEach((entity) => this.add(entity));
  }

  remove(id: EntityId): EditorEntity | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;
    this.entities.delete(id);
    return cloneEntity(entity);
  }

  removeMany(ids: EntityId[]): EditorEntity[] {
    return ids
      .map((id) => this.remove(id))
      .filter((entity): entity is EditorEntity => Boolean(entity));
  }

  updateName(id: EntityId, name: string): void {
    const entity = this.entities.get(id);
    if (entity) entity.name = name;
  }

  setParent(id: EntityId, parentId: EntityId | null): void {
    const entity = this.entities.get(id);
    if (entity) entity.parentId = parentId;
  }

  setChildren(id: EntityId, children: EntityId[]): void {
    const entity = this.entities.get(id);
    if (entity) entity.children = [...children];
  }

  setVisibility(id: EntityId, visible: boolean): void {
    const entity = this.entities.get(id);
    if (entity) entity.editor.visible = visible;
  }

  setLock(id: EntityId, locked: boolean): void {
    const entity = this.entities.get(id);
    if (entity) entity.editor.locked = locked;
  }

  snapshot(ids?: EntityId[]): EditorEntity[] {
    const source = ids ? ids.map((id) => this.entities.get(id)) : this.all;
    return source.filter((entity): entity is EditorEntity => Boolean(entity)).map(cloneEntity);
  }

  getTransform(id: EntityId): TransformComponent | undefined {
    const component = this.entities.get(id)?.components.transform;
    return component?.type === 'transform' ? cloneTransform(component as TransformComponent) : undefined;
  }

  setTransform(id: EntityId, patch: TransformPatch): void {
    const entity = this.entities.get(id);
    const transform = entity?.components.transform;
    if (!entity || transform?.type !== 'transform') return;
    entity.components.transform = applyTransformPatch(transform as TransformComponent, patch);
  }

  replaceTransform(id: EntityId, transform: TransformComponent): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    entity.components.transform = cloneTransform(transform);
  }

  replaceMaterial(id: EntityId, material: MaterialComponent): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    entity.components.material = { ...material };
  }

  replaceAnimation(id: EntityId, animation: AnimationComponent): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    // 动画组件保存业务数据，运行时系统只读取这里的声明。
    entity.components.animation = structuredClone(animation);
  }

  replaceTimer(id: EntityId, timer: TimerComponent): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    entity.components.timer = structuredClone(timer);
  }

  replaceShader(id: EntityId, shader: ShaderComponent | undefined): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    if (shader) entity.components.shader = structuredClone(shader);
    else delete entity.components.shader;
  }

  replacePhysics(id: EntityId, physics: PhysicsComponent | undefined): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    if (physics) entity.components.physics = structuredClone(physics);
    else delete entity.components.physics;
  }

  replaceCollider(id: EntityId, collider: ColliderComponent | undefined): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    if (collider) entity.components.collider = structuredClone(collider);
    else delete entity.components.collider;
  }
}

export function cloneEntity(entity: EditorEntity): EditorEntity {
  return {
    ...entity,
    children: [...entity.children],
    components: Object.fromEntries(
      Object.entries(entity.components).map(([key, value]) => [
        key,
        value?.type === 'transform' ? cloneTransform(value as TransformComponent) : value ? structuredClone(value) : value
      ])
    ) as EditorEntity['components'],
    editor: { ...entity.editor }
  };
}

export function cloneEntityWithNewIds(entity: EditorEntity, suffix: string): EditorEntity {
  const cloned = cloneEntity(entity);
  return {
    ...cloned,
    id: `${entity.id}_${suffix}`,
    name: `${entity.name} Copy`,
    parentId: null,
    children: [],
    components: Object.fromEntries(
      Object.entries(cloned.components).map(([key, value]) => {
        if (!value) return [key, value];
        if (value.type === 'mesh') {
          const mesh = value as MeshComponent;
          return [key, { ...mesh, geometryId: `${mesh.geometryId}_${suffix}`, materialId: `${mesh.materialId}_${suffix}` }];
        }
        if ('id' in value && typeof value.id === 'string') {
          return [key, { ...value, id: `${value.id}_${suffix}` }];
        }
        return [key, structuredClone(value)];
      })
    ) as EditorEntity['components']
  };
}





