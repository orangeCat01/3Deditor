<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { WorkspaceId } from './types';

const props = defineProps<{ modelValue: WorkspaceId; workspaces: WorkspaceId[] }>();
const emit = defineEmits<{ 'update:modelValue': [workspace: WorkspaceId] }>();
const { t } = useI18n();
</script>

<template>
  <div class="workspace-switcher" :aria-label="t('workspace.title')">
    <span>{{ t('workspace.title') }}</span>
    <button
      v-for="workspace in props.workspaces"
      :key="workspace"
      type="button"
      :class="{ active: props.modelValue === workspace }"
      @click="emit('update:modelValue', workspace)"
    >
      {{ t(`workspace.${workspace.toLowerCase()}`) }}
    </button>
  </div>
</template>
