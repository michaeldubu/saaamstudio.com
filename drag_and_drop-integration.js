/**
 * SAAAM Drag and Drop System Integration
 * 
 * This file demonstrates how to integrate the SAAAM drag and drop system
 * with the existing SAAAM Game Studio.
 */

import { SaaamDragDropSystem, SnappingGuide, ObjectFactory, integrateWithSaaamGameStudio } from './saaam-drag-drop.js';

/**
 * Integrate with the Game Studio component
 * @param {Object} GameStudio - The GameStudio component class
 * @returns {Object} The enhanced GameStudio component
 */
export function enhanceGameStudio(GameStudio) {
  // Create an enhanced version of GameStudio with drag and drop functionality
  return class EnhancedGameStudio extends GameStudio {
    constructor(props) {
      super(props);
      
      // Bind the initialization method
      this.initializeDragAndDrop = this.initializeDragAndDrop.bind(this);
    }
    
    /**
     * Initialize the drag and drop system after the component mounts
     */
    initializeDragAndDrop() {
      // Ensure we have a canvas reference and the editor tab is active
      if (this.editorCanvasRef.current && this.state.activeTab === 'editor') {
        console.log('Initializing SAAAM Drag and Drop System');
        
        // Integrate with the game studio
        const { dragDropSystem, snappingGuide, objectFactory } = integrateWithSaaamGameStudio(
          this.editorCanvasRef.current,
          this
        );
        
        // Store references for later use
        this.dragDropSystem = dragDropSystem;
        this.snappingGuide = snappingGuide;
        this.objectFactory = objectFactory;
        
        // Add keyboard shortcut for toolbar toggle
        window.addEventListener('keydown', (e) => {
          if (e.key === 't') {
            this.toggleObjectToolbar();
          }
        });
        
        // Add welcome message
        this.addMessage('Drag & Drop System initialized! Press T to toggle the object toolbar.', 'info');
      }
    }
    
    /**
     * Toggle the object creation toolbar
     */
    toggleObjectToolbar() {
      if (this.objectFactory) {
        const toolbar = document.getElementById('saaam-object-toolbar');
        const isVisible = toolbar.style.display !== 'none';
        this.objectFactory.toggleToolbar(!isVisible);
        this.addMessage(`Object toolbar ${isVisible ? 'hidden' : 'shown'}`, 'info');
      }
    }
    
    /**
     * Override componentDidMount to initialize drag and drop after mounting
     */
    componentDidMount() {
      // Call the original componentDidMount if it exists
      if (super.componentDidMount) {
        super.componentDidMount();
      }
      
      // Initialize drag and drop system
      this.initializeDragAndDrop();
    }
    
    /**
     * Override componentDidUpdate to initialize drag and drop when the tab changes
     */
    componentDidUpdate(prevProps, prevState) {
      // Call the original componentDidUpdate if it exists
      if (super.componentDidUpdate) {
        super.componentDidUpdate(prevProps, prevState);
      }
      
      // Initialize drag and drop if we just switched to the editor tab
      if (prevState.activeTab !== 'editor' && this.state.activeTab === 'editor') {
        this.initializeDragAndDrop();
      }
    }
    
    /**
     * Enhancement to allow programmatic creation of platforms
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} color - Color
     */
    createPlatform(x, y, width, height, color) {
      if (this.dragDropSystem) {
        return this.dragDropSystem.createPlatform(x, y, width, height, color);
      } else {
        // Fallback to original method if drag drop system isn't initialized
        return super.createPlatform ? super.createPlatform(x, y, width, height, color) : null;
      }
    }
    
    /**
     * Enhancement to allow programmatic creation of enemies
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} color - Color
     */
    createEnemy(x, y, width, height, color) {
      if (this.dragDropSystem) {
        return this.dragDropSystem.createEnemy(x, y, width, height, color);
      } else {
        // Fallback to original method if drag drop system isn't initialized
        return super.createEnemy ? super.createEnemy(x, y, width, height, color) : null;
      }
    }
    
    /**
     * Enhancement to allow programmatic creation of collectibles
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} color - Color
     */
    createCollectible(x, y, width, height, color) {
      if (this.dragDropSystem) {
        return this.dragDropSystem.createCollectible(x, y, width, height, color);
      } else {
        // Fallback to original method if drag drop system isn't initialized
        return super.createCollectible ? super.createCollectible(x, y, width, height, color) : null;
      }
    }
  };
}

