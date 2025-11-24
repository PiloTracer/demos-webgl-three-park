# Project Architecture - Modular Structure

## Overview

The project has been refactored from a monolithic 2500+ line `main.js` file into a **modular, scalable, and maintainable** architecture following industry best practices.

## Directory Structure

```
app/
├── index.html                 # Entry HTML file
├── main.js                    # Application entry point (orchestrator)
├── src/
│   ├── config/
│   │   └── constants.js      # ✅ All game constants and configuration
│   │
│   ├── core/                 # Core Three.js setup
│   │   ├── scene.js          # ✅ Scene initialization and management
│   │   ├── renderer.js       # ✅ WebGL renderer setup
│   │   ├── camera.js         # ✅ Camera configuration
│   │   └── controls.js       # ✅ Pointer lock controls and input state
│   │
│   ├── environment/          # Environmental elements
│   │   ├── terrain.js        # TODO: Terrain generation with hills
│   │   ├── lighting.js       # TODO: Sun, moon, ambient lights
│   │   └── weather.js        # TODO: Fog, sky, atmosphere
│   │
│   ├── objects/              # Static world objects
│   │   ├── trees.js          # TODO: Tree creation and placement
│   │   ├── ponds.js          # TODO: Pond creation with water
│   │   ├── buildings.js      # TODO: Multi-story buildings with interiors
│   │   ├── platforms.js      # TODO: Elevated terraces and outcrops
│   │   ├── decorations.js    # TODO: Benches, lamps, boulders, etc.
│   │   ├── boardwalk.js      # TODO: Wooden boardwalk path
│   │   └── bridge.js         # TODO: Bridge structure
│   │
│   ├── entities/             # Animated entities
│   │   ├── birds.js          # TODO: Birds with flight paths
│   │   ├── fish.js           # TODO: Fish in ponds
│   │   ├── butterflies.js    # TODO: Butterfly animations
│   │   └── dragonflies.js    # TODO: Dragonfly animations
│   │
│   ├── game/                 # Game logic
│   │   ├── state.js          # ✅ Centralized game state management
│   │   ├── collectibles.js   # TODO: Gems, coins, treasure
│   │   ├── objectives.js     # TODO: Quest system
│   │   └── score.js          # TODO: Score tracking
│   │
│   ├── physics/              # Physics and collision
│   │   ├── collision.js      # ✅ Collision detection system
│   │   ├── movement.js       # TODO: Player movement and physics
│   │   └── water.js          # TODO: Water depth and resistance
│   │
│   ├── ui/                   # User interface
│   │   ├── hud.js            # TODO: Stats, FPS, position display
│   │   ├── notifications.js  # TODO: Popup notifications
│   │   └── gamePanel.js      # TODO: Score and objectives panel
│   │
│   ├── utils/                # Utility functions
│   │   ├── textures.js       # ✅ Procedural texture generation
│   │   └── helpers.js        # TODO: Common helper functions
│   │
│   └── systems/              # Game systems
│       ├── animationSystem.js # TODO: Centralized animation loop
│       ├── inputSystem.js     # TODO: Keyboard/mouse input handling
│       └── audioSystem.js     # TODO: Sound effects
```

## Key Principles

### 1. **Separation of Concerns**
Each module has a single, well-defined responsibility:
- `config/` - Configuration only
- `core/` - Three.js initialization only
- `environment/` - World building only
- `game/` - Game logic only
- `physics/` - Physics calculations only

### 2. **Encapsulation**
- Each module exports only what's necessary
- Internal state is private
- Clear public API through exports

### 3. **Dependency Management**
- Modules import only what they need
- No circular dependencies
- Clear dependency graph

### 4. **Testability**
- Each module can be tested independently
- Pure functions where possible
- State management centralized

### 5. **Scalability**
- Easy to add new features (new modules)
- Easy to modify existing features (isolated modules)
- Easy to remove features (delete module)

## Module Patterns

### Configuration Module (`config/constants.js`)
```javascript
export const PLAYER = {
    WALK_SPEED: 50.0,
    // ... other constants
};

// Import: import { PLAYER } from '../config/constants.js';
```

