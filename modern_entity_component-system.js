/**
 * Modern Entity Component System (ECS) Architecture
 * A data-oriented approach to game object management
 */

/**
 * Component Pool for efficient component memory management
 */
class ComponentPool {
  /**
   * Create a new component pool
   * @param {Function} componentClass - Component constructor
   * @param {number} initialSize - Initial pool size
   */
  constructor(componentClass, initialSize = 100) {
    this.componentClass = componentClass;
    this.componentName = componentClass.name;
    this.pool = [];
    this.nextId = 0;
    this.activeCount = 0;
    
    // Initialize pool with instances
    this._expandPool(initialSize);
  }
  
  /**
   * Create/get a component from the pool
   * @param {Object} initData - Initialization data
   * @returns {Object} Component instance
   */
  create(initData = {}) {
    // Check if we need to expand
    if (this.activeCount >= this.pool.length) {
      this._expandPool(Math.ceil(this.pool.length * 1.5));
    }
    
    // Get next available component
    const component = this.pool[this.activeCount];
    component._active = true;
    component._id = this.nextId++;
    
    // Reset component to initial state
    if (component.reset) {
      component.reset();
    }
    
    // Initialize with provided data
    Object.assign(component, initData);
    
    // Initialize if has method
    if (component.initialize) {
      component.initialize();
    }
    
    this.activeCount++;
    return component;
  }
  
  /**
   * Return a component to the pool
   * @param {Object} component - Component instance
   */
  release(component) {
    const index = this.pool.indexOf(component);
    
    // Skip if not found or already inactive
    if (index === -1 || !component._active) {
      return;
    }
    
    // Call destruction callback
    if (component.onDestroy) {
      component.onDestroy();
    }
    
    // Mark as inactive
    component._active = false;
    
    // Swap with the last active component to maintain contiguous active region
    if (index < this.activeCount - 1) {
      [this.pool[index], this.pool[this.activeCount - 1]] = 
        [this.pool[this.activeCount - 1], this.pool[index]];
    }
    
    this.activeCount--;
  }
  
  /**
   * Get all active components
   * @returns {Array} Active components
   */
  getActive() {
    return this.pool.slice(0, this.activeCount);
  }
  
  /**
   * Get component by entity ID
   * @param {number} entityId - Entity ID
   * @returns {Object|null} Component or null if not found
   */
  getByEntity(entityId) {
    for (let i = 0; i < this.activeCount; i++) {
      if (this.pool[i].entityId === entityId) {
        return this.pool[i];
      }
    }
    return null;
  }
  
  /**
   * Get all components for an entity
   * @param {number} entityId - Entity ID
   * @returns {Array} Components for entity
   */
  getAllByEntity(entityId) {
    const result = [];
    for (let i = 0; i < this.activeCount; i++) {
      if (this.pool[i].entityId === entityId) {
        result.push(this.pool[i]);
      }
    }
    return result;
  }
  
  /**
   * Expand the pool
   * @param {number} size - New size
   * @private
   */
  _expandPool(size) {
    const currentSize = this.pool.length;
    for (let i = currentSize; i < size; i++) {
      this.pool.push(new this.componentClass());
    }
  }
  
  /**
   * Clear all components
   */
  clear() {
    for (let i = 0; i < this.activeCount; i++) {
      const component = this.pool[i];
      if (component.onDestroy) {
        component.onDestroy();
      }
      component._active = false;
    }
    this.activeCount = 0;
  }
}

/**
 * Entity Manager
 * Manages entity creation, destruction, and component attachment
 */
class EntityManager {
  /**
   * Create a new entity manager
   */
  constructor() {
    this.entities = new Map(); // Maps entity ID to entity data
    this.nextEntityId = 1;
    this.componentPools = new Map(); // Maps component name to pool
    this.entityComponents = new Map(); // Maps entity ID to array of component IDs
    this.tags = new Map(); // Maps tag to set of entity IDs
    this.componentTypes = new Set(); // Set of registered component types
  }
  
