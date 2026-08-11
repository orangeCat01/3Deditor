# 开发说明

## 常用命令

```bash
npm test
npm run typecheck
npm run build
npm run dev -- --host 127.0.0.1
```

## 代码规范

- Vue 只调用 Editor Core，不直接操作 Three.js。
- 场景结构修改必须进入 Command。
- Transform 旋转使用 Quaternion 作为权威数据。
- Object3D、Physics runtime object、GPU resource 不进入业务序列化。
- 新模块优先补测试，再实现。
- 中文注释只写在关键架构边界和非显然逻辑处。
