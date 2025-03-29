/**
 * SAAAM Language Interpreter
 * Executes SAAAM code in the browser environment, connecting with the game engine.
 */

class SaaamInterpreter {
  constructor(engine) {
    // Store a reference to the game engine
    this.engine = engine || window.SAAAM;
    
    // Store the compiled scripts
    this.scripts = [];
    
    // Store the lifecycle functions registered by scripts
    this.createFunctions = [];
    this.stepFunctions = [];
    this.drawFunctions = [];
    
    // Set up keyboard state
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.keysReleased = new Set();
    
    // Set up virtual key codes (similar to GameMaker)
    this.vk = {
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      space: 32,
      enter: 13,
      escape: 27,
      shift: 16,
      ctrl: 17,
      alt: 18,
      tab: 9,
      backspace: 8,
      delete: 46,
      insert: 45,
      home: 36,
      end: 35,
      pageup: 33,
      pagedown: 34,
      // Add number keys
      0: 48, 1: 49, 2: 50, 3: 51, 4: 52, 5: 53, 6: 54, 7: 55, 8: 56, 9: 57,
      // Add letter keys
      a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72, i: 73, j: 74,
      k: 75, l: 76, m: 77, n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84,
      u: 85, v: 86, w: 87, x: 88, y: 89, z: 90
    };
    
    // Set up the SAAAM environment for scripts
    this.environment = {
      registerCreate: this.registerCreate.bind(this),
      registerStep: this.registerStep.bind(this),
      registerDraw: this.registerDraw.bind(this),
      keyboardCheck: this.keyboardCheck.bind(this),
      keyboardCheckPressed: this.keyboardCheckPressed.bind(this),
      drawSprite: this.drawSprite.bind(this),
      // Add other SAAAM functions here
    };
    
    // Game state
    this.running = false;
    this.lastTime = 0;
    this.canvas = null;
    this.ctx = null;
    this.gameObjects = [];
    
    // Reference to the compiler
    this.compiler = null;
  }
  
