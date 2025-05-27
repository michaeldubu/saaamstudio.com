# SAAAM Language Tutorial

## Introduction to SAAAM

Welcome to SAAAM (Simple-Architecture Accessible-Mechanics), a domain-specific language designed specifically for game development. SAAAM makes it easy for both beginners and experienced developers to create engaging 2D games with an intuitive syntax and powerful built-in features.

This tutorial will guide you through the basics of SAAAM, starting with simple concepts and progressing to more complex game mechanics. By the end, you'll have the knowledge to create your own games using the SAAAM language and engine.

## Setting Up

To start using SAAAM, you'll need:

1. The SAAAM Game Studio (which includes the SAAAM code editor and engine)
2. A basic understanding of programming concepts

If you haven't installed SAAAM Game Studio yet, download it from [saaamstudio.com](https://saaamstudio.com) and follow the installation instructions.

## Your First SAAAM Program

Let's start with the classic "Hello, World!" example to get familiar with SAAAM:

```

This advanced example demonstrates how to structure a complete game with different states:

1. Menu screen with a start button
2. Active gameplay with score and time tracking
3. Game over screen when time runs out
4. Victory screen when the target score is reached

## Using State Machines

For more complex game objects, state machines can help keep your code organized. SAAAM provides a built-in state machine system:

```saaam
// Enemy with state machine
var enemy = {
  x: 300,
  y: 300,
  width: 40,
  height: 40,
  health: 100,
  speed: 120,
  color: "#FF5555",
  state: null // Will hold the state machine
};

// Create the state machine
enemy.state = new StateMachine({
  initial: "patrol",
  states: {
    patrol: {
      enter: function() {
        console.log("Enemy is now patrolling");
        enemy.color = "#FF5555"; // Red
      },
      update: function(dt) {
        // Move back and forth
        enemy.x += Math.sin(gameTime) * enemy.speed * dt;
        
        // Check if player is near
        var distance = Math.sqrt(
          Math.pow(enemy.x - player.x, 2) + 
          Math.pow(enemy.y - player.y, 2)
        );
        
        if (distance < 150) {
          this.change_state("chase");
        }
      }
    },
    chase: {
      enter: function() {
        console.log("Enemy is now chasing");
        enemy.color = "#FF0000"; // Bright red
      },
      update: function(dt) {
        // Move towards player
        var dx = player.x - enemy.x;
        var dy = player.y - enemy.y;
        var length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          dx /= length;
          dy /= length;
          
          enemy.x += dx * enemy.speed * dt;
          enemy.y += dy * enemy.speed * dt;
        }
        
        // If player gets too far, go back to patrol
        if (length > 250) {
          this.change_state("patrol");
        }
        
        // If close enough, attack
        if (length < 50) {
          this.change_state("attack");
        }
      }
    },
    attack: {
      enter: function() {
        console.log("Enemy is attacking");
        enemy.color = "#FF00FF"; // Magenta
        
        // Set a timer to return to chase
        this.attack_timer = 0.5;
      },
      update: function(dt) {
        // Flash
        enemy.color = Math.sin(gameTime * 20) > 0 ? "#FF00FF" : "#FFFF00";
        
        // Decrease timer
        this.attack_timer -= dt;
        
        // When timer expires, go back to chase
        if (this.attack_timer <= 0) {
          this.change_state("chase");
        }
      }
    }
  }
});

// Use in step function
function updateEnemy(dt) {
  enemy.state.update(dt);
}

// Use in draw function
function drawEnemy(ctx) {
  draw_rectangle(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);
}
```

This example shows how to use a state machine to create an enemy with different behaviors:
1. Patrol: Move back and forth until the player comes near
2. Chase: Follow the player
3. Attack: Flash and attack when close enough

## Using Coroutines

SAAAM supports coroutines for handling sequences of events over time:

```saaam
// Create a coroutine for an enemy spawn sequence
function* spawn_sequence() {
  console.log("Starting spawn sequence");
  
  // Spawn 3 enemies
  for (var i = 0; i < 3; i++) {
    // Spawn animation
    var enemy = {
      x: 400,
      y: 0,
      width: 40,
      height: 40,
      color: "#FF5555"
    };
    
    // Animate dropping in
    for (var t = 0; t < 1; t += 0.1) {
      enemy.y = 100 * t;
      yield; // Pause execution until next frame
    }
    
    // Add to game
    enemies.push(enemy);
    
    // Wait 1 second before spawning next enemy
    yield* wait(1);
  }
  
  console.log("Spawn sequence complete");
}

