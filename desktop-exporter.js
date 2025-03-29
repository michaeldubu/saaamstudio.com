// SAAAM Desktop Exporter
// A comprehensive solution for packaging SAAAM projects for desktop platforms
// Supports Windows, macOS, and Linux using Electron

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const archiver = require('archiver');
const electronBuilder = require('electron-builder');
const { notarize } = require('electron-notarize');
const log = require('electron-log');
const semver = require('semver');

// Configuration and constants
const CONFIG_FILE = 'saaam-export.json';
const DEFAULT_CONFIG = {
  appName: 'SAAAM Game',
  version: '1.0.0',
  description: 'Game created with SAAAM Studio',
  author: {
    name: 'SAAAM Developer',
    email: 'dev@example.com'
  },
  copyright: `Copyright © ${new Date().getFullYear()}`,
  outputDir: 'dist',
  platforms: ['win', 'mac', 'linux'],
  packagingOptions: {
    asar: true,
    icon: './assets/icon',
    extraResources: []
  },
  macOS: {
    category: 'public.app-category.games',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    notarize: false
  },
  windows: {
    target: [
      'nsis',
      'portable'
    ],
    certificateFile: null,
    certificatePassword: null,
    publisherName: null
  },
  linux: {
    target: [
      'AppImage',
      'deb',
      'rpm'
    ],
    category: 'Game'
  },
  compression: 'normal', // 'store', 'normal', 'maximum'
  buildOptions: {
    productName: 'SAAAM Game',
    appId: 'com.saaam.game',
    artifactName: '${productName}-${version}-${platform}-${arch}.${ext}',
    directories: {
      buildResources: 'build',
      output: 'dist'
    }
  }
};

// Electron app template files
const MAIN_JS = `const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const settings = new Store();

// Configure logging
log.transports.file.level = 'info';
log.info('Application starting...');
autoUpdater.logger = log;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the mainWindow object
let mainWindow;

function createWindow() {
  // Check if fullscreen setting exists, default to false
  const isFullscreen = settings.get('fullscreen', false);
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: isFullscreen,
    backgroundColor: '#2e2c29',
    title: 'SAAAM Game',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: process.env.NODE_ENV === 'development'
    }
  });

  // Load the game
  mainWindow.loadFile('game/index.html');

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Create application menu
  createAppMenu(isFullscreen);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Check for updates
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// Create the application menu
function createAppMenu(isFullscreen) {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
          accelerator: 'F11',
          click: () => {
            const newFullscreenState = !mainWindow.isFullScreen();
            mainWindow.setFullScreen(newFullscreenState);
            settings.set('fullscreen', newFullscreenState);
            createAppMenu(newFullscreenState);
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About SAAAM Game',
              message: 'SAAAM Game',
              detail: \`Version: \${app.getVersion()}\\nMade with SAAAM Studio\\n\\nCopyright © \${new Date().getFullYear()}\`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle events
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for game communication
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    await fs.promises.writeFile(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info);
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let logMessage = \`Download speed: \${progressObj.bytesPerSecond}\`;
  logMessage = \`\${logMessage} - Downloaded \${progressObj.percent}%\`;
  logMessage = \`\${logMessage} (\${progressObj.transferred}/\${progressObj.total})\`;
  log.info(logMessage);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  dialog.showMessageBox({
    title: 'Install Updates',
    message: 'Updates downloaded, application will be quit and restarted...',
    buttons: ['Restart']
  }).then(() => {
    setImmediate(() => autoUpdater.quitAndInstall());
  });
});`;