  /**
   * Register a component type
   * @param {Function} componentClass - Component constructor
   * @param {number} initialPoolSize - Initial pool size
   */
  registerComponent(componentClass, initialPoolSize = 100) {
    const name = componentClass.name;
    
    if (!this.componentPools.has(name)) {
      this.componentPools.set(name, new ComponentPool(componentClass, initialPoolSize));
      this.componentTypes.add(componentClass);
    }
  }
  
  /**
   * Create a new entity
   * @param {string} name - Entity name
   * @param {Array<string>} tags - Entity tags
   * @returns {number} Entity ID
   */
  createEntity(name = '', tags = []) {
    const entityId = this.nextEntityId++;
    
    this.entities.set(entityId, {
      id: entityId,
      name: name || `Entity_${entityId}`,
      active: true
    });
    
    this.entityComponents.set(entityId, []);
    
    // Add tags
    for (const tag of tags) {
      this.addTag(entityId, tag);
    }
    
    return entityId;
  }
  
  /**
   * Destroy an entity and all its components
   * @param {number} entityId - Entity ID
   * @returns {boolean} True if entity was destroyed
   */
  destroyEntity(entityId) {
    if (!this.entities.has(entityId)) {
      return false;
    }
    
    // Get all components
    const componentIds = this.entityComponents.get(entityId) || [];
    
    // Release all components
    for (const pool of this.componentPools.values()) {
      const components = pool.getAllByEntity(entityId);
      for (const component of components) {
        pool.release(component);
      }
    }
    
    // Remove from all tags
    for (const [tag, entities] of this.tags.entries()) {
      entities.delete(entityId);
    }
    
    // Remove entity
    this.entities.delete(entityId);
    this.entityComponents.delete(entityId);
    
    return true;
  }
  
  /**
   * Add a component to an entity
   * @param {number} entityId - Entity ID
   * @param {Function} componentType - Component type
   * @param {Object} componentData - Component initialization data
   * @returns {Object} Component instance
   */
  addComponent(entityId, componentType, componentData = {}) {
    // Check if entity exists
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }
    
    const componentName = componentType.name;
    
    // Register component type if not registered
    if (!this.componentPools.has(componentName)) {
      this.registerComponent(componentType);
    }
    
    // Get pool
    const pool = this.componentPools.get(componentName);
    
    // Create component
    const component = pool.create({
      ...componentData,
      entityId
    });
    
    // Add to entity components
    const components = this.entityComponents.get(entityId);
    components.push(component._id);
    
