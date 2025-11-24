# Park Adventure Game - Gameplay Guide

Welcome to the Park Adventure Game! This guide will help you understand the game mechanics and how to win.

## 🎯 Objective

Complete all three objectives to win the game:

1. **Collect All Gems** - Find and collect all 10 glowing cyan gems scattered throughout the park
2. **Find the Treasure** - Discover the hidden treasure chest near the gazebo (500 points!)
3. **Discover All Ponds** - Visit all three ponds in the park

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W** | Move forward |
| **S** | Move backward |
| **A** | Strafe left |
| **D** | Strafe right |
| **Mouse** | Look around |
| **Shift** (hold) | Run |
| **Space** | Jump |
| **N** | Toggle Day/Night cycle |
| **F** | Toggle Fog |
| **ESC** | Unlock mouse pointer |
| **Click** | Lock mouse pointer (required to play) |

## 💎 Collectibles

### Gems (💎)
- **Count**: 10 scattered throughout the park
- **Value**: 100 points each
- **Appearance**: Glowing cyan octahedrons
- **Animation**: Rotating and bobbing up/down
- **Total Possible**: 1,000 points

### Coins (🪙)
- **Count**: 5 scattered throughout the park
- **Value**: 10 points each
- **Appearance**: Golden discs
- **Animation**: Rotating and bobbing up/down
- **Total Possible**: 50 points

### Treasure Chest (🎁)
- **Count**: 1 (hidden near gazebo)
- **Value**: 500 points
- **Appearance**: Brown wooden chest with gold glow
- **Location**: Inside or very close to the gazebo structure at coordinates (-70, -30)
- **Required**: Must find to complete Objective #2

## 🗺️ Map Features

### Key Locations

1. **Starting Point** (0, 0)
   - You begin at the center of the park

2. **Gazebo** (-70, -30)
   - Octagonal structure with pillars
   - Contains the treasure chest
   - Good landmark for navigation

3. **Three Ponds**
   - **Pond 1**: Northwest area (-60, 40)
   - **Pond 2**: Southeast area (50, -50)
   - **Pond 3**: Southwest area (-30, -60)
   - Look for water, lily pads, and reeds

4. **Decorative Bridge** (50, -45)
   - Wooden bridge near Pond 2

5. **Benches** (5 locations)
   - Scattered along the boardwalk
   - Good resting points visually

6. **Lamp Posts** (5 locations)
   - Light up at night
   - Help with navigation in darkness

## 🚧 Collision Detection

The game features realistic collision detection:

### Collidable Objects
- **Trees** (80+) - Large trunks you cannot pass through
- **Boulders** (larger ones only) - Cannot walk through rocks
- **Benches** (5) - Solid objects
- **Gazebo** (1) - Large structure with collision radius
- **Signs** (3) - Small collision zones
- **Map Boundaries** - Cannot leave the park (±240 units from center)

### Non-Collidable
- Flowers, small mushrooms, bushes (walk through them)
- Birds, butterflies, dragonflies (fly above/around you)
- Reeds and grass
- Water (you can walk through ponds)

## 🎵 Audio Feedback

The game uses Web Audio API for sound effects:

- **Gem Collection**: High-pitched tone (800 Hz)
- **Coin Collection**: Mid-pitched tone (600 Hz)
- **Treasure Found**: Very high-pitched tone (1000 Hz) - plays 3 times!

## 📊 Scoring System

### Maximum Possible Score: 1,550 points

- 10 Gems × 100 = 1,000 points
- 5 Coins × 10 = 50 points
- 1 Treasure × 500 = 500 points
- **Total**: 1,550 points

### Score Display
- Real-time score updates in top-right panel
- Gem counter shows progress (e.g., "7/10")
- Objective list updates with checkmarks as you complete them

## 🏆 Winning the Game

