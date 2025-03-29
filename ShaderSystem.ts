/**
 * ShaderSystem for SAAAM Engine
 * Provides tools for creating, compiling, and managing shaders
 * with support for custom DSL parsing
 */
class ShaderSystem {
  /**
   * Create a new shader system
   * @param {WebGLRenderer} renderer - Reference to the WebGL renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.gl = renderer ? renderer.gl : null;
    
    // Shader cache
    this.programs = new Map();
    
    // Default shaders
    this.defaultShaders = {
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: DEFAULT_FRAGMENT_SHADER
    };
    
    // DSL parser
    this.dslParser = new ShaderDSLParser();
  }
  
  /**
   * Initialize the shader system
   */
  initialize() {
    if (!this.gl) {
      console.error('Cannot initialize ShaderSystem: WebGL context not available');
      return false;
    }
    
    // Create standard shader programs
    this.createStandardShaders();
    
    return true;
  }
  
  /**
   * Create standard shader programs
   */
  createStandardShaders() {
    // Basic colored shader
    this.createProgram('basic', 
      DEFAULT_VERTEX_SHADER, 
      DEFAULT_FRAGMENT_SHADER
    );
    
    // Sprite shader
    this.createProgram('sprite',
      SPRITE_VERTEX_SHADER,
      SPRITE_FRAGMENT_SHADER
    );
    
    // Particle shader
    this.createProgram('particle',
      PARTICLE_VERTEX_SHADER,
      PARTICLE_FRAGMENT_SHADER
    );
    
    // Post-process shader
    this.createProgram('postprocess',
      POSTPROCESS_VERTEX_SHADER,
      POSTPROCESS_FRAGMENT_SHADER
    );
  }
  
  /**
   * Create a shader program from source code
   * @param {string} name - Program name
   * @param {string} vertexSource - Vertex shader source
   * @param {string} fragmentSource - Fragment shader source
   * @returns {Object} Shader program info
   */
  createProgram(name, vertexSource, fragmentSource) {
    const gl = this.gl;
    if (!gl) return null;
    
    // Check if program already exists
    if (this.programs.has(name)) {
      return this.programs.get(name);
    }
    
    // Create the program
    const program = this._createShaderProgram(vertexSource, fragmentSource);
    if (!program) {
      console.error(`Failed to create shader program: ${name}`);
      return null;
    }
    
    // Add to cache
    this.programs.set(name, program);
    
    return program;
  }
  
  /**
   * Create a shader program from DSL
   * @param {string} name - Program name
   * @param {string} dsl - DSL shader definition
   * @returns {Object} Shader program info
   */
  createProgramFromDSL(name, dsl) {
    // Parse DSL to get shader sources
    const { vertexSource, fragmentSource } = this.dslParser.parse(dsl);
    
    // Create program from sources
    return this.createProgram(name, vertexSource, fragmentSource);
  }
  
  /**
   * Get a shader program by name
   * @param {string} name - Program name
   * @returns {Object} Shader program info
   */
  getProgram(name) {
    return this.programs.get(name) || null;
  }
  
