# SAAAM Language Specification

## Overview

SAAAM (Simple-Architecture Accessible-Mechanics) is a domain-specific language designed for 2D game development. It provides a clean, intuitive syntax focused on game mechanics and behavior, with built-in constructs for common game development patterns.

## Core Philosophy

SAAAM's design is guided by the following principles:

- **Simplicity**: Easy to learn, read, and write, even for developers with limited programming experience
- **Game-Focused**: Built specifically for game logic with game-oriented constructs and vocabulary
- **Modern**: Incorporating modern programming paradigms while avoiding unnecessary complexity
- **Extensible**: Allowing developers to build their own abstractions and tools

## Language Structure

SAAAM is a structured, event-driven language with a JavaScript-like syntax that is specifically tailored for creating games. It uses a combination of lifecycle functions, event handlers, and game-specific constructs.

### Basic Syntax

SAAAM uses a C-style syntax with curly braces for blocks and semicolons to terminate statements.

```saaam
// This is a comment
var player_speed = 5;  // Variable declaration
const GRAVITY = 0.5;   // Constant declaration

// Function definition
function move_player() {
  // Function body
  player.x += 5;
}
```

### Data Types

SAAAM supports the following primitive data types:

- **Number**: Both integers and floating-point values (`5`, `3.14`)
- **String**: Text enclosed in quotes (`"Hello"`, `'World'`)
- **Boolean**: Logical values (`true`, `false`)
- **Vector2**: 2D vector with x and y components (`vec2(10, 20)`)
- **Vector3**: 3D vector with x, y, and z components (`vec3(10, 20, 30)`)
- **Color**: RGBA color values (`color(255, 0, 0)`, `"#FF0000"`)
- **Null**: Represents the absence of a value (`null`)

And the following complex data types:

- **Array**: Ordered collection of values (`[1, 2, 3]`)
- **Object**: Collection of key-value pairs (`{x: 10, y: 20}`)
- **Function**: Callable code blocks (`function() { return 42; }`)

### Variables and Constants

Variables are declared using `var` and constants with `const`:

```saaam
var score = 0;               // Mutable variable
const PLAYER_SPEED = 5.5;    // Immutable constant
```

### Operators

SAAAM supports standard arithmetic, comparison, logical, and assignment operators:

- **Arithmetic**: `+`, `-`, `*`, `/`, `%` (modulo), `**` (exponentiation)
- **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Logical**: `&&` (and), `||` (or), `!` (not)
- **Assignment**: `=`, `+=`, `-=`, `*=`, `/=`

### Control Structures

SAAAM includes standard control structures:

```saaam
// Conditionals
if (health <= 0) {
  game_over();
} else if (health < 20) {
  show_warning();
} else {
  continue_game();
}

// Loops
for (var i = 0; i < 10; i++) {
  spawn_enemy();
}

while (enemies_active > 0) {
  update_enemies();
}

// Switch statements
switch (current_state) {
  case "walking":
    update_walk_animation();
    break;
  case "jumping":
    apply_jump_physics();
    break;
  default:
    idle_animation();
    break;
}
```

## Lifecycle Functions

SAAAM games are structured around three primary lifecycle functions:

### create()

This function is called once when a game object is created. It's used for initialization:

```saaam
function create() {
  // Initialize object properties
  this.position = vec2(100, 100);
  this.velocity = vec2(0, 0);
  this.sprite = "player_idle";
  
  // Setup other properties
  this.health = 100;
  this.max_health = 100;
  this.coins = 0;
}
```

### step(deltaTime)

This function is called once per frame for logic updates. The `deltaTime` parameter represents the time elapsed since the last frame in seconds:

```saaam
function step(deltaTime) {
  // Update object logic
  this.velocity.y += GRAVITY * deltaTime;
  this.position.x += this.velocity.x * deltaTime;
  this.position.y += this.velocity.y * deltaTime;
  
  // Handle input
  if (keyboard_check(vk_right)) {
    this.velocity.x = player_speed;
  }
  
  // Handle collisions
  check_collisions();
}
```

### draw(ctx)

This function is called once per frame for rendering. The `ctx` parameter is the rendering context:

```saaam
function draw(ctx) {
  // Draw the sprite
  draw_sprite(this.sprite, this.position.x, this.position.y);
  
  // Draw UI elements
  draw_health_bar(this.position.x - 20, this.position.y - 30, 40, 5, this.health / this.max_health);
}
```

## Event Functions

Beyond the basic lifecycle, SAAAM supports event functions for handling specific occurrences:

```saaam
// Called when this object collides with another
function on_collision(other) {
  if (other.tag == "enemy") {
    take_damage(10);
  }
}

// Called when the object is destroyed
function on_destroy() {
  spawn_particles("explosion", this.position.x, this.position.y);
  drop_item("coin", this.position.x, this.position.y);
}
```

## Game-Specific Functions

SAAAM includes built-in functions for common game development tasks:

### Input Functions

```saaam
// Check if a key is currently held down
if (keyboard_check(vk_space)) {
  jump();
}

// Check if a key was just pressed this frame
if (keyboard_check_pressed(vk_z)) {
  attack();
}

// Check if a key was just released this frame
if (keyboard_check_released(vk_x)) {
  cancel_charge();
}

// Get mouse position
var mouse_pos = mouse_position();

// Check if mouse button is pressed
if (mouse_check(mb_left)) {
  fire_weapon();
}
```

### Drawing Functions

```saaam
// Draw a sprite
draw_sprite("player", x, y);

// Draw a sprite with transformations
draw_sprite_ext("enemy", x, y, 2, 2, 45, "#FF0000", 0.8);

// Draw shapes
draw_rectangle(x, y, width, height, "#00FF00");
draw_circle(x, y, radius, "#0000FF");
draw_line(x1, y1, x2, y2, "#FFFFFF");

// Draw text
draw_text("Score: " + score, 20, 20, "#FFFFFF");
```

### Audio Functions

```saaam
// Play a sound effect
play_sound("explosion");

// Play background music
play_music("level_theme", 0.8, true);

// Stop music
stop_music();
```

### Physics and Collision

```saaam
// Check for collision with an object of a specific tag
var enemy = check_collision(this.position.x, this.position.y, "enemy");
if (enemy) {
  take_damage(enemy.damage);
}

// Apply forces
apply_force(vec2(0, -jump_force));
```

### Time and Coroutines

```saaam
// Run a function after a delay
wait(2, function() {
  spawn_boss();
});

// Create a sequence of timed events
sequence([
  {time: 0, action: function() { show_text("Get Ready!"); }},
  {time: 2, action: function() { start_wave(1); }},
  {time: 60, action: function() { end_level(); }}
]);
```

## Constants and Built-ins

SAAAM provides predefined constants for common values:

### Virtual Key Constants

```saaam
vk_up       // Up arrow key
vk_down     // Down arrow key
vk_left     // Left arrow key
vk_right    // Right arrow key
vk_space    // Space bar
vk_enter    // Enter key
vk_escape   // Escape key
vk_shift    // Shift key
vk_control  // Control key
vk_alt      // Alt key
vk_tab      // Tab key

// Letters
vk_a through vk_z

// Numbers
vk_0 through vk_9
```

### Mouse Button Constants

```saaam
mb_left    // Left mouse button
mb_right   // Right mouse button
mb_middle  // Middle mouse button
```

### Global Variables

```saaam
current_time          // Current game time in milliseconds
delta_time            // Time since last frame in seconds
room_width            // Width of the current room/level
room_height           // Height of the current room/level
game_fps              // Current frames per second
debug_mode            // Boolean indicating if game is in debug mode
```

## Advanced Features

### State Machines

SAAAM includes a simple state machine system:

```saaam
// Define a state machine
var state_machine = new StateMachine({
  initial: "idle",
  states: {
    idle: {
      enter: function() {
        this.sprite = "player_idle";
      },
      update: function(dt) {
        if (keyboard_check(vk_right) || keyboard_check(vk_left)) {
          this.change_state("walking");
        }
      }
    },
    walking: {
      enter: function() {
        this.sprite = "player_walk";
      },
      update: function(dt) {
        // Walking logic
      }
    }
  }
});

// Use in step function
function step(dt) {
  state_machine.update(dt);
}
```

### Particle Systems

