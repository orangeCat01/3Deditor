<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { editor, editorVersion, importerRegistry } from '../../app/editorInstance';
import type { AssetType } from '../../editor/assets/AssetManager';

const { t } = useI18n();

const search = ref('');
const typeFilter = ref<AssetType | 'All'>('All');
const assetTypes: Array<AssetType | 'All'> = ['All', 'Model', 'Material', 'Texture', 'HDRI', 'Animation', 'Shader'];

const assets = computed(() => {
  editorVersion.value;
  const keyword = search.value.trim().toLowerCase();
  return editor.assets.all.filter((asset) => {
    const typeMatches = typeFilter.value === 'All' || asset.type === typeFilter.value;
    const nameMatches = keyword.length === 0 || asset.name.toLowerCase().includes(keyword);
    return typeMatches && nameMatches;
  });
});

function registerPlaceholder(type: AssetType): void {
  editor.assets.register({
    type,
    name: `${type} Asset`,
    url: `memory://${type.toLowerCase()}`,
    metadata: { placeholder: true }
  });
  editor.notifySceneChanged();
}

function assetTypeLabel(type: AssetType | 'All'): string {
  if (type === 'All') return t('assets.all');
  return t('assets.' + type.toLowerCase());
}

function startDrag(event: DragEvent, assetId: string): void {
  event.dataTransfer?.setData('application/x-editor-asset', assetId);
}

async function importFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  for (const file of files) {
    const importer = importerRegistry.findByFileName(file.name);
    if (importer) await importer.import(file, editor);
  }
  input.value = '';
}
</script>

<template>
  <aside>
    <div class="panel-header">
      <strong>{{ t('assets.title') }}</strong>
      <small>{{ assets.length }}</small>
    </div>
    <div class="panel-tools">
      <input v-model="search" :placeholder="t('assets.search')" />
      <select v-model="typeFilter">
        <option v-for="type in assetTypes" :key="type" :value="type">{{ assetTypeLabel(type) }}</option>
      </select>
    </div>
    <div class="panel-tools compact-tools asset-actions">
      <button type="button" @click="registerPlaceholder('Model')">{{ t('assets.model') }}</button>
      <button type="button" @click="registerPlaceholder('Material')">{{ t('assets.material') }}</button>
      <button type="button" @click="registerPlaceholder('Texture')">{{ t('assets.texture') }}</button>
      <button type="button" @click="registerPlaceholder('Shader')">{{ t('assets.shader') }}</button>
      <label class="file-button">GLTF<input type="file" accept=".gltf,.glb" multiple @change="importFiles" /></label>
    </div>
    <div class="asset-grid">
      <article v-for="asset in assets" :key="asset.id" class="asset-card" draggable="true" @dragstart="startDrag($event, asset.id)">
        <div class="asset-thumb">{{ asset.type.slice(0, 2) }}</div>
        <strong>{{ asset.name }}</strong>
        <small>{{ asset.type }} / refs {{ asset.references.length }}</small>
      </article>
    </div>
  </aside>
</template>



