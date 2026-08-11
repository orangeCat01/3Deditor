<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { editor, editorVersion } from '../../app/editorInstance';
import { DeleteEntityCommand } from '../../editor/commands/DeleteEntityCommand';
import { DuplicateEntityCommand } from '../../editor/commands/DuplicateEntityCommand';
import { GroupCommand } from '../../editor/commands/GroupCommand';
import { RenameEntityCommand } from '../../editor/commands/RenameEntityCommand';
import { ReorderHierarchyCommand } from '../../editor/commands/ReorderHierarchyCommand';
import { SetLockCommand } from '../../editor/commands/SetLockCommand';
import { SetParentCommand } from '../../editor/commands/SetParentCommand';
import { SetVisibilityCommand } from '../../editor/commands/SetVisibilityCommand';
import { UngroupCommand } from '../../editor/commands/UngroupCommand';
import type { EditorEntity, EntityId } from '../../editor/types';

const { t } = useI18n();

const expandedIds = ref(new Set<EntityId>());
const search = ref('');
const typeFilter = ref<'all' | 'mesh' | 'group'>('all');
const dragId = ref<EntityId | null>(null);

const rootEntities = computed(() => {
  editorVersion.value;
  return editor.sceneGraph.rootIds
    .map((id) => editor.entities.get(id))
    .filter((entity): entity is EditorEntity => Boolean(entity))
    .filter(matchesFilter);
});

function matchesFilter(entity: EditorEntity): boolean {
  const keyword = search.value.trim().toLowerCase();
  const nameMatches = keyword.length === 0 || entity.name.toLowerCase().includes(keyword);
  const typeMatches = typeFilter.value === 'all'
    || (typeFilter.value === 'mesh' && Boolean(entity.components.mesh))
    || (typeFilter.value === 'group' && !entity.components.mesh);
  return nameMatches && typeMatches;
}

function childrenOf(entity: EditorEntity): EditorEntity[] {
  return editor.sceneGraph.getChildren(entity.id)
    .map((id) => editor.entities.get(id))
    .filter((child): child is EditorEntity => Boolean(child))
    .filter(matchesFilter);
}

