import { shallowRef } from 'vue';
import type { PivotMode } from '../editor/transform/PivotManager';

export type TransformMode = 'translate' | 'rotate' | 'scale';
export type TransformSpace = 'world' | 'local';

export const transformMode = shallowRef<TransformMode>('translate');
export const transformSpace = shallowRef<TransformSpace>('world');
export const pivotMode = shallowRef<PivotMode>('selection-center');
