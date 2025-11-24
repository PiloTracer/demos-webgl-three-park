# Three.js Park Adventure Game

A professional WebGL + Three.js interactive 3D park exploration game featuring realistic terrain, 80+ trees, animated ponds, winding boardwalks, a decorative gazebo, and abundant wildlife including birds, butterflies, and dragonflies. Explore the park with realistic collision detection, collect gems and coins, find hidden treasure, and complete objectives to win! Experience dynamic day/night cycles, atmospheric lighting, and immersive first-person gameplay through a beautifully crafted natural environment.

## Features

### 3D Environment
- **Realistic Terrain**: Procedurally generated grass terrain with height variations
- **3D Trees**: 80+ trees with realistic bark textures and multi-layered foliage
- **Water Ponds**: 3 animated ponds with lily pads, rocks, reeds, and water reflections
- **Boardwalk Path**: Winding wooden boardwalk throughout the park
- **Elevated Stone Terraces** (7): Multi-level platforms at varying heights (2.5-5 units high)
- **Natural Rock Outcrops** (5): Climbable rock formations for vertical exploration
- **Stone Steps & Ramps** (3): Stairs and ramps connecting different elevations
- **Decorative Bridge**: Wooden bridge with detailed railings and support beams
- **Gazebo Structure**: Beautiful octagonal gazebo with pillars and roof
- **Park Benches**: 5 wooden benches strategically placed for resting
- **Lamp Posts**: 5 street lamps with automatic night lighting
- **Park Signs**: Information boards marking different areas
- **Natural Elements**:
  - 15 animated birds with realistic flight patterns and wing animations
  - 12 butterflies with colorful wings and flight patterns
  - 10 dragonflies hovering near ponds
  - 15 moving clouds in the sky
  - 25 decorative boulders and rocks
  - 50 flowers in various colors
  - 30 bushes scattered throughout
  - 8 tree stumps with detailed bark texture
  - 20 mushrooms with varied cap colors
  - Reeds growing around pond edges

### Interactive Features
- **First-Person Controls**: WASD movement with mouse look
- **Walking/Running**: Hold Shift to run, Space to jump
- **Day/Night Cycle**: Press N to toggle between day and night
- **Dynamic Fog**: Press F to toggle fog effects
- **Real-time Shadows**: Advanced shadow mapping for realistic lighting
- **Performance Stats**: FPS counter and position tracking

### Game Mechanics
- **Collision Detection**: Realistic physics - can't walk through trees, benches, gazebo, terraces, or other solid objects
- **Vertical Exploration**: Jump and climb elevated stone platforms to reach high-altitude collectibles
- **Platforming Gameplay**: Use stairs, ramps, and natural rock formations to access different elevations
- **Map Boundaries**: Park boundaries prevent you from leaving the playable area
- **Collectibles System**:
  - 💎 **Gems** (10 total): 100 points each - glowing cyan octahedrons
    - 5 at ground level
    - 5 on elevated platforms (requires platforming skills!)
  - 🪙 **Coins** (5 total): 10 points each - golden discs
    - 3 at ground level
    - 2 on elevated terraces
  - 🎁 **Treasure Chest**: 500 points - hidden near the gazebo
- **Objectives**:
  1. Collect all gems scattered throughout the park
  2. Find the hidden treasure near the gazebo
  3. Discover all three ponds in the park
- **Win Condition**: Complete all three objectives to win the game
- **Animated Collectibles**: All items rotate, bob, and pulse to attract attention
- **Sound Effects**: Audio feedback when collecting items (Web Audio API)
- **Score System**: Real-time score tracking with visual feedback
- **Discovery System**: Ponds are marked as "discovered" when you get close

### Visual Effects
- Procedurally generated textures (grass, wood, bark)
- Real-time shadows with PCF soft shadow mapping
- ACES Filmic tone mapping for realistic colors
- Animated water surfaces with gentle waves
- Dynamic lighting (sun and moon)
- Atmospheric fog with day/night variations
- Lamp post lights that activate at night
- Animated wildlife (birds, butterflies, dragonflies)
- Drifting clouds across the sky
- Realistic wing flapping animations
- Smooth transitions between day and night

## Quick Start

### Using Docker (Recommended)

1. Start the application:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. Open your browser and navigate to:
```
http://localhost:6968
```

