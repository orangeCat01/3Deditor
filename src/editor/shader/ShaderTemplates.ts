import type { ShaderAssetInput } from './ShaderAsset';

export function createBasicColorShaderAsset(): ShaderAssetInput {
  return {
    name: 'Basic Color Shader',
    vertexSource: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentSource: 'uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.0); }',
    uniformSchema: { uColor: { type: 'color', defaultValue: '#44ccff' } },
    metadata: { template: true }
  };
}

export function createTimeWaveShaderAsset(): ShaderAssetInput {
  return {
    name: 'Time Wave Shader',
    vertexSource: 'uniform float uTime; void main() { vec3 p = position; p.y += sin(uTime + position.x) * 0.05; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentSource: 'uniform vec3 uColor; uniform float uTime; void main() { gl_FragColor = vec4(uColor * (0.7 + 0.3 * sin(uTime)), 1.0); }',
    uniformSchema: { uColor: { type: 'color', defaultValue: '#44ccff' }, uTime: { type: 'number', defaultValue: 0 } },
    metadata: { template: true }
  };
}

export function createTextureShaderAsset(): ShaderAssetInput {
  return {
    name: 'Texture Shader',
    vertexSource: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentSource: 'uniform sampler2D uTexture; varying vec2 vUv; void main() { gl_FragColor = texture2D(uTexture, vUv); }',
    uniformSchema: { uTexture: { type: 'texture', defaultValue: null } },
    metadata: { template: true }
  };
}
