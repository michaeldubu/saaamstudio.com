/**
 * WebGL Renderer for SAAAM Engine
 * Provides hardware-accelerated rendering capabilities
 */
class WebGLRenderer {
  /**
   * Create a new WebGL renderer
   * @param {SaaamEngine} engine - Reference to the game engine
   * @param {Object} options - Renderer options
   */
  constructor(engine, options = {}) {
    this.engine = engine;
    this.canvas = null;
    this.gl = null;
    this.width = 0;
    this.height = 0;
    this.clearColor = options.clearColor || [0.1, 0.1, 0.1, 1.0];
    
    // Shader programs
    this.programs = {
      default: null,
      sprite: null,
      postprocess: null
    };
    
    // Render targets
    this.mainRenderTarget = null;
    this.postProcessTarget = null;
    
    // Texture cache
    this.textureCache = new Map();
    
    // Default sprite buffers
    this.spriteVAO = null;
    this.spriteVBO = null;
    this.spriteIBO = null;
    
    // Batch rendering
    this.maxBatchSize = options.maxBatchSize || 1000;
    this.batchVertexData = null;
    this.batchIndexData = null;
    this.batchCount = 0;
    this.batchTextureMap = new Map();
    this.currentBatchTexture = null;
    this.batchTextureCounter = 0;
    
    // Stats
    this.stats = {
      drawCalls: 0,
      verticesRendered: 0,
      texturesCreated: 0,
      texturesFreed: 0
    };
    
    // Bind methods
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
  }
  
  /**
   * Initialize the WebGL renderer
   * @param {HTMLCanvasElement} canvas - Canvas element for rendering
   */
  initialize(canvas) {
    this.canvas = canvas;
    
    // Try to get WebGL2 context, fall back to WebGL1
    try {
      this.gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        depth: true,
        stencil: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      });
      