// Start the coroutine
SAAAM.startCoroutine(spawn_sequence());

// Helper function to wait
function* wait(seconds) {
  var timer = 0;
  while (timer < seconds) {
    timer += delta_time;
    yield;
  }
}
```

Coroutines are useful for:
1. Sequences of actions that span multiple frames
2. Creating cutscenes or scripted events
3. Complex animations
4. Boss behaviors

## Importing and Exporting

SAAAM supports modular code through importing and exporting:

```saaam
// player.saaam
export var player_speed = 200;

export function createPlayer(x, y) {
  return {
    x: x,
    y: y,
    width: 40,
    height: 40,
    color: "#4488FF",
    speed: player_speed
  };
}
```

```saaam
// main.saaam
import { createPlayer, player_speed } from 'player.saaam';

// Create player at center
var player = createPlayer(400, 300);

// Can access imported variables
console.log("Player speed:", player_speed);
```

## Advanced Graphics

SAAAM supports various drawing operations for more complex visuals:

```saaam
// Draw with blend modes
draw_set_blend_mode("add");
draw_circle(400, 300, 100, "#FF8800");
draw_set_blend_mode("normal");

// Draw with effects
draw_sprite_ext(
  "flame",        // sprite name
  0,              // subimage index
  400, 300,       // position
  2, 2,           // scale
  45,             // rotation (degrees)
  "#FFFFFF",      // color
  0.8             // alpha
);

// Draw complex shapes
draw_begin_path();
draw_move_to(100, 100);
draw_line_to(200, 100);
draw_line_to(200, 200);
draw_line_to(100, 200);
draw_close_path();
draw_fill("#FF8800");
draw_stroke("#000000", 2);
```

## Physics Integration

SAAAM includes simplified physics capabilities:

```saaam
// Create a physics body
var physics_object = physics_create_rectangle(
  200, 200,     // position
  50, 50,       // size
  0,            // rotation
  true          // is dynamic (affected by forces)
);

// Apply a force
physics_apply_force(physics_object, 100, 0);

// Check for collisions
var collisions = physics_get_collisions(physics_object);
for (var i = 0; i < collisions.length; i++) {
  console.log("Collided with:", collisions[i].object);
}

// Destroy when no longer needed
physics_destroy(physics_object);
```

## Using Camera Controls

SAAAM allows camera manipulation for creating games larger than the screen:

```saaam
// Set camera position
camera_set_position(player.x - 400, player.y - 300);

// Set camera parameters
camera_set_view(
  player.x - 400,  // x
  player.y - 300,  // y
  800,             // width
  600,             // height
  0                // rotation
);

// Smooth camera follow
var target_x = player.x - 400;
var target_y = player.y - 300;
var current_x = camera_get_x();
var current_y = camera_get_y();

var new_x = current_x + (target_x - current_x) * 0.1;
var new_y = current_y + (target_y - current_y) * 0.1;

camera_set_position(new_x, new_y);
```

## Saving and Loading Data

SAAAM provides functions for saving and loading game data:

```saaam
// Save high score
function saveHighScore(score) {
  save_data("high_score", score);
}

// Load high score
function loadHighScore() {
  var high_score = load_data("high_score");
  return high_score || 0; // Default to 0 if not found
}

// Save complex data
var save_data = {
  player: {
    x: player.x,
    y: player.y,
    health: player.health
  },
  collectibles: collectibles.length,
  score: score,
  level: current_level
};

save_data("game_save", JSON.stringify(save_data));