function toggleExpanded(id: EntityId): void {
  const next = new Set(expandedIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  expandedIds.value = next;
}

function select(entity: EditorEntity, event: MouseEvent): void {
  if (event.ctrlKey || event.metaKey || event.shiftKey) {
    editor.select(entity.id, true);
  } else {
    editor.select(entity.id);
  }
}

function rename(entity: EditorEntity): void {
  const name = window.prompt(t('hierarchy.rename'), entity.name)?.trim();
  if (name && name !== entity.name) editor.execute(new RenameEntityCommand(editor, entity.id, name));
}

function deleteSelected(): void {
  const ids = editor.selection.selectedIds;
  if (ids.length > 0) editor.execute(new DeleteEntityCommand(editor, ids));
}

function duplicateSelected(): void {
  const ids = editor.selection.selectedIds;
  if (ids.length > 0) editor.execute(new DuplicateEntityCommand(editor, ids));
}

function groupSelected(): void {
  const ids = editor.selection.selectedIds;
  if (ids.length > 1) editor.execute(new GroupCommand(editor, ids, 'group'));
}

function ungroupActive(): void {
  const activeId = editor.selection.activeId;
  if (activeId) editor.execute(new UngroupCommand(editor, activeId));
}

function toggleVisible(entity: EditorEntity): void {
  editor.execute(new SetVisibilityCommand(editor, entity.id, !entity.editor.visible));
}

function toggleLocked(entity: EditorEntity): void {
  editor.execute(new SetLockCommand(editor, entity.id, !entity.editor.locked));
}

function onDragStart(entity: EditorEntity): void {
  dragId.value = entity.id;
}

function onDrop(target: EditorEntity | null): void {
  if (!dragId.value) return;
  if (target && target.id !== dragId.value) {
    expandedIds.value = new Set([...expandedIds.value, target.id]);
    editor.execute(new SetParentCommand(editor, dragId.value, target.id));
  } else if (!target) {
    editor.execute(new SetParentCommand(editor, dragId.value, null));
  }
  dragId.value = null;
}

function moveRoot(from: number, to: number): void {
  const roots = editor.sceneGraph.rootIds;
  const [id] = roots.splice(from, 1);
  roots.splice(to, 0, id);
  editor.execute(new ReorderHierarchyCommand(editor, null, roots));
}

function iconFor(entity: EditorEntity): string {
  return entity.components.mesh ? 'mesh' : 'group';
}
</script>

<template>
  <aside @dragover.prevent @drop="onDrop(null)">
    <div class="panel-header">
      <strong>{{ t('scene.graph') }}</strong>
      <small>{{ t('scene.roots', { count: rootEntities.length }) }}</small>
    </div>
    <div class="panel-tools">
      <input v-model="search" :placeholder="t('scene.search')" />
      <select v-model="typeFilter">
        <option value="all" >{{ t('scene.all') }}</option>
        <option value="mesh" >{{ t('scene.mesh') }}</option>
        <option value="group" >{{ t('scene.group') }}</option>
      </select>
    </div>
    <div class="panel-tools compact-tools">
      <button type="button" @click="duplicateSelected" >{{ t('hierarchy.duplicate') }}</button>
      <button type="button" @click="groupSelected" >{{ t('hierarchy.group') }}</button>
      <button type="button" @click="ungroupActive" >{{ t('hierarchy.ungroup') }}</button>
      <button type="button" @click="deleteSelected" >{{ t('hierarchy.delete') }}</button>
    </div>
    <div class="tree-list">
      <template v-for="(entity, index) in rootEntities" :key="entity.id">
        <div
          class="entity-row tree-row"
          :class="{ selected: editor.selection.selectedIds.includes(entity.id), hovered: editor.selection.hoverId === entity.id }"
          draggable="true"
          @dragstart="onDragStart(entity)"
          @drop.stop.prevent="onDrop(entity)"
          @mouseenter="editor.setHover(entity.id)"
          @mouseleave="editor.setHover(null)"
          @click="select(entity, $event)"
        >
          <button type="button" class="icon-button" @click.stop="toggleExpanded(entity.id)">{{ expandedIds.has(entity.id) ? '-' : '+' }}</button>
          <span class="entity-icon">{{ iconFor(entity).slice(0, 1) }}</span>
          <span class="entity-name" @dblclick.stop="rename(entity)">{{ entity.name }}</span>
          <button type="button" class="icon-button" @click.stop="toggleVisible(entity)">{{ entity.editor.visible ? 'V' : 'H' }}</button>
          <button type="button" class="icon-button" @click.stop="toggleLocked(entity)">{{ entity.editor.locked ? 'L' : 'U' }}</button>
          <button type="button" class="icon-button" :disabled="index === 0" @click.stop="moveRoot(index, index - 1)" >{{ t('hierarchy.up') }}</button>
          <button type="button" class="icon-button" :disabled="index === rootEntities.length - 1" @click.stop="moveRoot(index, index + 1)" >{{ t('hierarchy.down') }}</button>
        </div>
        <div v-if="expandedIds.has(entity.id)" class="children-list">
          <div
            v-for="child in childrenOf(entity)"
            :key="child.id"
            class="entity-row tree-row child-row"
            :class="{ selected: editor.selection.selectedIds.includes(child.id) }"
            draggable="true"
            @dragstart="onDragStart(child)"
            @drop.stop.prevent="onDrop(child)"
            @click="select(child, $event)"
          >
            <span class="entity-icon">{{ iconFor(child).slice(0, 1) }}</span>
            <span class="entity-name" @dblclick.stop="rename(child)">{{ child.name }}</span>
            <button type="button" class="icon-button" @click.stop="toggleVisible(child)">{{ child.editor.visible ? 'V' : 'H' }}</button>
            <button type="button" class="icon-button" @click.stop="toggleLocked(child)">{{ child.editor.locked ? 'L' : 'U' }}</button>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