3. Stop the application:
```bash
docker-compose -f docker-compose.dev.yml down
```

### Local Development

Serve the `app` folder using any web server:

```bash
cd app
python -m http.server 6968
```

Or use Node.js:
```bash
npx http-server app -p 6968
```

## Controls

| Key | Action |
|-----|--------|
| **W A S D** | Move forward, left, backward, right |
| **Mouse** | Look around |
| **Shift** | Run (hold) |
| **Space** | Jump (keep holding WASD to move in air!) |
| **N** | Toggle day/night cycle |
| **F** | Toggle fog |
| **Click** | Lock pointer to play |
| **ESC** | Unlock pointer |

## How to Play

1. **Start the game** - The game begins automatically when loaded
2. **Click on the screen** to lock your mouse pointer
3. **Explore the park** using WASD to move and mouse to look around
4. **Jump onto platforms** - Press Space and **KEEP HOLDING WASD** to move while in air!
5. **Collect items**:
   - 💎 Glowing cyan gems (100 pts each) - 10 total (5 ground, 5 elevated!)
   - 🪙 Golden coins (10 pts each) - 5 total (3 ground, 2 elevated!)
   - 🎁 Treasure chest (500 pts) - Hidden near gazebo
6. **Complete objectives**:
   - Collect all gems (requires climbing platforms!)
   - Find the treasure
   - Discover all three ponds
7. **Win the game** when all objectives are completed!

**Pro Tip**: Sprint + Jump (Shift + Space + W) to reach distant platforms!

For detailed gameplay instructions, see [GAME.md](GAME.md)

## Project Structure

```
demos-webgl-threejs-park/
├── docker-compose.dev.yml    # Docker compose configuration
├── README.md                 # This file
├── FEATURES.md              # Detailed list of all 3D elements
├── GAME.md                  # Complete gameplay guide
└── app/
    ├── Dockerfile           # Container configuration
    ├── package.json         # Project metadata
    ├── index.html          # Main HTML file with game UI
    └── main.js             # Three.js game engine and logic
```

## Technical Details

### Technologies
- **Three.js r160**: 3D graphics library
- **WebGL**: Hardware-accelerated 3D rendering
- **Pointer Lock API**: First-person camera controls
- **Docker**: Containerized deployment
- **Nginx**: Web server

### Performance
- 60 FPS target
- Shadow mapping: 2048x2048 resolution
- Optimized geometry and textures
- Efficient animation loops
- Collision detection optimized with spatial checks
- 164+ animated 3D elements running smoothly

### Rendering Features
- PBR materials (Physically Based Rendering)
- Real-time shadows
- Dynamic lighting
- Post-processing effects
- Anti-aliasing
- Emissive materials for collectibles
- Procedural animations

### Game Systems
- **Collision Detection**: Circle-circle collision for player vs objects
- **Physics**: Simple gravity and jump mechanics
- **Item Collection**: Proximity-based pickup system (2-unit radius)
- **Score Tracking**: Real-time score updates
- **Quest System**: 3 objectives with completion tracking
- **Audio System**: Web Audio API for sound effects
- **Animation System**: Rotating, bobbing, and scaling collectibles
- **Discovery System**: Pond proximity detection (20-unit radius)
- **Boundary System**: Map limits at ±240 units

## Browser Requirements

- Modern browser with WebGL support
- Recommended: Chrome, Firefox, Edge, Safari (latest versions)
- Hardware acceleration enabled

## Customization

You can customize various aspects by editing `main.js`:

- **Tree count**: Change `treeCount` variable (line 309)
- **Bird count**: Change `birdCount` variable (line 490)
- **Butterfly count**: Change `butterflyCount` variable (line 788)
- **Cloud count**: Change `cloudCount` variable (line 916)
- **Boulder count**: Adjust loop in `createBoulders()` function (line 753)
- **Terrain size**: Modify ground geometry dimensions (line 123)
- **Movement speed**: Adjust `WALK_SPEED` and `RUN_SPEED` constants
- **Colors**: Modify material colors throughout the code
- **Bench positions**: Edit `benchPositions` array (line 625)
- **Lamp positions**: Edit `lampPositions` array (line 688)
- **Pond positions**: Edit `pondPositions` array (line 406)

## License

This is a demo project for educational and demonstration purposes.

## Credits

Built with Three.js - https://threejs.org