// Load complex data
var loaded_string = load_data("game_save");
if (loaded_string) {
  var loaded_data = JSON.parse(loaded_string);
  player.x = loaded_data.player.x;
  player.y = loaded_data.player.y;
  player.health = loaded_data.player.health;
  score = loaded_data.score;
  current_level = loaded_data.level;
}
```

## Conclusion

This tutorial has covered the basics of the SAAAM language and its capabilities. SAAAM is designed to make game development accessible while still providing powerful features for creating engaging games.

As you've seen, SAAAM allows you to:
1. Create and manage game objects with lifecycle functions
2. Handle input and user interaction
3. Implement collision detection and physics
4. Add visual effects and animations
5. Structure your game with states and state machines
6. Use coroutines for complex sequences
7. Save and load game data
8. Create modular code with imports and exports

With these tools, you can start creating your own games with SAAAM. Remember to check the [SAAAM Language Specification](saaam-language-spec.html) for detailed information about all available functions and features.

Happy game developing!
saaam
// My first SAAAM program
SAAAM.registerCreate(create);
SAAAM.registerDraw(draw);

function create() {
  console.log("Hello, World!");
}

function draw(ctx) {
  draw_text("Hello, SAAAM World!", 400, 300, "#FFFFFF");
}
```

Save this code as `hello.saaam` and run it with SAAAM Game Studio. You should see the text "Hello, SAAAM World!" displayed in the center of the screen, and "Hello, World!" logged to the console.

### Understanding the Basics

Let's break down what's happening:

1. We register two of SAAAM's lifecycle functions, `create` and `draw`, with the engine
2. The `create` function runs once when the game starts
3. The `draw` function runs every frame to render content to the screen
4. We use the built-in `draw_text` function to display text

## Moving Objects

Now let's create a simple moving square:

```saaam
// Moving square example
SAAAM.registerCreate(create);
SAAAM.registerStep(step);
SAAAM.registerDraw(draw);

// Game object
var square = {
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  color: "#4488FF",
  speed: 200
};

function create() {
  // Initialization code (empty for now)
}

function step(deltaTime) {
  // Move square with arrow keys
  if (keyboard_check(vk_right)) {
    square.x += square.speed * deltaTime;
  }
  if (keyboard_check(vk_left)) {
    square.x -= square.speed * deltaTime;
  }
  if (keyboard_check(vk_up)) {
    square.y -= square.speed * deltaTime;
  }
  if (keyboard_check(vk_down)) {
    square.y += square.speed * deltaTime;
  }
  
  // Keep square on screen
  if (square.x < 0) square.x = 0;
  if (square.x + square.width > 800) square.x = 800 - square.width;
  if (square.y < 0) square.y = 0;
  if (square.y + square.height > 600) square.y = 600 - square.height;
}

function draw(ctx) {
  // Clear the screen
  draw_rectangle(0, 0, 800, 600, "#222222");
  
  // Draw the square
  draw_rectangle(square.x, square.y, square.width, square.height, square.color);
  
  // Draw instructions
  draw_text("Use arrow keys to move", 400, 30, "#FFFFFF");
}
```

When you run this code, you should see a blue square that you can move around using the arrow keys.

### Key Concepts Introduced

1. The `step` function is called every frame and is used for game logic
2. The `deltaTime` parameter represents the time elapsed since the last frame
3. We use `keyboard_check` to detect key presses
4. We multiply movement by `deltaTime` to ensure consistent speed regardless of frame rate

## Adding Collectibles

Let's expand our game by adding collectibles that the player can gather:

