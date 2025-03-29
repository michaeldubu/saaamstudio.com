# SAAAM Drag and Drop System

## Introduction

The SAAAM Drag and Drop System is a comprehensive solution for intuitive object manipulation in the SAAAM Game Studio. It provides a rich set of features for creating, selecting, moving, resizing, and managing game objects in the level editor.

This document provides an overview of the system, its features, integration guide, and usage examples.

## Features

### Core Functionality

- **Object Selection**: Click to select objects, shift+click for multi-select
- **Drag and Drop**: Intuitive movement of objects in the editor
- **Resizing**: Resize objects using handles on selected objects
- **Copy/Paste/Duplicate**: Standard operations for efficient workflow
- **Undo/Redo**: Multi-step history for all operations
- **Delete**: Remove objects from the level
- **Z-Order Management**: Bring objects to front or send to back

### Advanced Features

- **Grid Snapping**: Align objects to a customizable grid
- **Object Snapping**: Snap objects to align with other objects
- **Smart Guides**: Visual guides for alignment and spacing
- **Multi-select Box**: Draw a box to select multiple objects
- **Object Toolbar**: Quick access to object templates
- **Context Menus**: Right-click for context-specific actions
- **Keyboard Shortcuts**: Efficient workflow with keyboard controls

### Integration Features

- **Event System**: Custom events for integration with the game engine
- **Extension Points**: Easily extend with custom functionality
- **Object Factory**: Create new objects from templates
- **Snapping Guide**: Advanced alignment system

## Getting Started

### Integration

To integrate the SAAAM Drag and Drop System with your Game Studio:

1. Import the necessary modules:
```javascript
import { SaaamDragDropSystem, integrateWithSaaamGameStudio } from './saaam-drag-drop.js';
```

2. Initialize the system with your canvas and game studio instance:
```javascript
const { dragDropSystem, snappingGuide, objectFactory } = integrateWithSaaamGameStudio(
  editorCanvasRef.current,
  gameStudio
);
```

3. Store the references for later use:
```javascript
gameStudio.dragDropSystem = dragDropSystem;
gameStudio.snappingGuide = snappingGuide;
gameStudio.objectFactory = objectFactory;
```

### Basic Usage

Once integrated, the system automatically handles mouse and keyboard events for drag and drop operations. Here are some common operations:

- **Select an object**: Click on it
- **Select multiple objects**: Hold Shift while clicking
- **Move objects**: Drag selected objects
- **Resize an object**: Drag the handles around a selected object
- **Copy objects**: Select objects and press Ctrl+C
- **Paste objects**: Press Ctrl+V
- **Delete objects**: Select objects and press Delete
- **Undo**: Press Ctrl+Z
- **Redo**: Press Ctrl+Shift+Z or Ctrl+Y

### Object Creation

Create new objects programmatically:

```javascript
// Create a platform
const platform = dragDropSystem.createPlatform(100, 200, 100, 20, '#888888');

// Create an enemy
const enemy = dragDropSystem.createEnemy(300, 300, 32, 32, '#FF0000');

// Create a collectible
const collectible = dragDropSystem.createCollectible(200, 150, 20, 20, '#FFFF00');
```

Or use the object factory to create objects from templates:

```javascript
// Show the object toolbar
objectFactory.toggleToolbar(true);

// Create a custom template
objectFactory.addTemplate('platform', 'bouncy', {
  width: 100,
  height: 10,
  color: '#44FF44',
  type: 'platform',
  bouncy: true
});
```

## System Architecture

### Core Components

The SAAAM Drag and Drop System consists of three main components:

1. **SaaamDragDropSystem**: The main class that handles mouse and keyboard events, manages selection, and coordinates operations.

2. **SnappingGuide**: A helper class for implementing snapping functionality, both to grid and to other objects.

3. **ObjectFactory**: A utility for creating and managing object templates.

### UML Class Diagram

```
+------------------------+       +-------------------+
| SaaamDragDropSystem    |------>| SnappingGuide     |
+------------------------+       +-------------------+
| - canvas               |       | - dragDropSystem  |
| - gameStudio           |       | - snapThreshold   |
| - selectedObjects      |       | - activeGuides    |
| - isDragging           |       +-------------------+
| - isResizing           |       | + snapObject()    |
| - undoStack            |       | + renderGuidelines|
| - redoStack            |       +-------------------+
+------------------------+               ^
| + handleMouseDown()    |               |
| + handleMouseMove()    |     +---------+----------+
| + handleMouseUp()      |     | ObjectFactory      |
| + render()             |---->+--------------------|
+------------------------+     | - dragDropSystem   |
                               | - templates         |
                               +--------------------|
                               | + createFromTemplate|
                               | + toggleToolbar()   |
                               +--------------------+
```