### Core Module Pattern (`core/scene.js`)
```javascript
let scene = null;

export function initScene() {
    scene = new THREE.Scene();
    return scene;
}

export function getScene() {
    return scene;
}
```

### Game State Module (`game/state.js`)
```javascript
const gameState = { /* ... */ };

export function getGameState() {
    return gameState;
}

export function addScore(points) {
    gameState.score += points;
    return gameState.score;
}
```

### Physics Module (`physics/collision.js`)
```javascript
let collidableObjects = [];

export function registerCollidable(object) {
    collidableObjects.push(object);
}

export function checkCollision(x, z, y) {
    // Collision logic
}
```

## Entry Point Pattern (`main.js`)

The new `main.js` should be a **thin orchestrator** that:
1. Imports all modules
2. Initializes systems in order
3. Sets up the animation loop
4. Handles high-level coordination

```javascript
// Example structure
import { initScene } from './src/core/scene.js';
import { initRenderer } from './src/core/renderer.js';
import { initCamera } from './src/core/camera.js';
// ... more imports

async function init() {
    // 1. Initialize core
    const scene = initScene();
    const camera = initCamera();
    const renderer = initRenderer();

    // 2. Initialize environment
    await createTerrain();
    await initLighting();

    // 3. Create objects
    await createTrees();
    await createBuildings();

    // 4. Initialize game
    initGameState();

    // 5. Start animation loop
    animate();
}

function animate() {
    // Update all systems
    updatePhysics();
    updateAnimations();
    updateUI();
    render();
}

init();
```

## Benefits of This Architecture

### ✅ **Maintainability**
- Find code easily (know which file to look in)
- Modify code safely (changes isolated to modules)
- Debug efficiently (smaller, focused modules)

### ✅ **Scalability**
- Add new features without touching existing code
- Grow project to hundreds of files
- Team can work on different modules simultaneously

### ✅ **Testability**
- Unit test individual modules
- Mock dependencies easily
- Test coverage per module

### ✅ **Reusability**
- Export modules for use in other projects
- Share utility functions across projects
- Create library of common modules

### ✅ **Performance**
- Tree-shaking removes unused code
- Lazy loading of modules
- Better code splitting

### ✅ **Developer Experience**
- IntelliSense/autocomplete works better
- Clear module boundaries
- Self-documenting structure

## Migration Guide

### How to Complete the Refactoring

1. **One module at a time** - Don't try to refactor everything at once
2. **Test after each module** - Ensure nothing breaks
3. **Start with utilities** - Move texture functions first
4. **Then core systems** - Scene, camera, renderer
5. **Then game objects** - Trees, buildings, etc.
6. **Finally game logic** - Collectibles, objectives, etc.

### Example: Moving Tree Creation

**Before** (in main.js):
```javascript
function createTrees() {
    // 100 lines of tree code
}
```

**After** (in src/objects/trees.js):
```javascript
import * as THREE from 'three';
import { createBarkTexture } from '../utils/textures.js';

export function createTrees(scene, count) {
    // Tree creation logic
    const trees = [];
    for (let i = 0; i < count; i++) {
        const tree = createTree();
        scene.add(tree);
        trees.push(tree);
    }
    return trees;
}

function createTree() {
    // Single tree creation
}
```

**In main.js**:
```javascript
import { createTrees } from './src/objects/trees.js';

const trees = createTrees(scene, 80);
```

## Next Steps

1. ✅ Create folder structure
2. ✅ Create `config/constants.js`
3. ✅ Create core modules (`scene`, `renderer`, `camera`, `controls`)
4. ✅ Create `utils/textures.js`
5. ✅ Create `game/state.js`
6. ✅ Create `physics/collision.js`
7. TODO: Create `environment/` modules
8. TODO: Create `objects/` modules
9. TODO: Create `entities/` modules
10. TODO: Create `systems/` modules
11. TODO: Refactor main.js as orchestrator
12. TODO: Test and debug
13. TODO: Update documentation

## Resources

- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Three.js Best Practices](https://threejs.org/docs/#manual/en/introduction/How-to-use-modules)
- [JavaScript Module Patterns](https://www.patterns.dev/posts/module-pattern/)

---

**Status**: 🚧 In Progress - Core modules created, objects modules TODO
