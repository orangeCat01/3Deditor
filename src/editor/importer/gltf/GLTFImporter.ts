import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CreateAnimationClipCommand } from '../../commands/CreateAnimationClipCommand';
import type { Editor } from '../../Editor';
import type { Importer, ImportResult } from '../ImporterRegistry';
import { GLTFAnimationAdapter } from './GLTFAnimationAdapter';
import { GLTFEntityBuilder } from './GLTFEntityBuilder';

export class GLTFImporter implements Importer {
  readonly id = 'gltf';
  readonly label = 'glTF / GLB';
  readonly extensions = ['.gltf', '.glb'];

  async import(file: File, editor: Editor): Promise<ImportResult> {
    const modelAsset = editor.assets.register({
      type: 'Model',
      name: file.name,
      url: URL.createObjectURL(file),
      metadata: { format: file.name.toLowerCase().endsWith('.glb') ? 'glb' : 'gltf' }
    });

    const gltf = await this.parseFile(file);
    const build = new GLTFEntityBuilder(editor).build(gltf.scene, modelAsset.id);
    build.commands.forEach((command) => editor.execute(command));

    const clips = new GLTFAnimationAdapter().buildClips(gltf.animations ?? [], gltf.scene, build.uuidMap);
    clips.forEach((clip) => editor.execute(new CreateAnimationClipCommand(editor, build.rootEntityId, clip)));

    return { assetId: modelAsset.id, entityIds: build.entityIds };
  }

  private async parseFile(file: File): Promise<GLTF> {
    const loader = new GLTFLoader();
    const buffer = await file.arrayBuffer();
    return new Promise((resolve, reject) => {
      loader.parse(buffer, '', resolve, reject);
    });
  }
}