### Event Flow

The system uses a combination of DOM events and custom events to handle user interactions:

1. **DOM Events**:
   - `mousedown`: Start selection or drag operation
   - `mousemove`: Handle drag or resize operation
   - `mouseup`: Complete operation
   - `keydown`: Handle keyboard shortcuts
   - `contextmenu`: Show context menu

2. **Custom Events**:
   - `objectSelected`: Fired when an object is selected
   - `objectMoved`: Fired when objects are moved
   - `objectResized`: Fired when an object is resized
   - `objectsDeleted`: Fired when objects are deleted
   - `selectionChanged`: Fired when the selection changes
   - `dragStart`: Fired when a drag operation starts
   - `dragEnd`: Fired when a drag operation ends

## Advanced Features

### Grid System

The system includes a flexible grid system for aligning objects:

```javascript
// Configure grid size
dragDropSystem.gridSize = 20; // Set grid size to 20 pixels

// Toggle grid snapping
dragDropSystem.snapToGrid = true; // Enable grid snapping
```

### Snapping System

The snapping system helps align objects with each other:

```javascript
// Configure snapping threshold
snappingGuide.snapThreshold = 10; // Object edges will snap when within 10 pixels

// Toggle object snapping
snappingGuide.snapToObjects = true; // Enable object snapping
```

### Object Templates

The object factory manages templates for creating new objects:

```javascript
// Add a custom template
objectFactory.addTemplate('enemy', 'boss', {
  width: 64,
  height: 64,
  color: '#880000',
  type: 'enemy',
  health: 100,
  damage: 20,
  speed: 2
});

// Create an object from a template
objectFactory.createObjectFromTemplate('enemy', 'boss');
```

### Undo/Redo System

The system includes a robust undo/redo system:

```javascript
// Manually trigger undo/redo
dragDropSystem.undo();
dragDropSystem.redo();
```

The undo/redo system tracks all operations including:
- Object creation
- Object deletion
- Object movement
- Object resizing
- Property changes

## Keyboard Shortcuts

| Shortcut                   | Action                           |
|----------------------------|----------------------------------|
| `Shift + Click`            | Multi-select objects             |
| `Ctrl + C` / `Cmd + C`     | Copy selected objects            |
| `Ctrl + V` / `Cmd + V`     | Paste objects                    |
| `Ctrl + X` / `Cmd + X`     | Cut selected objects             |
| `Ctrl + D` / `Cmd + D`     | Duplicate selected objects       |
| `Delete`                   | Delete selected objects          |
| `Ctrl + Z` / `Cmd + Z`     | Undo                             |
| `Ctrl + Shift + Z` / `Cmd + Shift + Z` or | Redo             |
| `Ctrl + Y` / `Cmd + Y`     | Redo                             |
| `G`                        | Toggle grid snapping             |
| `T`                        | Toggle object toolbar            |
| `Arrow keys`               | Move selected objects (1px)      |
| `Shift + Arrow keys`       | Move selected objects (10px)     |

## Customization

### Styling

The appearance of the drag and drop system can be customized:

```javascript
// Customize selection appearance
dragDropSystem.selectionColor = '#4a90e2';
dragDropSystem.selectionWidth = 2;
dragDropSystem.handleFillColor = '#ffffff';
dragDropSystem.handleStrokeColor = '#4a90e2';

// Customize grid
dragDropSystem.gridColor = 'rgba(255, 255, 255, 0.1)';

// Customize snapping guides
snappingGuide.guidelineColor = 'rgba(0, 150, 255, 0.7)';
snappingGuide.guidelineWidth = 1;
```

### Event Handling

Listen for custom events to add your own behavior:

```javascript
// Listen for selection change
editorCanvas.addEventListener('selectionChanged', (e) => {
  const selectedObjects = e.detail.objects;
  updatePropertiesPanel(selectedObjects);
});

// Listen for object movement
editorCanvas.addEventListener('objectMoved', (e) => {
  const movedObjects = e.detail.objects;
  updateObjectCoordinates(movedObjects);
});
```

## Integration Example

Here's a complete example of integrating the SAAAM Drag and Drop System with a React component:

```jsx
import React, { useEffect, useRef } from 'react';
import { SaaamDragDropSystem, integrateWithSaaamGameStudio } from './saaam-drag-drop.js';

const LevelEditor = () => {
  const canvasRef = useRef(null);
  const dragDropSystemRef = useRef(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      // Create a simple game studio interface
      const gameStudio = {
        currentLevel: {
          name: 'Test Level',
          player: { x: 50, y: 300 },
          platforms: [
            { x: 0, y: 550, width: 800, height: 50, color: '#888888' }
          ],
          enemies: [],
          collectibles: []
        },
        addMessage: (text, type) => {
          console.log(`[${type}] ${text}`);
        },
        requestDraw: () => {
          // Redraw the canvas
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          // Clear canvas
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw level objects
          // ...
          
          // Render drag and drop system
          dragDropSystemRef.current.render();
        }
      };
      
      // Initialize the drag and drop system
      const { dragDropSystem } = integrateWithSaaamGameStudio(
        canvasRef.current,
        gameStudio
      );
      
      // Store the reference
      dragDropSystemRef.current = dragDropSystem;
      
      // Initial draw
      gameStudio.requestDraw();
    }
  }, []);
  
  return (
    <div className="level-editor">
      <canvas 
        ref={canvasRef}
        width={800}
        height={600}
        className="editor-canvas"
      />
    </div>
  );
};

export default LevelEditor;
```

## Best Practices

### Performance Optimization

For best performance:

1. **Limit the number of objects** in the scene for smooth dragging
2. **Use appropriate grid size** based on your game's scale
3. **Consider disabling object snapping** for large levels
4. **Optimize your render function** since it will be called frequently

### Memory Management

To prevent memory leaks:

1. Always **clean up event listeners** when the component unmounts
2. **Limit undo/redo stack size** for large levels
3. Be careful with **circular references** in your objects

### User Experience

For the best user experience:

1. **Provide visual feedback** for all operations
2. **Use consistent shortcuts** that match common applications
3. **Add tooltips** for UI elements
4. **Implement progressive disclosure** of advanced features

## Troubleshooting

### Common Issues

**Objects aren't selectable**
- Check z-index of canvas elements
- Verify object bounds are correctly defined
- Ensure event propagation isn't being stopped

**Dragging is jerky or slow**
- Optimize your rendering code
- Reduce the number of objects in the scene
- Consider using a lower resolution grid

**Snapping doesn't work correctly**
- Check if snapping is enabled
- Verify the snapping threshold is appropriate
- Ensure objects have the correct dimensions

## API Reference

### SaaamDragDropSystem

```javascript
// Constructor
const dragDropSystem = new SaaamDragDropSystem(canvas, gameStudio);

// Properties
dragDropSystem.snapToGrid = true;          // Enable/disable grid snapping
dragDropSystem.gridSize = 10;              // Set grid size
dragDropSystem.selectedObjects = [];       // Currently selected objects
dragDropSystem.selectedObject = null;      // Primary selected object

// Methods
dragDropSystem.selectObject(obj, addToSelection);  // Select an object
dragDropSystem.clearSelection();                  // Clear selection
dragDropSystem.createPlatform(x, y, width, height, color);  // Create platform
dragDropSystem.createEnemy(x, y, width, height, color);     // Create enemy
dragDropSystem.createCollectible(x, y, width, height, color); // Create collectible
dragDropSystem.undo();                             // Undo last operation
dragDropSystem.redo();                             // Redo last undone operation
dragDropSystem.render();                           // Render selection, handles, etc.
```

### SnappingGuide

```javascript
// Properties
snappingGuide.snapToObjects = true;       // Enable/disable object snapping
snappingGuide.snapThreshold = 10;         // Snapping distance in pixels
snappingGuide.showGuidelines = true;      // Show/hide alignment guides

// Methods
snappingGuide.snapObject(obj, x, y, otherObjects);  // Snap object position
snappingGuide.renderGuidelines();                  // Render alignment guides
snappingGuide.toggleObjectSnapping(enabled);       // Toggle object snapping
snappingGuide.toggleGuidelines(enabled);           // Toggle guidelines visibility
```

### ObjectFactory

```javascript
// Properties
objectFactory.templates = {};             // Object templates

// Methods
objectFactory.createObjectFromTemplate(category, template);  // Create from template
objectFactory.toggleToolbar(visible);                     // Show/hide toolbar
objectFactory.addTemplate(category, name, template);      // Add custom template
```

## Conclusion

The SAAAM Drag and Drop System provides a comprehensive solution for object manipulation in the SAAAM Game Studio. With its intuitive interface, powerful features, and flexible architecture, it enhances the level design workflow and improves the overall user experience.

By following this documentation, you should be able to integrate the system into your projects, customize it to your needs, and extend it with your own functionality.

## Further Resources

For more information and advanced usage examples, refer to:

- [SAAAM Engine Documentation](https://saaam-engine.docs)
- [Level Editor Best Practices](https://saaam-engine.docs/level-editor)
- [Game Object Management](https://saaam-engine.docs/objects)
- [Custom Events in SAAAM](https://saaam-engine.docs/events)
