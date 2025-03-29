/**
 * SAAAM Drag and Drop System
 * 
 * A comprehensive drag and drop system for the SAAAM Game Studio
 * that enables intuitive object manipulation in the level editor.
 */

class SaaamDragDropSystem {
  constructor(editorCanvas, gameStudio) {
    this.canvas = editorCanvas;
    this.gameStudio = gameStudio;
    this.ctx = editorCanvas.getContext('2d');
    
    // State tracking
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.selectedObject = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dragStartPos = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    this.snapToGrid = true;
    this.gridSize = 10;
    this.objectsUnderMouse = [];
    this.multiSelect = false;
    this.selectedObjects = [];
    this.copyBuffer = [];
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoSteps = 50;
    
    // Configuration
    this.handleSize = 8;
    this.minObjectSize = 10;
    this.dragThreshold = 5; // Minimum drag distance to start a drag operation
    
    // Styling
    this.selectionColor = '#4a90e2';
    this.selectionWidth = 2;
    this.handleFillColor = '#ffffff';
    this.handleStrokeColor = '#4a90e2';
    this.multiSelectBoxColor = 'rgba(74, 144, 226, 0.2)';
    this.multiSelectBorderColor = '#4a90e2';
    this.ghostObjectAlpha = 0.4;
    this.gridColor = 'rgba(255, 255, 255, 0.1)';
    this.snapIndicatorColor = '#ff9800';
    
    // Initialize the system
    this.init();
  }
  
  /**
   * Initialize the drag and drop system
   */
  init() {
    // Bind event listeners
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Add keyboard event listeners to the window
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Add contextmenu listener
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Initialize custom events
    this.events = {
      objectSelected: new CustomEvent('objectSelected'),
      objectMoved: new CustomEvent('objectMoved'),
      objectResized: new CustomEvent('objectResized'),
      objectsDeleted: new CustomEvent('objectsDeleted'),
      selectionChanged: new CustomEvent('selectionChanged'),
      dragStart: new CustomEvent('dragStart'),
      dragEnd: new CustomEvent('dragEnd')
    };
    
    // Initialize context menu
    this.initContextMenu();
    
    console.log('SAAAM Drag and Drop System initialized');
  }
  
  /**
   * Handle mouse down events on the canvas
   * @param {MouseEvent} e - The mouse event
   */
  handleMouseDown(e) {
    // Get canvas-relative coordinates
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Store the starting position for potential drag operation
    this.dragStartPos = { x, y };
    this.lastMousePos = { x, y };
    
    // Check if shift key is pressed for multi-select
    this.multiSelect = e.shiftKey;
    
    // Handle right-click separately
    if (e.button === 2) {
      // Right-click handled by contextmenu event
      return;
    }
    
    // Check if clicking on a resize handle of the selected object
    if (this.selectedObject) {
      const handle = this.getResizeHandleAtPosition(x, y, this.selectedObject);
      if (handle) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.saveObjectStateForUndo([this.selectedObject]);
        e.preventDefault();
        return;
      }
    }
    
    // Try to find an object under the cursor
    const objectUnderCursor = this.findObjectAtPosition(x, y);
    