  /**
   * Initialize the interpreter
   */
  initialize() {
    // Set up event listeners for keyboard input
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Check if the engine is available
    if (!this.engine) {
      console.error('SAAAM engine not found');
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle keydown events
   * @param {KeyboardEvent} event - The keydown event
   */
  handleKeyDown(event) {
    const keyCode = event.keyCode;
    
    if (!this.keysDown.has(keyCode)) {
      this.keysPressed.add(keyCode);
    }
    
    this.keysDown.add(keyCode);
  }
  
  /**
   * Handle keyup events
   * @param {KeyboardEvent} event - The keyup event
   */
  handleKeyUp(event) {
    const keyCode = event.keyCode;
    
    this.keysDown.delete(keyCode);
    this.keysReleased.add(keyCode);
  }
  
  /**
   * Clear the "pressed" and "released" key states after each frame
   */
  clearFrameKeyStates() {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }
  
  /**
   * Register a create function
   * @param {Function} func - The create function
   */
  registerCreate(func) {
    this.createFunctions.push(func);
  }
  
  /**
   * Register a step function
   * @param {Function} func - The step function
   */
  registerStep(func) {
    this.stepFunctions.push(func);
  }
  
  /**
   * Register a draw function
   * @param {Function} func - The draw function
   */
  registerDraw(func) {
    this.drawFunctions.push(func);
  }
  
  /**
   * Check if a key is currently down
   * @param {number} keyCode - The key code to check
   * @returns {boolean} - Whether the key is down
   */
  keyboardCheck(keyCode) {
    return this.keysDown.has(keyCode);
  }
  
  /**
   * Check if a key was pressed this frame
   * @param {number} keyCode - The key code to check
   * @returns {boolean} - Whether the key was pressed this frame
   */
  keyboardCheckPressed(keyCode) {
    return this.keysPressed.has(keyCode);
  }
  
  /**
   * Check if a key was released this frame
   * @param {number} keyCode - The key code to check
   * @returns {boolean} - Whether the key was released this frame
   */
  keyboardCheckReleased(keyCode) {
    return this.keysReleased.has(keyCode);
  }
  
  /**
   * Draw a sprite
   * @param {number} spriteIndex - The sprite index
   * @param {number} imageIndex - The image index (frame)
   * @param {number} x - The x position
   * @param {number} y - The y position
   */
  drawSprite(spriteIndex, imageIndex, x, y) {
    // This is a placeholder implementation
    // In a real implementation, this would look up the sprite and draw it
    if (!this.ctx) return;
    
    // Draw a placeholder rectangle for now
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillRect(x - 16, y - 16, 32, 32);
    
    // Draw a border
    this.ctx.strokeStyle = 'white';
    this.ctx.strokeRect(x - 16, y - 16, 32, 32);
    
    // Draw a cross to show it's a placeholder
    this.ctx.beginPath();
    this.ctx.moveTo(x - 16, y - 16);
    this.ctx.lineTo(x + 16, y + 16);
    this.ctx.moveTo(x + 16, y - 16);
    this.ctx.lineTo(x - 16, y + 16);
    this.ctx.stroke();
  }
  
  /**
   * Load and compile a SAAAM script
   * @param {string} code - The SAAAM code to load
   * @param {string} id - A unique identifier for this script
   * @returns {boolean} - Whether the script was loaded successfully
   */
  loadScript(code, id = '') {
    try {
      // Ensure we have a compiler
      if (!this.compiler) {
        if (typeof SaaamCompiler === 'undefined') {
          console.error('SaaamCompiler not found');
          return false;
        }
        
        this.compiler = new SaaamCompiler();
      }
      
      // Compile the code
      const compiledCode = this.compiler.compile(code);
      
      // Create a script object
      const script = {
        id: id || `script_${Date.now()}`,
        originalCode: code,
        compiledCode: compiledCode
      };
      
      // Add the script to our collection
      this.scripts.push(script);
      
      return true;
    } catch (error) {
      console.error('Error loading SAAAM script:', error);
      return false;
    }
  }
  
  /**
   * Execute a loaded script
   * @param {string} id - The script identifier
   * @returns {boolean} - Whether the script was executed successfully
   */
  executeScript(id) {
    const script = this.scripts.find(s => s.id === id);
    
    if (!script) {
      console.error(`Script with id ${id} not found`);
      return false;
    }
    
    try {
      // Create a function from the compiled code
      const scriptFunc = new Function('SAAAM', script.compiledCode);
      
      // Execute the script with our environment
      scriptFunc(this.environment);
      
      return true;
    } catch (error) {
      console.error(`Error executing script ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Start the game
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @returns {boolean} - Whether the game was started successfully
   */
  startGame(canvas) {
    if (!canvas) {
      console.error('No canvas provided');
      return false;
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Call all create functions
    for (const createFunc of this.createFunctions) {
      try {
        createFunc.call({});
      } catch (error) {
        console.error('Error in create function:', error);
      }
    }
    
    // Start the game loop
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
    
    return true;
  }
  
  /**
   * Stop the game
   */
  stopGame() {
    this.running = false;
  }
  
  /**
   * The main game loop
   * @param {number} timestamp - The current timestamp
   */
  gameLoop(timestamp) {
    if (!this.running) return;
    
    // Calculate delta time
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    // Clear the canvas
    this.ctx.fillStyle = '#222222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Call all step functions
    for (const stepFunc of this.stepFunctions) {
      try {
        stepFunc.call({}, deltaTime);
      } catch (error) {
        console.error('Error in step function:', error);
      }
    }
    
    // Call all draw functions
    for (const drawFunc of this.drawFunctions) {
      try {
        drawFunc.call({});
      } catch (error) {
        console.error('Error in draw function:', error);
      }
    }
    
    // Clear the frame-specific key states
    this.clearFrameKeyStates();
    
    // Continue the game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  /**
   * Load a level from a JSON string
   * @param {string} json - The level data as a JSON string
   * @returns {boolean} - Whether the level was loaded successfully
   */
  loadLevelFromJSON(json) {
    try {
      const level = JSON.parse(json);
      
      // Clear existing game objects
      this.gameObjects = [];
      
      // Create player
      if (level.player) {
        const player = this.engine.GameObject({
          position: { x: level.player.x, y: level.player.y },
          size: { x: 32, y: 48 },
          color: '#00FFFF',
          tag: 'player'
        });
        
        // Add player components if the engine supports them
        if (this.engine.PlayerController) {
          player.addComponent(new this.engine.PlayerController());
        }
        
        this.gameObjects.push(player);
      }
      
      // Create platforms
      if (level.platforms && level.platforms.length > 0) {
        for (const platformData of level.platforms) {
          const platform = this.engine.createPlatform(
            platformData.x,
            platformData.y,
            platformData.width,
            platformData.height,
            platformData.color || '#888888'
          );
          
          this.gameObjects.push(platform);
        }
      }
      
      // Create enemies
      if (level.enemies && level.enemies.length > 0) {
        for (const enemyData of level.enemies) {
          const enemy = this.engine.createEnemy(
            enemyData.x,
            enemyData.y,
            enemyData.width || 32,
            enemyData.height || 32,
            enemyData.color || '#FF0000',
            this.gameObjects[0] // Player is typically the first game object
          );
          
          this.gameObjects.push(enemy);
        }
      }
      
      // Create collectibles
      if (level.collectibles && level.collectibles.length > 0) {
        for (const collectibleData of level.collectibles) {
          const collectible = this.engine.createCollectible(
            collectibleData.x,
            collectibleData.y,
            collectibleData.width || 20,
            collectibleData.height || 20,
            collectibleData.color || '#FFFF00'
          );
          
          this.gameObjects.push(collectible);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error loading level:', error);
      return false;
    }
  }
}

// Export the interpreter
if (typeof module !== 'undefined') {
  module.exports = { SaaamInterpreter };
}
