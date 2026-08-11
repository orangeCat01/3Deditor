<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { editor } from '../app/editorInstance';
import { pivotMode, transformMode, transformSpace } from '../app/viewportState';
import { ThreeSceneAdapter } from '../engine/three/ThreeSceneAdapter';
import { HoverHighlightManager } from '../engine/three/HoverHighlightManager';
import type { TransformComponent } from '../editor/components/TransformComponent';
import { PivotManager } from '../editor/transform/PivotManager';
import { addVector, subtractVector, TransformSelectionCommand, type TransformRecord } from '../editor/commands/TransformSelectionCommand';
import { RectangleSelection } from '../editor/selection/RectangleSelection';
import { SelectionBoxOverlay } from '../editor/selection/SelectionBoxOverlay';
import { OverlapSelection, type OverlapSelectionCandidate } from '../editor/selection/OverlapSelection';
import { VertexSnapper, type VertexSnapCandidate } from '../editor/snap/VertexSnapper';
import { VertexSnapPreview } from '../editor/snap/VertexSnapPreview';

const host = ref<HTMLDivElement | null>(null);
const selectionBox = ref(new SelectionBoxOverlay());
const overlapCandidates = ref<OverlapSelectionCandidate[]>([]);
const snapPreviewText = ref('');
let renderer: WebGLRenderer | null = null;
let camera: PerspectiveCamera | null = null;
let scene: Scene | null = null;
let orbit: OrbitControls | null = null;
let transform: TransformControls | null = null;
let adapter: ThreeSceneAdapter | null = null;
let frame = 0;
let resizeObserver: ResizeObserver | null = null;
let dragStart = new Map<string, TransformComponent>();
let cleanupEvents: Array<() => void> = [];
let isBoxSelecting = false;
const hoverHighlight = new HoverHighlightManager();
const vertexPreview = new VertexSnapPreview(new VertexSnapper());