    return component;
  }
  
  /**
   * Remove a component from an entity
   * @param {number} entityId - Entity ID
   * @param {Function} componentType - Component type
   * @returns {boolean} True if component was removed
   */
  removeComponent(entityId, componentType) {
    // Check if entity exists
    if (!this.entities.has(entityId)) {
      return false;
    }
    
    const componentName = componentType.name;
    
    // Check if component type is registered
    if (!this.componentPools.has(componentName)) {
      return false;
    }
    
    // Get pool
    const pool = this.componentPools.get(componentName);
    
    // Find component
    const component = pool.getByEntity(entityId);
    if (!component) {
      return false;
    }
    
    // Release component
    pool.release(component);
    
    // Remove from entity components
    const components = this.entityComponents.get(entityId);
    const index = components.indexOf(component._id);
    if (index !== -1) {
      components.splice(index, 1);
    }
    
    return true;
  }
  
  /**
   * Get a component from an entity
   * @param {number} entityId - Entity ID
   * @param {Function} componentType - Component type
   * @returns {Object|null} Component instance or null if not found
   */
  getComponent(entityId, componentType) {
    // Check if entity exists
    if (!this.entities.has(entityId)) {
      return null;
    }
    
    const componentName = componentType.name;
    
    // Check if component type is registered
    if (!this.componentPools.has(componentName)) {
      return null;
    }
    
    // Get pool
    const pool = this.componentPools.get(componentName);
    
    // Find component
    return pool.getByEntity(entityId);
  }
  
  /**
   * Get all components from an entity
   * @param {number} entityId - Entity ID
   * @returns {Array} Component instances
   */
  getComponents(entityId) {
    // Check if entity exists
    if (!this.entities.has(entityId)) {
      return [];
    }
    
    const result = [];
    
    // Get all components from all pools
    for (const pool of this.componentPools.values()) {
      const components = pool.getAllByEntity(entityId);
      result.push(...components);
    }
    
    return result;
  }
  
  /**
   * Get all entities with a component
   * @param {Function} componentType - Component type
   * @returns {Array} Entity IDs
   */
  getEntitiesWithComponent(componentType) {
    const componentName = componentType.name;
    
    // Check if component type is registered
    if (!this.componentPools.has(componentName)) {
      return [];
    }
    
    // Get pool
    const pool = this.componentPools.get(componentName);
    
    // Get all active components
    const components = pool.getActive();
    
    // Get unique entity IDs
    const entityIds = new Set();
    for (const component of components) {
      if (component.entityId) {
        entityIds.add(component.entityId);
      }
    }
    
    return [...entityIds];
  }
  
  /**
   * Get all entities with a set of components
   * @param {Array<Function>} componentTypes - Component types
   * @returns {Array} Entity IDs
   */
  getEntitiesWithComponents(componentTypes) {
    if (componentTypes.length === 0) {
      return Array.from(this.entities.keys());
    }
    
    // Start with first component type
    const firstType = componentTypes[0];
    let entityIds = this.getEntitiesWithComponent(firstType);
    
    // Filter by remaining types
    for (let i = 1; i < componentTypes.length; i++) {
      const componentType = componentTypes[i];
      const requiredEntities = this.getEntitiesWithComponent(componentType);
      
      // Filter to only entities that have all required components
      entityIds = entityIds.filter(id => requiredEntities.includes(id));
    }
    
    return entityIds;
  }
  
  /**
   * Add a tag to an entity
   * @param {number} entityId - Entity ID
   * @param {string} tag - Tag name
   */
  addTag(entityId, tag) {
    // Check if entity exists
    if (!this.entities.has(entityId)) {
      return;
    }
    
    // Create tag set if it doesn't exist
    if (!this.tags.has(tag)) {
      this.tags.set(tag, new Set());
    }
    
    // Add entity to tag set
    this.tags.get(tag).add(entityId);
  }
  
  /**
   * Remove a tag from an entity
   * @param {number} entityId - Entity ID
   * @param {string} tag - Tag name
   */
  removeTag(entityId, tag) {
    // Check if tag exists
    if (!this.tags.has(tag)) {
      return;
    }
    
    // Remove entity from tag set
    this.tags.get(tag).delete(entityId);
  }
  
  /**
   * Get all entities with a tag
   * @param {string} tag - Tag name
   * @returns {Array} Entity IDs
   */
  getEntitiesWithTag(tag) {
    // Check if tag exists
    if (!this.tags.has(tag)) {
      return [];
    }
    
    // Return entities with tag
    return Array.from(this.tags.get(tag));
  }
  
  /**
   * Get entity by name
   * @param {string} name - Entity name
   * @returns {number|null} Entity ID or null if not found
   */
  getEntityByName(name) {
    for (const [id, entity] of this.entities.entries()) {
      if (entity.name === name) {
        return id;
      }
    }
    return null;
  }
  
  /**
   * Check if entity exists
   * @param {number} entityId - Entity ID
   * @returns {boolean} True if entity exists
   */
  entityExists(entityId) {
    return this.entities.has(entityId);
  }
  
  /**
   * Clear all entities and components
   */
  clear() {
    // Release all components
    for (const pool of this.componentPools.values()) {
      pool.clear();
    }
    
    // Clear collections
    this.entities.clear();
    this.entityComponents.clear();
    this.tags.clear();
  }
}