const PRELOAD_JS = `const { contextBridge, ipcRenderer } = require('electron');

// Expose API to the renderer process
contextBridge.exposeInMainWorld('saaamAPI', {
  // File system operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  
  // Game state functions
  saveGameState: async (data) => {
    try {
      const dataStr = JSON.stringify(data);
      localStorage.setItem('saaamGameState', dataStr);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  loadGameState: () => {
    try {
      const dataStr = localStorage.getItem('saaamGameState');
      if (!dataStr) return { success: false, error: 'No saved game found' };
      const data = JSON.parse(dataStr);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  clearGameState: () => {
    try {
      localStorage.removeItem('saaamGameState');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // System info
  getPlatform: () => process.platform,
  getVersion: () => process.env.APP_VERSION
});

// Add support for keyboard/gamepad events
window.addEventListener('DOMContentLoaded', () => {
  // Initialize gamepad API if supported
  if (navigator.getGamepads) {
    const gamepads = {};
    let gamepadCheckInterval;
    
    // Start polling for gamepad input
    gamepadCheckInterval = setInterval(() => {
      // Get the current state of gamepads
      const currentGamepads = navigator.getGamepads();
      
      // Process each gamepad
      for (const gamepad of currentGamepads) {
        if (!gamepad) continue;
        
        // Store previous state for comparison
        const prevGamepad = gamepads[gamepad.index];
        gamepads[gamepad.index] = {
          buttons: gamepad.buttons.map(b => b.pressed),
          axes: [...gamepad.axes]
        };
        
        // Skip if no previous state is available for comparison
        if (!prevGamepad) continue;
        
        // Detect button changes and dispatch custom events
        for (let i = 0; i < gamepad.buttons.length; i++) {
          if (gamepad.buttons[i].pressed && !prevGamepad.buttons[i]) {
            // Button pressed this frame
            window.dispatchEvent(new CustomEvent('gamepadButtonDown', { 
              detail: { gamepad: gamepad.index, button: i }
            }));
          }
          else if (!gamepad.buttons[i].pressed && prevGamepad.buttons[i]) {
            // Button released this frame
            window.dispatchEvent(new CustomEvent('gamepadButtonUp', { 
              detail: { gamepad: gamepad.index, button: i }
            }));
          }
        }
      }
    }, 16); // Approximately 60 fps
    
    // Cleanup on window unload
    window.addEventListener('beforeunload', () => {
      if (gamepadCheckInterval) {
        clearInterval(gamepadCheckInterval);
      }
    });
  }
});`;

const PACKAGE_JSON = `{
  "name": "saaam-game",
  "version": "1.0.0",
  "description": "Game created with SAAAM Studio",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "keywords": [
    "saaam",
    "game"
  ],
  "author": "SAAAM Developer",
  "license": "MIT",
  "devDependencies": {
    "electron": "^25.3.1",
    "electron-builder": "^24.6.3"
  },
  "dependencies": {
    "electron-log": "^4.4.8",
    "electron-store": "^8.1.0",
    "electron-updater": "^6.1.1"
  },
  "build": {
    "appId": "com.saaam.game",
    "productName": "SAAAM Game",
    "directories": {
      "buildResources": "build",
      "output": "dist"
    },
    "files": [
      "**/*",
      "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!**/node_modules/*.d.ts",
      "!**/node_modules/.bin",
      "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
      "!.editorconfig",
      "!.eslintrc.json",
      "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
      "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
      "!**/{appveyor.yml,.travis.yml,circle.yml}",
      "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
    ],
    "mac": {
      "category": "public.app-category.games",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "target": [
        "dmg",
        "zip"
      ]
    },
    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ]
    },
    "win": {
      "target": [
        "nsis",
        "portable"
      ]
    },
    "linux": {
      "target": [
        "AppImage",
        "deb",
        "rpm"
      ],
      "category": "Game"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    },
    "publish": {
      "provider": "generic",
      "url": "https://your-update-server.com/updates"
    }
  }
}`;

const MAC_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.inherit</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
  </dict>