To win, you must:
1. ✓ Collect all 10 gems (Objective #1 complete)
2. ✓ Find the treasure chest (Objective #2 complete)
3. ✓ Discover all 3 ponds (Objective #3 complete)

When all objectives are complete, a victory screen appears showing:
- 🎉 "YOU WIN!" message
- Final score
- Time elapsed
- Gems collected count
- "Play Again" button

## 💡 Tips & Strategies

### Navigation Tips
1. **Use landmarks**: Gazebo, bridge, and lamp posts are easy to spot
2. **Day vs Night**: Toggle 'N' key if you need better visibility
3. **Sprint**: Hold Shift to cover ground faster when exploring
4. **Jump**: Use Space to get on elevated areas or see over obstacles
5. **Check map bounds**: The park is ±240 units from center - don't waste time at edges

### Collection Strategy
1. **Start near spawn**: Several gems are close to starting position (0,0)
2. **Follow boardwalk**: Collectibles are often near the winding path
3. **Check all ponds**: Gems and coins are scattered around water areas
4. **Visit gazebo**: Essential for treasure, may have nearby gems
5. **Use audio cues**: Listen for collection sounds to confirm pickups

### Efficient Routes
1. **Clockwise sweep**: Start at (0,0), go north to Pond 1, east, south to Pond 2, west to Pond 3, then gazebo
2. **Gazebo first**: Head straight to (-70, -30) to get treasure early
3. **Pond hopping**: Visit all three ponds first to complete Objective #3 quickly

## 🐛 Known Behaviors

- **Collectibles animate**: They rotate, bob, and pulse - this is normal!
- **Collection radius**: You must be within 2 units to collect an item
- **Pond discovery radius**: You must be within 20 units of pond center
- **Collision smoothing**: If you hit a tree, you'll stop - back up and go around
- **Jump mechanics**: Simple jump with gravity, use for exploration or fun

## 📱 UI Elements

### Left Panel (Info)
- Controls reference
- Point values for collectibles
- Can be hidden with "Hide Info" button

### Right Top Panel (Game Status)
- Current score
- Gems collected counter
- Objectives list with completion status

### Right Bottom Panel (Stats)
- FPS counter
- Your position (X, Y, Z coordinates)
- Time of day (Day/Night)

### Center
- Crosshair for aiming/looking
- Notification messages appear here when:
  - Collecting items
  - Discovering ponds
  - Changing day/night
  - Toggling fog

## 🎨 Visual Cues

- **Gems**: Bright cyan glow, easy to spot from distance
- **Coins**: Golden shine, visible but smaller
- **Treasure**: Gold aura emanating from chest
- **Ponds**: Blue water with lily pads
- **Gazebo**: White pillars with brown roof
- **Lamp posts**: Black poles, glow yellow at night

## ⚙️ Technical Details

- **Player radius**: 1.0 units (collision sphere around you)
- **Player height**: 2.0 units
- **Walk speed**: 50 units/second
- **Run speed**: 100 units/second (2x faster)
- **Jump velocity**: 20 units/second
- **Map size**: 500×500 units (playable area: ±240 units)
- **Collectible detection**: 2.0 unit radius
- **Pond discovery**: 20.0 unit radius

## 🎯 Speedrun Potential

For those looking for a challenge:
- **Casual completion**: 5-10 minutes
- **Fast completion**: 2-3 minutes (if you know gem locations)
- **Speedrun record**: Try to beat 90 seconds!

## 🔄 Replay Value

- Try collecting items in different orders
- Explore every corner of the park
- Test collision boundaries
- Find optimal speedrun routes
- Experience day vs night atmospheres
- Challenge friends for best time/score

## 🎮 Game Over

After winning, you can:
- View your final stats
- Click "Play Again" to restart
- Try to beat your previous time
- Aim for maximum score (1,550 points)

---

**Good luck, explorer!** 🌳🎮

Remember: The park is beautiful, but there's treasure to find and objectives to complete. Get out there and start collecting!