/**
 * System base class
 * Systems operate on entities with specific components
 */
class System {
  /**
   * Create a new system
   * @param {World} world - ECS world
   */
  constructor(world) {
    this.world = world;
    this.priority = 0;
    this.enabled = true;
    this.requiredComponents = [];
    this.excludedComponents = [];
  }
  
  /**
   * Initialize the system
   */
  initialize() {
    // Override in subclasses
  }
  
  /**
   * Get entities that match this system's requirements
   * @returns {Array} Entity IDs
   */
  getMatchingEntities() {
    let entities = this.world.entityManager.getEntitiesWithComponents(this.requiredComponents);
    
    // Filter out entities with excluded components
    if (this.excludedComponents.length > 0) {
      for (const excludedType of this.excludedComponents) {
        const excludedEntities = this.world.entityManager.getEntitiesWithComponent(excludedType);
        entities = entities.filter(id => !excludedEntities.includes(id));
      }
    }
    
    return entities;
  }
  
  /**
   * Update the system
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Override in subclasses
  }
  
  /**
   * Clean up the system
   */
  dispose() {
    // Override in subclasses
  }
}

/**
 * ECS World
 * Container for all entities, components, and systems
 */
class World {
  /**
   * Create a new ECS world
   */
  constructor() {
    this.entityManager = new EntityManager();
    this.systems = [];
    this.initialized = false;
    this.time = 0;
    this.deltaTime = 0;
  }
  
  /**
   * Initialize the world
   */
  initialize() {
    if (this.initialized) return;
    
    // Sort systems by priority
    this.systems.sort((a, b) => a.priority - b.priority);
    
    // Initialize systems
    for (const system of this.systems) {
      system.initialize();
    }
    
    this.initialized = true;
  }
  
  /**
   * Register a system
   * @param {System} system - System instance
   */
  registerSystem(system) {
    this.systems.push(system);
    
    // Sort if already initialized
    if (this.initialized) {
      this.systems.sort((a, b) => a.priority - b.priority);
    }
  }
  
  /**
   * Register a component type
   * @param {Function} componentType - Component constructor
   * @param {number} initialPoolSize - Initial pool size
   */
  registerComponent(componentType, initialPoolSize = 100) {
    this.entityManager.registerComponent(componentType, initialPoolSize);
  }
  
  /**
   * Update the world
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Update time tracking
    this.deltaTime = deltaTime;
    this.time += deltaTime;
    
    // Update systems
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(deltaTime);
      }
    }
  }
  
  /**
   * Create an entity
   * @param {string} name - Entity name
   * @param {Array<string>} tags - Entity tags
   * @returns {number} Entity ID
   */
  createEntity(name = '', tags = []) {
    return this.entityManager.createEntity(name, tags);
  }
  
  /**
   * Destroy an entity
   * @param {number} entityId - Entity ID
   */
  destroyEntity(entityId) {
    this.entityManager.destroyEntity(entityId);
  }
  
  /**
   * Add a component to an entity
   * @param {number} entityId - Entity ID
   * @param {Function} componentType - Component type
   * @param {Object} componentData - Component initialization data
   * @returns {Object} Component instance
   */
  addComponent(entityId, componentType, componentData = {}) {
    return this.entityManager.addComponent(entityId, componentType, componentData);
  }
  
  /**
   * Get a component from an entity
   * @param {number} entityId - Entity ID
   * @param {Function} componentType - Component type
   * @returns {Object|null} Component instance or null if not found
   */
  getComponent(entityId, componentType) {
    return this.entityManager.getComponent(entityId, componentType);
  }
  
  /**
   * Get all entities with a component
   * @param {Function} componentType - Component type
   * @returns {Array} Entity IDs
   */
  getEntitiesWithComponent(componentType) {
    return this.entityManager.getEntitiesWithComponent(componentType);
  }
  
  /**
   * Clear the world (remove all entities and components)
   */
  clear() {
    this.entityManager.clear();
  }
  
