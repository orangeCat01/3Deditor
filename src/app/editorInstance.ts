import { shallowRef } from 'vue';
import { Editor } from '../editor/Editor';
import { AddEntityCommand } from '../editor/commands/AddEntityCommand';
import { createCubeEntity } from '../editor/factories/entityFactories';
import { ImporterRegistry } from '../editor/importer/ImporterRegistry';
import { GLTFImporter } from '../editor/importer/gltf/GLTFImporter';

export const editor = new Editor();
export const editorVersion = shallowRef(0);
export const importerRegistry = new ImporterRegistry();

importerRegistry.register(new GLTFImporter());

editor.events.on('sceneChanged', () => {
  editorVersion.value += 1;
});

editor.events.on('selectionChanged', () => {
  editorVersion.value += 1;
});

editor.execute(new AddEntityCommand(editor, createCubeEntity('Cube')));
