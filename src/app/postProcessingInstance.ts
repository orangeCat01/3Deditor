import { PassRegistry } from '../editor/postprocess/PassRegistry';
import { PostProcessingManager } from '../editor/postprocess/PostProcessingManager';

export const passRegistry = new PassRegistry();
export const postProcessingManager = new PostProcessingManager(passRegistry);

postProcessingManager.addPass(passRegistry.create('Bloom'));
postProcessingManager.addPass(passRegistry.create('ToneMapping'));
postProcessingManager.addPass(passRegistry.create('FXAA'));