</plist>`;

/**
 * Utility functions
 */

// Create a CLI interface for user input
const createInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

// Helper to ask questions
const askQuestion = async (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Check if a directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
};

// Create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!directoryExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Copy directory recursively
const copyDirectory = (source, destination) => {
  // Ensure destination exists
  ensureDirectoryExists(destination);
  
  // Read all files/directories in the source
  const files = fs.readdirSync(source);
  
  // Process each file/directory
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      // Recursively copy directory
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
    }
  }
};

// Create a zip file from a directory
const createZipFromDirectory = (sourceDir, outputPath) => {
  return new Promise((resolve, reject) => {
    // Create output stream
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Listen for events
    output.on('close', () => {
      resolve(archive.pointer());
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    // Pipe archive data to the output file
    archive.pipe(output);
    
    // Add entire directory to the archive
    archive.directory(sourceDir, false);
    
    // Finalize the archive
    archive.finalize();
  });
};

/**
 * Configuration functions
 */

// Create a new configuration file
const createNewConfig = async () => {
  const rl = createInterface();
  
  console.log(chalk.cyan('\nCreating a new SAAAM export configuration\n'));
  
  // Clone the default config
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  
  // Ask for basic information
  config.appName = await askQuestion(rl, `${chalk.yellow('App Name:')} (${config.appName}) `);
  config.version = await askQuestion(rl, `${chalk.yellow('Version:')} (${config.version}) `);
  config.description = await askQuestion(rl, `${chalk.yellow('Description:')} (${config.description}) `);
  
  // Author info
  const authorName = await askQuestion(rl, `${chalk.yellow('Author Name:')} (${config.author.name}) `);
  if (authorName) config.author.name = authorName;
  
  const authorEmail = await askQuestion(rl, `${chalk.yellow('Author Email:')} (${config.author.email}) `);
  if (authorEmail) config.author.email = authorEmail;
  
  // Choose platforms
  const platformsInput = await askQuestion(rl, `${chalk.yellow('Platforms (comma-separated):')} (${config.platforms.join(',')}) `);
  if (platformsInput) {
    config.platforms = platformsInput.split(',').map(p => p.trim().toLowerCase());
  }
  
  // Close the readline interface
  rl.close();
  
  // Save the configuration
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  console.log(chalk.green(`\nConfiguration saved to ${CONFIG_FILE}\n`));
  return config;
};

// Load configuration from file
const loadConfig = () => {
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
};

// Get configuration, create if needed
const getConfig = async () => {
  let config = loadConfig();
  
  if (!config) {
    config = await createNewConfig();
  }
  
  return config;
};

/**
 * Build functions
 */

// Prepare the project for packaging
const prepareProject = async (config) => {
  const spinner = ora('Preparing project for packaging...').start();
  
  try {
    // Create directories
    const buildDir = path.resolve('./build');
    const tempDir = path.resolve('./temp');
    const gameDir = path.resolve('./temp/game');
    
    // Ensure directories exist
    ensureDirectoryExists(buildDir);
    ensureDirectoryExists(tempDir);
    ensureDirectoryExists(gameDir);
    
    // Create necessary files
    
    // main.js
    fs.writeFileSync(path.join(tempDir, 'main.js'), MAIN_JS);
    
    // preload.js
    fs.writeFileSync(path.join(tempDir, 'preload.js'), PRELOAD_JS);
    
    // package.json
    const packageJson = JSON.parse(PACKAGE_JSON);
    packageJson.name = config.appName.toLowerCase().replace(/\s+/g, '-');
    packageJson.version = config.version;
    packageJson.description = config.description;
    packageJson.author = config.author;
    
    // Update build configuration
    packageJson.build.appId = config.buildOptions.appId;
    packageJson.build.productName = config.buildOptions.productName;
    packageJson.build.directories.output = config.buildOptions.directories.output;
    
    // Set platform-specific options
    if (config.platforms.includes('mac')) {
      packageJson.build.mac.category = config.macOS.category;
      packageJson.build.mac.hardenedRuntime = config.macOS.hardenedRuntime;
      packageJson.build.mac.gatekeeperAssess = config.macOS.gatekeeperAssess;
      packageJson.build.mac.entitlements = config.macOS.entitlements;
      packageJson.build.mac.entitlementsInherit = config.macOS.entitlementsInherit;
    }
    
    if (config.platforms.includes('win')) {
      packageJson.build.win.target = config.windows.target;
      
      if (config.windows.certificateFile) {
        packageJson.build.win.certificateFile = config.windows.certificateFile;
        packageJson.build.win.certificatePassword = config.windows.certificatePassword;
      }
      
      if (config.windows.publisherName) {
        packageJson.build.win.publisherName = config.windows.publisherName;
      }
    }
    
    if (config.platforms.includes('linux')) {
      packageJson.build.linux.target = config.linux.target;
      packageJson.build.linux.category = config.linux.category;
    }
    
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create entitlements file for macOS
    if (config.platforms.includes('mac')) {
      ensureDirectoryExists(path.join(buildDir));
      fs.writeFileSync(path.join(buildDir, 'entitlements.mac.plist'), MAC_ENTITLEMENTS);
    }
    
    // Copy game files
    if (directoryExists('./game')) {
      spinner.text = 'Copying game files...';
      copyDirectory('./game', gameDir);
    } else {
      // Create minimal game directory
      fs.writeFileSync(path.join(gameDir, 'index.html'), `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.appName}</title>
  <style>
    body { 
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #2e2c29;
      color: white;
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    #game-container {
      width: 800px;
      height: 600px;
      border: 1px solid #444;
      position: relative;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <h1 style="text-align:center;margin-top:200px;">SAAAM Game</h1>
    <p style="text-align:center;">Add your game content here</p>
  </div>
  <script>
    // Initialize SAAAM engine here
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Game initialized');
      
      // Access the Electron API
      if (window.saaamAPI) {
        console.log('Running on platform:', window.saaamAPI.getPlatform());
        console.log('App version:', window.saaamAPI.getVersion());
      }
    });
  </script>
