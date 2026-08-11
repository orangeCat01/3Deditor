export type PostProcessPassType = 'Bloom' | 'ToneMapping' | 'FXAA' | 'DepthOfField' | 'ColorCorrection' | 'Vignette' | 'SMAA';

export interface PostProcessPass {
  id: PostProcessPassType;
  label: string;
  enabled: boolean;
  parameters: Record<string, number | boolean | string>;
}

export type PostProcessPassPatch = Partial<Omit<PostProcessPass, 'id' | 'label'>>;
