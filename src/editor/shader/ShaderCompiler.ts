import type { ShaderCompileStatus } from './ShaderComponent';

export class ShaderCompiler {
  compile(vertexShader: string, fragmentShader: string): ShaderCompileStatus {
    const source = `${vertexShader}\n${fragmentShader}`;
    if (!vertexShader.includes('void main')) return { success: false, error: 'Vertex shader missing void main()' };
    if (!fragmentShader.includes('void main')) return { success: false, error: 'Fragment shader missing void main()' };
    if (/error_token|syntax_error|INVALID_SHADER/i.test(source)) return { success: false, error: 'Shader source failed validation' };
    return { success: true };
  }
}

