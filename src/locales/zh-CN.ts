const zhCN = {
  app: { title: 'Web 3D 编辑器', subtitle: '专业编辑器布局', language: 'English' },
  menu: {
    title: '主菜单', file: '文件', edit: '编辑', object: '对象', run: '运行', window: '窗口', help: '帮助',
    newScene: '新建场景', open: '打开', save: '保存', import: '导入', export: '导出', undo: '撤销', redo: '重做',
    copy: '复制', paste: '粘贴', delete: '删除', createObject: '创建对象', group: '组合', ungroup: '解组',
    preview: '预览', play: '播放', pause: '暂停', stop: '停止', aboutText: '基于 Entity / Component 的 Web 端 3D 编辑器'
  },
  toolbar: {
    title: '工具栏', selection: '选择', addCube: '添加立方体', exportJson: '导出 JSON', importJson: '导入 JSON', undo: '撤销', redo: '重做',
    translate: '移动', rotate: '旋转', scale: '缩放', world: '世界', local: '本地', gridSnap: '网格吸附', angleSnap: '角度吸附', pivot: '轴心模式', angle: '角度吸附'
  },
  workspace: { title: '工作区', modeling: '建模', animation: '动画', material: '材质', runtime: '运行' },
  panel: {
    sceneGraph: '场景', assets: '资源', inspector: '检查器', properties: '属性', timeline: '时间轴', animation: '动画', shader: '着色器', postFX: '后处理', physics: '物理', performance: '性能', console: '控制台',
    collapse: '收起', expand: '展开', shaderHint: '着色器资源与 Uniform 状态由 Inspector 和 Shader 系统管理。', physicsHint: '物理与碰撞体属性由 Schema Inspector 管理。', consoleHint: '编辑器事件与插件日志预留面板。'
  },
  viewport: { camera: '相机', perspective: '透视', runtimeMode: '运行模式', performance: '性能', selected: '已选' },
  runtime: { edit: '编辑', preview: '预览', play: '播放', pause: '暂停', stop: '停止' },
  pivot: { 'object-origin': '对象原点', 'selection-center': '选择中心', 'bounding-box-center': '包围盒中心', 'active-object': '活动对象', 'world-origin': '世界原点' },
  scene: { graph: '场景层级', roots: '{count} 个根节点', search: '搜索', all: '全部', mesh: '网格', group: '组', root: '根节点' },
  hierarchy: { duplicate: '复制', group: '成组', ungroup: '解组', delete: '删除', rename: '重命名对象', visible: '显示', hidden: '隐藏', locked: '锁定', unlocked: '解锁', up: '上移', down: '下移' },
  inspector: { title: '检查器', schemaDriven: 'Schema 驱动', selectEntity: '请选择对象', name: '名称', reset: '重置', enabled: '启用' },
  assets: { title: '资源', all: '全部', search: '搜索资源', model: '模型', material: '材质', texture: '贴图', hdri: 'HDRI', animation: '动画', shader: '着色器' },
  timeline: { title: '时间轴', readOnly: '只读', noClip: '没有动画片段', play: '播放', pause: '暂停', stop: '停止', loop: '循环', frame: '帧' },
  postprocess: { title: '后处理', active: '{count} 个启用', bloom: '泛光', toneMapping: '色调映射', fxaa: 'FXAA' },
  performance: { title: '性能', monitor: '监控' },
  animation: { title: '动画', activeClip: '活动片段', autoplay: '自动播放', playing: '播放中', speed: '速度', duration: '补间时长', delay: '补间延迟', loop: '补间循环', easing: '缓动', autoStart: '自动开始' },
  physics: { title: '物理', mass: '质量', friction: '摩擦', restitution: '反弹', enabled: '启用', collider: '碰撞体', shape: '形状', radius: '半径', height: '高度', isTrigger: '触发器' },
  plugin: { title: '插件', gridHelper: '网格辅助插件' },
  dialog: { confirm: '确认', cancel: '取消' },
  command: { createEntity: '创建对象', deleteEntity: '删除对象', duplicateEntity: '复制对象', move: '移动', rotate: '旋转', scale: '缩放', setMaterial: '修改材质', setAnimation: '修改动画' },
  entity: { cube: '立方体', camera: '相机', light: '灯光', mesh: '网格', group: '组', object: '对象' },
  transform: { title: '变换', position: '位置', rotation: '旋转', scale: '缩放' },
  material: { title: '材质', color: '基础颜色', textureAssetId: '贴图', normalMapAssetId: '法线贴图', aoMapAssetId: 'AO 贴图', emissive: '自发光', metalness: '金属度', roughness: '粗糙度', opacity: '不透明度', transparent: '透明', alphaTest: '透明裁剪', blendMode: '混合模式', side: '面向', depthTest: '深度测试', depthWrite: '写入深度' },
  shader: { title: '着色器', enabled: '启用', shaderAssetId: '着色器资源', vertexShader: '顶点着色器', fragmentShader: '片元着色器' },
  timer: { title: '计时器', delay: '延迟', repeat: '重复', repeatCount: '重复次数', autoStart: '自动开始', paused: '暂停' }
} as const;

export default zhCN;
