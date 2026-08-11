import type { PostProcessPass, PostProcessPassPatch, PostProcessPassType } from './PostProcessPass';

export class PostProcessingManager {
  private readonly passes = new Map<PostProcessPassType, PostProcessPass>();

  constructor(readonly registry = new (class {})()) {}

  get all(): PostProcessPass[] {
    return [...this.passes.values()].map((pass) => structuredClone(pass));
  }

  get activePassCount(): number {
    return [...this.passes.values()].filter((pass) => pass.enabled).length;
  }

  addPass(pass: PostProcessPass): void {
    this.passes.set(pass.id, structuredClone(pass));
  }

  getPass(id: PostProcessPassType): PostProcessPass | undefined {
    const pass = this.passes.get(id);
    return pass ? structuredClone(pass) : undefined;
  }

  updatePass(id: PostProcessPassType, patch: PostProcessPassPatch): void {
    const current = this.passes.get(id);
    if (!current) return;
    this.passes.set(id, {
      ...current,
      ...patch,
      parameters: { ...current.parameters, ...(patch.parameters ?? {}) }
    });
  }

  update(): void {
    // EffectComposer 接入点：本阶段维护 Pass 链数据，渲染器层后续消费。
  }
}