  /**
   * Dispose of the world
   */
  dispose() {
    // Dispose of systems
    for (const system of this.systems) {
      if (system.dispose) {
        system.dispose();
      }
    }
    
    // Clear entity manager
    this.entityManager.clear();
    
    this.systems = [];
    this.initialized = false;
  }
}

// Base Component class
class Component {
  constructor() {
    this._id = 0;           // Unique component ID
    this._active = false;   // Whether component is active
    this.entityId = 0;      // Entity this component belongs to
  }
  
  /**
   * Reset component to default state
   */
  reset() {
    // Override in subclasses
  }
  
  /**
   * Initialize the component
   */
  initialize() {
    // Override in subclasses
  }
  
  /**
   * Clean up the component
   */
  onDestroy() {
    // Override in subclasses
  }
}

// Example components

/**
 * Transform component
 */
class TransformComponent extends Component {
  constructor() {
    super();
    this.reset();
  }
  
  reset() {
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
    this.parent = null;
    this.children = [];
    this.worldMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    this.worldMatrixDirty = true;
  }
  
  // Calculate world matrix
  updateWorldMatrix(parentMatrix = null) {
    // Implementation would normally go here
    // ...
    
    this.worldMatrixDirty = false;
    
    // Update children
    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }
}

/**
 * Sprite Renderer component
 */
class SpriteRendererComponent extends Component {
  constructor() {
    super();
    this.reset();
  }
  
  reset() {
    this.sprite = null;
    this.width = 32;
    this.height = 32;
    this.color = { r: 1, g: 1, b: 1, a: 1 };
    this.layer = 0;
    this.visible = true;
    this.flip = { x: false, y: false };
    this.pivot = { x: 0.5, y: 0.5 };
    this.material = null;
    
    // Animation properties
    this.animations = {};
    this.currentAnimation = null;
    this.frame = 0;
    this.animationSpeed = 1;
    this.playing = false;
  }
  
  // Play animation
  play(name, loop = true) {
    if (this.animations[name]) {
      this.currentAnimation = name;
      this.frame = 0;
      this.playing = true;
      this.loop = loop;
    }
  }
  
  // Stop animation
  stop() {
    this.playing = false;
  }
}

/**
 * Rigidbody component
 */
class RigidbodyComponent extends Component {
  constructor() {
    super();
    this.reset();
  }
  
  reset() {
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.mass = 1;
    this.friction = 0.1;
    this.restitution = 0.5;
    this.gravityScale = 1;
    this.fixedRotation = false;
    this.isKinematic = false;
    this.isSleeping = false;
    this.collisionResponse = true;
  }
  
  // Apply force
  applyForce(x, y) {
    this.acceleration.x += x / this.mass;
    this.acceleration.y += y / this.mass;
  }
  
  // Apply impulse
  applyImpulse(x, y) {
    this.velocity.x += x / this.mass;
    this.velocity.y += y / this.mass;
  }
}

/**
 * Collider component
 */
class ColliderComponent extends Component {
  constructor() {
    super();
    this.reset();
  }
  
  reset() {
    this.type = 'box'; // box, circle, polygon
    this.width = 32;
    this.height = 32;
    this.radius = 16;
    this.offset = { x: 0, y: 0 };
    this.isTrigger = false;
    this.isSensor = false;
    this.filter = {
      category: 0x0001,
      mask: 0xFFFF,
      group: 0
    };
  }
  
  // Check collision with another collider
  checkCollision(other) {
    // Implementation would normally go here
    // ...
    return false;
  }
}

// Example systems

/**
 * Physics System
 */
class PhysicsSystem extends System {
  constructor(world) {
    super(world);
    this.priority = 10;
    this.gravity = { x: 0, y: 9.8 };
    this.requiredComponents = [TransformComponent, RigidbodyComponent];
  }
  
