/**
 * SAAAM Drag and Drop System - Usage Example
 * 
 * This example demonstrates how to use the SAAAM Drag and Drop System
 * with the existing GameStudio component.
 */

import React, { useEffect, useRef } from 'react';
import { SaaamDragDropSystem, integrateWithSaaamGameStudio } from './saaam-drag-drop.js';

/**
 * Enhanced GameStudio component with drag and drop functionality
 */
const EnhancedGameStudio = ({ initialLevel }) => {
  // State and refs from the original GameStudio component
  const [activeTab, setActiveTab] = useState('editor');
  const [gameRunning, setGameRunning] = useState(false);
  const [selectedTool, setSelectedTool] = useState('platform');
  const [currentLevel, setCurrentLevel] = useState(initialLevel || {
    name: 'My Level',
    player: { x: 50, y: 300 },
    platforms: [
      { x: 0, y: 550, width: 800, height: 50, color: '#888888' } // Ground
    ],
    enemies: [],
    collectibles: []
  });
  const [messages, setMessages] = useState([{
    text: 'Welcome to SAAAM Game Studio!',
    type: 'info'
  }]);
  
  // Canvas refs
  const editorCanvasRef = useRef(null);
  const gameCanvasRef = useRef(null);
  
  // Drag and drop system ref
  const dragDropSystemRef = useRef(null);
  
  // Effect to initialize the drag and drop system
  useEffect(() => {
    if (editorCanvasRef.current && activeTab === 'editor') {
      // Create a game studio interface for the drag and drop system
      const gameStudioInterface = {
        currentLevel,
        setCurrentLevel,
        addMessage: (text, type) => {
          setMessages(prev => [...prev, { text, type, id: Date.now() }]);
        },
        requestDraw: () => {
          // Redraw the canvas
          if (editorCanvasRef.current) {
            drawEditorGrid(editorCanvasRef.current.getContext('2d'));
            drawLevelObjects(editorCanvasRef.current.getContext('2d'));
          }
        }
      };
      
      // Initialize the drag and drop system
      const { dragDropSystem } = integrateWithSaaamGameStudio(
        editorCanvasRef.current,
        gameStudioInterface
      );
      
      // Store the drag and drop system
      dragDropSystemRef.current = dragDropSystem;
      
      // Initial draw
      gameStudioInterface.requestDraw();
      
      // Clean up on unmount
      return () => {
        // Any cleanup needed
      };
    }
  }, [editorCanvasRef, activeTab]);
  
  // Function to draw the editor grid
  const drawEditorGrid = (ctx) => {
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw grid lines
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= 800; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= 600; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }
  };
  
  // Function to draw level objects
  const drawLevelObjects = (ctx) => {
    // Draw player
    const player = currentLevel.player;
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(player.x, player.y, 32, 48);
    
    // Draw platforms
    for (const platform of currentLevel.platforms) {
      ctx.fillStyle = platform.color || '#888888';
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
    
    // Draw enemies
    if (currentLevel.enemies) {
      for (const enemy of currentLevel.enemies) {
        ctx.fillStyle = enemy.color || '#FF0000';
        ctx.fillRect(enemy.x, enemy.y, enemy.width || 32, enemy.height || 32);
      }
    }
    
    // Draw collectibles
    if (currentLevel.collectibles) {
      for (const collectible of currentLevel.collectibles) {
        ctx.fillStyle = collectible.color || '#FFFF00';
        ctx.fillRect(collectible.x, collectible.y, collectible.width || 20, collectible.height || 20);
      }
    }
  };
  
  // Create a platform programmatically
  const createPlatform = (x, y, width = 100, height = 20, color = '#888888') => {
    if (dragDropSystemRef.current) {
      return dragDropSystemRef.current.createPlatform(x, y, width, height, color);
    }
    
    // Fallback if drag drop system isn't initialized
    const platform = { x, y, width, height, color, type: 'platform' };
    setCurrentLevel(prev => ({
      ...prev,
      platforms: [...prev.platforms, platform]
    }));
    return platform;
  };
  
  // Create an enemy programmatically
  const createEnemy = (x, y, width = 32, height = 32, color = '#FF0000') => {
    if (dragDropSystemRef.current) {
      return dragDropSystemRef.current.createEnemy(x, y, width, height, color);
    }
    
    // Fallback if drag drop system isn't initialized
    const enemy = { x, y, width, height, color, type: 'enemy' };
    setCurrentLevel(prev => ({
      ...prev,
      enemies: [...(prev.enemies || []), enemy]
    }));
    return enemy;
  };
  
  // Create a collectible programmatically
  const createCollectible = (x, y, width = 20, height = 20, color = '#FFFF00') => {
    if (dragDropSystemRef.current) {
      return dragDropSystemRef.current.createCollectible(x, y, width, height, color);
    }
    
    // Fallback if drag drop system isn't initialized
    const collectible = { x, y, width, height, color, type: 'collectible' };
    setCurrentLevel(prev => ({
      ...prev,
      collectibles: [...(prev.collectibles || []), collectible]
    }));
    return collectible;
  };
  
  // Toggle the object toolbar
  const toggleObjectToolbar = () => {
    if (dragDropSystemRef.current && dragDropSystemRef.current.objectFactory) {
      const toolbar = document.getElementById('saaam-object-toolbar');
      const isVisible = toolbar.style.display !== 'none';
      dragDropSystemRef.current.objectFactory.toggleToolbar(!isVisible);
      
      // Add message
      setMessages(prev => [
        ...prev,
        { 
          text: `Object toolbar ${isVisible ? 'hidden' : 'shown'}`,
          type: 'info',
          id: Date.now()
        }
      ]);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle tool selection
  const handleToolChange = (tool) => {
    setSelectedTool(tool);
  };
  
  // Basic toolbar buttons
  const renderToolbar = () => (
    <div className="editor-toolbar flex items-center p-2 bg-gray-800 border-b border-gray-700">
      {/* Tool selection */}
      <div className="flex space-x-2 mr-4">
        <button 
          className={`px-3 py-1 rounded ${selectedTool === 'player' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => handleToolChange('player')}
        >
          Player
        </button>
        <button 
          className={`px-3 py-1 rounded ${selectedTool === 'platform' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => handleToolChange('platform')}
        >
          Platform
        </button>
        <button 
          className={`px-3 py-1 rounded ${selectedTool === 'enemy' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => handleToolChange('enemy')}
        >
          Enemy
        </button>
        <button 
          className={`px-3 py-1 rounded ${selectedTool === 'collectible' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => handleToolChange('collectible')}
        >
          Collectible
        </button>
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-gray-700 mx-4"></div>
      
      {/* Drag and drop specific buttons */}
      <button 
        className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
        onClick={toggleObjectToolbar}
        title="Toggle Object Toolbar (T)"
      >
        Objects
      </button>
      
      <button 
        className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 ml-2"
        onClick={() => {
          if (dragDropSystemRef.current) {
            dragDropSystemRef.current.snapToGrid = !dragDropSystemRef.current.snapToGrid;
            setMessages(prev => [
              ...prev,
              { 
                text: `Grid snapping: ${dragDropSystemRef.current.snapToGrid ? 'on' : 'off'}`,
                type: 'info',
                id: Date.now()
              }
            ]);
            dragDropSystemRef.current.gameStudio.requestDraw();
          }
        }}
        title="Toggle Grid Snapping (G)"
      >
        Grid
      </button>
    </div>
  );
  
  // Console messages
  const renderConsole = () => (
    <div className="console bg-gray-800 border-l border-gray-700 p-2 overflow-y-auto h-full">
      <div className="text-sm text-gray-400 font-semibold mb-2">CONSOLE</div>
      {messages.map((msg, index) => (
        <div 
          key={msg.id || index} 
          className={`text-sm py-1 ${
            msg.type === 'error' ? 'text-red-400' : 
            msg.type === 'success' ? 'text-green-400' : 
            msg.type === 'warning' ? 'text-yellow-400' : 
            'text-gray-300'
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
      {/* Tab navigation */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        <button 
          className={`px-4 py-2 ${activeTab === 'editor' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
          onClick={() => handleTabChange('editor')}
        >
          Editor
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'game' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
          onClick={() => handleTabChange('game')}
        >
          Game
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'editor' ? (
          <>
            {/* Editor toolbar */}
            {renderToolbar()}
            
            {/* Editor main area */}
            <div className="flex flex-1">
              {/* Canvas area */}
              <div className="flex-1 bg-black flex items-center justify-center">
                <canvas 
                  ref={editorCanvasRef} 
                  width={800} 
                  height={600} 
                  className="border border-gray-700"
                />
              </div>
              
              {/* Console */}
              <div className="w-64">
                {renderConsole()}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Game view */}
            <div className="flex-1 bg-black flex items-center justify-center">
              <canvas 
                ref={gameCanvasRef} 
                width={800} 
                height={600} 
                className="border border-gray-700"
              />
            </div>
            
            {/* Console */}
            <div className="w-64">
              {renderConsole()}
            </div>
          </>
        )}
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-blue-800 text-white text-xs">
        <div>
          {activeTab === 'editor' ? 
            `Editor | Selected tool: ${selectedTool}` : 
            `Game ${gameRunning ? 'running' : 'stopped'}`
          }
        </div>
        <div>SAAAM Studio</div>
      </div>
    </div>
  );
};

/**
 * Example of using the enhanced game studio
 */
const SaaamDragDropDemo = () => {
  // Set up a sample level
  const sampleLevel = {
    name: 'Demo Level',
    player: { x: 50, y: 300 },
    platforms: [
      { x: 0, y: 550, width: 800, height: 50, color: '#888888' }, // Ground
      { x: 200, y: 450, width: 100, height: 20, color: '#888888' }, // Platform 1
      { x: 350, y: 350, width: 100, height: 20, color: '#888888' }, // Platform 2
      { x: 500, y: 250, width: 100, height: 20, color: '#888888' }  // Platform 3
    ],
    enemies: [
      { x: 350, y: 318, width: 32, height: 32, color: '#FF0000' }
    ],
    collectibles: [
      { x: 230, y: 420, width: 20, height: 20, color: '#FFFF00' },
      { x: 380, y: 320, width: 20, height: 20, color: '#FFFF00' },
      { x: 530, y: 220, width: 20, height: 20, color: '#FFFF00' }
    ]
  };
  
  return (
    <div className="w-full h-screen">
      <EnhancedGameStudio initialLevel={sampleLevel} />
    </div>
  );
};

export default SaaamDragDropDemo;