const selectionRectStyle = computed(() => {
  const rect = selectionBox.value.rect;
  return rect ? { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` } : {};
});

function render(): void {
  if (!renderer || !scene || !camera) return;
  renderer.render(scene, camera);
}

function animate(): void {
  orbit?.update();
  render();
  frame = requestAnimationFrame(animate);
}

function resize(): void {
  if (!host.value || !renderer || !camera) return;
  const { width, height } = host.value.getBoundingClientRect();
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  render();
}

function syncScene(): void {
  adapter?.sync();
  attachTransformToSelection();
  render();
}

function attachTransformToSelection(): void {
  const activeId = editor.selection.activeId;
  if (!transform || !adapter || !activeId) {
    transform?.detach();
    return;
  }
  const object = adapter.getObject(activeId);
  if (object) transform.attach(object);
}

function raycast(event: PointerEvent): string[] {
  if (!host.value || !camera || !adapter) return [];
  const bounds = host.value.getBoundingClientRect();
  const pointer = new Vector2(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
  );
  const raycaster = new Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(adapter.root.children, true);
  return hits
    .map((hit) => adapter?.getEntityIdFromObject(hit.object) ?? null)
    .filter((id): id is string => Boolean(id));
}

function viewportPoint(event: PointerEvent): { x: number; y: number } {
  const bounds = host.value?.getBoundingClientRect();
  return bounds ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top } : { x: 0, y: 0 };
}

function handlePointerDown(event: PointerEvent): void {
  overlapCandidates.value = [];
  if (event.altKey) {
    isBoxSelecting = true;
    selectionBox.value.begin(viewportPoint(event), event.shiftKey ? 'intersect' : 'contain');
    return;
  }
  const ids = raycast(event);
  if (ids.length > 1) {
    overlapCandidates.value = new OverlapSelection(editor).buildCandidates(ids);
    return;
  }
  editor.select(ids[0] ?? null, event.shiftKey || event.ctrlKey || event.metaKey);
}

function handlePointerMove(event: PointerEvent): void {
  if (isBoxSelecting) {
    selectionBox.value.update(viewportPoint(event));
    return;
  }
  const id = raycast(event)[0] ?? null;
  editor.setHover(id);
  hoverHighlight.setHover(id, id && adapter ? adapter.getObject(id) ?? null : null);
}

function handlePointerUp(): void {
  if (!isBoxSelecting || !host.value || !camera || !adapter) return;
  const rect = selectionBox.value.end();
  isBoxSelecting = false;
  if (!rect) return;
  const bounds = host.value.getBoundingClientRect();
  const candidates = editor.entities.all
    .map((entity) => {
      const object = adapter?.getObject(entity.id);
      return object ? { entityId: entity.id, center: object.getWorldPosition(new Vector3()), radius: 0.35 } : null;
    })
    .filter((candidate): candidate is { entityId: string; center: Vector3; radius: number } => Boolean(candidate));
  const selected = new RectangleSelection(camera, { width: bounds.width, height: bounds.height }).select(candidates, rect, selectionBox.value.mode);
  editor.setSelection(selected, selected.at(-1) ?? null);
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') overlapCandidates.value = [];
}

function selectOverlap(candidate: OverlapSelectionCandidate): void {
  new OverlapSelection(editor).setActive(candidate.entityId);
  overlapCandidates.value = [];
}

function beginGizmoTransaction(): void {
  dragStart = new Map();
  const pivot = new PivotManager(editor);
  const roots = pivot.getEffectiveTransformRoots(editor.selection.selectedIds);
  roots.forEach((id) => {
    const transformSnapshot = editor.entities.getTransform(id);
    if (transformSnapshot) dragStart.set(id, transformSnapshot);
  });
}

function updateVertexSnapPreview(): void {
  if (!adapter || !editor.selection.activeId) return;
  const activeObject = adapter.getObject(editor.selection.activeId);
  if (!activeObject) return;
  const candidates: VertexSnapCandidate[] = editor.entities.all
    .filter((entity) => entity.id !== editor.selection.activeId)
    .map((entity) => {
      const object = adapter?.getObject(entity.id);
      return object instanceof Mesh ? { entityId: entity.id, object } : null;
    })
    .filter((candidate): candidate is VertexSnapCandidate => Boolean(candidate));
  const state = vertexPreview.update(candidates, activeObject.getWorldPosition(new Vector3()), 0.35);
  snapPreviewText.value = state ? `Snap ${state.entityId}` : '';
}

function commitGizmoTransaction(): void {
  if (!adapter || dragStart.size === 0 || !editor.selection.activeId) return;
  const activeObject = adapter.getObject(editor.selection.activeId);
  const activeBefore = dragStart.get(editor.selection.activeId);
  if (!activeObject || !activeBefore) return;

  updateVertexSnapPreview();
  const preview = vertexPreview.current;
  const activePosition = activeObject.position.clone();
  if (preview) activePosition.add(preview.snapPoint.clone().sub(preview.lineStart));
  const snappedActivePosition = editor.snap.snapPosition({ x: activePosition.x, y: activePosition.y, z: activePosition.z });
  const delta = subtractVector(snappedActivePosition, activeBefore.position);
  const pivot = new PivotManager(editor).calculatePivot([...dragStart.keys()], pivotMode.value);
  const records: TransformRecord[] = [];

  dragStart.forEach((before, entityId) => {
    const object = adapter?.getObject(entityId);
    const afterPosition = entityId === editor.selection.activeId
      ? snappedActivePosition
      : addVector(before.position, delta);
    records.push({
      entityId,
      before,
      after: {
        ...before,
        position: afterPosition,
        quaternion: object
          ? { x: object.quaternion.x, y: object.quaternion.y, z: object.quaternion.z, w: object.quaternion.w }
          : before.quaternion,
        scale: object ? { x: object.scale.x, y: object.scale.y, z: object.scale.z } : before.scale
      }
    });
  });

  editor.execute(new TransformSelectionCommand(editor, records, pivot, transformSpace.value));
  dragStart = new Map();
  vertexPreview.clear();
  snapPreviewText.value = '';
}

onMounted(() => {
  if (!host.value) return;
  scene = new Scene();
  scene.background = null;
  camera = new PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.set(4, 3, 6);
  camera.lookAt(new Vector3(0, 0, 0));

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.value.appendChild(renderer.domElement);

  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;

  transform = new TransformControls(camera, renderer.domElement);
  transform.setMode(transformMode.value);
  transform.setSpace(transformSpace.value);
  transform.addEventListener('objectChange', updateVertexSnapPreview);
  transform.addEventListener('dragging-changed', (event) => {
    if (orbit) orbit.enabled = !event.value;
    if (event.value) beginGizmoTransaction();
    else commitGizmoTransaction();
  });

  scene.add(new AmbientLight(0xffffff, 0.55));
  const light = new DirectionalLight(0xffffff, 1.7);
  light.position.set(6, 8, 4);
  scene.add(light);
  scene.add(new GridHelper(24, 24, '#526063', '#2f383b'));
  scene.add(new AxesHelper(2.5));

  adapter = new ThreeSceneAdapter(editor);
  scene.add(adapter.root);
  scene.add(transform.getHelper());
  syncScene();

  host.value.addEventListener('pointerdown', handlePointerDown);
  host.value.addEventListener('pointermove', handlePointerMove);
  host.value.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('keydown', handleKeyDown);
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host.value);
  cleanupEvents = [editor.events.on('sceneChanged', syncScene), editor.events.on('selectionChanged', syncScene), editor.events.on('hoverChanged', render)];
  animate();
});

watch(transformMode, (mode) => {
  transform?.setMode(mode);
  render();
});

watch(transformSpace, (space) => {
  transform?.setSpace(space);
  render();
});

onBeforeUnmount(() => {
  if (host.value) {
    host.value.removeEventListener('pointerdown', handlePointerDown);
    host.value.removeEventListener('pointermove', handlePointerMove);
    host.value.removeEventListener('pointerup', handlePointerUp);
  }
  window.removeEventListener('keydown', handleKeyDown);
  cleanupEvents.forEach((cleanup) => cleanup());
  resizeObserver?.disconnect();
  cancelAnimationFrame(frame);
  transform?.dispose();
  orbit?.dispose();
  renderer?.dispose();
});
</script>

<template>
  <section ref="host" class="viewport-surface" aria-label="3D viewport">
    <div class="viewport-hud">
      <span>Perspective</span>
      <span>{{ transformSpace }}</span>
      <span>{{ pivotMode }}</span>
      <span>{{ editor.selection.selectedIds.length }} selected</span>
      <span v-if="snapPreviewText">{{ snapPreviewText }}</span>
    </div>
    <div v-if="selectionBox.visible" class="selection-box" :style="selectionRectStyle"></div>
    <div v-if="overlapCandidates.length" class="overlap-panel">
      <strong>Select</strong>
      <button v-for="candidate in overlapCandidates" :key="candidate.entityId" type="button" @click="selectOverlap(candidate)">
        <span>{{ candidate.name }}</span>
        <small>{{ candidate.type }} / {{ candidate.path }}</small>
      </button>
    </div>
  </section>
</template>