  update(deltaTime) {
    const entities = this.getMatchingEntities();
    
    for (const entityId of entities) {
      const transform = this.world.getComponent(entityId, TransformComponent);
      const rigidbody = this.world.getComponent(entityId, RigidbodyComponent);
      
      if (!transform || !rigidbody || rigidbody.isKinematic) continue;
      
      // Apply gravity
      rigidbody.acceleration.y += this.gravity.y * rigidbody.gravityScale;
      
      // Update velocity
      rigidbody.velocity.x += rigidbody.acceleration.x * deltaTime;
      rigidbody.velocity.y += rigidbody.acceleration.y * deltaTime;
      
      // Apply friction
      rigidbody.velocity.x *= (1 - rigidbody.friction * deltaTime);
      rigidbody.velocity.y *= (1 - rigidbody.friction * deltaTime);
      
      // Update position
      transform.position.x += rigidbody.velocity.x * deltaTime;
      transform.position.y += rigidbody.velocity.y * deltaTime;
      
      // Reset acceleration
      rigidbody.acceleration.x = 0;
      rigidbody.acceleration.y = 0;
      
      // Mark transform as dirty
      transform.worldMatrixDirty = true;
    }
  }
}

/**
 * Collision System
 */
class CollisionSystem extends System {
  constructor(world) {
    super(world);
    this.priority = 20;
    this.requiredComponents = [TransformComponent, ColliderComponent];
    this.collisions = new Map(); // Maps entity pairs to collision state
  }
  
  update(deltaTime) {
    const entities = this.getMatchingEntities();
    const newCollisions = new Map();
    
    // Check all possible collisions
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        
        const transformA = this.world.getComponent(entityA, TransformComponent);
        const colliderA = this.world.getComponent(entityA, ColliderComponent);
        
        const transformB = this.world.getComponent(entityB, TransformComponent);
        const colliderB = this.world.getComponent(entityB, ColliderComponent);
        
        // Update transforms if dirty
        if (transformA.worldMatrixDirty) {
          transformA.updateWorldMatrix();
        }
        
        if (transformB.worldMatrixDirty) {
          transformB.updateWorldMatrix();
        }
        
        // Check collision
        const colliding = this._checkCollision(transformA, colliderA, transformB, colliderB);
        
        if (colliding) {
          // Generate collision pair key
          const pairKey = `${Math.min(entityA, entityB)}_${Math.max(entityA, entityB)}`;
          
          // Store collision state
          newCollisions.set(pairKey, {
            entityA,
            entityB,
            time: this.world.time
          });
          
          // Check if this is a new collision
          if (!this.collisions.has(pairKey)) {
            // Trigger collision enter event
            this._triggerCollisionEnter(entityA, entityB);
          }
        }
      }
    }
    
    // Check for collision exits
    for (const [pairKey, collision] of this.collisions.entries()) {
      if (!newCollisions.has(pairKey)) {
        // Trigger collision exit event
        this._triggerCollisionExit(collision.entityA, collision.entityB);
      }
    }
    
    // Update collision map
    this.collisions = newCollisions;
  }
  
  /**
   * Check collision between two entities
   * @private
   */
  _checkCollision(transformA, colliderA, transformB, colliderB) {
    // Simple AABB collision check for demonstration
    const aLeft = transformA.position.x - colliderA.width / 2 + colliderA.offset.x;
    const aRight = transformA.position.x + colliderA.width / 2 + colliderA.offset.x;
    const aTop = transformA.position.y - colliderA.height / 2 + colliderA.offset.y;
    const aBottom = transformA.position.y + colliderA.height / 2 + colliderA.offset.y;
    
    const bLeft = transformB.position.x - colliderB.width / 2 + colliderB.offset.x;
    const bRight = transformB.position.x + colliderB.width / 2 + colliderB.offset.x;
    const bTop = transformB.position.y - colliderB.height / 2 + colliderB.offset.y;
    const bBottom = transformB.position.y + colliderB.height / 2 + colliderB.offset.y;
    
    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
  }
  
  /**
   * Trigger collision enter event
   * @private
   */
  _triggerCollisionEnter(entityA, entityB) {
    // Implementation would normally go here to dispatch events
    // ...
  }
  
  /**
   * Trigger collision exit event
   * @private
   */
  _triggerCollisionExit(entityA, entityB) {
    // Implementation would normally go here to dispatch events
    // ...
  }
}

