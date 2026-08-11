# Plugin API

插件通过 `PluginManager` 管理生命周期：install、enable、disable、uninstall。

`PluginContext` 提供 Editor API、注册 API、Command API、Event API、Asset API。

插件禁止直接修改 Three.js Scene。插件必须通过 Editor Core 或 Command 修改场景。插件异常会记录到 PluginState，不中断主编辑器。

示例插件：`src/editor/plugin/demo/GridHelperPlugin.ts`。
