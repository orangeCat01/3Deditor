import type { PostProcessPass, PostProcessPassType } from './PostProcessPass';

export class PassRegistry {
  create(type: PostProcessPassType): PostProcessPass {
    if (type === 'Bloom') return { id: 'Bloom', label: 'Bloom', enabled: false, parameters: { strength: 0.8, radius: 0.2 } };
    if (type === 'ToneMapping') return { id: 'ToneMapping', label: 'Tone Mapping', enabled: true, parameters: { exposure: 1 } };
    if (type === 'FXAA') return { id: 'FXAA', label: 'FXAA', enabled: true, parameters: { enabled: true } };
    return { id: type, label: type, enabled: false, parameters: {} };
  }
}