/**
 * Rendering System
 */
class RenderingSystem extends System {
  constructor(world) {
    super(world);
    this.priority = 100; // Render last
    this.requiredComponents = [TransformComponent, SpriteRendererComponent];
    this.renderer = null;
  }
  
  setRenderer(renderer) {
    this.renderer = renderer;
  }
  
  update(deltaTime) {
    if (!this.renderer) return;
    
    const entities = this.getMatchingEntities();
    
    // Sort entities by layer
    entities.sort((a, b) => {
      const rendererA = this.world.getComponent(a, SpriteRendererComponent);
      const rendererB = this.world.getComponent(b, SpriteRendererComponent);
      return rendererA.layer - rendererB.layer;
    });
    
    // Start batch rendering
    this.renderer.beginBatch();
    
    // Render each entity
    for (const entityId of entities) {
      const transform = this.world.getComponent(entityId, TransformComponent);
      const renderer = this.world.getComponent(entityId, SpriteRendererComponent);
      
      if (!transform || !renderer || !renderer.visible) continue;
      
      // Update transform if dirty
      if (transform.worldMatrixDirty) {
        transform.updateWorldMatrix();
      }
      
      // Update animation
      if (renderer.playing && renderer.currentAnimation) {
        const animation = renderer.animations[renderer.currentAnimation];
        if (animation) {
          renderer.frame += animation.speed * renderer.animationSpeed * deltaTime;
          
          if (renderer.frame >= animation.frames.length) {
            if (renderer.loop) {
              renderer.frame %= animation.frames.length;
            } else {
              renderer.frame = animation.frames.length - 1;
              renderer.playing = false;
            }
          }
        }
      }
      
      // Draw sprite
      this.renderer.drawSprite(
        renderer.sprite,
        transform.position.x,
        transform.position.y,
        renderer.width * transform.scale.x,
        renderer.height * transform.scale.y,
        transform.rotation.z,
        renderer.color,
        {
          pivotX: renderer.pivot.x,
          pivotY: renderer.pivot.y,
          flipX: renderer.flip.x,
          flipY: renderer.flip.y,
          frame: Math.floor(renderer.frame)
        }
      );
    }
    
    // End batch rendering
    this.renderer.flushBatch();
  }
}

/**
 * Animation System
 */
class AnimationSystem extends System {
  constructor(world) {
    super(world);
    this.priority = 50;
    this.requiredComponents = [SpriteRendererComponent];
  }
  
  update(deltaTime) {
    const entities = this.getMatchingEntities();
    
    for (const entityId of entities) {
      const renderer = this.world.getComponent(entityId, SpriteRendererComponent);
      
      if (!renderer || !renderer.playing || !renderer.currentAnimation) continue;
      
      const animation = renderer.animations[renderer.currentAnimation];
      if (!animation) continue;
      
      // Update frame
      renderer.frame += animation.speed * renderer.animationSpeed * deltaTime;
      
      // Handle animation looping or completion
      if (renderer.frame >= animation.frames.length) {
        if (renderer.loop) {
          renderer.frame %= animation.frames.length;
        } else {
          renderer.frame = animation.frames.length - 1;
          renderer.playing = false;
          
          // Trigger animation complete event
          // ...
        }
      }
    }
  }
}

export { 
  World, 
  System, 
  Component, 
  TransformComponent, 
  SpriteRendererComponent, 
  RigidbodyComponent, 
  ColliderComponent,
  PhysicsSystem,
  CollisionSystem,
  RenderingSystem,
  AnimationSystem
};
