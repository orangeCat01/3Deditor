const enUS = {
  app: { title: 'Web 3D Editor', subtitle: 'Professional Editor Layout', language: '中文' },
  menu: {
    title: 'Main Menu', file: 'File', edit: 'Edit', object: 'Object', run: 'Run', window: 'Window', help: 'Help',
    newScene: 'New Scene', open: 'Open', save: 'Save', import: 'Import', export: 'Export', undo: 'Undo', redo: 'Redo',
    copy: 'Copy', paste: 'Paste', delete: 'Delete', createObject: 'Create Object', group: 'Group', ungroup: 'Ungroup',
    preview: 'Preview', play: 'Play', pause: 'Pause', stop: 'Stop', aboutText: 'Entity / Component based Web 3D Editor'
  },
  toolbar: {
    title: 'Toolbar', selection: 'Selection', addCube: 'Add Cube', exportJson: 'Export JSON', importJson: 'Import JSON', undo: 'Undo', redo: 'Redo',
    translate: 'Translate', rotate: 'Rotate', scale: 'Scale', world: 'World', local: 'Local', gridSnap: 'Grid Snap', angleSnap: 'Angle Snap', pivot: 'Pivot mode', angle: 'Angle snap'
  },
  workspace: { title: 'Workspace', modeling: 'Modeling', animation: 'Animation', material: 'Material', runtime: 'Runtime' },
  panel: {
    sceneGraph: 'Scene', assets: 'Assets', inspector: 'Inspector', properties: 'Properties', timeline: 'Timeline', animation: 'Animation', shader: 'Shader', postFX: 'Post FX', physics: 'Physics', performance: 'Performance', console: 'Console',
    collapse: 'Collapse', expand: 'Expand', shaderHint: 'Shader assets and uniforms are managed by the Inspector and Shader system.', physicsHint: 'Physics and collider properties are managed by the Schema Inspector.', consoleHint: 'Reserved panel for editor events and plugin logs.'
  },
  viewport: { camera: 'Camera', perspective: 'Perspective', runtimeMode: 'Runtime Mode', performance: 'Performance', selected: 'selected' },
  runtime: { edit: 'Edit', preview: 'Preview', play: 'Play', pause: 'Pause', stop: 'Stop' },
  pivot: { 'object-origin': 'Object Origin', 'selection-center': 'Selection Center', 'bounding-box-center': 'Bounding Box Center', 'active-object': 'Active Object', 'world-origin': 'World Origin' },
  scene: { graph: 'Scene Graph', roots: '{count} roots', search: 'Search', all: 'All', mesh: 'Mesh', group: 'Group', root: 'Root' },
  hierarchy: { duplicate: 'Duplicate', group: 'Group', ungroup: 'Ungroup', delete: 'Delete', rename: 'Rename entity', visible: 'Visible', hidden: 'Hidden', locked: 'Locked', unlocked: 'Unlocked', up: 'Up', down: 'Down' },
  inspector: { title: 'Inspector', schemaDriven: 'Schema Driven', selectEntity: 'Select an entity', name: 'Name', reset: 'Reset', enabled: 'Enabled' },
  assets: { title: 'Assets', all: 'All', search: 'Search assets', model: 'Model', material: 'Material', texture: 'Texture', hdri: 'HDRI', animation: 'Animation', shader: 'Shader' },
  timeline: { title: 'Timeline', readOnly: 'Read Only', noClip: 'No animation clip', play: 'Play', pause: 'Pause', stop: 'Stop', loop: 'Loop', frame: 'Frame' },
  postprocess: { title: 'Post FX', active: '{count} Active', bloom: 'Bloom', toneMapping: 'Tone Mapping', fxaa: 'FXAA' },
  performance: { title: 'Performance', monitor: 'Monitor' },
  animation: { title: 'Animation', activeClip: 'Active Clip', autoplay: 'Autoplay', playing: 'Playing', speed: 'Speed', duration: 'Tween Duration', delay: 'Tween Delay', loop: 'Tween Loop', easing: 'Tween Easing', autoStart: 'Tween Auto Start' },
  physics: { title: 'Physics', mass: 'Mass', friction: 'Friction', restitution: 'Restitution', enabled: 'Enabled', collider: 'Collider', shape: 'Shape', radius: 'Radius', height: 'Height', isTrigger: 'Is Trigger' },
  plugin: { title: 'Plugin', gridHelper: 'Grid Helper Plugin' },
  dialog: { confirm: 'Confirm', cancel: 'Cancel' },
  command: { createEntity: 'Create Entity', deleteEntity: 'Delete Entity', duplicateEntity: 'Duplicate Entity', move: 'Move', rotate: 'Rotate', scale: 'Scale', setMaterial: 'Set Material', setAnimation: 'Set Animation' },
  entity: { cube: 'Cube', camera: 'Camera', light: 'Light', mesh: 'Mesh', group: 'Group', object: 'Object' },
  transform: { title: 'Transform', position: 'Position', rotation: 'Rotation', scale: 'Scale' },
  material: { title: 'Material', color: 'Base Color', textureAssetId: 'Texture', normalMapAssetId: 'Normal Map', aoMapAssetId: 'AO Map', emissive: 'Emissive', metalness: 'Metalness', roughness: 'Roughness', opacity: 'Opacity', transparent: 'Transparency', alphaTest: 'Alpha Test', blendMode: 'Blend Mode', side: 'Side', depthTest: 'Depth Test', depthWrite: 'Depth Write' },
  shader: { title: 'Shader', enabled: 'Enabled', shaderAssetId: 'Shader Asset', vertexShader: 'Vertex Shader', fragmentShader: 'Fragment Shader' },
  timer: { title: 'Timer', delay: 'Delay', repeat: 'Repeat', repeatCount: 'Repeat Count', autoStart: 'Auto Start', paused: 'Paused' }
} as const;

export default enUS;
