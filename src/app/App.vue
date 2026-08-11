<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ViewportPanel from '../viewport/ViewportPanel.vue';
import HierarchyPanel from '../panels/hierarchy/HierarchyPanel.vue';
import InspectorPanel from '../panels/inspector/InspectorPanel.vue';
import AssetPanel from '../panels/assets/AssetPanel.vue';
import TimelinePanel from '../panels/timeline/TimelinePanel.vue';
import PostProcessingPanel from '../panels/postprocess/PostProcessingPanel.vue';
import PerformancePanel from '../panels/performance/PerformancePanel.vue';
import MenuBar from '../layout/MenuBar.vue';
import WorkspaceSwitcher from '../layout/WorkspaceSwitcher.vue';
import { DockLayoutManager } from '../layout/DockLayoutManager';
import { LayoutStore } from '../layout/LayoutStore';
import { PanelRegistry } from '../layout/PanelRegistry';
import { WorkspaceManager } from '../layout/WorkspaceManager';
import type { DockPosition, PanelDescriptor, WorkspaceId } from '../layout/types';
import { editor, editorVersion } from './editorInstance';
import { CreateEntityCommand } from '../editor/commands/CreateEntityCommand';
import { DeleteEntityCommand } from '../editor/commands/DeleteEntityCommand';
import { DuplicateEntityCommand } from '../editor/commands/DuplicateEntityCommand';
import { GroupCommand } from '../editor/commands/GroupCommand';
import { ImportSceneCommand } from '../editor/commands/ImportSceneCommand';
import { UngroupCommand } from '../editor/commands/UngroupCommand';
import { createCubeEntity } from '../editor/factories/entityFactories';
import { RuntimeModeManager, type RuntimeMode } from '../editor/runtime/RuntimeModeManager';
import { SceneSerializer } from '../editor/serializer/SceneSerializer';
import type { SerializedSceneDocument } from '../editor/serializer/SceneVersion';
import { pivotMode, transformMode, transformSpace, type TransformMode, type TransformSpace } from './viewportState';
import type { AngleSnapStep } from '../editor/snap/SnapManager';
import type { PivotMode } from '../editor/transform/PivotManager';
import { toggleLocale } from '../i18n';

const { t, locale } = useI18n();
const registry = PanelRegistry.createDefault();
const layout = new DockLayoutManager(registry);
const layoutStore = new LayoutStore();
const workspaceManager = new WorkspaceManager(layout);
const runtimeModeManager = new RuntimeModeManager(editor);

const layoutVersion = ref(0);
const leftActive = ref('SceneGraph');
const rightActive = ref('Inspector');
const bottomActive = ref('Timeline');
const bottomCollapsed = ref(false);
const runtimeMode = ref<RuntimeMode>('Edit');
const selectedAngleStep = ref<AngleSnapStep>(15);

const activeTool = computed(() => {
  editorVersion.value;
  return transformMode.value;
});
const canUndo = computed(() => editorVersion.value >= 0 && editor.history.canUndo);
const canRedo = computed(() => editorVersion.value >= 0 && editor.history.canRedo);
const snapSettings = computed(() => {
  editorVersion.value;
  return editor.snap.current;
});
const selectedCount = computed(() => {
  editorVersion.value;
  return editor.selection.selectedIds.length;
});
const performanceBrief = computed(() => {
  editorVersion.value;
  const meshCount = editor.entities.all.filter((entity) => Boolean(entity.components.mesh)).length;
  return `${editor.entities.all.length} E / ${meshCount} M`;
});

const modes: TransformMode[] = ['translate', 'rotate', 'scale'];
const spaces: TransformSpace[] = ['world', 'local'];
const pivots: PivotMode[] = ['object-origin', 'selection-center', 'bounding-box-center', 'active-object', 'world-origin'];
const angleSteps: AngleSnapStep[] = [1, 5, 15, 30, 45, 90];
const leftPanels = computed(() => visiblePanels('left'));
const rightPanels = computed(() => visiblePanels('right'));
const bottomPanels = computed(() => visiblePanels('bottom'));
const allPanels = computed(() => {
  layoutVersion.value;
  return layout.allPanels();
});
const workspace = computed({
  get: () => layout.workspace,
  set: (value: WorkspaceId) => activateWorkspace(value)
});

function visiblePanels(position: DockPosition): PanelDescriptor[] {
  layoutVersion.value;
  return layout.visiblePanels(position);
}

function touchLayout(): void {
  layoutVersion.value += 1;
  layoutStore.save(layout.snapshot());
  ensureActiveTabs();
}

