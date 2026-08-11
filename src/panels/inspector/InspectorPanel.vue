<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { editor, editorVersion } from '../../app/editorInstance';
import { RenameEntityCommand } from '../../editor/commands/RenameEntityCommand';
import { SetAnimationCommand } from '../../editor/commands/SetAnimationCommand';
import { SetAnimationPropertyCommand } from '../../editor/commands/SetAnimationPropertyCommand';
import { SetColliderCommand } from '../../editor/commands/SetColliderCommand';
import { SetMaterialCommand } from '../../editor/commands/SetMaterialCommand';
import { SetPhysicsCommand } from '../../editor/commands/SetPhysicsCommand';
import { SetShaderCommand } from '../../editor/commands/SetShaderCommand';
import { SetTimerCommand } from '../../editor/commands/SetTimerCommand';
import { SetTransformCommand } from '../../editor/commands/SetTransformCommand';
import { quaternionToEulerDegrees } from '../../editor/components/TransformComponent';
import type { InspectorComponentSchema, InspectorFieldSchema } from '../../editor/inspector/InspectorSchemaRegistry';
import type { Vector3Data } from '../../editor/types';

const { t } = useI18n();

const activeEntity = computed(() => {
  editorVersion.value;
  return editor.selection.activeId ? editor.entities.get(editor.selection.activeId) : undefined;
});

const transform = computed(() => {
  editorVersion.value;
  return activeEntity.value ? editor.entities.getTransform(activeEntity.value.id) : undefined;
});

const schemas = computed(() => {
  editorVersion.value;
  const entity = activeEntity.value;
  if (!entity) return [];
  return Object.keys(entity.components)
    .map((type) => editor.inspectorSchemas.get(type as never))
    .filter((schema): schema is InspectorComponentSchema => Boolean(schema));
});

const rotationEuler = computed(() => (transform.value ? quaternionToEulerDegrees(transform.value.quaternion) : { x: 0, y: 0, z: 0 }));
const tweenFieldPaths = new Set(['duration', 'delay', 'loop', 'easing', 'autoStart']);

function updateName(value: string): void {
  if (!activeEntity.value) return;
  const name = value.trim();
  if (name && name !== activeEntity.value.name) editor.execute(new RenameEntityCommand(editor, activeEntity.value.id, name));
}

function getVectorValue(field: InspectorFieldSchema): Vector3Data {
  if (!transform.value) return { x: 0, y: 0, z: 0 };
  if (field.path === 'rotation') return rotationEuler.value;
  if (field.path === 'scale') return transform.value.scale;
  return transform.value.position;
}

function getScalarValue(schema: InspectorComponentSchema, field: InspectorFieldSchema): unknown {
  const component = activeEntity.value?.components[schema.componentType];
  if (!component) return '';
  if (schema.componentType === 'animation') {
    const animation = activeEntity.value?.components.animation;
    if (tweenFieldPaths.has(field.path)) return animation?.tweens[0]?.[field.path as never] ?? '';
    return (animation as unknown as Record<string, unknown>)[field.path] ?? '';
  }
  return (component as unknown as Record<string, unknown>)[field.path];
}

function updateVector(field: InspectorFieldSchema, axis: keyof Vector3Data, value: string): void {
  if (!activeEntity.value || !transform.value) return;
  const numeric = Number(value);
  const next = { ...getVectorValue(field), [axis]: Number.isFinite(numeric) ? numeric : 0 };
  const patch = field.path === 'rotation' ? { rotationEulerDegrees: next } : { [field.path]: next };
  editor.execute(new SetTransformCommand(editor, activeEntity.value.id, patch));
}

function updateScalar(schema: InspectorComponentSchema, field: InspectorFieldSchema, value: string | boolean): void {
  if (!activeEntity.value) return;
  const nextValue = field.type === 'number' ? Number(value) : value;
  if (schema.componentType === 'material') {
    editor.execute(new SetMaterialCommand(editor, activeEntity.value.id, { [field.path]: nextValue }));
  }
  if (schema.componentType === 'animation') {
    if (tweenFieldPaths.has(field.path)) {
      editor.execute(new SetAnimationCommand(editor, activeEntity.value.id, { [field.path]: nextValue }));
    } else {
      editor.execute(new SetAnimationPropertyCommand(editor, activeEntity.value.id, { [field.path]: nextValue }));
    }
  }
  if (schema.componentType === 'timer') {
    editor.execute(new SetTimerCommand(editor, activeEntity.value.id, { [field.path]: nextValue }));
  }
  if (schema.componentType === 'shader') {
    const shader = activeEntity.value.components.shader;
    if (shader) editor.execute(new SetShaderCommand(editor, activeEntity.value.id, { ...shader, [field.path]: nextValue }));
  }
  if (schema.componentType === 'physics') {
    const physics = activeEntity.value.components.physics;
    if (physics) editor.execute(new SetPhysicsCommand(editor, activeEntity.value.id, { ...physics, [field.path]: nextValue }));
  }
  if (schema.componentType === 'collider') {
    const collider = activeEntity.value.components.collider;
    if (collider) editor.execute(new SetColliderCommand(editor, activeEntity.value.id, { ...collider, [field.path]: nextValue }));
  }
}

