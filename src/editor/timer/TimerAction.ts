import type { EntityId, QuaternionData, Vector3Data } from '../types';
import type { MaterialPatch } from '../components/RenderComponents';

export type TimerAction =
  | { type: 'PlayAnimation'; entityId: EntityId }
  | { type: 'PauseAnimation'; entityId: EntityId }
  | { type: 'StopAnimation'; entityId: EntityId }
  | { type: 'SetVisibility'; entityId: EntityId; visible: boolean }
  | { type: 'SetTransform'; entityId: EntityId; position?: Vector3Data; quaternion?: QuaternionData; scale?: Vector3Data }
  | { type: 'SetMaterialProperty'; entityId: EntityId; property: keyof MaterialPatch; value: MaterialPatch[keyof MaterialPatch] }
  | { type: 'SetShaderUniform'; entityId: EntityId; uniform: string; value: unknown }
  | { type: 'SwitchCamera'; entityId: EntityId }
  | { type: 'EmitEditorDefinedEvent'; eventName: string; payload?: unknown };