    // If we found an object and it's not already selected
    if (objectUnderCursor) {
      this.saveObjectStateForUndo([objectUnderCursor]);
      
      // If we're in multi-select mode
      if (this.multiSelect) {
        // If the object is already in the selection, remove it
        if (this.selectedObjects.includes(objectUnderCursor)) {
          this.selectedObjects = this.selectedObjects.filter(obj => obj !== objectUnderCursor);
          
          // If we just removed the primary selected object, select another one
          if (this.selectedObject === objectUnderCursor && this.selectedObjects.length > 0) {
            this.selectedObject = this.selectedObjects[0];
          } else if (this.selectedObjects.length === 0) {
            this.selectedObject = null;
          }
        } else {
          // Add the object to the selection
          this.selectedObjects.push(objectUnderCursor);
          this.selectedObject = objectUnderCursor; // Make this the primary selected object
        }
      } else {
        // Single-select mode
        this.selectedObject = objectUnderCursor;
        this.selectedObjects = [objectUnderCursor];
      }
      
      // Calculate drag offset
      this.dragOffset = {
        x: x - objectUnderCursor.x,
        y: y - objectUnderCursor.y
      };
      
      // Start drag operation
      this.isDragging = true;
      this.triggerEvent('objectSelected', { object: this.selectedObject });
    } else {
      // If we're in multi-select mode and not clicking on an object, 
      // start a multi-select box
      if (this.multiSelect) {
        this.multiSelectStart = { x, y };
      } else {
        // Clear selection if clicking on empty space without shift
        this.selectedObject = null;
        this.selectedObjects = [];
        this.triggerEvent('selectionChanged', { objects: [] });
      }
    }
    
