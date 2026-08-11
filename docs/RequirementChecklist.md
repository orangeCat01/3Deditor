# 需求验收清单

| 模块 | 完成状态 | 代码位置 | 测试状态 |
|---|---:|---|---|
| 对象 CRUD | 已完成 | `src/editor/commands/CreateEntityCommand.ts`, `DeleteEntityCommand.ts`, `DuplicateEntityCommand.ts` | `tests/second-stage.test.ts`, `tests/final-validation.test.ts` |
| Scene Graph | 已完成 | `src/editor/scene/SceneGraph.ts`, `src/panels/hierarchy/HierarchyPanel.vue` | `tests/second-stage.test.ts` |
| Selection | 已完成 | `src/editor/selection/SelectionManager.ts`, `RectangleSelection.ts`, `OverlapSelection.ts` | `tests/third-stage.test.ts`, `tests/fourth-stage.test.ts` |
| Transform / Gizmo | 已完成 | `src/editor/commands/SetTransformCommand.ts`, `TransformSelectionCommand.ts`, `src/viewport/ViewportPanel.vue` | `tests/editor-core.test.ts`, `tests/fourth-stage.test.ts` |
| Pivot | 已完成 | `src/editor/transform/PivotManager.ts` | `tests/second-stage.test.ts` |
| Snap | 已完成 | `src/editor/snap/SnapManager.ts`, `VertexSnapper.ts` | `tests/second-stage.test.ts`, `tests/fourth-stage.test.ts` |
| Inspector | 已完成 | `src/editor/inspector/InspectorSchemaRegistry.ts`, `src/panels/inspector/InspectorPanel.vue` | `tests/fifth-stage.test.ts` |
| Undo / Redo | 已完成 | `src/editor/commands/CommandManager.ts`, `CompositeCommand.ts` | 全阶段测试覆盖 |
| Asset Manager | 已完成 | `src/editor/assets/AssetManager.ts`, `AssetReferenceManager.ts` | `tests/second-stage.test.ts`, `tests/third-stage.test.ts` |
| GLTF / GLB | 已完成 | `src/editor/importer/gltf/GLTFImporter.ts`, `GLTFEntityBuilder.ts` | `tests/third-stage.test.ts`, `tests/final-validation.test.ts` |
| Scene Save / Load | 已完成 | `src/editor/serializer/SceneSerializer.ts`, `SceneDeserializer.ts` | `tests/fifth-stage.test.ts`, `tests/final-validation.test.ts` |
| Animation | 已完成 | `src/editor/animation/AnimationSystem.ts`, `AnimationComponent.ts` | `tests/sixth-stage.test.ts` |
| Timer | 已完成 | `src/editor/timer/TimerSystem.ts`, `TimerComponent.ts` | `tests/sixth-stage.test.ts`, `tests/final-validation.test.ts` |
| Shader | 已完成 | `src/editor/shader/`, `src/engine/three/ThreeSceneAdapter.ts` | `tests/seventh-stage.test.ts`, `tests/final-validation.test.ts` |
| Post Processing | 已完成基础框架 | `src/editor/postprocess/`, `src/panels/postprocess/PostProcessingPanel.vue` | `tests/seventh-stage.test.ts` |
| Runtime Export | 已完成 | `src/editor/runtime/export/RuntimeExporter.ts` | `tests/sixth-stage.test.ts`, `tests/final-validation.test.ts` |
| Physics / Collider | 已完成基础框架 | `src/editor/physics/`, `SetPhysicsCommand.ts`, `SetColliderCommand.ts` | `tests/eighth-stage.test.ts`, `tests/final-validation.test.ts` |
| Plugin | 已完成基础框架 | `src/editor/plugin/` | `tests/eighth-stage.test.ts`, `tests/final-validation.test.ts` |