```saaam
// Collectible game example
SAAAM.registerCreate(create);
SAAAM.registerStep(step);
SAAAM.registerDraw(draw);

// Player object
var player = {
  x: 400,
  y: 300,
  width: 40,
  height: 40,
  speed: 200,
  color: "#4488FF"
};

// Game variables
var collectibles = [];
var score = 0;
var gameTime = 0;

function create() {
  // Spawn initial collectibles
  for (var i = 0; i < 5; i++) {
    spawnCollectible();
  }
}

function step(deltaTime) {
  // Update game time
  gameTime += deltaTime;
  
  // Handle player movement
  handlePlayerMovement(deltaTime);
  
  // Update and check collectibles
  updateCollectibles(deltaTime);
}

function draw(ctx) {
  // Clear the screen
  draw_rectangle(0, 0, 800, 600, "#222222");
  
  // Draw collectibles
  for (var i = 0; i < collectibles.length; i++) {
    var c = collectibles[i];
    draw_rectangle(c.x, c.y, c.width, c.height, c.color);
  }
  
  // Draw player
  draw_rectangle(player.x, player.y, player.width, player.height, player.color);
  
  // Draw score
  draw_text("Score: " + score, 20, 30, "#FFFFFF");
}

// Handle player movement
function handlePlayerMovement(deltaTime) {
  if (keyboard_check(vk_right) || keyboard_check(vk_d)) {
    player.x += player.speed * deltaTime;
  }
  if (keyboard_check(vk_left) || keyboard_check(vk_a)) {
    player.x -= player.speed * deltaTime;
  }
  if (keyboard_check(vk_up) || keyboard_check(vk_w)) {
    player.y -= player.speed * deltaTime;
  }
  if (keyboard_check(vk_down) || keyboard_check(vk_s)) {
    player.y += player.speed * deltaTime;
  }
  
  // Keep player on screen
  player.x = Math.max(0, Math.min(800 - player.width, player.x));
  player.y = Math.max(0, Math.min(600 - player.height, player.y));
}

// Update collectibles and check collisions
function updateCollectibles(deltaTime) {
  for (var i = collectibles.length - 1; i >= 0; i--) {
    var c = collectibles[i];
    
    // Make collectibles bob up and down
    c.y = c.baseY + Math.sin(gameTime * c.bobSpeed) * 10;
    
    // Check for collision with player
    if (checkCollision(player, c)) {
      // Remove collectible
      collectibles.splice(i, 1);
      
      // Increase score
      score += 100;
      
      // Play sound
      if (play_sound) {
        play_sound("collect");
      }
      
      // Spawn a new collectible
      spawnCollectible();
    }
  }
}

// Spawn a collectible at a random position
function spawnCollectible() {
  var collectible = {
    x: 50 + Math.random() * 700,
    y: 50 + Math.random() * 500,
    baseY: 0,
    width: 20,
    height: 20,
    color: "#FFDD44",
    bobSpeed: 1 + Math.random() * 2
  };
  
  collectible.baseY = collectible.y;
  collectibles.push(collectible);
}

// Check collision between two rectangles
function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}
```

This example introduces several new concepts:

1. Creating and managing multiple game objects (collectibles)
2. Implementing collision detection
3. Keeping score
4. Using time-based animation for the bobbing effect
5. Breaking code into functions for better organization

## Adding Visual Polish

Let's enhance our game with better visuals:

```saaam
// Enhanced collectible game with visual effects
SAAAM.registerCreate(create);
SAAAM.registerStep(step);
SAAAM.registerDraw(draw);

// Player object with enhanced properties
var player = {
  x: 400,
  y: 300,
  width: 40,
  height: 40,
  speed: 200,
  color: "#4488FF",
  trailParticles: [],
  rotation: 0
};

// Game variables
var collectibles = [];
var particles = [];
var score = 0;
var gameTime = 0;

function create() {
  // Spawn initial collectibles
  for (var i = 0; i < 5; i++) {
    spawnCollectible();
  }
}

function step(deltaTime) {
  // Update game time
  gameTime += deltaTime;
  
  // Handle player movement
  handlePlayerMovement(deltaTime);
  
  // Update and check collectibles
  updateCollectibles(deltaTime);
  
  // Update particles
  updateParticles(deltaTime);
}

function draw(ctx) {
  // Draw a gradient background
  drawBackground(ctx);
  
  // Draw collectibles
  drawCollectibles(ctx);
  
  // Draw player
  drawPlayer(ctx);
  
  // Draw particles
  drawParticles(ctx);
  
  // Draw score
  draw_text("Score: " + score, 20, 30, "#FFFFFF");
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(1, "#16213e");
  draw_rectangle(0, 0, 800, 600, gradient);
  
  // Draw some stars
  for (var i = 0; i < 50; i++) {
    var x = (Math.sin(i * 3.14159 + gameTime * 0.2) * 400) + 400;
    var y = (Math.cos(i * 3.14159 + gameTime * 0.3) * 300) + 300;
    
    var brightness = Math.sin(gameTime * 2 + i) * 0.5 + 0.5;
    var alpha = 0.3 * brightness;
    var size = 2 + brightness * 2;
    
    draw_circle(x, y, size, `rgba(255, 255, 255, ${alpha})`);
  }
}

function handlePlayerMovement(deltaTime) {
  var movingX = false;
  var movingY = false;
  
  if (keyboard_check(vk_right) || keyboard_check(vk_d)) {
    player.x += player.speed * deltaTime;
    movingX = true;
    player.rotation = 0;
  }
  if (keyboard_check(vk_left) || keyboard_check(vk_a)) {
    player.x -= player.speed * deltaTime;
    movingX = true;
    player.rotation = Math.PI;
  }
  if (keyboard_check(vk_up) || keyboard_check(vk_w)) {
    player.y -= player.speed * deltaTime;
    movingY = true;
    if (!movingX) player.rotation = -Math.PI/2;
  }
  if (keyboard_check(vk_down) || keyboard_check(vk_s)) {
    player.y += player.speed * deltaTime;
    movingY = true;
    if (!movingX) player.rotation = Math.PI/2;
  }
  
  // Set diagonal rotation
  if (movingX && movingY) {
    if (keyboard_check(vk_left) || keyboard_check(vk_a)) {
      if (keyboard_check(vk_up) || keyboard_check(vk_w)) {
        player.rotation = -3*Math.PI/4;
      } else {
        player.rotation = 3*Math.PI/4;
      }
    } else {
      if (keyboard_check(vk_up) || keyboard_check(vk_w)) {
        player.rotation = -Math.PI/4;
      } else {
        player.rotation = Math.PI/4;
      }
    }
  }
  
  // Create trail particles if moving
  if (movingX || movingY) {
    createTrailParticle();
  }
  
  // Keep player on screen
  player.x = Math.max(0, Math.min(800 - player.width, player.x));
  player.y = Math.max(0, Math.min(600 - player.height, player.y));
}

function createTrailParticle() {
  // Only create particles sometimes
  if (Math.random() > 0.3) return;
  
  // Calculate position at the center-back of the player
  var offsetX = -Math.cos(player.rotation) * player.width/2;
  var offsetY = -Math.sin(player.rotation) * player.height/2;
  
  var particle = {
    type: "trail",
    x: player.x + player.width/2 + offsetX,
    y: player.y + player.height/2 + offsetY,
    size: 5 + Math.random() * 5,
    color: `rgba(${68 + Math.random()*30}, ${136 + Math.random()*30}, ${255}, 0.7)`,
    life: 0.5,
    maxLife: 0.5,
    vx: -Math.cos(player.rotation) * (10 + Math.random() * 20),
    vy: -Math.sin(player.rotation) * (10 + Math.random() * 20)
  };
  
  particles.push(particle);
}

function drawPlayer(ctx) {
  ctx.save();
  
  // Move to player center
  ctx.translate(player.x + player.width/2, player.y + player.height/2);
  
  // Rotate according to movement direction
  ctx.rotate(player.rotation);
  
  // Draw a spaceship shape instead of a square
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.moveTo(player.width/2, 0);
  ctx.lineTo(-player.width/2, player.height/3);
  ctx.lineTo(-player.width/3, 0);
  ctx.lineTo(-player.width/2, -player.height/3);
  ctx.closePath();
  ctx.fill();
  
  // Add a cockpit
  ctx.fillStyle = "#88CCFF";
  ctx.beginPath();
  ctx.arc(player.width/4, 0, player.width/6, 0, Math.PI * 2);
  ctx.fill();
  
  // Add engine flame effect when moving
  if (keyboard_check(vk_left) || keyboard_check(vk_right) ||
      keyboard_check(vk_up) || keyboard_check(vk_down) ||
      keyboard_check(vk_a) || keyboard_check(vk_d) ||
      keyboard_check(vk_w) || keyboard_check(vk_s)) {
    
    // Animate flame
    var flameSize = Math.sin(gameTime * 15) * 0.3 + 0.7;
    
    // Main flame
    ctx.fillStyle = "#FF9900";
    ctx.beginPath();
    ctx.moveTo(-player.width/3, 0);
    ctx.lineTo(-player.width/2 - 20 * flameSize, player.height/5 * flameSize);
    ctx.lineTo(-player.width/2 - 15 * flameSize, 0);
    ctx.lineTo(-player.width/2 - 20 * flameSize, -player.height/5 * flameSize);
    ctx.closePath();
    ctx.fill();
    
    // Inner flame
    ctx.fillStyle = "#FFCC00";
    ctx.beginPath();
    ctx.moveTo(-player.width/3, 0);
    ctx.lineTo(-player.width/2 - 10 * flameSize, player.height/8 * flameSize);
    ctx.lineTo(-player.width/2 - 8 * flameSize, 0);
    ctx.lineTo(-player.width/2 - 10 * flameSize, -player.height/8 * flameSize);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

function updateCollectibles(deltaTime) {
  for (var i = collectibles.length - 1; i >= 0; i--) {
    var c = collectibles[i];
    
    // Update collectible animations
    c.rotation += c.rotationSpeed * deltaTime;
    c.y = c.baseY + Math.sin(gameTime * c.bobSpeed) * c.bobHeight;
    
    // Check for collision with player
    if (checkCollision(player, c)) {
      // Remove collectible
      collectibles.splice(i, 1);
      
      // Increase score
      score += 100;
      
      // Play sound
      if (SAAAM.playSound) {
        SAAAM.playSound("collect");
      }
      
      // Create collection particles
      createCollectionParticles(c);
      
      // Spawn a new collectible
      spawnCollectible();
    }
  }
}

function drawCollectibles(ctx) {
  for (var i = 0; i < collectibles.length; i++) {
    var c = collectibles[i];
    
    ctx.save();
    
    // Move to collectible center
    ctx.translate(c.x + c.width/2, c.y + c.height/2);
    
    // Rotate
    ctx.rotate(c.rotation);
    
    // Draw as a star instead of square
    var points = 5;
    var outerRadius = c.width / 2;
    var innerRadius = c.width / 4;
    
    ctx.fillStyle = c.color;
    ctx.beginPath();
    
    for (var j = 0; j < points * 2; j++) {
      var radius = j % 2 === 0 ? outerRadius : innerRadius;
      var angle = (j * Math.PI) / points;
      var x = Math.cos(angle) * radius;
      var y = Math.sin(angle) * radius;
      
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Add glow effect
    var glow = Math.sin(gameTime * 3) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(255, 255, 255, ${glow * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, c.width / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
}

function spawnCollectible() {
  var collectible = {
    x: 50 + Math.random() * 700,
    y: 50 + Math.random() * 500,
    width: 30,
    height: 30,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 3,
    bobHeight: 10 + Math.random() * 10,
    bobSpeed: 1 + Math.random() * 2,
    baseY: 0,
    color: "#FFDD44"
  };
  
  collectible.baseY = collectible.y;
  
  // Make sure it doesn't overlap with the player
  if (checkCollision(
    { x: collectible.x, y: collectible.y, width: collectible.width, height: collectible.height },
    { x: player.x - 50, y: player.y - 50, width: player.width + 100, height: player.height + 100 }
  )) {
    return spawnCollectible(); // Try again
  }
  
  collectibles.push(collectible);
}

function createCollectionParticles(collectible) {
  var cx = collectible.x + collectible.width/2;
  var cy = collectible.y + collectible.height/2;
  
  // Create sparkle effect
  for (var i = 0; i < 20; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 50 + Math.random() * 100;
    
    particles.push({
      type: "sparkle",
      x: cx,
      y: cy,
      size: 2 + Math.random() * 3,
      color: collectible.color,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 0.5 + Math.random() * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    });
  }
  
  // Create score popup
  particles.push({
    type: "score",
    x: cx,
    y: cy - 20,
    text: "+100",
    color: "#FFFFFF",
    life: 1.0,
    maxLife: 1.0,
    vy: -40
  });
  
  // Create circular wave effect
  particles.push({
    type: "wave",
    x: cx,
    y: cy,
    radius: 5,
    maxRadius: 60,
    color: collectible.color,
    life: 0.5,
    maxLife: 0.5
  });
}

function updateParticles(deltaTime) {
  for (var i = particles.length - 1; i >= 0; i--) {
    var particle = particles[i];
    
    // Update life
    particle.life -= deltaTime;
    
    // Remove dead particles
    if (particle.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    // Update position for moving particles
    if (particle.type === "sparkle" || particle.type === "trail" || particle.type === "score") {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
    }
    
    // Update radius for expanding particles
    if (particle.type === "wave") {
      var progress = 1 - (particle.life / particle.maxLife);
      particle.radius = particle.maxRadius * progress;
    }
  }
}

function drawParticles(ctx) {
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    var alpha = p.life / p.maxLife;
    
    if (p.type === "sparkle" || p.type === "trail") {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "wave") {
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === "score") {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
    }
    
    ctx.globalAlpha = 1.0;
  }
}

function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}
```