      if (!this.gl) {
        this.gl = canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          depth: true,
          stencil: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false
        });
      }
      
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
      
      // Log WebGL version
      const isWebGL2 = this.gl instanceof WebGL2RenderingContext;
      console.log(`Using ${isWebGL2 ? 'WebGL 2.0' : 'WebGL 1.0'}`);
      
      // Set initial size
      this.width = canvas.width;
      this.height = canvas.height;
      
      // Register resize handler
      window.addEventListener('resize', this.resize);
      
      // Initialize WebGL
      this._initializeGL();
    } catch (error) {
      console.error('Failed to initialize WebGL renderer:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Initialize WebGL state, shaders, and buffers
   * @private
   */
  _initializeGL() {
    const gl = this.gl;
    
    // Enable transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Create shader programs
    this._createShaderPrograms();
    
    // Create default sprite mesh
    this._createSpriteMesh();
    
    // Create render targets
    this._createRenderTargets();
    
    // Create batch rendering buffers
    this._createBatchBuffers();
  }
  
  /**
   * Create necessary shader programs
   * @private
   */
  _createShaderPrograms() {
    const gl = this.gl;
    
    // Default shader for simple colored rendering
    this.programs.default = this._createShaderProgram(
      defaultVertexShader,
      defaultFragmentShader
    );
    
    // Sprite shader for textured rendering
    this.programs.sprite = this._createShaderProgram(
      spriteVertexShader,
      spriteFragmentShader
    );
    
    // Post-processing shader
    this.programs.postprocess = this._createShaderProgram(
      postprocessVertexShader,
      postprocessFragmentShader
    );
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
      uniforms
    };
  }
  
  /**
   * Create a quad mesh for sprite rendering
   * @private
   */
  _createSpriteMesh() {
    const gl = this.gl;
    
    // Create a simple quad (2 triangles)
    const vertices = new Float32Array([
      // positions    // texture coords
      -0.5, -0.5,     0.0, 1.0,  // bottom left
       0.5, -0.5,     1.0, 1.0,  // bottom right
       0.5,  0.5,     1.0, 0.0,  // top right
      -0.5,  0.5,     0.0, 0.0   // top left
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2,  // first triangle
      0, 2, 3   // second triangle
    ]);
    
    // Create and bind vertex array object if available (WebGL2)
    if (gl instanceof WebGL2RenderingContext) {
      this.spriteVAO = gl.createVertexArray();
      gl.bindVertexArray(this.spriteVAO);
    }
    
    // Create vertex buffer
    this.spriteVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteVBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // Setup vertex attributes
    // Position attribute
    gl.vertexAttribPointer(
      this.programs.sprite.attributes.aPosition,
      2, // size (vec2)
      gl.FLOAT, // type
      false, // normalized
      4 * Float32Array.BYTES_PER_ELEMENT, // stride
      0 // offset
    );
    gl.enableVertexAttribArray(this.programs.sprite.attributes.aPosition);
    
    // Texture coordinate attribute
    gl.vertexAttribPointer(
      this.programs.sprite.attributes.aTexCoord,
      2, // size (vec2)
      gl.FLOAT, // type
      false, // normalized
      4 * Float32Array.BYTES_PER_ELEMENT, // stride
      2 * Float32Array.BYTES_PER_ELEMENT // offset
    );
    gl.enableVertexAttribArray(this.programs.sprite.attributes.aTexCoord);
    
    // Create index buffer
    this.spriteIBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.spriteIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    // Unbind VAO if available
    if (gl instanceof WebGL2RenderingContext) {
      gl.bindVertexArray(null);
    }
    
    // Unbind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
  
  /**
   * Create framebuffers for render targets
   * @private
   */
  _createRenderTargets() {
    const gl = this.gl;
    
    // Create main render target
    this.mainRenderTarget = this._createRenderTarget(this.width, this.height);
    
    // Create post-process render target
    this.postProcessTarget = this._createRenderTarget(this.width, this.height);
  }
  
  /**
   * Create a render target (framebuffer with texture and renderbuffer)
   * @param {number} width - Width of render target
   * @param {number} height - Height of render target
   * @returns {Object} Render target info
   * @private
   */
  _createRenderTarget(width, height) {
    const gl = this.gl;
    
    // Create framebuffer
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    // Create texture for color attachment
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0, // level
      gl.RGBA, // internal format
      width,
      height,
      0, // border
      gl.RGBA, // format
      gl.UNSIGNED_BYTE, // type
      null // data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Attach texture to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0 // level
    );
    
    // Create renderbuffer for depth and stencil
    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_STENCIL, // or gl.DEPTH_COMPONENT16 if only depth is needed
      width,
      height
    );
    
    // Attach renderbuffer to framebuffer
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_STENCIL_ATTACHMENT,
      gl.RENDERBUFFER,
      renderbuffer
    );
    
    // Check framebuffer status
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer not complete:', status);
    }
    
    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    
    return {
      framebuffer,
      texture,
      renderbuffer,
      width,
      height
    };
  }
  
  /**
   * Create buffers for batch rendering
   * @private
   */
  _createBatchBuffers() {
    const gl = this.gl;
    
    // Each sprite requires 4 vertices (quad), each vertex has:
    // - 2 floats for position
    // - 2 floats for texture coords
    // - 4 floats for color
    // - 1 float for texture index
    // Total: 9 floats per vertex, 36 floats per sprite
    const vertexSize = 9; // floats per vertex
    const verticesPerSprite = 4; // 4 vertices per sprite
    
    // Create buffer large enough for maxBatchSize sprites
    this.batchVertexData = new Float32Array(this.maxBatchSize * verticesPerSprite * vertexSize);
    
    // Each sprite uses 6 indices (2 triangles)
    this.batchIndexData = new Uint16Array(this.maxBatchSize * 6);
    
    // Fill index buffer with values for all sprites
    // Pattern: 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, ...
    for (let i = 0; i < this.maxBatchSize; i++) {
      const offset = i * 6;
      const vertexOffset = i * 4;
      
      this.batchIndexData[offset + 0] = vertexOffset + 0;
      this.batchIndexData[offset + 1] = vertexOffset + 1;
      this.batchIndexData[offset + 2] = vertexOffset + 2;
      this.batchIndexData[offset + 3] = vertexOffset + 0;
      this.batchIndexData[offset + 4] = vertexOffset + 2;
      this.batchIndexData[offset + 5] = vertexOffset + 3;
    }
    
    // Create vertex array object for batch rendering (WebGL2)
    if (gl instanceof WebGL2RenderingContext) {
      this.batchVAO = gl.createVertexArray();
      gl.bindVertexArray(this.batchVAO);
    }
    
    // Create vertex buffer
    this.batchVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.batchVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.batchVertexData, gl.DYNAMIC_DRAW);
    
    // Create index buffer
    this.batchIBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.batchIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.batchIndexData, gl.STATIC_DRAW);
    
    // Setup vertex attributes for the batch program
    const stride = vertexSize * Float32Array.BYTES_PER_ELEMENT;
    
    // Position attribute
    gl.vertexAttribPointer(
      this.programs.sprite.attributes.aPosition,
      2, // size (vec2)
      gl.FLOAT, // type
      false, // normalized
      stride, // stride
      0 // offset
    );
    gl.enableVertexAttribArray(this.programs.sprite.attributes.aPosition);
    
    // Texture coordinate attribute
    gl.vertexAttribPointer(
      this.programs.sprite.attributes.aTexCoord,
      2, // size (vec2)
      gl.FLOAT, // type
      false, // normalized
      stride, // stride
      2 * Float32Array.BYTES_PER_ELEMENT // offset
    );
    gl.enableVertexAttribArray(this.programs.sprite.attributes.aTexCoord);
    
    // Color attribute
    gl.vertexAttribPointer(
      this.programs.sprite.attributes.aColor,
      4, // size (vec4)
      gl.FLOAT, // type
      false, // normalized
      stride, // stride
      4 * Float32Array.BYTES_PER_ELEMENT // offset
    );
    gl.enableVertexAttribArray(this.programs.sprite.attributes.aColor);
    
    // Texture index attribute
    gl.vertexAttribPointer(
      this.programs.sprite.attributes.aTexIndex,
      1, // size (float)
      gl.FLOAT, // type
      false, // normalized
      stride, // stride
      8 * Float32Array.BYTES_PER_ELEMENT // offset
    );
    gl.enableVertexAttribArray(this.programs.sprite.attributes.aTexIndex);
    
    // Unbind VAO if available
    if (gl instanceof WebGL2RenderingContext) {
      gl.bindVertexArray(null);
    }
    
    // Unbind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
  
  /**
   * Resize the renderer
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    const gl = this.gl;
    
    // Update canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Update viewport
    gl.viewport(0, 0, width, height);
    
    // Recreate render targets
    if (this.mainRenderTarget) {
      gl.deleteFramebuffer(this.mainRenderTarget.framebuffer);
      gl.deleteTexture(this.mainRenderTarget.texture);
      gl.deleteRenderbuffer(this.mainRenderTarget.renderbuffer);
      this.mainRenderTarget = this._createRenderTarget(width, height);
    }
    
    if (this.postProcessTarget) {
      gl.deleteFramebuffer(this.postProcessTarget.framebuffer);
      gl.deleteTexture(this.postProcessTarget.texture);
      gl.deleteRenderbuffer(this.postProcessTarget.renderbuffer);
      this.postProcessTarget = this._createRenderTarget(width, height);
    }
    
    // Update stored dimensions
    this.width = width;
    this.height = height;
  }
  
  /**
   * Begin a new batch
   */
  beginBatch() {
    this.batchCount = 0;
    this.batchTextureMap.clear();
    this.batchTextureCounter = 0;
  }
  
  /**
   * Add a sprite to the current batch
   * @param {Texture} texture - Sprite texture
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} rotation - Rotation in radians
   * @param {Color} color - Tint color
   * @param {Object} [options] - Additional options
   */
  drawSprite(texture, x, y, width, height, rotation, color, options = {}) {
    // Check if we need to flush the batch
    if (this.batchCount >= this.maxBatchSize) {
      this.flushBatch();
      this.beginBatch();
    }
    
    // Get or assign texture unit
    let textureIndex = 0;
    if (texture) {
      // Get WebGL texture
      const glTexture = this._getOrCreateTexture(texture);
      
      // Check if texture is already in batch
      if (this.batchTextureMap.has(glTexture)) {
        textureIndex = this.batchTextureMap.get(glTexture);
      } else {
        // Add texture to batch (up to 16 textures per batch)
        if (this.batchTextureMap.size < 16) {
          textureIndex = this.batchTextureCounter++;
          this.batchTextureMap.set(glTexture, textureIndex);
        } else {
          // Too many textures, flush batch and start a new one
          this.flushBatch();
          this.beginBatch();
          textureIndex = 0;
          this.batchTextureMap.set(glTexture, textureIndex);
          this.batchTextureCounter = 1;
        }
      }
    }
    
    // Calculate vertices
    const vertexSize = 9; // floats per vertex
    const verticesPerSprite = 4; // 4 vertices per sprite
    const offset = this.batchCount * verticesPerSprite * vertexSize;
    
    // Extract options
    const pivotX = options.pivotX !== undefined ? options.pivotX : 0.5;
    const pivotY = options.pivotY !== undefined ? options.pivotY : 0.5;
    const flipX = options.flipX || false;
    const flipY = options.flipY || false;
    
    // Source rectangle for sprite sheet support
    const srcX = options.srcX || 0;
    const srcY = options.srcY || 0;
    const srcWidth = options.srcWidth || (texture ? texture.width : 1);
    const srcHeight = options.srcHeight || (texture ? texture.height : 1);
    
    // Calculate UV coordinates
    let u0 = srcX / (texture ? texture.width : 1);
    let v0 = srcY / (texture ? texture.height : 1);
    let u1 = (srcX + srcWidth) / (texture ? texture.width : 1);
    let v1 = (srcY + srcHeight) / (texture ? texture.height : 1);
    
    // Handle flipping
    if (flipX) {
      [u0, u1] = [u1, u0];
    }
    
    if (flipY) {
      [v0, v1] = [v1, v0];
    }
    
    // Calculate pivot offset
    const pivotOffsetX = (0.5 - pivotX) * width;
    const pivotOffsetY = (0.5 - pivotY) * height;
    
    // Create transformation matrix
    const matrix = new Float32Array(6);
    
    // Start with identity matrix
    matrix[0] = 1; matrix[2] = 0; matrix[4] = 0;
    matrix[1] = 0; matrix[3] = 1; matrix[5] = 0;
    
    // Apply transformations in reverse order (scale, rotate, translate)
    // 1. Apply scale
    matrix[0] *= width;
    matrix[3] *= height;
    
    // 2. Apply rotation around pivot
    if (rotation !== 0) {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      const m0 = matrix[0];
      const m1 = matrix[1];
      const m2 = matrix[2];
      const m3 = matrix[3];
      
      matrix[0] = m0 * cos + m2 * sin;
      matrix[1] = m1 * cos + m3 * sin;
      matrix[2] = m0 * -sin + m2 * cos;
      matrix[3] = m1 * -sin + m3 * cos;
    }
    
    // 3. Apply translation (position + pivot offset)
    matrix[4] = x + pivotOffsetX;
    matrix[5] = y + pivotOffsetY;
    
    // Convert color components to 0-1 range
    const r = color.r;
    const g = color.g;
    const b = color.b;
    const a = color.a;
    
    // Calculate vertex positions with matrix
    // Top-left
    const x0 = matrix[0] * -0.5 + matrix[2] * -0.5 + matrix[4];
    const y0 = matrix[1] * -0.5 + matrix[3] * -0.5 + matrix[5];
    
    // Top-right
    const x1 = matrix[0] * 0.5 + matrix[2] * -0.5 + matrix[4];
    const y1 = matrix[1] * 0.5 + matrix[3] * -0.5 + matrix[5];
    
    // Bottom-right
    const x2 = matrix[0] * 0.5 + matrix[2] * 0.5 + matrix[4];
    const y2 = matrix[1] * 0.5 + matrix[3] * 0.5 + matrix[5];
    
    // Bottom-left
    const x3 = matrix[0] * -0.5 + matrix[2] * 0.5 + matrix[4];
    const y3 = matrix[1] * -0.5 + matrix[3] * 0.5 + matrix[5];
    
    // Add vertices to batch
    // Top-left
    this.batchVertexData[offset + 0] = x0;
    this.batchVertexData[offset + 1] = y0;
    this.batchVertexData[offset + 2] = u0;
    this.batchVertexData[offset + 3] = v0;
    this.batchVertexData[offset + 4] = r;
    this.batchVertexData[offset + 5] = g;
    this.batchVertexData[offset + 6] = b;
    this.batchVertexData[offset + 7] = a;
    this.batchVertexData[offset + 8] = textureIndex;
    
    // Top-right
    this.batchVertexData[offset + 9] = x1;
    this.batchVertexData[offset + 10] = y1;
    this.batchVertexData[offset + 11] = u1;
    this.batchVertexData[offset + 12] = v0;
    this.batchVertexData[offset + 13] = r;
    this.batchVertexData[offset + 14] = g;
    this.batchVertexData[offset + 15] = b;
    this.batchVertexData[offset + 16] = a;
    this.batchVertexData[offset + 17] = textureIndex;
    
    // Bottom-right
    this.batchVertexData[offset + 18] = x2;
    this.batchVertexData[offset + 19] = y2;
    this.batchVertexData[offset + 20] = u1;
    this.batchVertexData[offset + 21] = v1;
    this.batchVertexData[offset + 22] = r;
    this.batchVertexData[offset + 23] = g;
    this.batchVertexData[offset + 24] = b;
    this.batchVertexData[offset + 25] = a;
    this.batchVertexData[offset + 26] = textureIndex;
    
    // Bottom-left
    this.batchVertexData[offset + 27] = x3;
    this.batchVertexData[offset + 28] = y3;
    this.batchVertexData[offset + 29] = u0;
    this.batchVertexData[offset + 30] = v1;
    this.batchVertexData[offset + 31] = r;
    this.batchVertexData[offset + 32] = g;
    this.batchVertexData[offset + 33] = b;
    this.batchVertexData[offset + 34] = a;
    this.batchVertexData[offset + 35] = textureIndex;
    
    // Increment batch count
    this.batchCount++;
  }
  
  /**
   * Flush the current batch
   */
  flushBatch() {
    const gl = this.gl;
    
    // Skip if batch is empty
    if (this.batchCount === 0 || this.batchTextureMap.size === 0) {
      return;
    }
    
    // Use sprite shader program
    gl.useProgram(this.programs.sprite.program);
    
    // Set projection matrix uniform
    const projectionMatrix = this._getProjectionMatrix();
    gl.uniformMatrix4fv(this.programs.sprite.uniforms.uProjection, false, projectionMatrix);
    
    // Bind batch VAO (WebGL2)
    if (gl instanceof WebGL2RenderingContext) {
      gl.bindVertexArray(this.batchVAO);
    } else {
      // For WebGL1, set up attribute pointers manually
      gl.bindBuffer(gl.ARRAY_BUFFER, this.batchVBO);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.batchIBO);
      
      const vertexSize = 9; // floats per vertex
      const stride = vertexSize * Float32Array.BYTES_PER_ELEMENT;
      
      // Position attribute
      gl.vertexAttribPointer(
        this.programs.sprite.attributes.aPosition,
        2, // size (vec2)
        gl.FLOAT, // type
        false, // normalized
        stride, // stride
        0 // offset
      );
      gl.enableVertexAttribArray(this.programs.sprite.attributes.aPosition);
      
      // Texture coordinate attribute
      gl.vertexAttribPointer(
        this.programs.sprite.attributes.aTexCoord,
        2, // size (vec2)
        gl.FLOAT, // type
        false, // normalized
        stride, // stride
        2 * Float32Array.BYTES_PER_ELEMENT // offset
      );
      gl.enableVertexAttribArray(this.programs.sprite.attributes.aTexCoord);
      
      // Color attribute
      gl.vertexAttribPointer(
        this.programs.sprite.attributes.aColor,
        4, // size (vec4)
        gl.FLOAT, // type
        false, // normalized
        stride, // stride
        4 * Float32Array.BYTES_PER_ELEMENT // offset
      );
      gl.enableVertexAttribArray(this.programs.sprite.attributes.aColor);
      
      // Texture index attribute
      gl.vertexAttribPointer(
        this.programs.sprite.attributes.aTexIndex,
        1, // size (float)
        gl.FLOAT, // type
        false, // normalized
        stride, // stride
        8 * Float32Array.BYTES_PER_ELEMENT // offset
      );
      gl.enableVertexAttribArray(this.programs.sprite.attributes.aTexIndex);
    }
    
    // Update vertex buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.batchVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchVertexData.subarray(0, this.batchCount * 4 * 9));
    
    // Bind textures
    let textureUnit = 0;
    for (const [texture, index] of this.batchTextureMap.entries()) {
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(this.programs.sprite.uniforms.uTextures[index], textureUnit);
      textureUnit++;
    }
    
    // Draw elements
    gl.drawElements(
      gl.TRIANGLES,
      this.batchCount * 6, // 6 indices per sprite
      gl.UNSIGNED_SHORT,
      0
    );
    
    // Update stats
    this.stats.drawCalls++;
    this.stats.verticesRendered += this.batchCount * 6;
    
    // Reset batch
    this.batchCount = 0;
    this.batchTextureMap.clear();
    this.batchTextureCounter = 0;
    
    // Unbind VAO (WebGL2)
    if (gl instanceof WebGL2RenderingContext) {
      gl.bindVertexArray(null);
    }
  }
  
  /**
   * Get or create a WebGL texture from a Texture object
   * @param {Texture} texture - Texture object
   * @returns {WebGLTexture} WebGL texture
   * @private
   */
  _getOrCreateTexture(texture) {
    const gl = this.gl;
    
    // Check if texture is already cached
    if (this.textureCache.has(texture.id)) {
      return this.textureCache.get(texture.id);
    }
    
    // Create new WebGL texture
    const glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Set filtering based on texture options
    if (texture.smoothing) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    
    // Upload texture data
    gl.texImage2D(
      gl.TEXTURE_2D,
      0, // level
      gl.RGBA, // internal format
      gl.RGBA, // format
      gl.UNSIGNED_BYTE, // type
      texture.source // source (HTMLImageElement, HTMLCanvasElement, etc.)
    );
    
    // Generate mipmaps if needed
    if (texture.generateMipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    
    // Unbind texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    // Cache texture
    this.textureCache.set(texture.id, glTexture);
    this.stats.texturesCreated++;
    
    return glTexture;
  }
  
  /**
   * Get 4x4 orthographic projection matrix
   * @returns {Float32Array} 4x4 matrix
   * @private
   */
  _getProjectionMatrix() {
    // Create 4x4 orthographic projection matrix
    const matrix = new Float32Array(16);
    
    // Calculate scale factors
    const scaleX = 2 / this.width;
    const scaleY = -2 / this.height; // Flip Y axis
    
    // Set matrix values (column-major order)
    matrix[0] = scaleX;
    matrix[1] = 0;
    matrix[2] = 0;
    matrix[3] = 0;
    
    matrix[4] = 0;
    matrix[5] = scaleY;
    matrix[6] = 0;
    matrix[7] = 0;
    
    matrix[8] = 0;
    matrix[9] = 0;
    matrix[10] = -0.001; // Arbitrary small z scale
    matrix[11] = 0;
    
    matrix[12] = -1;
    matrix[13] = 1;
    matrix[14] = 0;
    matrix[15] = 1;
    
    return matrix;
  }
  
  /**
   * Render a scene
   * @param {Scene} scene - Scene to render
   */
  render(scene) {
    const gl = this.gl;
    
    // Reset stats for this frame
    this.stats.drawCalls = 0;
    this.stats.verticesRendered = 0;
    
    // Clear the canvas
    gl.clearColor(
      this.clearColor[0],
      this.clearColor[1],
      this.clearColor[2],
      this.clearColor[3]
    );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Begin new batch
    this.beginBatch();
    
    // Iterate through all renderable game objects
    for (const gameObject of scene.gameObjects) {
      if (!gameObject.active) continue;
      
      // Get sprite renderer component
      const spriteRenderer = gameObject.getComponent(SpriteRenderer);
      if (!spriteRenderer || !spriteRenderer.visible) continue;
      
      // Get world transform
      const worldPos = gameObject.getWorldPosition();
      const worldRotation = gameObject.getWorldRotation() * Math.PI / 180;
      const worldScale = gameObject.getWorldScale();
      
      // Collect sprite data
      const sprite = spriteRenderer.sprite;
      const width = spriteRenderer.width * worldScale.x;
      const height = spriteRenderer.height * worldScale.y;
      const color = spriteRenderer.color;
      
      // Add sprite to batch
      this.drawSprite(
        sprite,
        worldPos.x,
        worldPos.y,
        width,
        height,
        worldRotation,
        color,
        {
          pivotX: spriteRenderer.pivot.x,
          pivotY: spriteRenderer.pivot.y,
          flipX: spriteRenderer.flip.x,
          flipY: spriteRenderer.flip.y,
          srcX: spriteRenderer.spriteSheet ? spriteRenderer.frameIndex % spriteRenderer.spriteSheet.columns * spriteRenderer.width : 0,
          srcY: spriteRenderer.spriteSheet ? Math.floor(spriteRenderer.frameIndex / spriteRenderer.spriteSheet.columns) * spriteRenderer.height : 0,
          srcWidth: spriteRenderer.width,
          srcHeight: spriteRenderer.height
        }
      );
    }
    
    // Flush the batch
    this.flushBatch();
  }
  
  /**
   * Apply post-processing effects
   * @param {Array} effects - Array of post-processing effects
   */
  applyPostProcessing(effects) {
    const gl = this.gl;
    
    // Skip if no effects
    if (!effects || effects.length === 0) {
      return;
    }
    
    // Use post-process shader program
    gl.useProgram(this.programs.postprocess.program);
    
    // Ping-pong between render targets
    let sourceTarget = this.mainRenderTarget;
    let destTarget = this.postProcessTarget;
    
    // Apply each effect
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      const isLastEffect = i === effects.length - 1;
      
      // Set destination (framebuffer or canvas)
      if (isLastEffect) {
        // Final effect renders to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.width, this.height);
      } else {
        // Intermediate effect renders to dest target
        gl.bindFramebuffer(gl.FRAMEBUFFER, destTarget.framebuffer);
        gl.viewport(0, 0, destTarget.width, destTarget.height);
      }
      
      // Clear destination
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Bind source texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sourceTarget.texture);
      gl.uniform1i(this.programs.postprocess.uniforms.uTexture, 0);
      
      // Set uniforms for the effect
      effect.setUniforms(this.programs.postprocess);
      
      // Draw a full-screen quad
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      // Swap targets for next effect
      [sourceTarget, destTarget] = [destTarget, sourceTarget];
    }
  }
  
  /**
   * Clean up WebGL resources
   */
  dispose() {
    const gl = this.gl;
    
    // Delete shader programs
    for (const programInfo of Object.values(this.programs)) {
      if (programInfo && programInfo.program) {
        gl.deleteProgram(programInfo.program);
      }
    }
    
    // Delete buffers
    if (this.spriteVBO) gl.deleteBuffer(this.spriteVBO);
    if (this.spriteIBO) gl.deleteBuffer(this.spriteIBO);
    if (this.batchVBO) gl.deleteBuffer(this.batchVBO);
    if (this.batchIBO) gl.deleteBuffer(this.batchIBO);
    
    // Delete VAOs
    if (gl instanceof WebGL2RenderingContext) {
      if (this.spriteVAO) gl.deleteVertexArray(this.spriteVAO);
      if (this.batchVAO) gl.deleteVertexArray(this.batchVAO);
    }
    
    // Delete render targets
    if (this.mainRenderTarget) {
      gl.deleteFramebuffer(this.mainRenderTarget.framebuffer);
      gl.deleteTexture(this.mainRenderTarget.texture);
      gl.deleteRenderbuffer(this.mainRenderTarget.renderbuffer);
    }
    
    if (this.postProcessTarget) {
      gl.deleteFramebuffer(this.postProcessTarget.framebuffer);
      gl.deleteTexture(this.postProcessTarget.texture);
      gl.deleteRenderbuffer(this.postProcessTarget.renderbuffer);
    }
    
    // Delete cached textures
    for (const texture of this.textureCache.values()) {
      gl.deleteTexture(texture);
    }
    
    this.textureCache.clear();
    
    // Remove event listeners
    window.removeEventListener('resize', this.resize);
  }
}

