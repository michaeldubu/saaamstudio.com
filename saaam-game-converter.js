// SAAAM Game Converter
// Converts SAAAM Studio projects into optimized game deployments ready for export

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ora = require('ora');
const chalk = require('chalk');
const terser = require('terser');
const CleanCSS = require('clean-css');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminSvgo = require('imagemin-svgo');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * Main Converter Class
 */
class SaaamGameConverter {
  constructor(options = {}) {
    this.options = {
      inputDir: './project',
      outputDir: './game',
      minify: true,
      optimizeImages: true,
      generateLoadingScreen: true,
      bundleAssets: true,
      includeDebugTools: false,
      ...options
    };
  }

  async convert() {
    console.log(chalk.cyan('\nSAAAM Game Converter\n'));
    
    // Validate input directory
    if (!this.validateInputDirectory()) {
      return false;
    }
    
    // Clear output directory if it exists
    if (fs.existsSync(this.options.outputDir)) {
      const spinner = ora('Clearing output directory...').start();
      try {
        fs.rmSync(this.options.outputDir, { recursive: true, force: true });
        spinner.succeed('Output directory cleared');
      } catch (error) {
        spinner.fail(`Failed to clear output directory: ${error.message}`);
        return false;
      }
    }
    
    // Create output directory
    fs.mkdirSync(this.options.outputDir, { recursive: true });
    
    // Process the project
    await this.processProject();
    
    console.log(chalk.green('\nConversion completed successfully!\n'));
    console.log(chalk.cyan('Output directory:'), chalk.yellow(this.options.outputDir));
    
    return true;
  }
  
  validateInputDirectory() {
    const spinner = ora('Validating SAAAM project...').start();
    
    if (!fs.existsSync(this.options.inputDir)) {
      spinner.fail(`Input directory does not exist: ${this.options.inputDir}`);
      return false;
    }
    
    // Check for essential project files
    const requiredFiles = [
      path.join(this.options.inputDir, 'index.html')
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        spinner.fail(`Missing required file: ${file}`);
        return false;
      }
    }
    