  /**
   * Create a shader program from vertex and fragment sources
   * @param {string} vertexSource - Vertex shader source
   * @param {string} fragmentSource - Fragment shader source
   * @returns {Object} Shader program info
   * @private
   */
  _createShaderProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    
    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Failed to compile vertex shader:', gl.getShaderInfoLog(vertexShader));
      gl.deleteShader(vertexShader);
      return null;
    }
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Failed to compile fragment shader:', gl.getShaderInfoLog(fragmentShader));
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    
    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Failed to link shader program:', gl.getProgramInfoLog(program));
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      return null;
    }
    
    // Get attribute and uniform locations
    const attributes = {};
    const uniforms = {};
    
    // Get attribute locations
    const attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attribCount; i++) {
      const info = gl.getActiveAttrib(program, i);
      attributes[info.name] = gl.getAttribLocation(program, info.name);
    }
    
    // Get uniform locations
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    
    // Clean up shaders as they're no longer needed
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
    return {
      program,
      attributes,
      uniforms,
      vertexSource,
      fragmentSource
    };
  }
  
  /**
   * Set uniforms for a shader program
   * @param {Object} program - Shader program info
   * @param {Object} uniforms - Uniform values
   */
  setUniforms(program, uniforms) {
    const gl = this.gl;
    if (!gl || !program) return;
    
    gl.useProgram(program.program);
    
    for (const [name, value] of Object.entries(uniforms)) {
      const location = program.uniforms[name];
      if (!location) continue;
      
      if (Array.isArray(value)) {
        // Determine type based on array length
        switch (value.length) {
          case 2:
            gl.uniform2fv(location, value);
            break;
          case 3:
            gl.uniform3fv(location, value);
            break;
          case 4:
            gl.uniform4fv(location, value);
            break;
          case 9:
            gl.uniformMatrix3fv(location, false, value);
            break;
          case 16:
            gl.uniformMatrix4fv(location, false, value);
            break;
          default:
            gl.uniform1fv(location, value);
        }
      } else if (value instanceof Float32Array) {
        // Handle typed arrays based on length
        switch (value.length) {
          case 2:
            gl.uniform2fv(location, value);
            break;
          case 3:
            gl.uniform3fv(location, value);
            break;
          case 4:
            gl.uniform4fv(location, value);
            break;
          case 9:
            gl.uniformMatrix3fv(location, false, value);
            break;
          case 16:
            gl.uniformMatrix4fv(location, false, value);
            break;
          default:
            gl.uniform1fv(location, value);
        }
      } else if (value instanceof WebGLTexture || value.isTexture) {
        // Handle textures
        const textureUnit = uniforms._textureUnit || 0;
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, value instanceof WebGLTexture ? value : value.texture);
        gl.uniform1i(location, textureUnit);
        uniforms._textureUnit = textureUnit + 1;
      } else {
        // Handle primitive types
        switch (typeof value) {
          case 'number':
            gl.uniform1f(location, value);
            break;
          case 'boolean':
            gl.uniform1i(location, value ? 1 : 0);
            break;
          default:
            console.warn(`Unsupported uniform type: ${typeof value}`);
        }
      }
    }
  }
  
  /**
   * Dispose of a shader program
   * @param {string} name - Program name
   */
  disposeProgram(name) {
    const gl = this.gl;
    const program = this.programs.get(name);
    
    if (program) {
      gl.deleteProgram(program.program);
      this.programs.delete(name);
    }
  }
  
  /**
   * Clean up all shader resources
   */
  dispose() {
    const gl = this.gl;
    
    // Delete all programs
    for (const program of this.programs.values()) {
      gl.deleteProgram(program.program);
    }
    
    this.programs.clear();
  }
}

/**
 * Parser for SAAAM Shader DSL
 * Converts simplified shader syntax to GLSL
 */
class ShaderDSLParser {
  constructor() {
    this.vertexTemplate = DEFAULT_VERTEX_SHADER;
    this.fragmentTemplate = DEFAULT_FRAGMENT_SHADER;
  }
  
  /**
   * Parse DSL shader definition into GLSL vertex and fragment shaders
   * @param {string} dsl - DSL shader definition
   * @returns {Object} Vertex and fragment shader sources
   */
  parse(dsl) {
    try {
      // Parse the DSL into an AST
      const ast = this._parseDSL(dsl);
      
      // Generate GLSL code from AST
      const vertexSource = this._generateVertexShader(ast);
      const fragmentSource = this._generateFragmentShader(ast);
      
      return { vertexSource, fragmentSource };
    } catch (error) {
      console.error('Error parsing shader DSL:', error);
      return {
        vertexSource: this.vertexTemplate,
        fragmentSource: this.fragmentTemplate
      };
    }
  }
  
  /**
   * Parse DSL into an abstract syntax tree
   * @param {string} dsl - DSL shader definition
   * @returns {Object} AST
   * @private
   */
  _parseDSL(dsl) {
    // This is a simplistic parser for demonstration
    // A full parser would be more complex
    
    const lines = dsl.split('\n');
    const ast = {
      name: '',
      properties: {},
      uniforms: [],
      attributes: [],
      varyings: [],
      vertexFunctions: [],
      fragmentFunctions: [],
      vertexMain: [],
      fragmentMain: []
    };
    
    let currentSection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('//')) {
        continue;
      }
      
      // Check for section headers
      if (trimmed.startsWith('shader')) {
        ast.name = trimmed.split(' ')[1];
        continue;
      } else if (trimmed === 'properties:') {
        currentSection = 'properties';
        continue;
      } else if (trimmed === 'uniforms:') {
        currentSection = 'uniforms';
        continue;
      } else if (trimmed === 'attributes:') {
        currentSection = 'attributes';
        continue;
      } else if (trimmed === 'varyings:') {
        currentSection = 'varyings';
        continue;
      } else if (trimmed === 'vertex:') {
        currentSection = 'vertex';
        continue;
      } else if (trimmed === 'fragment:') {
        currentSection = 'fragment';
        continue;
      }
      
