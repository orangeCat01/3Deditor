# 架构说明

```text
Vue UI -> Editor Core -> Entity / Component -> Command System -> Runtime Loop -> ThreeSceneAdapter -> Three.js Renderer
```

Vue 面板只读取 Editor 状态并提交 Command，不直接修改 Three.js `Object3D`。业务数据以 Entity / Component 为准，Three.js 对象由 Adapter 同步生成。

## 模块边界

- `src/editor/`：编辑器核心、ECS、命令、序列化、运行时系统。
- `src/engine/three/`：Three.js 映射与资源释放。
- `src/panels/`：Vue 面板，只通过 Editor Core 交互。
- `tests/`：阶段测试与最终验收测试。

## 生命周期

场景结构修改必须经过 Command。运行时 Play 前保存快照，Stop 时恢复编辑状态，运行结果不污染编辑场景。

## 资源释放

删除 Entity 后由 Adapter 移除 Object3D，并通过 ResourceDisposeManager 释放 Geometry、Material、Texture。ShaderMaterial、RenderTarget 生命周期通过 ResourceLifecycleManager 预留统计入口。
