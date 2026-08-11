import type { Asset } from '../assets/AssetManager';
import type { Editor } from '../Editor';
import { SceneDeserializer } from '../serializer/SceneDeserializer';
import type { SerializedSceneDocument } from '../serializer/SceneVersion';
import type { EditorEntity } from '../types';
import type { Command } from './Command';

export class ImportSceneCommand implements Command {
  readonly name = 'Import Scene';
  private beforeEntities: EditorEntity[] = [];
  private beforeAssets: Asset[] = [];
  private afterEntities: EditorEntity[] = [];
  private afterAssets: Asset[] = [];

  constructor(private readonly editor: Editor, private readonly document: SerializedSceneDocument) {}

  execute(): void {
    this.beforeEntities = this.editor.entities.snapshot();
    this.beforeAssets = this.editor.assets.all;
    const result = new SceneDeserializer().deserialize(this.document);
    this.afterEntities = result.entities;
    this.afterAssets = result.assets;
    this.apply(this.afterEntities, this.afterAssets);
  }

  undo(): void {
    this.apply(this.beforeEntities, this.beforeAssets);
  }

  redo(): void {
    this.apply(this.afterEntities, this.afterAssets);
  }

  private apply(entities: EditorEntity[], assets: Asset[]): void {
    this.editor.clearSceneInternal();
    assets.forEach((asset) => this.editor.assets.restore(asset));
    this.editor.restoreEntitiesInternal(entities);
  }
}
