# Runtime 说明

RuntimeLoop 固定顺序：

```text
Clock Update -> Timer Update -> Animation Update -> Tween Update -> Physics Update -> Shader Uniform Update -> Post Processing Update -> Render
```

Play 进入运行态前保存编辑快照。Stop 使用 SceneDeserializer 恢复快照。Preview/Play 允许 Animation、Tween、Timer、Physics 推进。

Runtime Export 使用 `RuntimeExporter` 导出运行时 JSON，保留 Entity、Component、Asset Reference、Animation、Tween、Timer、Physics、Shader 配置，剔除 History、Selection、Hover、Helper、Gizmo 和 UI 状态。
