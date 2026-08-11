<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PanelDescriptor, WorkspaceId } from './types';

const props = defineProps<{ panels: PanelDescriptor[]; workspace: WorkspaceId }>();
const emit = defineEmits<{
  newScene: [];
  importScene: [event: Event];
  exportScene: [];
  addCube: [];
  undo: [];
  redo: [];
  duplicate: [];
  group: [];
  ungroup: [];
  delete: [];
  runtime: [mode: 'Preview' | 'Play' | 'Pause' | 'Stop'];
  togglePanel: [id: string];
}>();

const { t } = useI18n();
const groupedPanels = computed(() => props.panels.filter((panel) => panel.position !== 'center'));
</script>

<template>
  <nav class="menu-bar" :aria-label="t('menu.title')">
    <div class="brand compact-brand">
      <span class="brand-mark"></span>
      <strong>{{ t('app.title') }}</strong>
    </div>
    <div class="menu-group">
      <details class="menu-item">
        <summary>{{ t('menu.file') }}</summary>
        <div class="menu-popover">
          <button type="button" @click="emit('newScene')">{{ t('menu.newScene') }}</button>
          <label class="menu-file">{{ t('menu.open') }}<input type="file" accept=".json" @change="emit('importScene', $event)" /></label>
          <button type="button" @click="emit('exportScene')">{{ t('menu.save') }}</button>
          <label class="menu-file">{{ t('menu.import') }}<input type="file" accept=".json" @change="emit('importScene', $event)" /></label>
          <button type="button" @click="emit('exportScene')">{{ t('menu.export') }}</button>
        </div>
      </details>
      <details class="menu-item">
        <summary>{{ t('menu.edit') }}</summary>
        <div class="menu-popover">
          <button type="button" @click="emit('undo')">{{ t('menu.undo') }}</button>
          <button type="button" @click="emit('redo')">{{ t('menu.redo') }}</button>
          <button type="button" @click="emit('duplicate')">{{ t('menu.copy') }}</button>
          <button type="button" @click="emit('duplicate')">{{ t('menu.paste') }}</button>
          <button type="button" @click="emit('delete')">{{ t('menu.delete') }}</button>
        </div>
      </details>
      <details class="menu-item">
        <summary>{{ t('menu.object') }}</summary>
        <div class="menu-popover">
          <button type="button" @click="emit('addCube')">{{ t('menu.createObject') }}</button>
          <button type="button" @click="emit('group')">{{ t('menu.group') }}</button>
          <button type="button" @click="emit('ungroup')">{{ t('menu.ungroup') }}</button>
        </div>
      </details>
      <details class="menu-item">
        <summary>{{ t('menu.run') }}</summary>
        <div class="menu-popover">
          <button type="button" @click="emit('runtime', 'Preview')">{{ t('menu.preview') }}</button>
          <button type="button" @click="emit('runtime', 'Play')">{{ t('menu.play') }}</button>
          <button type="button" @click="emit('runtime', 'Pause')">{{ t('menu.pause') }}</button>
          <button type="button" @click="emit('runtime', 'Stop')">{{ t('menu.stop') }}</button>
        </div>
      </details>
      <details class="menu-item">
        <summary>{{ t('menu.window') }}</summary>
        <div class="menu-popover panel-menu">
          <button v-for="panel in groupedPanels" :key="panel.id" type="button" @click="emit('togglePanel', panel.id)">
            <span>{{ panel.visible ? '●' : '○' }}</span>{{ t(panel.titleKey) }}
          </button>
        </div>
      </details>
      <details class="menu-item">
        <summary>{{ t('menu.help') }}</summary>
        <div class="menu-popover">
          <span class="menu-about">{{ t('menu.aboutText') }}</span>
        </div>
      </details>
    </div>
  </nav>
</template>