function ensureActiveTabs(): void {
  const left = layout.visiblePanels('left');
  const right = layout.visiblePanels('right');
  const bottom = layout.visiblePanels('bottom');
  if (!left.some((panel) => panel.id === leftActive.value)) leftActive.value = left[0]?.id ?? 'SceneGraph';
  if (!right.some((panel) => panel.id === rightActive.value)) rightActive.value = right[0]?.id ?? 'Inspector';
  if (!bottom.some((panel) => panel.id === bottomActive.value)) bottomActive.value = bottom[0]?.id ?? 'Timeline';
}

function addCube(): void {
  editor.execute(new CreateEntityCommand(editor, createCubeEntity('cube')));
}

function newScene(): void {
  const ids = editor.entities.all.map((entity) => entity.id);
  if (ids.length > 0) editor.execute(new DeleteEntityCommand(editor, ids));
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

function toggleGridSnap(): void {
  editor.snap.updateSettings({ gridEnabled: !snapSettings.value.gridEnabled, gridSize: 0.5 });
  editor.notifySceneChanged();
}

function toggleAngleSnap(): void {
  editor.snap.updateSettings({ angleEnabled: !snapSettings.value.angleEnabled, angleStep: selectedAngleStep.value });
  editor.notifySceneChanged();
}

function setAngleStep(value: string): void {
  selectedAngleStep.value = Number(value) as AngleSnapStep;
  editor.snap.updateSettings({ angleStep: selectedAngleStep.value });
  editor.notifySceneChanged();
}

function exportScene(): void {
  const sceneDocument = new SceneSerializer().serialize(editor);
  const blob = new Blob([JSON.stringify(sceneDocument, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'scene.web3d.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importScene(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  editor.execute(new ImportSceneCommand(editor, JSON.parse(text) as SerializedSceneDocument));
  input.value = '';
}

function runMode(mode: RuntimeMode): void {
  if (mode === 'Preview') runtimeModeManager.preview();
  if (mode === 'Play') runtimeModeManager.play();
  if (mode === 'Pause') runtimeModeManager.pause();
  if (mode === 'Stop') runtimeModeManager.stop();
  runtimeMode.value = runtimeModeManager.mode;
  editor.notifySceneChanged();
}

function togglePanel(id: string): void {
  layout.setPanelVisible(id, !layout.isVisible(id));
  touchLayout();
}

function activateWorkspace(value: WorkspaceId): void {
  workspaceManager.activate(value);
  touchLayout();
}

function startResize(position: DockPosition, event: PointerEvent): void {
  const start = position === 'bottom' ? event.clientY : event.clientX;
  const initial = layout.sizeOf(position);
  const direction = position === 'right' || position === 'bottom' ? -1 : 1;
  const move = (moveEvent: PointerEvent): void => {
    const current = position === 'bottom' ? moveEvent.clientY : moveEvent.clientX;
    layout.resizePanel(position, initial + (current - start) * direction);
    touchLayout();
  };
  const up = (): void => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function panelTitle(panel: PanelDescriptor): string {
  return t(panel.titleKey);
}

onMounted(() => {
  const saved = layoutStore.load();
  if (saved) layout.restore(saved);
  ensureActiveTabs();
  layoutVersion.value += 1;
});

watch(locale, () => {
  layoutVersion.value += 1;
});
</script>

<template>
  <main class="editor-shell" :lang="locale">
    <MenuBar
      :panels="allPanels"
      :workspace="workspace"
      @new-scene="newScene"
      @import-scene="importScene"
      @export-scene="exportScene"
      @add-cube="addCube"
      @undo="editor.undo()"
      @redo="editor.redo()"
      @duplicate="duplicateSelected"
      @group="groupSelected"
      @ungroup="ungroupActive"
      @delete="deleteSelected"
      @runtime="runMode"
      @toggle-panel="togglePanel"
    />

    <header class="toolbar-row">
      <nav class="toolbar compact-toolbar" :aria-label="t('toolbar.title')">
        <span class="toolbar-label">{{ t('toolbar.selection') }}</span>
        <button v-for="mode in modes" :key="mode" type="button" :class="{ active: activeTool === mode }" @click="transformMode = mode">
          {{ t(`toolbar.${mode}`) }}
        </button>
        <span class="toolbar-separator"></span>
        <button v-for="space in spaces" :key="space" type="button" :class="{ active: transformSpace === space }" @click="transformSpace = space">
          {{ t(`toolbar.${space}`) }}
        </button>
        <select v-model="pivotMode" class="toolbar-select" :aria-label="t('toolbar.pivot')">
          <option v-for="pivot in pivots" :key="pivot" :value="pivot">{{ t(`pivot.${pivot}`) }}</option>
        </select>
        <button type="button" :class="{ active: snapSettings.gridEnabled }" @click="toggleGridSnap">{{ t('toolbar.gridSnap') }}</button>
        <button type="button" :class="{ active: snapSettings.angleEnabled }" @click="toggleAngleSnap">{{ t('toolbar.angleSnap') }}</button>
        <select :value="selectedAngleStep" class="toolbar-select compact" :aria-label="t('toolbar.angle')" @change="setAngleStep(($event.target as HTMLSelectElement).value)">
          <option v-for="step in angleSteps" :key="step" :value="step">{{ step }}°</option>
        </select>
        <button type="button" :disabled="!canUndo" @click="editor.undo()">{{ t('toolbar.undo') }}</button>
        <button type="button" :disabled="!canRedo" @click="editor.redo()">{{ t('toolbar.redo') }}</button>
      </nav>
      <WorkspaceSwitcher v-model="workspace" :workspaces="workspaceManager.workspaces" />
      <button class="language-button" type="button" @click="toggleLocale">{{ t('app.language') }}</button>
    </header>

    <section
      class="dock-workspace"
      :style="{
        '--left-dock': `${layout.sizeOf('left')}px`,
        '--right-dock': `${layout.sizeOf('right')}px`,
        '--bottom-dock': bottomCollapsed ? '34px' : `${layout.sizeOf('bottom')}px`
      }"
    >
      <aside v-if="leftPanels.length" class="dock dock-left">
        <div class="dock-tabs">
          <button v-for="panel in leftPanels" :key="panel.id" type="button" :class="{ active: leftActive === panel.id }" @click="leftActive = panel.id">
            {{ panelTitle(panel) }}
          </button>
        </div>
        <div class="dock-body">
          <HierarchyPanel v-if="leftActive === 'SceneGraph'" class="panel-content" />
          <AssetPanel v-if="leftActive === 'Assets'" class="panel-content" />
        </div>
        <div class="dock-resizer vertical right-edge" @pointerdown="startResize('left', $event)"></div>
      </aside>

      <section class="viewport-cell">
        <ViewportPanel class="viewport" />
        <div class="viewport-overlay camera-overlay">
          <strong>{{ t('viewport.camera') }}</strong>
          <span>{{ t('viewport.perspective') }}</span>
        </div>
        <div class="viewport-overlay runtime-overlay">
          <strong>{{ t('viewport.runtimeMode') }}</strong>
          <span>{{ t(`runtime.${runtimeMode.toLowerCase()}`) }}</span>
        </div>
        <div class="viewport-overlay perf-overlay">
          <span>{{ t('viewport.performance') }}</span>
          <strong>{{ performanceBrief }} / {{ selectedCount }} {{ t('viewport.selected') }}</strong>
        </div>
      </section>

      <aside v-if="rightPanels.length" class="dock dock-right">
        <div class="dock-resizer vertical left-edge" @pointerdown="startResize('right', $event)"></div>
        <div class="dock-tabs">
          <button v-for="panel in rightPanels" :key="panel.id" type="button" :class="{ active: rightActive === panel.id }" @click="rightActive = panel.id">
            {{ panelTitle(panel) }}
          </button>
        </div>
        <div class="dock-body">
          <InspectorPanel v-if="rightActive === 'Inspector' || rightActive === 'Properties'" class="panel-content" />
        </div>
      </aside>

      <section v-if="bottomPanels.length" class="dock dock-bottom">
        <div class="dock-resizer horizontal top-edge" @pointerdown="startResize('bottom', $event)"></div>
        <div class="dock-tabs bottom-tabs">
          <button v-for="panel in bottomPanels" :key="panel.id" type="button" :class="{ active: bottomActive === panel.id }" @click="bottomActive = panel.id">
            {{ panelTitle(panel) }}
          </button>
          <button type="button" class="collapse-button" @click="bottomCollapsed = !bottomCollapsed">
            {{ bottomCollapsed ? t('panel.expand') : t('panel.collapse') }}
          </button>
        </div>
        <div v-if="!bottomCollapsed" class="dock-body bottom-body">
          <TimelinePanel v-if="bottomActive === 'Timeline' || bottomActive === 'Animation'" class="panel-content" />
          <PostProcessingPanel v-else-if="bottomActive === 'PostFX'" class="panel-content" />
          <PerformancePanel v-else-if="bottomActive === 'Performance'" class="panel-content" />
          <div v-else-if="bottomActive === 'Shader'" class="placeholder-panel">
            <strong>{{ t('panel.shader') }}</strong>
            <span>{{ t('panel.shaderHint') }}</span>
          </div>
          <div v-else-if="bottomActive === 'Physics'" class="placeholder-panel">
            <strong>{{ t('panel.physics') }}</strong>
            <span>{{ t('panel.physicsHint') }}</span>
          </div>
          <div v-else class="placeholder-panel">
            <strong>{{ t('panel.console') }}</strong>
            <span>{{ t('panel.consoleHint') }}</span>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