    spinner.succeed('SAAAM project validated');
    return true;
  }
  
  async processProject() {
    // Create directory structure
    const spinner = ora('Creating directory structure...').start();
    
    const directories = [
      path.join(this.options.outputDir, 'assets'),
      path.join(this.options.outputDir, 'assets', 'images'),
      path.join(this.options.outputDir, 'assets', 'audio'),
      path.join(this.options.outputDir, 'assets', 'fonts'),
      path.join(this.options.outputDir, 'js'),
      path.join(this.options.outputDir, 'css')
    ];
    
    for (const dir of directories) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    spinner.succeed('Directory structure created');
    
    // Process and copy HTML
    await this.processHtml();
    
    // Process and copy JavaScript
    await this.processJavaScript();
    
    // Process and copy CSS
    await this.processCss();
    
    // Process and copy assets
    await this.processAssets();
    
    // Generate additional files
    await this.generateAdditionalFiles();
  }
  
  async processHtml() {
    const spinner = ora('Processing HTML files...').start();
    
    try {
      // Read the main HTML file
      const indexHtmlPath = path.join(this.options.inputDir, 'index.html');
      let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      
      // Parse HTML to modify it
      const dom = new JSDOM(indexHtml);
      const document = dom.window.document;
      
      // Add viewport meta tag if not present
      if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        document.head.appendChild(meta);
      }
      
      // Add platform detection script
      const platformScript = document.createElement('script');
      platformScript.textContent = `
        // Platform detection
        window.saaamPlatform = {
          isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          isWeb: true,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          isElectron: typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer',
          environment: 'web'
        };

        // Add platform-specific classes to body
        document.addEventListener('DOMContentLoaded', function() {
          if (window.saaamPlatform.isDesktop) document.body.classList.add('saaam-desktop');
          if (window.saaamPlatform.isMobile) document.body.classList.add('saaam-mobile');
          if (window.saaamPlatform.isElectron) {
            document.body.classList.add('saaam-electron');
            window.saaamPlatform.environment = 'electron';
          }
        });
      `;
    
    fs.writeFileSync(path.join(this.options.outputDir, 'js', 'saaam-orientation-controls.js'), 
      this.options.minify ? 
        terser.minify(orientationControlsScript, { compress: true, mangle: true }).code : 
        orientationControlsScript
    );
    
    // Create game analytics script
    const analyticsScript = `
      // SAAAM Game Analytics
      (function() {
        // Analytics configuration
        const config = {
          enabled: true,
          sessionTimeout: 30 * 60 * 1000, // 30 minutes
          storageKey: 'saaam_analytics',
          events: []
        };
        
        // Analytics state
        let sessionId = null;
        let sessionStartTime = null;
        let lastActivityTime = null;
        
        // Initialize analytics
        function initAnalytics() {
          if (!window.localStorage) {
            console.warn('Local storage not available, analytics disabled');
            config.enabled = false;
            return;
          }
          
          // Load previous analytics data if available
          const savedData = localStorage.getItem(config.storageKey);
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              config.events = parsedData.events || [];
            } catch (e) {
              console.warn('Error loading analytics data:', e);
              config.events = [];
            }
          }
          
          // Start a new session
          startNewSession();
          
          // Set up activity tracking
          document.addEventListener('visibilitychange', handleVisibilityChange);
          window.addEventListener('beforeunload', handleBeforeUnload);
          
          // Track page view
          trackEvent('page_view', {
            url: window.location.href,
            referrer: document.referrer || 'direct'
          });
          
          // Periodically save analytics data
          setInterval(saveAnalyticsData, 60000); // Save every minute
        }
        
        function startNewSession() {
          sessionId = generateUniqueId();
          sessionStartTime = Date.now();
          lastActivityTime = sessionStartTime;
          
          trackEvent('session_start', {
            platform: getPlatformInfo(),
            screen: getScreenInfo(),
            userAgent: navigator.userAgent
          });
        }
        
        function handleVisibilityChange() {
          if (document.visibilityState === 'hidden') {
            // User left the page
            trackEvent('page_hide');
          } else {
            // User returned to the page
            const now = Date.now();
            
            // Check if session timed out
            if (now - lastActivityTime > config.sessionTimeout) {
              // Session timed out, start a new one
              trackEvent('session_timeout');
              startNewSession();
            } else {
              // Continue current session
              trackEvent('page_show');
            }
          }
          
          lastActivityTime = Date.now();
        }
        
        function handleBeforeUnload() {
          // Track session end
          trackEvent('session_end', {
            duration: Math.floor((Date.now() - sessionStartTime) / 1000)
          });
          
          // Save analytics data before page unload
          saveAnalyticsData();
        }
        
        function trackEvent(eventName, eventData = {}) {
          if (!config.enabled) return;
          
          const event = {
            event: eventName,
            timestamp: Date.now(),
            sessionId: sessionId,
            data: eventData
          };
          
          config.events.push(event);
          
          // Limit number of stored events to prevent excessive storage use
          if (config.events.length > 1000) {
            config.events = config.events.slice(-1000);
          }
          
          // Update last activity time
          lastActivityTime = Date.now();
        }
        
        function saveAnalyticsData() {
          if (!config.enabled) return;
          
          try {
            localStorage.setItem(config.storageKey, JSON.stringify({
              events: config.events
            }));
          } catch (e) {
            console.warn('Error saving analytics data:', e);
          }
        }
        
        function getAnalyticsData() {
          return {
            sessionId: sessionId,
            events: config.events
          };
        }
        
        function clearAnalyticsData() {
          config.events = [];
          localStorage.removeItem(config.storageKey);
        }
        
        function getPlatformInfo() {
          return {
            isMobile: window.saaamPlatform ? window.saaamPlatform.isMobile : /Mobi|Android/i.test(navigator.userAgent),
            isDesktop: window.saaamPlatform ? window.saaamPlatform.isDesktop : !/Mobi|Android/i.test(navigator.userAgent),
            environment: window.saaamPlatform ? window.saaamPlatform.environment : 'web'
          };
        }
        
        function getScreenInfo() {
          return {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1
          };
        }
        
        function generateUniqueId() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        
        // Expose analytics API
        window.saaamAnalytics = {
          trackEvent,
          getAnalyticsData,
          clearAnalyticsData
        };
        
        // Initialize analytics when the DOM is loaded
        document.addEventListener('DOMContentLoaded', initAnalytics);
      })();
    `;
    
    fs.writeFileSync(path.join(this.options.outputDir, 'js', 'saaam-analytics.js'), 
      this.options.minify ? 
        terser.minify(analyticsScript, { compress: true, mangle: true }).code : 
        analyticsScript
    );
      document.head.appendChild(platformScript);
      
      // Add loading screen if enabled
      if (this.options.generateLoadingScreen) {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'saaam-loading-screen';
        loadingScreen.innerHTML = `
          <div class="loading-container">
            <div class="loading-logo">SAAAM</div>
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading game...</div>
          </div>
        `;
        document.body.insertBefore(loadingScreen, document.body.firstChild);
        
        // Add loading screen styles
        const loadingStyle = document.createElement('style');
        loadingStyle.textContent = `
          #saaam-loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #1a1a2e;
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: opacity 0.5s ease;
          }
          .loading-container {
            text-align: center;
          }
          .loading-logo {
            font-size: 3rem;
            font-weight: 700;
            color: #4fc3f7;
            margin-bottom: 2rem;
            letter-spacing: 0.1em;
            text-shadow: 0 0 10px rgba(79, 195, 247, 0.8);
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(79, 195, 247, 0.3);
            border-radius: 50%;
            border-top-color: #4fc3f7;
            margin: 0 auto 1.5rem;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-text {
            color: #ffffff;
            font-size: 1rem;
          }
          #saaam-loading-screen.hidden {
            opacity: 0;
            pointer-events: none;
          }
        `;
        document.head.appendChild(loadingStyle);
        
        // Add loading screen hide logic
        const loadingScript = document.createElement('script');
        loadingScript.textContent = `
          window.addEventListener('load', function() {
            // Hide loading screen when game is ready
            // You can customize this to wait for specific game assets
            setTimeout(function() {
              document.getElementById('saaam-loading-screen').classList.add('hidden');
              // Remove it completely after transition
              setTimeout(function() {
                const loadingScreen = document.getElementById('saaam-loading-screen');
                if (loadingScreen && loadingScreen.parentNode) {
                  loadingScreen.parentNode.removeChild(loadingScreen);
                }
              }, 500);
            }, 1000);
          });
        `;
        document.body.appendChild(loadingScript);
      }
      
      // Add support for Electron API if available
      const electronApiScript = document.createElement('script');
      electronApiScript.textContent = `
        // Electron API bridge
        document.addEventListener('DOMContentLoaded', function() {
          if (window.saaamPlatform.isElectron && window.saaamAPI) {
            console.log('Electron API detected and initialized');
            
            // Create file system API wrapper for the game
            window.saaamFS = {
              saveFile: async function(fileName, data) {
                try {
                  const options = {
                    title: 'Save Game File',
                    defaultPath: fileName,
                    filters: [
                      { name: 'Game Files', extensions: ['save', 'json'] },
                      { name: 'All Files', extensions: ['*'] }
                    ]
                  };
                  
                  const result = await window.saaamAPI.showSaveDialog(options);
                  if (result.canceled) return { success: false, error: 'Canceled by user' };
                  
                  await window.saaamAPI.writeFile(result.filePath, data);
                  return { success: true, filePath: result.filePath };
                } catch (error) {
                  return { success: false, error: error.message };
                }
              },
              
              loadFile: async function() {
                try {
                  const options = {
                    title: 'Load Game File',
                    filters: [
                      { name: 'Game Files', extensions: ['save', 'json'] },
                      { name: 'All Files', extensions: ['*'] }
                    ],
                    properties: ['openFile']
                  };
                  
                  const result = await window.saaamAPI.showOpenDialog(options);
                  if (result.canceled || result.filePaths.length === 0) {
                    return { success: false, error: 'Canceled by user' };
                  }
                  
                  const data = await window.saaamAPI.readFile(result.filePaths[0]);
                  return data;
                } catch (error) {
                  return { success: false, error: error.message };
                }
              }
            };
          } else {
            // Web fallback
            window.saaamFS = {
              saveFile: async function(fileName, data) {
                try {
                  // Create a blob and download link
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  a.style.display = 'none';
                  
                  document.body.appendChild(a);
                  a.click();
                  
                  // Cleanup
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  return { success: true };
                } catch (error) {
                  return { success: false, error: error.message };
                }
              },
              
              loadFile: async function() {
                return { success: false, error: 'File loading not supported in web environment' };
              }
            };
          }
        });
      `;
      document.body.appendChild(electronApiScript);
      
      // Add fullscreen toggle support
      const fullscreenScript = document.createElement('script');
      fullscreenScript.textContent = `
        // Fullscreen support
        document.addEventListener('DOMContentLoaded', function() {
          window.saaamFullscreen = {
            isFullscreen: function() {
              return document.fullscreenElement !== null;
            },
            
            toggle: function() {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                  console.error('Error attempting to enable fullscreen mode:', err.message);
                });
              } else {
                if (document.exitFullscreen) {
                  document.exitFullscreen();
                }
              }
            }
          };
          
          // Add fullscreen toggle button
          const fullscreenBtn = document.createElement('button');
          fullscreenBtn.id = 'saaam-fullscreen-toggle';
          fullscreenBtn.innerHTML = '⛶';
          fullscreenBtn.title = 'Toggle Fullscreen';
          fullscreenBtn.addEventListener('click', window.saaamFullscreen.toggle);
          fullscreenBtn.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:1000;background:rgba(0,0,0,0.5);color:white;border:none;border-radius:4px;width:36px;height:36px;font-size:20px;cursor:pointer;opacity:0.5;transition:opacity 0.2s';
          fullscreenBtn.addEventListener('mouseover', () => { fullscreenBtn.style.opacity = '1'; });
          fullscreenBtn.addEventListener('mouseout', () => { fullscreenBtn.style.opacity = '0.5'; });
          document.body.appendChild(fullscreenBtn);
          
          // Handle F11 key for fullscreen toggle
          document.addEventListener('keydown', function(e) {
            if (e.key === 'F11') {
              e.preventDefault();
              window.saaamFullscreen.toggle();
            }
          });
        });
      `;
      document.body.appendChild(fullscreenScript);
      
      // Convert back to HTML string
      const modifiedHtml = dom.serialize();
      
      // Write the modified HTML to the output directory
      fs.writeFileSync(path.join(this.options.outputDir, 'index.html'), modifiedHtml);
      
      spinner.succeed('HTML files processed');
    } catch (error) {
      spinner.fail(`Error processing HTML: ${error.message}`);
      console.error(error);
    }
  }
  
  async processJavaScript() {
    const spinner = ora('Processing JavaScript files...').start();
    
    try {
      // Find all JS files in the project
      const jsDir = path.join(this.options.inputDir, 'js');
      
      // Check if js directory exists
      if (!fs.existsSync(jsDir)) {
        spinner.info('No JavaScript directory found, skipping...');
        return;
      }
      
      const jsFiles = this.getAllFiles(jsDir, '.js');
      
      // Copy and optionally minify JS files
      for (const file of jsFiles) {
        const relativePath = path.relative(jsDir, file);
        const outputPath = path.join(this.options.outputDir, 'js', relativePath);
        
        // Ensure output directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        
        // Read file
        const code = fs.readFileSync(file, 'utf8');
        
        // Modify code to include SAAAM API wrapper for cross-platform compatibility
        let modifiedCode = code;
        
        // Add special handling for SAAAM engine code if detected
        if (file.includes('engine') || file.includes('saaam')) {
          modifiedCode = this.enhanceSaaamEngine(modifiedCode);
        }
        
        // Minify if option is enabled
        if (this.options.minify) {
          const minified = await terser.minify(modifiedCode, {
            compress: {
              drop_console: !this.options.includeDebugTools,
              drop_debugger: !this.options.includeDebugTools
            },
            mangle: true
          });
          
          fs.writeFileSync(outputPath, minified.code);
        } else {
          fs.writeFileSync(outputPath, modifiedCode);
        }
      }
      
      // Create additional utility scripts
      this.createUtilityScripts();
      
      spinner.succeed(`JavaScript files processed (${jsFiles.length} files)`);
    } catch (error) {
      spinner.fail(`Error processing JavaScript: ${error.message}`);
      console.error(error);
    }
  }
  
  createUtilityScripts() {
    // Create mobile touch controls script if needed
    const touchControlsScript = `
      // SAAAM Touch Controls
      (function() {
        // Only initialize on mobile devices
        if (!window.saaamPlatform || !window.saaamPlatform.isMobile) return;
        
        // Touch controls configuration
        const config = {
          dpadSize: 150,
          buttonSize: 70,
          buttonSpacing: 10,
          opacity: 0.5,
          margin: 20
        };
        
        let dpad, aButton, bButton;
        let touchId = null;
        let dpadTouch = { id: null, active: false, direction: null };
        let aButtonTouch = { id: null, active: false };
        let bButtonTouch = { id: null, active: false };
        
        function createTouchControls() {
          const controlsContainer = document.createElement('div');
          controlsContainer.id = 'saaam-touch-controls';
          controlsContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;touch-action:none;';
          
          // Create D-pad
          dpad = document.createElement('div');
          dpad.className = 'saaam-dpad';
          dpad.style.cssText = \`position:absolute;left:\${config.margin}px;bottom:\${config.margin}px;width:\${config.dpadSize}px;height:\${config.dpadSize}px;background:rgba(255,255,255,0.1);border-radius:50%;pointer-events:auto;\`;
          
          // Create action buttons
          aButton = document.createElement('div');
          aButton.className = 'saaam-button saaam-button-a';
          aButton.style.cssText = \`position:absolute;right:\${config.margin + config.buttonSize + config.buttonSpacing}px;bottom:\${config.margin}px;width:\${config.buttonSize}px;height:\${config.buttonSize}px;background:rgba(255,0,0,\${config.opacity});border-radius:50%;pointer-events:auto;display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;\`;
          aButton.textContent = 'B';
          
          bButton = document.createElement('div');
          bButton.className = 'saaam-button saaam-button-b';
          bButton.style.cssText = \`position:absolute;right:\${config.margin}px;bottom:\${config.margin + config.buttonSize + config.buttonSpacing}px;width:\${config.buttonSize}px;height:\${config.buttonSize}px;background:rgba(0,255,0,\${config.opacity});border-radius:50%;pointer-events:auto;display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;\`;
          bButton.textContent = 'A';
          
          // Add elements to container
          controlsContainer.appendChild(dpad);
          controlsContainer.appendChild(aButton);
          controlsContainer.appendChild(bButton);
          
          document.body.appendChild(controlsContainer);
          
          // Set up event listeners
          setupTouchEvents();
        }
        
        function setupTouchEvents() {
          // D-pad touch events
          dpad.addEventListener('touchstart', handleDpadTouchStart, { passive: false });
          dpad.addEventListener('touchmove', handleDpadTouchMove, { passive: false });
          dpad.addEventListener('touchend', handleDpadTouchEnd, { passive: false });
          
          // Button touch events
          aButton.addEventListener('touchstart', handleAButtonTouchStart, { passive: false });
          aButton.addEventListener('touchend', handleAButtonTouchEnd, { passive: false });
          aButton.addEventListener('touchcancel', handleAButtonTouchEnd, { passive: false });
          
          bButton.addEventListener('touchstart', handleBButtonTouchStart, { passive: false });
          bButton.addEventListener('touchend', handleBButtonTouchEnd, { passive: false });
          bButton.addEventListener('touchcancel', handleBButtonTouchEnd, { passive: false });
        }
        
        function handleDpadTouchStart(event) {
          event.preventDefault();
          const touch = event.changedTouches[0];
          dpadTouch.id = touch.identifier;
          dpadTouch.active = true;
          updateDpadDirection(touch.clientX, touch.clientY);
        }
        
        function handleDpadTouchMove(event) {
          event.preventDefault();
          // Find the touch with the right ID
          for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (touch.identifier === dpadTouch.id) {
              updateDpadDirection(touch.clientX, touch.clientY);
              break;
            }
          }
        }
        
        function handleDpadTouchEnd(event) {
          event.preventDefault();
          // Find the touch with the right ID
          for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (touch.identifier === dpadTouch.id) {
              dpadTouch.active = false;
              dpadTouch.direction = null;
              
              // Reset all directional key states
              simulateKeyUp('ArrowUp');
              simulateKeyUp('ArrowDown');
              simulateKeyUp('ArrowLeft');
              simulateKeyUp('ArrowRight');
              break;
            }
          }
        }
        
        function updateDpadDirection(touchX, touchY) {
          // Calculate center of dpad
          const rect = dpad.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // Calculate direction vector
          const dx = touchX - centerX;
          const dy = touchY - centerY;
          
          // Get angle in degrees (0° is right, 90° is down)
          let angle = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angle < 0) angle += 360;
          
          // Get distance from center (for deadzone)
          const distance = Math.sqrt(dx * dx + dy * dy);
          const deadzone = rect.width * 0.2;
          
          // Reset all directions first
          simulateKeyUp('ArrowUp');
          simulateKeyUp('ArrowDown');
          simulateKeyUp('ArrowLeft');
          simulateKeyUp('ArrowRight');
          
          // If touch is outside deadzone, determine direction
          if (distance > deadzone) {
            // Determine primary direction based on angle
            if (angle >= 315 || angle < 45) {
              // Right
              simulateKeyDown('ArrowRight');
              dpadTouch.direction = 'right';
            } else if (angle >= 45 && angle < 135) {
              // Down
              simulateKeyDown('ArrowDown');
              dpadTouch.direction = 'down';
            } else if (angle >= 135 && angle < 225) {
              // Left
              simulateKeyDown('ArrowLeft');
              dpadTouch.direction = 'left';
            } else {
              // Up
              simulateKeyDown('ArrowUp');
              dpadTouch.direction = 'up';
            }
            
            // For diagonal movement, add second direction
            const diagonalThreshold = 22.5; // 45° / 2
            
            if (angle >= 45 - diagonalThreshold && angle < 45 + diagonalThreshold) {
              // Down-Right
              simulateKeyDown('ArrowRight');
              simulateKeyDown('ArrowDown');
              dpadTouch.direction = 'down-right';
            } else if (angle >= 135 - diagonalThreshold && angle < 135 + diagonalThreshold) {
              // Down-Left
              simulateKeyDown('ArrowLeft');
              simulateKeyDown('ArrowDown');
              dpadTouch.direction = 'down-left';
            } else if (angle >= 225 - diagonalThreshold && angle < 225 + diagonalThreshold) {
              // Up-Left
              simulateKeyDown('ArrowLeft');
              simulateKeyDown('ArrowUp');
              dpadTouch.direction = 'up-left';
            } else if (angle >= 315 - diagonalThreshold && angle < 315 + diagonalThreshold) {
              // Up-Right
              simulateKeyDown('ArrowRight');
              simulateKeyDown('ArrowUp');
              dpadTouch.direction = 'up-right';
            }
          }
        }
        
        function handleAButtonTouchStart(event) {
          event.preventDefault();
          const touch = event.changedTouches[0];
          aButtonTouch.id = touch.identifier;
          aButtonTouch.active = true;
          simulateKeyDown(' '); // Space key
          aButton.style.transform = 'scale(0.9)';
        }
        
        function handleAButtonTouchEnd(event) {
          event.preventDefault();
          // Find the touch with the right ID
          for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (touch.identifier === aButtonTouch.id) {
              aButtonTouch.active = false;
              simulateKeyUp(' '); // Space key
              aButton.style.transform = 'scale(1)';
              break;
            }
          }
        }
        
        function handleBButtonTouchStart(event) {
          event.preventDefault();
          const touch = event.changedTouches[0];
          bButtonTouch.id = touch.identifier;
          bButtonTouch.active = true;
          simulateKeyDown('z'); // Z key (common action button)
          bButton.style.transform = 'scale(0.9)';
        }
        
        function handleBButtonTouchEnd(event) {
          event.preventDefault();
          // Find the touch with the right ID
          for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (touch.identifier === bButtonTouch.id) {
              bButtonTouch.active = false;
              simulateKeyUp('z'); // Z key
              bButton.style.transform = 'scale(1)';
              break;
            }
          }
        }
        
        // Simulate keyboard events
        function simulateKeyDown(key) {
          const event = new KeyboardEvent('keydown', {
            key: key,
            code: getCodeFromKey(key),
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(event);
          
          // Also update SAAAM key states if available
          if (window.SAAAM && window.SAAAM.updateKeyState) {
            window.SAAAM.updateKeyState(key, true);
          }
        }
        
        function simulateKeyUp(key) {
          const event = new KeyboardEvent('keyup', {
            key: key,
            code: getCodeFromKey(key),
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(event);
          
          // Also update SAAAM key states if available
          if (window.SAAAM && window.SAAAM.updateKeyState) {
            window.SAAAM.updateKeyState(key, false);
          }
        }
        
        function getCodeFromKey(key) {
          const keyMap = {
            'ArrowUp': 'ArrowUp',
            'ArrowDown': 'ArrowDown',
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight',
            ' ': 'Space',
            'z': 'KeyZ'
          };
          
          return keyMap[key] || key;
        }
        
        // Initialize touch controls when the DOM is loaded
        document.addEventListener('DOMContentLoaded', createTouchControls);
      })();
    `;
    
    fs.writeFileSync(path.join(this.options.outputDir, 'js', 'saaam-touch-controls.js'), 
      this.options.minify ? 
        terser.minify(touchControlsScript, { compress: true, mangle: true }).code : 
        touchControlsScript
    );
    
    // Create device orientation controls for mobile
    const orientationControlsScript = `
      // SAAAM Orientation Controls
      (function() {
        // Only initialize on mobile devices with deviceorientation support
        if (!window.saaamPlatform || !window.saaamPlatform.isMobile || 
            !window.DeviceOrientationEvent) return;
        
        // Configuration
        const config = {
          enabled: false,
          calibration: {
            alpha: 0,
            beta: 0,
            gamma: 0
          },
          sensitivity: 1.0,
          deadzone: 5.0
        };
        
        // Setup device orientation
        function setupOrientationControls() {
          // Create settings UI toggle
          const toggleBtn = document.createElement('button');
          toggleBtn.id = 'saaam-orientation-toggle';
          toggleBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:1000;background:rgba(0,0,0,0.5);color:white;border:none;border-radius:4px;padding:8px;cursor:pointer;font-size:12px;';
          toggleBtn.textContent = 'Enable Tilt Controls';
          
          toggleBtn.addEventListener('click', function() {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
              // iOS 13+ requires permission
              DeviceOrientationEvent.requestPermission()
                .then(response => {
                  if (response === 'granted') {
                    enableOrientationControls();
                    this.textContent = 'Disable Tilt Controls';
                  }
                })
                .catch(error => {
                  console.error('Error requesting device orientation permission:', error);
                });
            } else {
              // Non-iOS devices or older iOS versions
              toggleOrientationControls();
              this.textContent = config.enabled ? 'Disable Tilt Controls' : 'Enable Tilt Controls';
            }
          });
          
          document.body.appendChild(toggleBtn);
        }
        
        function toggleOrientationControls() {
          config.enabled = !config.enabled;
          
          if (config.enabled) {
            // Calibrate current orientation as neutral
            window.addEventListener('deviceorientation', calibrateOrientation, { once: true });
            // Start listening for orientation changes
            window.addEventListener('deviceorientation', handleOrientation);
          } else {
            // Stop listening for orientation changes
            window.removeEventListener('deviceorientation', handleOrientation);
            // Reset any active directional keys
            resetAllDirections();
          }
        }
        
        function enableOrientationControls() {
          config.enabled = true;
          // Calibrate current orientation as neutral
          window.addEventListener('deviceorientation', calibrateOrientation, { once: true });
          // Start listening for orientation changes
          window.addEventListener('deviceorientation', handleOrientation);
        }
        
        function calibrateOrientation(event) {
          // Store current orientation as neutral position
          config.calibration.alpha = event.alpha || 0;
          config.calibration.beta = event.beta || 0;
          config.calibration.gamma = event.gamma || 0;
          
          console.log('Orientation calibrated:', config.calibration);
        }
        
        function handleOrientation(event) {
          if (!config.enabled) return;
          
          // Get current orientation
          const alpha = event.alpha || 0;
          const beta = event.beta || 0;
          const gamma = event.gamma || 0;
          
          // Calculate difference from calibration
          const betaDiff = beta - config.calibration.beta;
          const gammaDiff = gamma - config.calibration.gamma;
          
          // Reset all directions first
          resetAllDirections();
          
          // Apply forward/backward tilt (beta)
          if (betaDiff > config.deadzone) {
            // Tilting forward
            simulateKeyDown('ArrowDown');
          } else if (betaDiff < -config.deadzone) {
            // Tilting backward
            simulateKeyDown('ArrowUp');
          }
          
          // Apply left/right tilt (gamma)
          if (gammaDiff > config.deadzone) {
            // Tilting right
            simulateKeyDown('ArrowRight');
          } else if (gammaDiff < -config.deadzone) {
            // Tilting left
            simulateKeyDown('ArrowLeft');
          }
        }
        
        function resetAllDirections() {
          simulateKeyUp('ArrowUp');
          simulateKeyUp('ArrowDown');
          simulateKeyUp('ArrowLeft');
          simulateKeyUp('ArrowRight');
        }
        
        // Simulate keyboard events (same as touch controls)
        function simulateKeyDown(key) {
          const event = new KeyboardEvent('keydown', {
            key: key,
            code: getCodeFromKey(key),
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(event);
          
          // Also update SAAAM key states if available
          if (window.SAAAM && window.SAAAM.updateKeyState) {
            window.SAAAM.updateKeyState(key, true);
          }
        }
        
        function simulateKeyUp(key) {
          const event = new KeyboardEvent('keyup', {
            key: key,
            code: getCodeFromKey(key),
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(event);
          
          // Also update SAAAM key states if available
          if (window.SAAAM && window.SAAAM.updateKeyState) {
            window.SAAAM.updateKeyState(key, false);
          }
        }
        
        function getCodeFromKey(key) {
          const keyMap = {
            'ArrowUp': 'ArrowUp',
            'ArrowDown': 'ArrowDown',
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight'
          };
          
          return keyMap[key] || key;
        }
        
        // Initialize orientation controls when the DOM is loaded
        document.addEventListener('DOMContentLoaded', setupOrientationControls);
      })();
        `;
    
    fs.writeFileSync(path.join(this.options.outputDir, 'js', 'saaam-orientation-controls.js'), 
      this.options.minify ? 
        terser.minify(orientationControlsScript, { compress: true, mangle: true }).code : 
        orientationControlsScript
    );

// Continue from the previously defined orientationControlsScript

    // Enhanced SAAAM Engine with cross-platform compatibility
    enhanceSaaamEngine(code) {
      // Add platform detection and compatibility APIs
      return `
        // SAAAM Cross-Platform Enhancement
        (function() {
          // Only apply enhancements if this is the SAAAM engine
          if (typeof window.SAAAM === 'undefined') {
            // Wait for SAAAM to be initialized
            window.addEventListener('load', function checkSAAAM() {
              if (typeof window.SAAAM !== 'undefined') {
                enhanceSaaamEngine();
                window.removeEventListener('load', checkSAAAM);
              } else {
                setTimeout(checkSAAAM, 100);
              }
            });
            
            return;
          }
          
          function enhanceSaaamEngine() {
            // Add platform-specific optimization and features
            window.SAAAM.platform = window.saaamPlatform || {
              isDesktop: true,
              isMobile: false,
              isWeb: true,
              isElectron: false,
              environment: 'web'
            };
            
            // Add key state update method for virtual controls
            window.SAAAM.updateKeyState = function(key, isPressed) {
              if (!window.SAAAM.keysPressed) window.SAAAM.keysPressed = {};
              window.SAAAM.keysPressed[key] = isPressed;
            };
            
            // Add persistent storage API
            window.SAAAM.storage = {
              save: function(key, value) {
                try {
                  localStorage.setItem('saaam_' + key, JSON.stringify(value));
                  return true;
                } catch (e) {
                  console.error('Error saving data:', e);
                  return false;
                }
              },
              
              load: function(key) {
                try {
                  const data = localStorage.getItem('saaam_' + key);
                  return data ? JSON.parse(data) : null;
                } catch (e) {
                  console.error('Error loading data:', e);
                  return null;
                }
              },
              
              delete: function(key) {
                try {
                  localStorage.removeItem('saaam_' + key);
                  return true;
                } catch (e) {
                  console.error('Error deleting data:', e);
                  return false;
                }
              },
              
              clear: function() {
                try {
                  // Only clear SAAAM keys
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('saaam_')) {
                      localStorage.removeItem(key);
                    }
                  });
                  return true;
                } catch (e) {
                  console.error('Error clearing data:', e);
                  return false;
                }
              }
            };
            
            // Add analytics API integration
            if (window.saaamAnalytics) {
              window.SAAAM.analytics = {
                trackEvent: function(eventName, data) {
                  window.saaamAnalytics.trackEvent(eventName, data);
                }
              };
              
              // Track game events automatically
              const originalStartGame = window.SAAAM.startGame;
              window.SAAAM.startGame = function() {
                if (window.saaamAnalytics) {
                  window.saaamAnalytics.trackEvent('game_start');
                }
                return originalStartGame.apply(this, arguments);
              };
              
              const originalStopGame = window.SAAAM.stopGame;
              window.SAAAM.stopGame = function() {
                if (window.saaamAnalytics) {
                  window.saaamAnalytics.trackEvent('game_stop');
                }
                return originalStopGame.apply(this, arguments);
              };
            }
            
            console.log('SAAAM engine enhanced for cross-platform compatibility');
          }
          
          // Apply enhancements immediately
          enhanceSaaamEngine();
        })();
        
        ${code}
      `;
    }
  
  async processCss() {
    const spinner = ora('Processing CSS files...').start();
    
    try {
      // Find all CSS files in the project
      const cssDir = path.join(this.options.inputDir, 'css');
      
      // Check if css directory exists
      if (!fs.existsSync(cssDir)) {
        spinner.info('No CSS directory found, skipping...');
        return;
      }
      
      const cssFiles = this.getAllFiles(cssDir, '.css');
      
      // Copy and optionally minify CSS files
      for (const file of cssFiles) {
        const relativePath = path.relative(cssDir, file);
        const outputPath = path.join(this.options.outputDir, 'css', relativePath);
        
        // Ensure output directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        
        // Read file
        const css = fs.readFileSync(file, 'utf8');
        
        // Add cross-platform compatibility enhancements
        let enhancedCss = this.enhanceCss(css);
        
        // Minify if option is enabled
        if (this.options.minify) {
          const minified = new CleanCSS({ level: 2 }).minify(enhancedCss);
          fs.writeFileSync(outputPath, minified.styles);
        } else {
          fs.writeFileSync(outputPath, enhancedCss);
        }
      }
      
      // Create additional CSS for mobile optimization
      this.createMobileOptimizationCss();
      
      spinner.succeed(`CSS files processed (${cssFiles.length} files)`);
    } catch (error) {
      spinner.fail(`Error processing CSS: ${error.message}`);
      console.error(error);
    }
  }
  
  enhanceCss(css) {
    // Add platform-specific CSS enhancements
    return `
      /* Platform-specific enhancements */
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      
      /* Mobile optimizations */
      @media (max-width: 768px) {
        * {
          -webkit-tap-highlight-color: transparent;
        }
      }
      
      /* Original CSS */
      ${css}
    `;
  }
  
  createMobileOptimizationCss() {
    // Create mobile optimization CSS
    const mobileOptimizationCss = `
      /* SAAAM Mobile Optimizations */
      
      /* Prevent text selection */
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Hide address bar on some mobile browsers */
      html {
        height: 100%;
        overflow: hidden;
      }
      
      body {
        height: 100%;
        overflow: hidden;
        position: fixed;
        touch-action: none;
      }
      
      /* Game canvas optimizations */
      canvas {
        image-rendering: optimizeSpeed;
        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: optimize-contrast;
        image-rendering: pixelated;
        -ms-interpolation-mode: nearest-neighbor;
      }
      
      /* Hide scrollbars */
      ::-webkit-scrollbar {
        display: none;
      }
      
      /* Orientation message for mobile */
      @media screen and (orientation: portrait) {
        /* Only show if we have the body class that indicates we're on mobile */
        body.saaam-mobile .orientation-message {
          display: flex;
        }
      }
      
      .orientation-message {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #1a1a2e;
        z-index: 10000;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text-align: center;
        color: white;
        font-family: Arial, sans-serif;
      }
      
      .orientation-message .icon {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;
        animation: rotate 1s ease-in-out infinite alternate;
      }
      
      @keyframes rotate {
        0% {
          transform: rotate(-90deg);
        }
        100% {
          transform: rotate(-90deg) scale(1.1);
        }
      }
      
      .orientation-message p {
        font-size: 18px;
        margin: 10px 20px;
      }
    `;
    
    fs.writeFileSync(
      path.join(this.options.outputDir, 'css', 'saaam-mobile.css'),
      this.options.minify ? 
        new CleanCSS({ level: 2 }).minify(mobileOptimizationCss).styles : 
        mobileOptimizationCss
    );
  }
  
  async processAssets() {
    const spinner = ora('Processing assets...').start();
    
    try {
      // Find all asset files in the project
      const assetsDir = path.join(this.options.inputDir, 'assets');
      
      // Check if assets directory exists
      if (!fs.existsSync(assetsDir)) {
        spinner.info('No assets directory found, skipping...');
        return;
      }
      
      // Process images
      if (this.options.optimizeImages) {
        await this.optimizeImages(assetsDir);
      } else {
        this.copyAssets(assetsDir);
      }
      
      // Generate asset manifest
      if (this.options.bundleAssets) {
        this.generateAssetManifest();
      }
      
      spinner.succeed('Assets processed');
    } catch (error) {
      spinner.fail(`Error processing assets: ${error.message}`);
      console.error(error);
    }
  }
  
  async optimizeImages(assetsDir) {
    const spinner = ora('Optimizing images...').start();
    
    try {
      const imageFiles = [
        ...this.getAllFiles(assetsDir, '.png'),
        ...this.getAllFiles(assetsDir, '.jpg'),
        ...this.getAllFiles(assetsDir, '.jpeg'),
        ...this.getAllFiles(assetsDir, '.svg')
      ];
      
      // Skip if no images found
      if (imageFiles.length === 0) {
        spinner.info('No images found to optimize');
        return;
      }
      
      // Group images by directory to maintain structure
      const imageGroups = {};
      for (const file of imageFiles) {
        const dir = path.dirname(file);
        const relativePath = path.relative(assetsDir, dir);
        
        if (!imageGroups[relativePath]) {
          imageGroups[relativePath] = [];
        }
        
        imageGroups[relativePath].push(file);
      }
      
      // Optimize each group and maintain directory structure
      for (const [relativePath, files] of Object.entries(imageGroups)) {
        const outputDir = path.join(this.options.outputDir, 'assets', relativePath);
        fs.mkdirSync(outputDir, { recursive: true });
        
        // Optimize images
        await imagemin(files, {
          destination: outputDir,
          plugins: [
            imageminPngquant({ quality: [0.6, 0.8] }),
            imageminJpegtran(),
            imageminSvgo()
          ]
        });
      }
      
      // Copy non-image assets
      const nonImageAssets = this.getAllFiles(assetsDir).filter(file => 
        !['.png', '.jpg', '.jpeg', '.svg'].includes(path.extname(file).toLowerCase())
      );
      
      for (const file of nonImageAssets) {
        const relativePath = path.relative(assetsDir, file);
        const outputPath = path.join(this.options.outputDir, 'assets', relativePath);
        
        // Ensure output directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        
        // Copy file
        fs.copyFileSync(file, outputPath);
      }
      
      spinner.succeed(`Optimized ${imageFiles.length} images`);
    } catch (error) {
      spinner.fail(`Error optimizing images: ${error.message}`);
      console.error(error);
      
      // Fallback to simple copy
      this.copyAssets(assetsDir);
    }
  }
  
  copyAssets(assetsDir) {
    const spinner = ora('Copying assets...').start();
    
    try {
      const assetFiles = this.getAllFiles(assetsDir);
      
      // Skip if no assets found
      if (assetFiles.length === 0) {
        spinner.info('No assets found to copy');
        return;
      }
      
      // Copy each asset
      for (const file of assetFiles) {
        const relativePath = path.relative(assetsDir, file);
        const outputPath = path.join(this.options.outputDir, 'assets', relativePath);
        
        // Ensure output directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        
        // Copy file
        fs.copyFileSync(file, outputPath);
      }
      
      spinner.succeed(`Copied ${assetFiles.length} assets`);
    } catch (error) {
      spinner.fail(`Error copying assets: ${error.message}`);
      console.error(error);
    }
  }
  
  generateAssetManifest() {
    const spinner = ora('Generating asset manifest...').start();
    
    try {
      const assetsDir = path.join(this.options.outputDir, 'assets');
      
      // Skip if assets directory doesn't exist
      if (!fs.existsSync(assetsDir)) {
        spinner.info('No assets directory found, skipping manifest generation');
        return;
      }
      
      // Get all assets
      const assets = this.getAllFiles(assetsDir);
      
      // Create manifest
      const manifest = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        assets: {}
      };
      
      // Group assets by type
      for (const file of assets) {
        const relativePath = path.relative(assetsDir, file);
        const extension = path.extname(file).toLowerCase().substring(1);
        
        let type = 'other';
        if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(extension)) {
          type = 'images';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
          type = 'audio';
        } else if (['ttf', 'woff', 'woff2', 'eot'].includes(extension)) {
          type = 'fonts';
        } else if (['json'].includes(extension)) {
          type = 'data';
        }
        
        if (!manifest.assets[type]) {
          manifest.assets[type] = [];
        }
        
        manifest.assets[type].push({
          path: relativePath.replace(/\\/g, '/'),
          size: fs.statSync(file).size,
          name: path.basename(file, path.extname(file))
        });
      }
      
      // Write manifest
      fs.writeFileSync(
        path.join(this.options.outputDir, 'assets', 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      
      // Also create a preload script for assets
      const preloadScript = `
        // SAAAM Asset Preloader
        (function() {
          window.saaamAssets = {
            manifest: ${JSON.stringify(manifest)},
            loaded: {},
            total: 0,
            completed: 0,
            
            preload: function(callback, progressCallback) {
              const self = this;
              let assets = [];
              
              // Flatten assets into a single array
              Object.values(this.manifest.assets).forEach(group => {
                assets = assets.concat(group);
              });
              
              this.total = assets.length;
              this.completed = 0;
              
              if (this.total === 0) {
                if (callback) callback();
                return;
              }
              
              // Load each asset
              assets.forEach(asset => {
                const extension = asset.path.split('.').pop().toLowerCase();
                
                if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(extension)) {
                  this.loadImage(asset, onAssetLoaded);
                } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
                  this.loadAudio(asset, onAssetLoaded);
                } else if (['ttf', 'woff', 'woff2', 'eot'].includes(extension)) {
                  this.loadFont(asset, onAssetLoaded);
                } else if (['json'].includes(extension)) {
                  this.loadJson(asset, onAssetLoaded);
                } else {
                  // Skip other assets
                  onAssetLoaded(asset, null);
                }
              });
              
              function onAssetLoaded(asset, loadedAsset) {
                self.completed++;
                self.loaded[asset.path] = loadedAsset;
                
                if (progressCallback) {
                  progressCallback(self.completed, self.total, asset);
                }
                
                if (self.completed === self.total && callback) {
                  callback();
                }
              }
            },
            
            loadImage: function(asset, callback) {
              const img = new Image();
              img.onload = function() {
                callback(asset, img);
              };
              img.onerror = function() {
                console.error('Failed to load image:', asset.path);
                callback(asset, null);
              };
              img.src = '/assets/' + asset.path;
            },
            
            loadAudio: function(asset, callback) {
              const audio = new Audio();
              audio.oncanplaythrough = function() {
                callback(asset, audio);
              };
              audio.onerror = function() {
                console.error('Failed to load audio:', asset.path);
                callback(asset, null);
              };
              audio.src = '/assets/' + asset.path;
              audio.load();
            },
            
            loadFont: function(asset, callback) {
              // Web fonts are loaded via CSS, so we just mark it as loaded
              callback(asset, true);
            },
            
            loadJson: function(asset, callback) {
              fetch('/assets/' + asset.path)
                .then(response => response.json())
                .then(data => {
                  callback(asset, data);
                })
                .catch(error => {
                  console.error('Failed to load JSON:', asset.path, error);
                  callback(asset, null);
                });
            },
            
            getAsset: function(path) {
              return this.loaded[path] || null;
            },
            
            getImage: function(name) {
              const images = this.manifest.assets.images || [];
              const image = images.find(img => img.name === name);
              return image ? this.getAsset(image.path) : null;
            },
            
            getAudio: function(name) {
              const audio = this.manifest.assets.audio || [];
              const sound = audio.find(snd => snd.name === name);
              return sound ? this.getAsset(sound.path) : null;
            },
            
            getJson: function(name) {
              const data = this.manifest.assets.data || [];
              const json = data.find(item => item.name === name);
              return json ? this.getAsset(json.path) : null;
            }
          };
          
          // Initialize asset preloader when the page loads
          window.addEventListener('load', function() {
            // Preload assets and hide loading screen when done
            window.saaamAssets.preload(function() {
              // Hide loading screen when preload is complete
              const loadingScreen = document.getElementById('saaam-loading-screen');
              if (loadingScreen) {
                loadingScreen.classList.add('hidden');
              }
              
              // Track loading complete
              if (window.saaamAnalytics) {
                window.saaamAnalytics.trackEvent('assets_loaded', {
                  count: window.saaamAssets.total
                });
              }
              
              // Dispatch event for game to start
              window.dispatchEvent(new Event('saaam-assets-loaded'));
            }, function(completed, total, asset) {
              // Update loading progress
              const loadingScreen = document.getElementById('saaam-loading-screen');
              if (loadingScreen) {
                const progress = Math.floor((completed / total) * 100);
                const loadingText = loadingScreen.querySelector('.loading-text');
                if (loadingText) {
                  loadingText.textContent = 'Loading game... ' + progress + '%';
                }
              }
            });
          });
        })();
      `;
      
      fs.writeFileSync(
        path.join(this.options.outputDir, 'js', 'saaam-preloader.js'),
        this.options.minify ? 
          terser.minify(preloadScript, { compress: true, mangle: true }).code : 
          preloadScript
      );
      
      spinner.succeed('Asset manifest and preloader generated');
    } catch (error) {
      spinner.fail(`Error generating asset manifest: ${error.message}`);
      console.error(error);
    }
  }
  
  async generateAdditionalFiles() {
    const spinner = ora('Generating additional files...').start();
    
    try {
      // Create mobile orientation message
      if (this.options.generateLoadingScreen) {
        this.createOrientationMessage();
      }
      
      // Create manifest.json for web app
      this.createWebAppManifest();
      
      // Create service worker for offline support
      this.createServiceWorker();
      
      // Create README.md
      this.createReadme();
      
      spinner.succeed('Additional files generated');
    } catch (error) {
      spinner.fail(`Error generating additional files: ${error.message}`);
      console.error(error);
    }
  }
  
  createOrientationMessage() {
    // Create orientation message HTML
    const orientationMessageHtml = `
      <div class="orientation-message">
        <div class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12" y2="18"></line>
          </svg>
        </div>
        <p>Please rotate your device to landscape mode for the best experience.</p>
      </div>
    `;
    
    // Add to index.html
    const indexHtmlPath = path.join(this.options.outputDir, 'index.html');
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Parse HTML
    const dom = new JSDOM(indexHtml);
    const document = dom.window.document;
    
    // Add orientation message after the loading screen
    const loadingScreen = document.getElementById('saaam-loading-screen');
    if (loadingScreen) {
      loadingScreen.insertAdjacentHTML('afterend', orientationMessageHtml);
    } else {
      // Add at the beginning of the body if no loading screen
      document.body.insertAdjacentHTML('afterbegin', orientationMessageHtml);
    }
    
    // Add script to handle orientation changes
    const orientationScript = document.createElement('script');
    orientationScript.textContent = `
      // Handle orientation changes
      window.addEventListener('DOMContentLoaded', function() {
        if (window.saaamPlatform && window.saaamPlatform.isMobile) {
          // Add mobile class to body
          document.body.classList.add('saaam-mobile');
          
          // Add check for Safari by checking for 'AppleWebKit' and absence of 'Chrome'
          const isSafari = /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
          if (isSafari) {
            document.body.classList.add('saaam-safari');
          }
          
          // Check orientation on load and changes
          checkOrientation();
          window.addEventListener('resize', checkOrientation);
        }
        
        function checkOrientation() {
          // Only show message in portrait mode on mobile
          if (window.innerHeight > window.innerWidth) {
            document.body.classList.add('saaam-portrait');
            document.body.classList.remove('saaam-landscape');
          } else {
            document.body.classList.add('saaam-landscape');
            document.body.classList.remove('saaam-portrait');
          }
        }
      });
    `;
    document.body.appendChild(orientationScript);
    
    // Write modified HTML
    fs.writeFileSync(indexHtmlPath, dom.serialize());
  }
  
  createWebAppManifest() {
    // Create web app manifest
    const manifest = {
      name: 'SAAAM Game',
      short_name: 'SAAAM Game',
      description: 'A game created with SAAAM Game Studio',
      start_url: '/',
      display: 'fullscreen',
      orientation: 'landscape',
      background_color: '#1a1a2e',
      theme_color: '#1a1a2e',
      icons: [
        {
          src: 'assets/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'assets/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
    
    // Create icons directory
    const iconsDir = path.join(this.options.outputDir, 'assets', 'icons');
    fs.mkdirSync(iconsDir, { recursive: true });
    
    // Write manifest
    fs.writeFileSync(
      path.join(this.options.outputDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Add link to manifest in index.html
    const indexHtmlPath = path.join(this.options.outputDir, 'index.html');
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Parse HTML
    const dom = new JSDOM(indexHtml);
    const document = dom.window.document;
    
    // Add manifest link if not present
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
      
      // Add theme color meta tag
      const themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = '#1a1a2e';
      document.head.appendChild(themeColorMeta);
      
      // Add apple touch icon
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = '/assets/icons/icon-192x192.png';
      document.head.appendChild(appleTouchIcon);
    }
    
    // Write modified HTML
    fs.writeFileSync(indexHtmlPath, dom.serialize());
  }
  
  createServiceWorker() {
    // Create service worker for offline support
    const serviceWorkerJs = `
      // SAAAM Game Service Worker
      const CACHE_NAME = 'saaam-game-cache-v1';
      const ASSETS_TO_CACHE = [
        '/',
        '/index.html',
        '/manifest.json',
        '/js/saaam-preloader.js',
        '/js/saaam-analytics.js',
        '/js/saaam-touch-controls.js',
        '/js/saaam-orientation-controls.js',
        '/css/saaam-mobile.css'
      ];
      
      // Install event - cache assets
      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.addAll(ASSETS_TO_CACHE);
            })
        );
      });
      
      // Fetch event - serve from cache if available
      self.addEventListener('fetch', (event) => {
        event.respondWith(
          caches.match(event.request)
            .then((response) => {
              // Return from cache if available
              if (response) {
                return response;
              }
              
              // Otherwise fetch from network
              return fetch(event.request).then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                
                // Clone the response since it can only be consumed once
                const responseToCache = response.clone();
                
                // Cache the response for future use
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
                
                return response;
              });
            })
        );
      });
      
      // Activate event - clean up old caches
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheName !== CACHE_NAME) {
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
      });
    `;
    
    // Write service worker
    fs.writeFileSync(
      path.join(this.options.outputDir, 'service-worker.js'),
      this.options.minify ? 
        terser.minify(serviceWorkerJs, { compress: true, mangle: true }).code : 
        serviceWorkerJs
    );
    
    // Add service worker registration to index.html
    const indexHtmlPath = path.join(this.options.outputDir, 'index.html');
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Parse HTML
    const dom = new JSDOM(indexHtml);
    const document = dom.window.document;
    
    // Add service worker registration script
    const serviceWorkerScript = document.createElement('script');
    serviceWorkerScript.textContent = `
      // Service worker registration
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
              console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
              console.error('Service Worker registration failed:', error);
            });
        });
      }
    `;
    document.body.appendChild(serviceWorkerScript);
    
    // Write modified HTML
    fs.writeFileSync(indexHtmlPath, dom.serialize());
  }
  
    createReadme() {
    const readmeContent = `
# ${this.options.inputDir} ➡️ ${this.options.outputDir}

This directory contains the optimized, export-ready version of your SAAAM Studio game.

## What's Included

- 🧠 **Minified JavaScript & CSS** for faster load times  
- 🖼️ **Optimized assets** (images, audio, fonts, etc.)  
- 🧭 **Cross-platform enhancements** (Electron, Web, Mobile)  
- 📊 **Game analytics & preloader integration**  
- 📱 **Touch & orientation controls**  
- 📦 **Asset manifest** for preloaders and memory management  
- 🌐 **PWA support** with `manifest.json` and `service-worker.js`

## Next Steps

- 📁 Copy this folder into your Desktop Exporter
- 🌍 Upload to web, or package for Electron
- 🚀 Enjoy your SAAAM-powered game!

---

🛠️ **Built with love by SAAAM Game Converter**
    `.trim();

    fs.writeFileSync(path.join(this.options.outputDir, 'README.md'), readmeContent);
  }
}