      // Process based on current section
      switch (currentSection) {
        case 'properties':
          // Properties are exposed in the editor
          if (trimmed.includes(':')) {
            const [name, typeAndDefault] = trimmed.split(':').map(s => s.trim());
            const [type, defaultValue] = typeAndDefault.split('=').map(s => s.trim());
            
            ast.properties[name] = {
              type,
              defaultValue: defaultValue || this._getDefaultForType(type)
            };
          }
          break;
          
        case 'uniforms':
          // Uniforms are passed to both shaders
          if (trimmed.includes(':')) {
            const [name, type] = trimmed.split(':').map(s => s.trim());
            ast.uniforms.push({ name, type });
          }
          break;
          
        case 'attributes':
          // Attributes are vertex inputs
          if (trimmed.includes(':')) {
            const [name, type] = trimmed.split(':').map(s => s.trim());
            ast.attributes.push({ name, type });
          }
          break;
          
        case 'varyings':
          // Varyings are passed from vertex to fragment
          if (trimmed.includes(':')) {
            const [name, type] = trimmed.split(':').map(s => s.trim());
            ast.varyings.push({ name, type });
          }
          break;
          
        case 'vertex':
          // Vertex shader code
          ast.vertexMain.push(trimmed);
          break;
          
        case 'fragment':
          // Fragment shader code
          ast.fragmentMain.push(trimmed);
          break;
      }
    }
    
    return ast;
  }
  
  /**
   * Generate vertex shader from AST
   * @param {Object} ast - AST
   * @returns {string} Vertex shader source
   * @private
   */
  _generateVertexShader(ast) {
    let source = '';
    
    // Add precision
    source += 'precision mediump float;\n\n';
    
    // Add attributes
    for (const attr of ast.attributes) {
      source += `attribute ${attr.type} ${attr.name};\n`;
    }
    source += '\n';
    
    // Add uniforms
    for (const uniform of ast.uniforms) {
      source += `uniform ${uniform.type} ${uniform.name};\n`;
    }
    source += '\n';
    
    // Add varyings
    for (const varying of ast.varyings) {
      source += `varying ${varying.type} ${varying.name};\n`;
    }
    source += '\n';
    
    // Add functions
    for (const func of ast.vertexFunctions) {
      source += func + '\n\n';
    }
    
    // Add main function
    source += 'void main() {\n';
    
    // Default position calculation if not present in DSL
    if (ast.vertexMain.length === 0) {
      source += '    gl_Position = vec4(aPosition, 0.0, 1.0);\n';
    } else {
      for (const line of ast.vertexMain) {
        source += '    ' + line + '\n';
      }
    }
    
    source += '}\n';
    
    return source;
  }
  
  /**
   * Generate fragment shader from AST
   * @param {Object} ast - AST
   * @returns {string} Fragment shader source
   * @private
   */
  _generateFragmentShader(ast) {
    let source = '';
    
    // Add precision
    source += 'precision mediump float;\n\n';
    
    // Add uniforms
    for (const uniform of ast.uniforms) {
      source += `uniform ${uniform.type} ${uniform.name};\n`;
    }
    source += '\n';
    
    // Add varyings
    for (const varying of ast.varyings) {
      source += `varying ${varying.type} ${varying.name};\n`;
    }
    source += '\n';
    
    // Add functions
    for (const func of ast.fragmentFunctions) {
      source += func + '\n\n';
    }
    
    // Add main function
    source += 'void main() {\n';
    
    // Default color calculation if not present in DSL
    if (ast.fragmentMain.length === 0) {
      source += '    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n';
    } else {
      for (const line of ast.fragmentMain) {
        source += '    ' + line + '\n';
      }
    }
    
    source += '}\n';
    
    return source;
  }
  
  /**
   * Get default value for a type
   * @param {string} type - GLSL type
   * @returns {string} Default value
   * @private
   */
  _getDefaultForType(type) {
    switch (type) {
      case 'float':
        return '0.0';
      case 'int':
        return '0';
      case 'bool':
        return 'false';
      case 'vec2':
        return 'vec2(0.0, 0.0)';
      case 'vec3':
        return 'vec3(0.0, 0.0, 0.0)';
      case 'vec4':
        return 'vec4(0.0, 0.0, 0.0, 1.0)';
      case 'mat2':
        return 'mat2(1.0, 0.0, 0.0, 1.0)';
      case 'mat3':
        return 'mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)';
      case 'mat4':
        return 'mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0)';
      case 'sampler2D':
        return 'null';
      default:
        return '0.0';
    }
  }
}

// Default shaders
const DEFAULT_VERTEX_SHADER = `
precision mediump float;

attribute vec2 aPosition;
attribute vec4 aColor;

uniform mat4 uProjection;
uniform mat4 uModelView;

varying vec4 vColor;

void main() {
  gl_Position = uProjection * uModelView * vec4(aPosition, 0.0, 1.0);
  vColor = aColor;
}
`;