    // Request redraw
    this.gameStudio.requestDraw();
  }
  
  /**
   * Handle mouse move events on the canvas
   * @param {MouseEvent} e - The mouse event
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update for hover effects
    this.updateObjectsUnderMouse(x, y);
    
    // Calculate the distance moved from the start position
    const dx = x - this.dragStartPos.x;
    const dy = y - this.dragStartPos.y;
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    
    // For cursor styling based on resize handles
    this.updateCursorForPosition(x, y);
    
    // If we're resizing an object
    if (this.isResizing && this.selectedObject && this.resizeHandle) {
      this.resizeObjectWithHandle(this.selectedObject, x, y, this.resizeHandle);
      this.triggerEvent('objectResized', { object: this.selectedObject });
      this.gameStudio.requestDraw();
      return;
    }
    
    // If we're dragging an object
    if (this.isDragging && this.selectedObject && dragDistance > this.dragThreshold) {
      this.triggerEvent('dragStart', { objects: this.selectedObjects });
      
      // Apply movement to all selected objects
      for (const obj of this.selectedObjects) {
        let newX = x - this.dragOffset.x;
        let newY = y - this.dragOffset.y;
        
        // If the primary object is being moved, maintain relative positions
        if (obj !== this.selectedObject) {
          // Calculate the delta from the primary object's original position
          const deltaX = obj.x - this.selectedObject.x;
          const deltaY = obj.y - this.selectedObject.y;
          
          // Apply the delta to the new position
          newX = x - this.dragOffset.x + deltaX;
          newY = y - this.dragOffset.y + deltaY;
        }
        
        // Apply snapping if enabled
        if (this.snapToGrid) {
          newX = Math.round(newX / this.gridSize) * this.gridSize;
          newY = Math.round(newY / this.gridSize) * this.gridSize;
        }
        
        // Update the object's position
        obj.x = newX;
        obj.y = newY;
      }
      
      this.triggerEvent('objectMoved', { 
        objects: this.selectedObjects,
        primary: this.selectedObject
      });
      
      this.gameStudio.requestDraw();
    }
    
    // If we're drawing a multi-select box
    if (this.multiSelect && this.multiSelectStart && !this.isDragging) {
      // Calculate the selection box
      const selectionBox = this.getSelectionBox(this.multiSelectStart, { x, y });
      
      // Find all objects within the selection box
      const objectsInBox = this.findObjectsInBox(selectionBox);
      
      // Update selection
      this.selectedObjects = objectsInBox;
      if (objectsInBox.length > 0) {
        this.selectedObject = objectsInBox[0];
      } else {
        this.selectedObject = null;
      }
      
      this.triggerEvent('selectionChanged', { objects: this.selectedObjects });
      this.gameStudio.requestDraw();
    }
    
    // Update the last mouse position
    this.lastMousePos = { x, y };
  }
  
  /**
   * Handle mouse up events on the canvas
   * @param {MouseEvent} e - The mouse event
   */
  handleMouseUp(e) {
    if (this.isDragging || this.isResizing) {
      // Trigger the dragEnd event
      this.triggerEvent('dragEnd', { objects: this.selectedObjects });
      
      // If objects were actually moved, record for undo
      if (this.selectedObjects.length > 0) {
        this.finalizeObjectStateForUndo(this.selectedObjects);
      }
    }
    
    // Reset drag and resize flags
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    
    // Clear multi-select box if we were drawing one
    if (this.multiSelectStart) {
      this.multiSelectStart = null;
    }
    
    // Request redraw
    this.gameStudio.requestDraw();
  }
  
  /**
   * Handle mouse leave events on the canvas
   * @param {MouseEvent} e - The mouse event
   */
  handleMouseLeave(e) {
    // Similar cleanup as mouseUp
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.multiSelectStart = null;
    
    // Clear hover objects
    this.objectsUnderMouse = [];
    
    // Request redraw
    this.gameStudio.requestDraw();
  }
  
  /**
   * Handle key down events
   * @param {KeyboardEvent} e - The keyboard event
   */
  handleKeyDown(e) {
    // Multi-select mode with Shift key
    if (e.key === 'Shift') {
      this.multiSelect = true;
    }
    
    // Delete selected objects with Delete key
    if (e.key === 'Delete' && this.selectedObjects.length > 0) {
      this.saveObjectStateForUndo(this.selectedObjects);
      this.deleteSelectedObjects();
    }
    
    // Copy with Ctrl+C
    if (e.key === 'c' && (e.ctrlKey || e.metaKey) && this.selectedObjects.length > 0) {
      this.copySelectedObjects();
    }
    
    // Paste with Ctrl+V
    if (e.key === 'v' && (e.ctrlKey || e.metaKey) && this.copyBuffer.length > 0) {
      this.pasteObjects();
    }
    
    // Cut with Ctrl+X
    if (e.key === 'x' && (e.ctrlKey || e.metaKey) && this.selectedObjects.length > 0) {
      this.copySelectedObjects();
      this.saveObjectStateForUndo(this.selectedObjects);
      this.deleteSelectedObjects();
    }
    
    // Duplicate with Ctrl+D
    if (e.key === 'd' && (e.ctrlKey || e.metaKey) && this.selectedObjects.length > 0) {
      e.preventDefault(); // Prevent browser's bookmark action
      this.duplicateSelectedObjects();
    }
    
    // Undo with Ctrl+Z
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    }
    
    // Redo with Ctrl+Shift+Z or Ctrl+Y
    if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) || 
        (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      this.redo();
    }
    
    // Toggle snap to grid with G key
    if (e.key === 'g') {
      this.snapToGrid = !this.snapToGrid;
      this.gameStudio.addMessage(`Snap to grid: ${this.snapToGrid ? 'on' : 'off'}`, 'info');
      this.gameStudio.requestDraw();
    }
    
    // Arrow key movement
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && 
        this.selectedObjects.length > 0) {
      e.preventDefault(); // Prevent scrolling
      
      // Determine the movement amount
      let dx = 0, dy = 0;
      const moveAmount = e.shiftKey ? 10 : 1;
      
      switch (e.key) {
        case 'ArrowLeft': dx = -moveAmount; break;
        case 'ArrowRight': dx = moveAmount; break;
        case 'ArrowUp': dy = -moveAmount; break;
        case 'ArrowDown': dy = moveAmount; break;
      }
      
      // Save the current state for undo
      if (!this.arrowKeyMoving) {
        this.saveObjectStateForUndo(this.selectedObjects);
        this.arrowKeyMoving = true;
      }
      
      // Move all selected objects
      for (const obj of this.selectedObjects) {
        obj.x += dx;
        obj.y += dy;
      }
      
      this.triggerEvent('objectMoved', { 
        objects: this.selectedObjects,
        primary: this.selectedObject
      });
      
      this.gameStudio.requestDraw();
    }
  }
  
  /**
   * Handle key up events
   * @param {KeyboardEvent} e - The keyboard event
   */
  handleKeyUp(e) {
    // Turn off multi-select mode when Shift is released
    if (e.key === 'Shift') {
      this.multiSelect = false;
    }
    
    // Finalize arrow key movement
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && 
        this.arrowKeyMoving) {
      this.arrowKeyMoving = false;
      this.finalizeObjectStateForUndo(this.selectedObjects);
    }
  }
  
  /**
   * Handle context menu events
   * @param {MouseEvent} e - The context menu event
   */
  handleContextMenu(e) {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // If not clicking on a selected object, check if there's an object under the cursor
    if (!this.selectedObject || !this.isPointInObject(x, y, this.selectedObject)) {
      const objectUnderCursor = this.findObjectAtPosition(x, y);
      if (objectUnderCursor) {
        this.selectedObject = objectUnderCursor;
        this.selectedObjects = [objectUnderCursor];
      }
    }
    
    // Show the context menu
    this.showContextMenu(e.clientX, e.clientY);
  }
  
  /**
   * Initialize the context menu
   */
  initContextMenu() {
    // Create context menu element if it doesn't exist
    this.contextMenu = document.getElementById('saaam-context-menu');
    if (!this.contextMenu) {
      this.contextMenu = document.createElement('div');
      this.contextMenu.id = 'saaam-context-menu';
      document.body.appendChild(this.contextMenu);
      
      // Add styles
      this.contextMenu.style.position = 'absolute';
      this.contextMenu.style.zIndex = '1000';
      this.contextMenu.style.backgroundColor = '#2c2c2c';
      this.contextMenu.style.border = '1px solid #444';
      this.contextMenu.style.borderRadius = '4px';
      this.contextMenu.style.padding = '4px 0';
      this.contextMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      this.contextMenu.style.display = 'none';
      this.contextMenu.style.minWidth = '150px';
    }
    
    // Add event listener to close menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (e.target !== this.contextMenu && !this.contextMenu.contains(e.target)) {
        this.contextMenu.style.display = 'none';
      }
    });
  }
  
  /**
   * Show the context menu at the specified position
   * @param {number} x - The x position
   * @param {number} y - The y position
   */
  showContextMenu(x, y) {
    // Clear existing menu items
    this.contextMenu.innerHTML = '';
    
    // Create menu items
    const menuItems = [];
    
    if (this.selectedObjects.length > 0) {
      menuItems.push(
        { label: 'Cut', action: () => this.cutSelectedObjects(), shortcut: 'Ctrl+X' },
        { label: 'Copy', action: () => this.copySelectedObjects(), shortcut: 'Ctrl+C' },
        { label: 'Duplicate', action: () => this.duplicateSelectedObjects(), shortcut: 'Ctrl+D' },
        { label: 'Delete', action: () => this.deleteSelectedObjects(), shortcut: 'Delete' },
        { type: 'separator' },
        { label: 'Bring to Front', action: () => this.bringObjectsToFront() },
        { label: 'Send to Back', action: () => this.sendObjectsToBack() },
        { type: 'separator' }
      );
      
      // Add object-specific menu items based on type
      if (this.selectedObjects.length === 1) {
        const obj = this.selectedObjects[0];
        
        if (obj.type === 'platform') {
          menuItems.push(
            { label: 'Edit Properties', action: () => this.editObjectProperties(obj) }
          );
        } else if (obj.type === 'enemy') {
          menuItems.push(
            { label: 'Configure AI', action: () => this.configureEnemyAI(obj) },
            { label: 'Set Patrol Points', action: () => this.setEnemyPatrolPoints(obj) }
          );
        } else if (obj.type === 'collectible') {
          menuItems.push(
            { label: 'Set Collectible Type', action: () => this.setCollectibleType(obj) }
          );
        }
      }
    }
    
    // Always show these items
    menuItems.push(
      { type: 'separator' },
      { 
        label: `Snap to Grid: ${this.snapToGrid ? 'On' : 'Off'}`, 
        action: () => {
          this.snapToGrid = !this.snapToGrid;
          this.gameStudio.addMessage(`Snap to grid: ${this.snapToGrid ? 'on' : 'off'}`, 'info');
          this.gameStudio.requestDraw();
        },
        shortcut: 'G'
      },
      { 
        label: 'Grid Size', 
        submenu: [
          { label: '5px', action: () => this.setGridSize(5) },
          { label: '10px', action: () => this.setGridSize(10) },
          { label: '20px', action: () => this.setGridSize(20) },
          { label: '50px', action: () => this.setGridSize(50) }
        ]
      }
    );
    
    // Create the menu items UI
    menuItems.forEach(item => {
      if (item.type === 'separator') {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.backgroundColor = '#444';
        separator.style.margin = '4px 0';
        this.contextMenu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'saaam-context-menu-item';
        menuItem.style.padding = '6px 20px';
        menuItem.style.cursor = 'pointer';
        menuItem.style.fontSize = '14px';
        menuItem.style.whiteSpace = 'nowrap';
        menuItem.style.display = 'flex';
        menuItem.style.justifyContent = 'space-between';
        menuItem.style.alignItems = 'center';
        
        // Add hover effect
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.backgroundColor = '#444';
        });
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.backgroundColor = 'transparent';
        });
        
        // Label
        const labelContainer = document.createElement('span');
        labelContainer.textContent = item.label;
        menuItem.appendChild(labelContainer);
        
        // Shortcut
        if (item.shortcut) {
          const shortcutContainer = document.createElement('span');
          shortcutContainer.textContent = item.shortcut;
          shortcutContainer.style.marginLeft = '10px';
          shortcutContainer.style.fontSize = '12px';
          shortcutContainer.style.opacity = '0.7';
          menuItem.appendChild(shortcutContainer);
        }
        
        // Submenu indicator
        if (item.submenu) {
          const indicator = document.createElement('span');
          indicator.textContent = '▶';
          indicator.style.fontSize = '10px';
          indicator.style.marginLeft = '10px';
          menuItem.appendChild(indicator);
          
          // Handle submenu
          let submenuElement = null;
          
          menuItem.addEventListener('mouseenter', () => {
            // Position and create submenu
            submenuElement = document.createElement('div');
            submenuElement.className = 'saaam-context-submenu';
            submenuElement.style.position = 'absolute';
            submenuElement.style.left = `${this.contextMenu.offsetWidth}px`;
            submenuElement.style.top = '0';
            submenuElement.style.backgroundColor = '#2c2c2c';
            submenuElement.style.border = '1px solid #444';
            submenuElement.style.borderRadius = '4px';
            submenuElement.style.padding = '4px 0';
            submenuElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            submenuElement.style.minWidth = '100px';
            
            // Create submenu items
            item.submenu.forEach(subItem => {
              const subMenuItem = document.createElement('div');
              subMenuItem.className = 'saaam-context-menu-item';
              subMenuItem.textContent = subItem.label;
              subMenuItem.style.padding = '6px 20px';
              subMenuItem.style.cursor = 'pointer';
              subMenuItem.style.fontSize = '14px';
              
              // Add hover effect
              subMenuItem.addEventListener('mouseenter', () => {
                subMenuItem.style.backgroundColor = '#444';
              });
              subMenuItem.addEventListener('mouseleave', () => {
                subMenuItem.style.backgroundColor = 'transparent';
              });
              
              // Add click handler
              subMenuItem.addEventListener('click', () => {
                subItem.action();
                this.contextMenu.style.display = 'none';
              });
              
              submenuElement.appendChild(subMenuItem);
            });
            
            menuItem.appendChild(submenuElement);
          });
          
          menuItem.addEventListener('mouseleave', () => {
            if (submenuElement && menuItem.contains(submenuElement)) {
              menuItem.removeChild(submenuElement);
            }
          });
        } else {
          // Regular menu item click handler
          menuItem.addEventListener('click', () => {
            item.action();
            this.contextMenu.style.display = 'none';
          });
        }
        
        this.contextMenu.appendChild(menuItem);
      }
    });
    
    // Position the menu
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    
    // Show the menu
    this.contextMenu.style.display = 'block';
    
    // Adjust position if menu would go off screen
    const menuRect = this.contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (menuRect.right > viewportWidth) {
      this.contextMenu.style.left = `${x - menuRect.width}px`;
    }
    
    if (menuRect.bottom > viewportHeight) {
      this.contextMenu.style.top = `${y - menuRect.height}px`;
    }
  }
  
  /**
   * Find an object at the specified position
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @returns {Object|null} The object at the position, or null if none found
   */
  findObjectAtPosition(x, y) {
    // Get all objects from the game studio
    const objects = this.getAllObjects();
    
    // Start from the end (topmost objects first)
    for (let i = objects.length - 1; i >= 0; i--) {
      const object = objects[i];
      
      if (this.isPointInObject(x, y, object)) {
        return object;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a point is inside an object
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {Object} object - The object to check
   * @returns {boolean} True if the point is in the object
   */
  isPointInObject(x, y, object) {
    // Different hitbox logic based on object type
    switch (object.type) {
      case 'platform':
      case 'enemy':
      case 'collectible':
        return x >= object.x && 
               x <= object.x + (object.width || 32) && 
               y >= object.y && 
               y <= object.y + (object.height || 32);
      
      case 'player':
        // Player might have a slightly different hitbox
        return x >= object.x - 5 && 
               x <= object.x + (object.width || 32) + 5 && 
               y >= object.y - 5 && 
               y <= object.y + (object.height || 48) + 5;
      
      default:
        // Default rectangular hitbox
        return x >= object.x && 
               x <= object.x + (object.width || 32) && 
               y >= object.y && 
               y <= object.y + (object.height || 32);
    }
  }
  
  /**
   * Find all objects that intersect with a selection box
   * @param {Object} box - The selection box {x, y, width, height}
   * @returns {Array} Array of objects in the box
   */
  findObjectsInBox(box) {
    const objects = this.getAllObjects();
    return objects.filter(obj => this.isObjectInBox(obj, box));
  }
  
  /**
   * Check if an object intersects with a selection box
   * @param {Object} object - The object to check
   * @param {Object} box - The selection box {x, y, width, height}
   * @returns {boolean} True if the object intersects the box
   */
  isObjectInBox(object, box) {
    const objWidth = object.width || 32;
    const objHeight = object.height || 32;
    
    // Check for intersection
    return (
      object.x < box.x + box.width &&
      object.x + objWidth > box.x &&
      object.y < box.y + box.height &&
      object.y + objHeight > box.y
    );
  }
  
  /**
   * Get all objects from the game studio
   * @returns {Array} Array of all objects
   */
  getAllObjects() {
    const objects = [];
    const currentLevel = this.gameStudio.currentLevel;
    
    // Add player
    if (currentLevel.player) {
      objects.push({
        ...currentLevel.player,
        type: 'player',
        width: 32,
        height: 48
      });
    }
    
    // Add platforms
    if (currentLevel.platforms) {
      currentLevel.platforms.forEach(platform => {
        objects.push({
          ...platform,
          type: 'platform'
        });
      });
    }
    
    // Add enemies
    if (currentLevel.enemies) {
      currentLevel.enemies.forEach(enemy => {
        objects.push({
          ...enemy,
          type: 'enemy',
          width: enemy.width || 32,
          height: enemy.height || 32
        });
      });
    }
    
    // Add collectibles
    if (
