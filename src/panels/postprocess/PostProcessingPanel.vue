<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { editor, editorVersion } from '../../app/editorInstance';
import { postProcessingManager } from '../../app/postProcessingInstance';
import { SetPostProcessPassCommand } from '../../editor/commands/SetPostProcessPassCommand';
import type { PostProcessPass } from '../../editor/postprocess/PostProcessPass';

const { t } = useI18n();

const passes = computed(() => {
  editorVersion.value;
  return postProcessingManager.all;
});

function updateEnabled(pass: PostProcessPass, enabled: boolean): void {
  editor.execute(new SetPostProcessPassCommand(postProcessingManager, pass.id, { enabled }));
}

function updateNumber(pass: PostProcessPass, key: string, value: string): void {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return;
  editor.execute(new SetPostProcessPassCommand(postProcessingManager, pass.id, { parameters: { [key]: numeric } }));
}
</script>

<template>
  <section class="post-panel">
    <div class="panel-header">
      <strong>{{ t('postprocess.title') }}</strong>
      <small>{{ t('postprocess.active', { count: passes.filter((pass) => pass.enabled).length }) }}</small>
    </div>
    <div class="post-list">
      <article v-for="pass in passes" :key="pass.id" class="post-pass">
        <label class="schema-check">
          <input type="checkbox" :checked="pass.enabled" @change="updateEnabled(pass, ($event.target as HTMLInputElement).checked)" />
          <span>{{ t(`postprocess.${pass.id === 'ToneMapping' ? 'toneMapping' : pass.id.toLowerCase()}`) }}</span>
        </label>
        <label v-for="(value, key) in pass.parameters" :key="key" class="post-param">
          <span>{{ key }}</span>
          <input v-if="typeof value === 'number'" type="number" step="0.05" :value="value" @change="updateNumber(pass, key, ($event.target as HTMLInputElement).value)" />
          <span v-else>{{ String(value) }}</span>
        </label>
      </article>
    </div>
  </section>
</template>