const DEFAULT_FRAGMENT_SHADER = `
precision mediump float;

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;

const SPRITE_VERTEX_SHADER = `
precision mediump float;

attribute vec2 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aColor;
attribute float aTexIndex;

uniform mat4 uProjection;

varying vec2 vTexCoord;
varying vec4 vColor;
varying float vTexIndex;

void main() {
  gl_Position = uProjection * vec4(aPosition, 0.0, 1.0);
  vTexCoord = aTexCoord;
  vColor = aColor;
  vTexIndex = aTexIndex;
}
`;

const SPRITE_FRAGMENT_SHADER = `
precision mediump float;

varying vec2 vTexCoord;
varying vec4 vColor;
varying float vTexIndex;

uniform sampler2D uTextures[16];

void main() {
  int index = int(vTexIndex);
  
  // WebGL1 doesn't support dynamic indexing, so we need to use conditionals
  vec4 texColor;
  if (index == 0) {
    texColor = texture2D(uTextures[0], vTexCoord);
  } else if (index == 1) {
    texColor = texture2D(uTextures[1], vTexCoord);
  } else if (index == 2) {
    texColor = texture2D(uTextures[2], vTexCoord);
  } else if (index == 3) {
    texColor = texture2D(uTextures[3], vTexCoord);
  } else if (index == 4) {
    texColor = texture2D(uTextures[4], vTexCoord);
  } else if (index == 5) {
    texColor = texture2D(uTextures[5], vTexCoord);
  } else if (index == 6) {
    texColor = texture2D(uTextures[6], vTexCoord);
  } else if (index == 7) {
    texColor = texture2D(uTextures[7], vTexCoord);
  } else {
    texColor = texture2D(uTextures[0], vTexCoord); // Fallback
  }
  
  gl_FragColor = texColor * vColor;
}
`;

const PARTICLE_VERTEX_SHADER = `
precision mediump float;

attribute vec2 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aColor;
attribute float aSize;
attribute float aRotation;

uniform mat4 uProjection;
uniform mat4 uView;

varying vec2 vTexCoord;
varying vec4 vColor;

void main() {
  // Apply size and rotation to position
  float c = cos(aRotation);
  float s = sin(aRotation);
  
  vec2 rotatedPos = vec2(
    aPosition.x * c - aPosition.y * s,
    aPosition.x * s + aPosition.y * c
  ) * aSize;
  
  gl_Position = uProjection * uView * vec4(rotatedPos, 0.0, 1.0);
  vTexCoord = aTexCoord;
  vColor = aColor;
}
`;

const PARTICLE_FRAGMENT_SHADER = `
precision mediump float;

varying vec2 vTexCoord;
varying vec4 vColor;

uniform sampler2D uTexture;

void main() {
  vec4 texColor = texture2D(uTexture, vTexCoord);
  gl_FragColor = texColor * vColor;
}
`;

const POSTPROCESS_VERTEX_SHADER = `
precision mediump float;

attribute vec2 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vTexCoord = aTexCoord;
}
`;

const POSTPROCESS_FRAGMENT_SHADER = `
precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;

// Effects
uniform float uEffectIntensity;

void main() {
  vec4 color = texture2D(uTexture, vTexCoord);
  
  // Apply post-processing effects
  // ...
  
  gl_FragColor = color;
}
`;

// Example of a shader defined in SAAAM's DSL
const EXAMPLE_DSL_SHADER = `
shader WaterEffect

properties:
  waveHeight: float = 0.02
  waveFrequency: float = 10.0
  waveSpeed: float = 1.0
  tint: vec4 = vec4(0.0, 0.3, 0.8, 1.0)

uniforms:
  uTime: float
  uTexture: sampler2D
  uResolution: vec2

attributes:
  aPosition: vec2
  aTexCoord: vec2

varyings:
  vTexCoord: vec2
  vColor: vec4

vertex:
  vec2 pos = aPosition;
  float wave = sin(aTexCoord.x * waveFrequency + uTime * waveSpeed) * waveHeight;
  pos.y += wave;
  
  gl_Position = vec4(pos, 0.0, 1.0);
  vTexCoord = aTexCoord;
  vColor = tint;

fragment:
  vec2 uv = vTexCoord;
  vec2 distortion = vec2(
    sin(uv.y * 20.0 + uTime) * 0.01,
    cos(uv.x * 20.0 + uTime) * 0.01
  );
  
  vec4 texColor = texture2D(uTexture, uv + distortion);
  gl_FragColor = texColor * vColor;
`;

export default ShaderSystem;
