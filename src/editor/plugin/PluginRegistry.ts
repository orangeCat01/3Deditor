export class PluginRegistry {
  readonly tools: string[] = [];
  readonly menus: string[] = [];
  readonly panels: string[] = [];
  readonly inspectors: string[] = [];
  readonly components: string[] = [];
  readonly commands: string[] = [];
  readonly importers: string[] = [];
  readonly exporters: string[] = [];
  readonly assetTypes: string[] = [];
  readonly shaderTemplates: string[] = [];
  readonly postProcessPasses: string[] = [];

  add(kind: keyof PluginRegistry, id: string): void {
    const target = this[kind];
    if (Array.isArray(target) && !target.includes(id)) target.push(id);
  }

  remove(id: string): void {
    Object.values(this).forEach((value) => {
      if (!Array.isArray(value)) return;
      for (let index = value.length - 1; index >= 0; index -= 1) {
        if (value[index] === id) value.splice(index, 1);
      }
    });
  }
}