function resetField(schema: InspectorComponentSchema, field: InspectorFieldSchema): void {
  if (!activeEntity.value || field.resetValue === undefined) return;
  if (schema.componentType === 'transform') {
    const patch = field.path === 'rotation'
      ? { rotationEulerDegrees: field.resetValue as Vector3Data }
      : { [field.path]: field.resetValue };
    editor.execute(new SetTransformCommand(editor, activeEntity.value.id, patch));
    return;
  }
  if (schema.componentType === 'material') {
    editor.execute(new SetMaterialCommand(editor, activeEntity.value.id, { [field.path]: field.resetValue }));
  }
  if (schema.componentType === 'animation') {
    if (tweenFieldPaths.has(field.path)) {
      editor.execute(new SetAnimationCommand(editor, activeEntity.value.id, { [field.path]: field.resetValue }));
    } else {
      editor.execute(new SetAnimationPropertyCommand(editor, activeEntity.value.id, { [field.path]: field.resetValue }));
    }
  }
  if (schema.componentType === 'timer') {
    editor.execute(new SetTimerCommand(editor, activeEntity.value.id, { [field.path]: field.resetValue }));
  }
  if (schema.componentType === 'shader') {
    const shader = activeEntity.value.components.shader;
    if (shader) editor.execute(new SetShaderCommand(editor, activeEntity.value.id, { ...shader, [field.path]: field.resetValue }));
  }
  if (schema.componentType === 'physics') {
    const physics = activeEntity.value.components.physics;
    if (physics) editor.execute(new SetPhysicsCommand(editor, activeEntity.value.id, { ...physics, [field.path]: field.resetValue }));
  }
  if (schema.componentType === 'collider') {
    const collider = activeEntity.value.components.collider;
    if (collider) editor.execute(new SetColliderCommand(editor, activeEntity.value.id, { ...collider, [field.path]: field.resetValue }));
  }
}
</script>

<template>
  <aside>
    <div class="panel-header">
      <strong>{{ t('inspector.title') }}</strong>
      <small>{{ t('inspector.schemaDriven') }}</small>
    </div>
    <div v-if="activeEntity" class="inspector-stack">
      <label class="field-block">
        <span>{{ t('inspector.name') }}</span>
        <input :value="activeEntity.name" @change="updateName(($event.target as HTMLInputElement).value)" />
      </label>

      <section v-for="schema in schemas" :key="schema.componentType" class="component-section">
        <h2>{{ t(schema.label) }}</h2>
        <div v-for="field in schema.fields" :key="field.path" class="schema-field">
          <div class="schema-field-title">
            <span>{{ t(field.label) }}</span>
            <button type="button" class="icon-button" @click="resetField(schema, field)">{{ t('inspector.reset') }}</button>
          </div>
          <div v-if="field.type === 'vector3' || field.type === 'quaternion'" class="vec-editor schema-vec">
            <span>XYZ</span>
            <input
              v-for="axis in ['x', 'y', 'z']"
              :key="`${field.path}-${axis}`"
              :value="getVectorValue(field)[axis as keyof Vector3Data]"
              type="number"
              step="0.1"
              @change="updateVector(field, axis as keyof Vector3Data, ($event.target as HTMLInputElement).value)"
            />
          </div>
          <input
            v-else-if="field.type === 'number'"
            class="schema-input"
            type="number"
            step="0.01"
            :value="getScalarValue(schema, field)"
            @change="updateScalar(schema, field, ($event.target as HTMLInputElement).value)"
          />
          <label v-else-if="field.type === 'boolean'" class="schema-check">
            <input
              type="checkbox"
              :checked="Boolean(getScalarValue(schema, field))"
              @change="updateScalar(schema, field, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ t('inspector.enabled') }}</span>
          </label>
          <input
            v-else
            class="schema-input"
            :value="getScalarValue(schema, field)"
            @change="updateScalar(schema, field, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </section>
    </div>
    <div v-else class="empty-state">{{ t('inspector.selectEntity') }}</div>
  </aside>
</template>