This enhanced version introduces many new visual elements:

1. A spaceship player character that rotates according to movement direction
2. Engine flame effects
3. Star-shaped collectibles that rotate and have a glow effect
4. Multiple types of particles: trails, sparkles, waves, and score popups
5. A gradient background with animated stars

## Sound Effects

SAAAM makes it easy to add sound effects to your game. Here's how to use them:

```saaam
// Play a sound once
play_sound("explosion");

// Play background music with loop
play_music("background", 0.7, true);

// Stop music
stop_music();
```

In our game, we're already using sound with `SAAAM.playSound("collect")` when collecting items.

## Implementing Game States

Let's add game states to create a complete game loop:

```saaam
// Game with states example
SAAAM.registerCreate(create);
SAAAM.registerStep(step);
SAAAM.registerDraw(draw);

// Game states
const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
  VICTORY: "victory"
};

// Game variables
var currentState = GameState.MENU;
var player = { /* ... player properties ... */ };
var collectibles = [];
var score = 0;
var targetScore = 1000;
var timeLeft = 60;
var gameTime = 0;

function create() {
  resetGame();
}

function step(deltaTime) {
  // Update game time
  gameTime += deltaTime;
  
  // Handle different game states
  switch (currentState) {
    case GameState.MENU:
      updateMenu(deltaTime);
      break;
    case GameState.PLAYING:
      updatePlaying(deltaTime);
      break;
    case GameState.GAME_OVER:
    case GameState.VICTORY:
      updateGameOver(deltaTime);
      break;
  }
}

function draw(ctx) {
  // Clear the screen
  drawBackground(ctx);
  
  // Draw based on game state
  switch (currentState) {
    case GameState.MENU:
      drawMenu(ctx);
      break;
    case GameState.PLAYING:
      drawPlaying(ctx);
      break;
    case GameState.GAME_OVER:
      drawGameOver(ctx);
      break;
    case GameState.VICTORY:
      drawVictory(ctx);
      break;
  }
}

function updateMenu(deltaTime) {
  // Check for game start
  if (keyboard_check_pressed(vk_space) || keyboard_check_pressed(vk_enter)) {
    currentState = GameState.PLAYING;
    resetGame();
  }
}

function updatePlaying(deltaTime) {
  // Update time
  timeLeft -= deltaTime;
  
  // Check for game over condition
  if (timeLeft <= 0) {
    currentState = GameState.GAME_OVER;
    return;
  }
  
  // Check for victory condition
  if (score >= targetScore) {
    currentState = GameState.VICTORY;
    return;
  }
  
  // Normal gameplay updates
  handlePlayerMovement(deltaTime);
  updateCollectibles(deltaTime);
  updateParticles(deltaTime);
}

function updateGameOver(deltaTime) {
  // Check for restart
  if (keyboard_check_pressed(vk_space) || keyboard_check_pressed(vk_enter)) {
    currentState = GameState.MENU;
  }
  
  // Still update particles
  updateParticles(deltaTime);
}

function drawMenu(ctx) {
  // Draw title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("COLLECTOR", 400, 200);
  
  // Draw instruction
  ctx.font = "24px Arial";
  ctx.fillText("Press SPACE to Start", 400, 300);
  
  // Draw credits
  ctx.font = "16px Arial";
  ctx.fillText("Created with SAAAM", 400, 550);
  
  // Draw pulsing start button
  var pulse = Math.sin(gameTime * 5) * 0.1 + 0.9;
  ctx.fillStyle = "#4488FF";
  ctx.beginPath();
  ctx.roundRect(300, 350, 200, 50, 10);
  ctx.fill();
  
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${Math.floor(24 * pulse)}px Arial`;
  ctx.fillText("START GAME", 400, 385);
}