/**
 * Setup function for the SAAAM Game Studio
 * @param {Object} gameStudio - The game studio instance
 */
export function setupSaaamGameStudio(gameStudio) {
  // Create and add toolbar buttons
  const addToolbarButtons = () => {
    // Get the toolbar element
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;
    
    // Add divider
    const divider = document.createElement('div');
    divider.className = 'toolbar-divider';
    divider.style.width = '1px';
    divider.style.height = '24px';
    divider.style.backgroundColor = '#444';
    divider.style.margin = '0 8px';
    toolbar.appendChild(divider);
    
    // Add toolbar button for toggling the grid
    const gridButton = document.createElement('button');
    gridButton.className = 'toolbar-button';
    gridButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    gridButton.title = 'Toggle Grid (G)';
    gridButton.onclick = () => {
      if (gameStudio.dragDropSystem) {
        gameStudio.dragDropSystem.snapToGrid = !gameStudio.dragDropSystem.snapToGrid;
        gameStudio.addMessage(`Grid snapping: ${gameStudio.dragDropSystem.snapToGrid ? 'on' : 'off'}`, 'info');
        gameStudio.requestDraw();
      }
    };
    toolbar.appendChild(gridButton);
    
    // Add toolbar button for toggling object snapping
    const snapButton = document.createElement('button');
    snapButton.className = 'toolbar-button';
    snapButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2L2 12l10 10 10-10L12 2z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2"/></svg>';
    snapButton.title = 'Toggle Object Snapping';
    snapButton.onclick = () => {
      if (gameStudio.snappingGuide) {
        gameStudio.snappingGuide.snapToObjects = !gameStudio.snappingGuide.snapToObjects;
        gameStudio.addMessage(`Object snapping: ${gameStudio.snappingGuide.snapToObjects ? 'on' : 'off'}`, 'info');
      }
    };
    toolbar.appendChild(snapButton);
    
    // Add toolbar button for toggling the object toolbar
    const toolbarButton = document.createElement('button');
    toolbarButton.className = 'toolbar-button';
    toolbarButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 4h16v3H4zM4 10.5h16v3H4zM4 17h16v3H4z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    toolbarButton.title = 'Toggle Object Toolbar (T)';
    toolbarButton.onclick = () => {
      gameStudio.toggleObjectToolbar();
    };
    toolbar.appendChild(toolbarButton);
  };
  
  // Add styles for the toolbar buttons
  const addToolbarStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .toolbar-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 4px;
        background-color: #333;
        color: #fff;
        cursor: pointer;
        margin-right: 4px;
        transition: background-color 0.2s;
      }
      
      .toolbar-button:hover {
        background-color: #444;
      }
      
      .toolbar-button:active {
        background-color: #555;
      }
    `;
    document.head.appendChild(style);
  };
  
  // Add context menu to the game studio
  const addContextMenu = () => {
    // This is just a placeholder for the context menu
    // The actual context menu is implemented in the SaaamDragDropSystem class
  };
  
  // Run the setup functions
  addToolbarStyles();
  addToolbarButtons();
  addContextMenu();
}

/**
 * Usage example
 */
export function initializeExample() {
  // Import the GameStudio component
  import('./GameStudio.jsx').then(({ default: GameStudio }) => {
    // Enhance the GameStudio component with drag and drop functionality
    const EnhancedGameStudio = enhanceGameStudio(GameStudio);
    
    // Render the enhanced game studio
    // This would normally be done by React
    const gameStudio = new EnhancedGameStudio();
    
    // Set up additional features
    setupSaaamGameStudio(gameStudio);
    
    console.log('SAAAM Drag and Drop System initialized successfully');
  });
}

// Uncomment this line to automatically initialize the example
// document.addEventListener('DOMContentLoaded', initializeExample);
