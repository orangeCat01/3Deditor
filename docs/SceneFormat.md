# 场景格式

自定义场景格式不使用 `THREE.Scene.toJSON()`。

```json
{
  "version": "1.0",
  "scene": { "rootEntities": [] },
  "entities": {},
  "assets": {},
  "settings": {}
}
```

Entity 保存 `id`、`name`、`parentId`、`children`、`components`、`editor metadata`。

不保存 Object3D、Gizmo、Helper、Hover、Selection、History。

Transform 只保存 `position`、`quaternion`、`scale`。旋转权威数据是 Quaternion，不保存 Euler。

Asset 保存 ID、类型、URL/source、metadata 和引用关系。纹理、模型、Shader 等资源通过引用恢复，不复制运行时 GPU 对象。