function drawPlaying(ctx) {
  // Draw all game elements
  drawCollectibles(ctx);
  drawPlayer(ctx);
  drawParticles(ctx);
  
  // Draw UI
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}/${targetScore}`, 20, 30);
  
  ctx.textAlign = "right";
  var timeDisplay = Math.ceil(timeLeft);
  var timeColor = timeLeft < 10 ? "#FF5555" : "#FFFFFF";
  ctx.fillStyle = timeColor;
  ctx.fillText(`Time: ${timeDisplay}s`, 780, 30);
}

function drawGameOver(ctx) {
  // Draw game elements in background
  drawCollectibles(ctx);
  drawPlayer(ctx);
  drawParticles(ctx);
  
  // Semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, 800, 600);
  
  // Game over text
  ctx.fillStyle = "#FF5555";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", 400, 200);
  
  // Score
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "24px Arial";
  ctx.fillText(`Final Score: ${score}`, 400, 260);
  ctx.fillText(`Target: ${targetScore}`, 400, 300);
  
  // Restart instructions
  ctx.fillStyle = "#AAAAAA";
  ctx.font = "18px Arial";
  ctx.fillText("Press SPACE to try again", 400, 380);
}

function drawVictory(ctx) {
  // Draw game elements in background
  drawCollectibles(ctx);
  drawPlayer(ctx);
  drawParticles(ctx);
  
  // Semi-transparent overlay
  ctx.fillStyle = "rgba(0, 20, 40, 0.7)";
  ctx.fillRect(0, 0, 800, 600);
  
  // Victory text
  var pulse = Math.sin(gameTime * 5) * 0.1 + 0.9;
  ctx.fillStyle = "#FFCC00";
  ctx.font = `bold ${Math.floor(48 * pulse)}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("VICTORY!", 400, 200);
  
  // Stats
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "24px Arial";
  ctx.fillText(`Final Score: ${score}`, 400, 260);
  ctx.fillText(`Time Remaining: ${Math.ceil(timeLeft)}s`, 400, 300);
  
  // Next steps
  ctx.fillStyle = "#AAAAAA";
  ctx.font = "18px Arial";
  ctx.fillText("Press SPACE to play again", 400, 380);
}

function resetGame() {
  // Reset game variables
  score = 0;
  timeLeft = 60;
  
  // Reset player
  player.x = 400;
  player.y = 300;
  player.trailParticles = [];
  
  // Clear and spawn collectibles
  collectibles = [];
  for (var i = 0; i < 5; i++) {
    spawnCollectible();
  }
  
  // Clear particles
  particles = [];
}