```saaam
// Create a particle system
var particle_system = new ParticleSystem({
  position: vec2(100, 100),
  texture: "particle",
  emission_rate: 20,
  lifetime: 2,
  direction: 90,
  spread: 20,
  speed: 50,
  gravity: vec2(0, 10),
  color_start: "#FFFFFF",
  color_end: "#FFFFFF00",
  size_start: 2,
  size_end: 0
});

// Emit particles
particle_system.emit(20);
```

### Tween Animations

```saaam
// Animate a property over time
tween(this, "position.x", 100, 300, 2, "ease_out_quad");
tween(this, "alpha", 1, 0, 0.5, "linear");
```

## Integration with SAAAM Engine

SAAAM language scripts are registered with the engine using registration functions:

```saaam
// Register game lifecycle functions
SAAAM.registerCreate(create);
SAAAM.registerStep(step);
SAAAM.registerDraw(draw);
```

## Example Complete Game

Below is a simple complete game example to demonstrate SAAAM in action:

```saaam
// SAAAM Collectible Game Example

// Register game lifecycle functions
SAAAM.registerCreate(create);
SAAAM.registerStep(step);
SAAAM.registerDraw(draw);

// Game variables
var player = {
  x: 400,
  y: 300,
  width: 40,
  height: 40,
  speed: 200,
  color: "#4488FF"
};

var collectibles = [];
var score = 0;
var game_time = 0;

// Create function - called once at start
function create() {
  // Spawn initial collectibles
  for (var i = 0; i < 5; i++) {
    spawn_collectible();
  }
}

// Step function - called every frame
function step(deltaTime) {
  // Update game time
  game_time += deltaTime;
  
  // Handle player input
  if (keyboard_check(vk_left) || keyboard_check(vk_a)) {
    player.x -= player.speed * deltaTime;
  }
  if (keyboard_check(vk_right) || keyboard_check(vk_d)) {
    player.x += player.speed * deltaTime;
  }
  if (keyboard_check(vk_up) || keyboard_check(vk_w)) {
    player.y -= player.speed * deltaTime;
  }
  if (keyboard_check(vk_down) || keyboard_check(vk_s)) {
    player.y += player.speed * deltaTime;
  }
  
  // Keep player within screen bounds
  player.x = Math.max(0, Math.min(800 - player.width, player.x));
  player.y = Math.max(0, Math.min(600 - player.height, player.y));
  
  // Check for collectible collisions
  for (var i = collectibles.length - 1; i >= 0; i--) {
    var c = collectibles[i];
    
    // Animate collectible
    c.y = c.baseY + Math.sin(game_time * c.bobSpeed) * 10;
    
    // Simple collision detection
    if (rectangles_collide(player, c)) {
      // Collect
      collectibles.splice(i, 1);
      score += 100;
      play_sound("collect");
      
      // Spawn new collectible
      spawn_collectible();
    }
  }
}

// Draw function - called every frame after step
function draw(ctx) {
  // Clear the screen with a dark background
  draw_rectangle(0, 0, 800, 600, "#222222");
  
  // Draw collectibles
  for (var i = 0; i < collectibles.length; i++) {
    var c = collectibles[i];
    draw_rectangle(c.x, c.y, c.width, c.height, c.color);
  }
  
  // Draw player
  draw_rectangle(player.x, player.y, player.width, player.height, player.color);
  
  // Draw UI
  draw_text("Score: " + score, 20, 30, "#FFFFFF");
}

// Helper function to spawn a collectible
function spawn_collectible() {
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

// Helper function for collision detection
function rectangles_collide(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}
```

## Best Practices

1. **Use descriptive variable names** - Choose meaningful names for game elements
2. **Keep functions focused** - Each function should do one thing well
3. **Use constants for magic numbers** - Define constants for values like speeds, health, etc.
4. **Separate logic and rendering** - Keep game logic in `step` and drawing in `draw`
5. **Use state machines for complex behavior** - Organize complex object behavior with state machines
6. **Optimize collision detection** - Use appropriate spatial data structures for large numbers of objects
7. **Handle time correctly** - Always scale movement and animations by deltaTime
8. **Comment your code** - Explain the why, not just the what
9. **Organize related functionality** - Group related game systems into their own files

## Future Extensions

The SAAAM language is designed to be extensible. Future versions may include:
- Network multiplayer support
- Mobile input abstractions
- Advanced AI behavior trees
- Shader integration
- 3D support