</body>
</html>`);
    }
    
    // Create app icons if they don't exist
    ensureDirectoryExists(path.join(buildDir));
    
    // TODO: Create default icons if not available
    
    spinner.succeed('Project prepared for packaging');
    return true;
  } catch (error) {
    spinner.fail(`Error preparing project: ${error.message}`);
    console.error(error);
    return false;
  }
};

// Install dependencies
const installDependencies = async () => {
  const spinner = ora('Installing dependencies...').start();
  
  return new Promise((resolve, reject) => {
    exec('cd temp && npm install', (error, stdout, stderr) => {
      if (error) {
        spinner.fail('Failed to install dependencies');
        console.error(stdout);
        console.error(stderr);
        reject(error);
      } else {
        spinner.succeed('Dependencies installed');
        resolve(true);
      }
    });
  });
};

// Build the project for all specified platforms
const buildProject = async (config) => {
  console.log(chalk.cyan('\nBuilding project for platforms:'), chalk.yellow(config.platforms.join(', ')));
  
  try {
    // Prepare project
    const prepared = await prepareProject(config);
    if (!prepared) {
      throw new Error('Failed to prepare project');
    }
    
    // Install dependencies
    await installDependencies();
    
    // Build configurations
    const buildConfigs = [];
    
    if (config.platforms.includes('win')) {
      buildConfigs.push({
        platform: 'win',
        config: {
          win: config.windows.target
        }
      });
    }
    
    if (config.platforms.includes('mac')) {
      buildConfigs.push({
        platform: 'mac',
        config: {
          mac: ['zip', 'dmg']
        }
      });
    }
    
    if (config.platforms.includes('linux')) {
      buildConfigs.push({
        platform: 'linux',
        config: {
          linux: config.linux.target
        }
      });
    }
    
    // Build for each platform
    for (const buildConfig of buildConfigs) {
      const spinner = ora(`Building for ${buildConfig.platform}...`).start();
      
      try {
        const result = await electronBuilder.build({
          targets: electronBuilder.Platform[buildConfig.platform.toUpperCase()].createTarget(),
          config: {
            directories: {
              output: path.resolve(config.outputDir)
            },
            compression: config.compression,
            ...buildConfig.config
          }
        });
        
        spinner.succeed(`Build successful for ${buildConfig.platform}`);
      } catch (error) {
        spinner.fail(`Build failed for ${buildConfig.platform}: ${error.message}`);
        console.error(error);
      }
    }
    
    // Clean up temp directory
    if (directoryExists('./temp')) {
      fs.rmSync('./temp', { recursive: true, force: true });
    }
    
    console.log(chalk.green('\nBuild completed! Output files can be found in:'), chalk.yellow(config.outputDir));
    return true;
  } catch (error) {
    console.error(chalk.red('\nBuild failed:'), error.message);
    return false;
  }
};

/**
 * Notarize macOS app
 */
const notarizeMacApp = async (config, appPath) => {
  if (!config.macOS.notarize) {
    console.log(chalk.yellow('Skipping notarization (disabled in config)'));
    return true;
  }
  
  const spinner = ora('Notarizing macOS application...').start();
  
  try {
    await notarize({
      appBundleId: config.buildOptions.appId,
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      ascProvider: process.env.APPLE_TEAM_ID
    });
    
    spinner.succeed('Application notarized successfully');
    return true;
  } catch (error) {
    spinner.fail(`Notarization failed: ${error.message}`);
    console.error(error);
    return false;
  }
};

/**
 * Generate debug certificate for Windows signing
 */
const generateDebugCertificate = async (config) => {
  if (!config.platforms.includes('win')) {
    return false;
  }
  
  // Skip if certificate already specified
  if (config.windows.certificateFile) {
    return false;
  }
  
  const spinner = ora('Generating debug certificate for Windows...').start();
  
  try {
    const certPath = path.resolve('./build/debug-cert.pfx');
    const password = Math.random().toString(36).substring(2, 15);
    
    // Generate debug certificate for code signing
    ensureDirectoryExists('./build');
    
    exec(`openssl req -x509 -newkey rsa:2048 -keyout build/debug-key.pem -out build/debug-cert.pem -days 365 -nodes -subj "/CN=SAAAM Debug Certificate"`, (error) => {
      if (error) {
        spinner.fail('Failed to generate debug certificate');
        console.error(error);
        return false;
      }
      
      // Convert to PFX format
      exec(`openssl pkcs12 -export -out ${certPath} -inkey build/debug-key.pem -in build/debug-cert.pem -password pass:${password}`, (error) => {
        if (error) {
          spinner.fail('Failed to convert certificate to PFX format');
          console.error(error);
          return false;
        }
        
        // Update config
        config.windows.certificateFile = certPath;
        config.windows.certificatePassword = password;
        
        // Save updated config
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        
        spinner.succeed('Debug certificate generated and configured');
        return true;
      });
    });
  } catch (error) {
    spinner.fail(`Certificate generation failed: ${error.message}`);
    console.error(error);
    return false;
  }
};

/**
 * Main CLI tool
 */
const main = async () => {
  console.log(boxen('SAAAM Desktop Exporter', {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#222'
  }));
  
  // Parse command line arguments
  const argv = yargs(hideBin(process.argv))
    .command('init', 'Initialize a new SAAAM export configuration')
    .command('build', 'Build the SAAAM game for desktop platforms')
    .command('package [platform]', 'Package the game for a specific platform', (yargs) => {
      return yargs.positional('platform', {
        describe: 'Target platform (win, mac, linux)',
        type: 'string',
        default: ''
      });
    })
    .option('clean', {
      alias: 'c',
      type: 'boolean',
      description: 'Clean output directory before building'
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output directory'
    })
    .help()
    .alias('help', 'h')
    .argv;
  
  // Initialize configuration
  if (argv._[0] === 'init') {
    await createNewConfig();
    return;
  }
  
  // Load configuration
  const config = await getConfig();
  
  // Override output directory if specified
  if (argv.output) {
    config.outputDir = argv.output;
  }
  
  // Clean output directory if requested
  if (argv.clean && directoryExists(config.outputDir)) {
    const spinner = ora(`Cleaning output directory: ${config.outputDir}`).start();
    try {
      fs.rmSync(config.outputDir, { recursive: true, force: true });
      spinner.succeed('Output directory cleaned');
    } catch (error) {
      spinner.fail(`Failed to clean output directory: ${error.message}`);
    }
  }
  
  // Ensure output directory exists
  ensureDirectoryExists(config.outputDir);
  
  // Build the project
  if (argv._[0] === 'build') {
    await buildProject(config);
  }
  
  // Package for specific platform
  if (argv._[0] === 'package') {
    const platform = argv.platform.toLowerCase();
    
    if (!platform) {
      console.error(chalk.red('Please specify a platform: win, mac, or linux'));
      return;
    }
    
    if (!['win', 'mac', 'linux'].includes(platform)) {
      console.error(chalk.red(`Unsupported platform: ${platform}. Use win, mac, or linux`));
      return;
    }
    
    // Override config to only build for specified platform
    config.platforms = [platform];
    await buildProject(config);
  }
};

// Run the main function
main().catch(error => {
  console.error(chalk.red('\nAn error occurred:'), error.message);
  process.exit(1);
});

/**
 * Mobile Export Module (Optional Extension)
 */
class MobileExporter {
  constructor(config) {
    this.config = config;
    this.projectPath = path.resolve('./mobile');
  }
  
  async prepareMobileProject() {
    const spinner = ora('Preparing mobile project...').start();
    
    try {
      // Create mobile project directory
      ensureDirectoryExists(this.projectPath);
      
      // TODO: Implement mobile project setup
      // This would integrate with frameworks like React Native, Capacitor, or Cordova
      
      spinner.succeed('Mobile project prepared');
      return true;
    } catch (error) {
      spinner.fail(`Error preparing mobile project: ${error.message}`);
      console.error(error);
      return false;
    }
  }
  
  async buildAndroid() {
    // TODO: Implement Android build process
  }
  
  async buildIOS() {
    // TODO: Implement iOS build process
  }
}

/**
 * Console Export Module (Optional Extension)
 */
class ConsoleExporter {
  constructor(config) {
    this.config = config;
    this.projectPath = path.resolve('./console');
  }
  
  async prepareConsoleProject() {
    const spinner = ora('Preparing console project...').start();
    
    try {
      // Create console project directory
      ensureDirectoryExists(this.projectPath);
      
      // TODO: Implement console project setup
      // This would typically involve integrating with proprietary SDKs
      
      spinner.succeed('Console project prepared');
      return true;
    } catch (error) {
      spinner.fail(`Error preparing console project: ${error.message}`);
      console.error(error);
      return false;
    }
  }
  
  async buildForConsole(platform) {
    // TODO: Implement console build process for different platforms
    // This would typically require specific SDKs and credentials
  }
}

/**
 * Web Export Module
 */
class WebExporter {
  constructor(config) {
    this.config = config;
    this.outputPath = path.resolve(config.outputDir, 'web');
  }
  
  async buildForWeb() {
    const spinner = ora('Building for web...').start();
    
    try {
      // Create output directory
      ensureDirectoryExists(this.outputPath);
      
      // Copy game files
      if (directoryExists('./game')) {
        copyDirectory('./game', this.outputPath);
      } else {
        throw new Error('Game directory not found');
      }
      
      // Create web index.html if it doesn't exist
      const indexPath = path.join(this.outputPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.appName}</title>
  <style>
    body { 
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #2e2c29;
      color: white;
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    #game-container {
      width: 800px;
      height: 600px;
      border: 1px solid #444;
      position: relative;
    }
    @media (max-width: 820px) {
      #game-container {
        width: 100%;
        height: 100vh;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div id="game-container">
    <h1 style="text-align:center;margin-top:200px;">SAAAM Game</h1>
    <p style="text-align:center;">Web version</p>
  </div>
  <script>
    // Initialize SAAAM engine here
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Web game initialized');
      
      // Web platform-specific initialization
      window.saaamAPI = {
        // Implement web version of the API
        saveGameState: async (data) => {
          try {
            const dataStr = JSON.stringify(data);
            localStorage.setItem('saaamGameState', dataStr);
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        
        loadGameState: () => {
          try {
            const dataStr = localStorage.getItem('saaamGameState');
            if (!dataStr) return { success: false, error: 'No saved game found' };
            const data = JSON.parse(dataStr);
            return { success: true, data };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        
        clearGameState: () => {
          try {
            localStorage.removeItem('saaamGameState');
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        
        getPlatform: () => 'web',
        getVersion: () => '${this.config.version}'
      };
    });
  </script>
</body>
</html>`);
      }
      
      // Create zip file for easy distribution
      const zipPath = path.join(this.config.outputDir, `${this.config.appName.toLowerCase().replace(/\s+/g, '-')}-web-${this.config.version}.zip`);
      const fileSize = await createZipFromDirectory(this.outputPath, zipPath);
      
      spinner.succeed(`Web build completed (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
      return true;
    } catch (error) {
      spinner.fail(`Web build failed: ${error.message}`);
      console.error(error);
      return false;
    }
  }
}

// Export the modules
module.exports = {
  main,
  buildProject,
  MobileExporter,
  ConsoleExporter,
  WebExporter
};
