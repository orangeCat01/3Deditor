<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { editor, editorVersion } from '../../app/editorInstance';
import { cloneAnimationComponent } from '../../editor/animation/AnimationComponent';
import { UpdateAnimationClipCommand } from '../../editor/commands/UpdateAnimationClipCommand';
import { RuntimeClock } from '../../editor/runtime/RuntimeClock';
import { RuntimeLoop } from '../../editor/runtime/RuntimeLoop';
import { RuntimeModeManager } from '../../editor/runtime/RuntimeModeManager';

const { t } = useI18n();

const clock = new RuntimeClock();
const mode = new RuntimeModeManager(editor);
const loop = new RuntimeLoop(editor, clock, mode);
const timelineTime = ref(0);
const rafId = ref<number | null>(null);

const activeAnimation = computed(() => {
  editorVersion.value;
  const activeId = editor.selection.activeId;
  return activeId ? editor.entities.get(activeId)?.components.animation : undefined;
});

const activeClip = computed(() => {
  const animation = activeAnimation.value;
  if (!animation) return undefined;
  return animation.clips.find((clip) => clip.id === animation.activeClipId) ?? animation.clips[0];
});

const currentFrame = computed(() => {
  const clip = activeClip.value;
  if (!clip) return 0;
  return Math.round((timelineTime.value / 1000) * clip.fps);
});

const keyframes = computed(() => activeClip.value?.tracks.flatMap((track) => track.keyframes.map((keyframe) => ({ ...keyframe, property: track.property }))) ?? []);

function play(): void {
  setPlayback(true);
  mode.play();
  clock.play();
  tick();
}

function pause(): void {
  clock.pause();
  mode.pause();
  setPlayback(false);
}

function stop(): void {
  if (rafId.value !== null) cancelAnimationFrame(rafId.value);
  rafId.value = null;
  clock.reset();
  timelineTime.value = 0;
  mode.stop();
}

function toggleLoop(): void {
  const clip = activeClip.value;
  const activeId = editor.selection.activeId;
  if (!clip || !activeId) return;
  editor.execute(new UpdateAnimationClipCommand(editor, activeId, clip.id, { loop: !clip.loop }));
}

function setPlayback(playing: boolean): void {
  const activeId = editor.selection.activeId;
  const animation = activeId ? editor.entities.get(activeId)?.components.animation : undefined;
  if (!activeId || !animation) return;
  const next = cloneAnimationComponent(animation);
  next.playing = playing;
  editor.entities.replaceAnimation(activeId, next);
  editor.notifySceneChanged();
}

function seek(value: string): void {
  const next = Number(value);
  timelineTime.value = Number.isFinite(next) ? next : 0;
}

function tick(): void {
  if (clock.paused) return;
  clock.update(16);
  timelineTime.value = clock.elapsedTime;
  loop.tick();
  rafId.value = requestAnimationFrame(tick);
}

onUnmounted(() => {
  if (rafId.value !== null) cancelAnimationFrame(rafId.value);
});
</script>

<template>
  <section class="timeline-panel">
    <div class="panel-header">
      <strong>{{ t('timeline.title') }}</strong>
      <small>{{ t('timeline.readOnly') }}</small>
    </div>
    <div v-if="activeClip" class="timeline-body">
      <div class="timeline-meta">
        <strong>{{ activeClip.name }}</strong>
        <span>{{ Math.round(activeClip.duration) }} ms</span>
        <span>{{ t('timeline.frame') }} {{ currentFrame }}</span>
      </div>
      <div class="timeline-controls">
        <button type="button" @click="play">{{ t('timeline.play') }}</button>
        <button type="button" @click="pause">{{ t('timeline.pause') }}</button>
        <button type="button" @click="stop">{{ t('timeline.stop') }}</button>
        <button type="button" :class="{ active: activeClip.loop }" @click="toggleLoop">{{ t('timeline.loop') }}</button>
      </div>
      <input class="timeline-range" type="range" min="0" :max="activeClip.duration" :value="timelineTime" @input="seek(($event.target as HTMLInputElement).value)" />
      <div class="keyframe-strip">
        <span
          v-for="(keyframe, index) in keyframes"
          :key="`${keyframe.property}-${keyframe.time}-${index}`"
          class="keyframe-dot"
          :title="`${keyframe.property} @ ${keyframe.time}ms`"
          :style="{ left: `${Math.min(100, Math.max(0, (keyframe.time / activeClip.duration) * 100))}%` }"
        ></span>
      </div>
    </div>
    <div v-else class="empty-state">{{ t('timeline.noClip') }}</div>
  </section>
</template>

