# Web 3D Editor

一个基于 **Vue 3 + TypeScript + Vite + Three.js** 构建的浏览器端 3D 场景编辑器。

项目采用模块化编辑器架构，支持在浏览器中创建、编辑、导入、序列化和运行 3D 场景。核心设计基于 Entity Component 模型、Command 命令系统和 Three.js Adapter 适配层，让编辑器数据、运行时数据和渲染对象保持清晰分离。

## 功能特性

- Editor Core：编辑器核心状态和系统调度
- Entity / Component：实体组件架构
- Command / Undo / Redo：命令模式、撤销和重做
- Scene Graph：创建、删除、复制、重命名、分组、解组和父子层级调整
- Selection / Transform：选择、移动、旋转、缩放、Gizmo、Pivot 和 Snap
- Inspector Schema：基于 Schema 的属性面板编辑
- Asset System：资源注册和引用管理
- GLTF / GLB Import：模型导入并转换为编辑器实体树
- Material / Texture：基础颜色、贴图、金属度、粗糙度、法线和透明度
- Scene Serializer：场景导出、导入和版本迁移
- Animation / Tween / Timer：动画片段、补间动画、定时器和运行时更新
- Runtime Loop / Runtime Export：播放模式、停止恢复和运行时场景导出
- Shader System：自定义 Shader、Uniform 管理和错误处理
- Post Processing：可扩展后处理 Pass 管线
- Physics / Collider：Collider、质量、重力、碰撞和 Trigger 事件
- Plugin System：插件安装、启用、禁用、卸载和 GridHelperPlugin 示例
- i18n：中文和英文切换
- Layout System：Dock 面板、Workspace 切换和布局保存恢复
- Performance Monitor：FPS、Draw Calls、实体数量、贴图数量和 Shader 数量统计

## 技术栈

- Vue 3
- TypeScript
- Vite
- Three.js
- Pinia
- Vue I18n
- Vitest

## 项目结构

```text
src/
  app/                Vue 应用入口、全局编辑器实例和共享状态
  editor/             编辑器核心、命令、组件、系统、运行时
  engine/three/       Three.js 场景适配器和资源释放管理
  i18n/               Vue I18n 初始化
  layout/             Dock 布局、面板注册和工作区管理
  locales/            中英文语言包
  panels/             编辑器 UI 面板
  viewport/           3D 视口面板
tests/                Vitest 单元测试、集成测试和最终验收测试
docs/                 架构、开发、插件 API 和场景格式文档
outputs/              E2E 验收截图和导出样例
```

## 在线体验
http://47.109.207.74:3001/3Deditor/
## 快速开始

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck
```

运行测试：

```bash
npm test
```

生产构建：

```bash
npm run build
```


## 设计原则

- 编辑器数据不直接依赖 Three.js Object3D
- 业务操作统一通过 Command 系统进入，便于撤销和重做
- Entity / Component 是场景数据源，Three.js Adapter 只负责显示同步
- Runtime 运行状态不污染编辑状态
- 插件通过 PluginContext 访问编辑器能力，不直接改核心架构

## 预览
<img width="1914" height="925" alt="image" src="https://github.com/user-attachments/assets/5d12a559-72de-46f5-ad6a-55fb1ab741eb" />

