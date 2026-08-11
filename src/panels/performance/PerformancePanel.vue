<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { editor, editorVersion } from '../../app/editorInstance';
import { postProcessingManager } from '../../app/postProcessingInstance';
import { PerformanceMonitor } from '../../editor/performance/PerformanceMonitor';
import { ThreeSceneAdapter } from '../../engine/three/ThreeSceneAdapter';

const { t } = useI18n();

const adapter = new ThreeSceneAdapter(editor);

const metrics = computed(() => {
  editorVersion.value;
  adapter.sync();
  return new PerformanceMonitor(editor, adapter, postProcessingManager).snapshot();
});
</script>

<template>
  <section class="performance-panel">
    <div class="panel-header">
      <strong>{{ t('performance.title') }}</strong>
      <small>{{ t('performance.monitor') }}</small>
    </div>
    <dl class="perf-grid">
      <div><dt>FPS</dt><dd>{{ metrics.fps }}</dd></div>
      <div><dt>Draw Calls</dt><dd>{{ metrics.drawCalls }}</dd></div>
      <div><dt>Entity</dt><dd>{{ metrics.entityCount }}</dd></div>
      <div><dt>Mesh</dt><dd>{{ metrics.meshCount }}</dd></div>
      <div><dt>Triangles</dt><dd>{{ metrics.triangleCount }}</dd></div>
      <div><dt>Textures</dt><dd>{{ metrics.textureCount }}</dd></div>
      <div><dt>Geometry KB</dt><dd>{{ Math.round(metrics.geometryMemory / 1024) }}</dd></div>
      <div><dt>Texture KB</dt><dd>{{ Math.round(metrics.textureMemory / 1024) }}</dd></div>
      <div><dt>Shaders</dt><dd>{{ metrics.shaderCount }}</dd></div>
      <div><dt>Passes</dt><dd>{{ metrics.activePassCount }}</dd></div>
    </dl>
  </section>
</template>