// Default Vertex Shader Source
const defaultVertexShader = `
  attribute vec2 aPosition;
  attribute vec4 aColor;
  
  uniform mat4 uProjection;
  uniform mat4 uModel;
  
  varying vec4 vColor;
  
  void main() {
    gl_Position = uProjection * uModel * vec4(aPosition, 0.0, 1.0);
    vColor = aColor;
  }
`;

// Default Fragment Shader Source
const defaultFragmentShader = `
  precision mediump float;
  
  varying vec4 vColor;
  
  void main() {
    gl_FragColor = vColor;
  }
`;

// Sprite Vertex Shader Source
const spriteVertexShader = `
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

// Sprite Fragment Shader Source
const spriteFragmentShader = `
  precision mediump float;
  
  varying vec2 vTexCoord;
  varying vec4 vColor;
  varying float vTexIndex;
  
  uniform sampler2D uTextures[16];
  
  void main() {
    int index = int(vTexIndex);
    vec4 texColor;
    
    // WebGL doesn't support dynamic indexing of sampler arrays,
    // so we need to use a switch/case or if-else chain
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
    } else if (index == 8) {
      texColor = texture2D(uTextures[8], vTexCoord);
    } else if (index == 9) {
      texColor = texture2D(uTextures[9], vTexCoord);
    } else if (index == 10) {
      texColor = texture2D(uTextures[10], vTexCoord);
    } else if (index == 11) {
      texColor = texture2D(uTextures[11], vTexCoord);
    } else if (index == 12) {
      texColor = texture2D(uTextures[12], vTexCoord);
    } else if (index == 13) {
      texColor = texture2D(uTextures[13], vTexCoord);
    } else if (index == 14) {
      texColor = texture2D(uTextures[14], vTexCoord);
    } else {
      texColor = texture2D(uTextures[15], vTexCoord);
    }
    
    gl_FragColor = texColor * vColor;
  }
`;

// Post-Processing Vertex Shader Source
const postprocessVertexShader = `
  attribute vec2 aPosition;
  attribute vec2 aTexCoord;
  
  varying vec2 vTexCoord;
  
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoord = aTexCoord;
  }
`;

// Post-Processing Fragment Shader Source
const postprocessFragmentShader = `
  precision mediump float;
  
  varying vec2 vTexCoord;
  
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uTime;
  
  // Effect uniforms
  uniform float uIntensity;
  uniform float uChromaIntensity;
  uniform float uBlurRadius;
  uniform float uVignetteIntensity;
  
  void main() {
    vec2 uv = vTexCoord;
    vec4 color = texture2D(uTexture, uv);
    
    // Apply effects here
    
    gl_FragColor = color;
  }
`;

// Export the class
export default WebGLRenderer;
