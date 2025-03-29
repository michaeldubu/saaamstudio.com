// Physics Collision Layer System in SAAAM

// Define named collision layers for clarity and maintainability
enum COLLISION_LAYER {
    DEFAULT     = 0,    // Default layer (layer 0)
    PLAYER      = 1,    // Player characters
    ENEMY       = 2,    // Enemy characters
    PROJECTILE  = 3,    // Bullets, missiles, etc.
    PICKUP      = 4,    // Collectible items
    PLATFORM    = 5,    // Platforms/ground
    TRIGGER     = 6,    // Trigger volumes (non-solid)
    WATER       = 7,    // Water/fluid volumes
    DESTRUCTIBLE = 8,   // Destructible objects
    NPC         = 9,    // Non-player characters
    VEHICLE     = 10,   // Vehicles
    WEAPON      = 11,   // Melee weapons
    SENSOR      = 12,   // Sensor/detector volumes
    OBSTACLE    = 13,   // Static obstacles
    FX          = 14,   // Special effects (particles)
    UI          = 15    // UI elements with physics
    // Layers 16-31 available for game-specific uses
}

// Example: Creating collision filtering presets

// Create a player collider that interacts with everything except other players and FX
var player_collider = new Collider({
    shape: "capsule",
    radius: 0.5,
    height: 2.0,
    layer: COLLISION_LAYER.PLAYER,
    // Collide with everything EXCEPT player and fx layers
    mask: 0xFFFFFFFF & ~(1 << COLLISION_LAYER.PLAYER | 1 << COLLISION_LAYER.FX)
});

// Create a trigger volume that only detects players
var player_detector = new Collider({
    shape: "box",
    size: vec3(3, 3, 3),
    layer: COLLISION_LAYER.SENSOR,
    mask: (1 << COLLISION_LAYER.PLAYER), // Only collide with player layer
    is_trigger: true // Doesn't block movement, just detects overlaps
});

// Create projectiles that hit enemies and environment, but not other projectiles or the player
var bullet_collider = new Collider({
    shape: "sphere",
    radius: 0.1,
    layer: COLLISION_LAYER.PROJECTILE,
    // Collide with enemies, platforms, obstacles, destructibles
    mask: (1 << COLLISION_LAYER.ENEMY) | 
          (1 << COLLISION_LAYER.PLATFORM) | 
          (1 << COLLISION_LAYER.OBSTACLE) |
          (1 << COLLISION_LAYER.DESTRUCTIBLE)
});

// Water that only affects players and NPCs
var water_volume = new Collider({
    shape: "box",
    size: vec3(20, 5, 20),
    layer: COLLISION_LAYER.WATER,
    mask: (1 << COLLISION_LAYER.PLAYER) | (1 << COLLISION_LAYER.NPC),
    is_trigger: true
});

// Utility functions for collision layer management

// Create a collision mask from an array of layers
function create_mask_from_layers(layer_array) {
    var mask = 0;
    for (var layer of layer_array) {
        mask |= (1 << layer);
    }
    return mask;
}

// Example usage
var player_mask = create_mask_from_layers([
    COLLISION_LAYER.ENEMY,
    COLLISION_LAYER.PLATFORM,
    COLLISION_LAYER.PICKUP,
    COLLISION_LAYER.TRIGGER,
    COLLISION_LAYER.WATER
]);

// Check if a specific layer is in a mask
function mask_contains_layer(mask, layer) {
    return (mask & (1 << layer)) !== 0;
}

// Change collision layers at runtime
function change_object_collision_properties(game_object, new_layer, collides_with_layers) {
    var collider = game_object.get_component(Collider);
    if (collider) {
        collider.layer = new_layer;
        collider.mask = create_mask_from_layers(collides_with_layers);
        physics.update_collider(collider); // Notify physics system of the change
    }
}

// Runtime example: Make the player temporarily invulnerable
function make_player_invulnerable(player, duration) {
    // Save original mask
    var original_mask = player.get_component(Collider).mask;
    
    // Change to only collide with environment
    change_object_collision_properties(
        player, 
        COLLISION_LAYER.PLAYER,
        [COLLISION_LAYER.PLATFORM, COLLISION_LAYER.OBSTACLE]
    );
    
    // Restore original collision after duration
    wait(duration).then(() => {
        player.get_component(Collider).mask = original_mask;
        physics.update_collider(player.get_component(Collider));
    });
}
