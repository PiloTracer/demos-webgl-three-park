import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class HouseManager {
  constructor(game, world) {
    this.game = game;
    this.world = world;
    this.scene = game.scene;
    this.physicsWorld = game.physicsWorld;
    this.doors = [];
    
    // Create random houses
    this.createHouses(5);
  }

  createHouses(count) {
    for (let i = 0; i < count; i++) {
        // Find flat-ish spot (or flatten it)
        const x = (Math.random() - 0.5) * 160;
        const z = (Math.random() - 0.5) * 160;
        
        // Check if underwater
        const h = this.world.getTerrainHeightAt(x, z);
        if (h < 0.5) continue; // Skip water/beaches

        // Flatten terrain logic is tricky post-creation. 
        // We will just place it on stilts/foundation if needed or embed it.
        // Or assume the builder flattened it (we can't easily modify heightfield after physics init without reloading)
        // Let's place it at ground height and add a foundation block.

        const floors = Math.random() > 0.5 ? 2 : 1;
        this.buildHouse(x, h, z, floors);
    }
  }

  buildHouse(x, y, z, floors) {
    const width = 6;
    const depth = 6;
    const heightPerFloor = 3;
    const wallThickness = 0.2;

    const houseGroup = new THREE.Group();
    houseGroup.position.set(x, y, z);
    
    // Foundation
    const foundationGeo = new THREE.BoxGeometry(width + 1, 1, depth + 1);
    const foundationMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const foundation = new THREE.Mesh(foundationGeo, foundationMat);
    foundation.position.y = -0.5;
    houseGroup.add(foundation);
    
    // Physics for foundation
    this.addBoxPhysics(x, y - 0.5, z, width + 1, 1, depth + 1);

    // Create Treasure in the house
    this.spawnTreasure(x, y + 1, z);

    for (let f = 0; f < floors; f++) {
        const floorY = f * heightPerFloor;
        
        // Floor
        if (f > 0) {
            const floorGeo = new THREE.BoxGeometry(width, 0.2, depth);
            const floor = new THREE.Mesh(floorGeo, foundationMat);
            floor.position.y = floorY;
            houseGroup.add(floor);
            this.addBoxPhysics(x, y + floorY, z, width, 0.2, depth);
        }

        // Walls
        // Front Wall (with Door and Window)
        // We construct walls from pieces to allow holes
        
        // Front Wall (Z+)
        // Left Panel
        this.buildWall(houseGroup, x, y + floorY, z, -width/2 + 1, 0, width/2, 2, heightPerFloor, wallThickness, 'front_left');
        // Right Panel
        this.buildWall(houseGroup, x, y + floorY, z, width/2 - 1, 0, width/2, 2, heightPerFloor, wallThickness, 'front_right');
        // Top Lintel (Door)
        this.buildWall(houseGroup, x, y + floorY, z, 0, 2.5, width/2, 2, 0.5, wallThickness, 'front_top');

        // Back Wall (Z-) (Full with window)
        // Bottom
        this.buildWall(houseGroup, x, y + floorY, z, 0, 0.5, -width/2, width, 1, wallThickness, 'back_bottom');
        // Top
        this.buildWall(houseGroup, x, y + floorY, z, 0, 2.5, -width/2, width, 0.5, wallThickness, 'back_top');
        // Sides
        this.buildWall(houseGroup, x, y + floorY, z, -2, 1.5, -width/2, 2, 1.5, wallThickness, 'back_left');
        this.buildWall(houseGroup, x, y + floorY, z, 2, 1.5, -width/2, 2, 1.5, wallThickness, 'back_right');

        // Left Wall (X-)
        this.buildWall(houseGroup, x, y + floorY, z, -width/2, 1.5, 0, wallThickness, heightPerFloor, depth, 'left');

        // Right Wall (X+)
        this.buildWall(houseGroup, x, y + floorY, z, width/2, 1.5, 0, wallThickness, heightPerFloor, depth, 'right');

        // Door (Ground floor only)
        if (f === 0) {
            this.createDoor(houseGroup, x, y, z + width/2, 0);
        }
    }

    // Roof
    const roofHeight = 1.5;
    const roofGeo = new THREE.ConeGeometry(5, roofHeight, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = floors * heightPerFloor + roofHeight / 2;
    houseGroup.add(roof);

    this.scene.add(houseGroup);
  }

  spawnTreasure(x, y, z) {
      // Random chance for treasure
      if (Math.random() > 0.3) {
          const type = Math.random() > 0.5 ? 'gem' : 'gold';
          const value = type === 'gem' ? 20 : 100;
          
          let geo, mat, color;
          if (type === 'gem') {
              geo = new THREE.OctahedronGeometry(0.3);
              color = 0xff00ff; // Purple gem for house
          } else {
              geo = new THREE.BoxGeometry(0.6, 0.2, 0.4);
              color = 0xffd700;
          }
          mat = new THREE.MeshStandardMaterial({ color: color, emissive: 0x222222 });
          
          this.game.collectibles.createItem(geo, mat, type + "_house", value, x, y, z);
      }
  }

  buildWall(group, wx, wy, wz, lx, ly, lz, w, h, d, name) {
      // lx, ly, lz are local positions relative to house center
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({ color: 0xdddddd }); // White walls
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(lx, ly, lz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Physics (World coords)
      this.addBoxPhysics(wx + lx, wy + ly, wz + lz, w, h, d);
  }

  addBoxPhysics(x, y, z, w, h, d) {
      const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2));
      const body = new CANNON.Body({ mass: 0 });
      body.addShape(shape);
      body.position.set(x, y, z);
      this.physicsWorld.addBody(body);
  }

  createDoor(group, hx, hy, hz, rotation) {
      // Door visual
      const w = 1.8;
      const h = 2.4;
      const d = 0.1;
      
      // Pivot group
      const pivot = new THREE.Group();
      pivot.position.set(0, 1.25, 3); // Front center
      
      const doorGeo = new THREE.BoxGeometry(w, h, d);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31 });
      const doorMesh = new THREE.Mesh(doorGeo, doorMat);
      // Offset mesh so pivot is at the hinge (left side)
      doorMesh.position.x = w/2; 
      
      pivot.add(doorMesh);
      group.add(pivot);

      // Physics Door
      // We need a kinematic body for the door to block player but move when opened
      const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2));
      const body = new CANNON.Body({ 
          mass: 0,
          type: CANNON.Body.KINEMATIC,
          position: new CANNON.Vec3(hx, hy + 1.25, hz) 
      });
      // Offset physics shape same as mesh? No, Body position is center of mass usually.
      // If we rotate body, we rotate around center.
      // To hinge it, we need to position the body such that its center moves correctly.
      // Easier: Use a static body that we verify open/close state and teleport/disable?
      // Or simply rotate the body.
      // Let's place the body at the center of the door panel.
      // Door panel center is at (hingeX + w/2).
      const worldDoorX = hx + 0.9; // Hinge at 0, center at 0.9
      const worldDoorZ = hz;
      
      body.position.set(worldDoorX, hy + 1.25, worldDoorZ);
      body.addShape(shape);
      this.physicsWorld.addBody(body);

      this.doors.push({
          meshPivot: pivot,
          body: body,
          isOpen: false,
          basePos: new CANNON.Vec3(worldDoorX, hy + 1.25, worldDoorZ),
          hingePos: new CANNON.Vec3(hx, hy + 1.25, hz) // World pos of hinge
      });
  }

  update(deltaTime) {
      // Handle Interactions
      if (this.game.input.keys.interact) {
          this.checkInteractions();
          this.game.input.keys.interact = false; // Consumer
      }

      // Animate Doors
      this.doors.forEach(door => {
          const targetRot = door.isOpen ? -Math.PI / 2 : 0;
          // Lerp visual
          door.meshPivot.rotation.y += (targetRot - door.meshPivot.rotation.y) * deltaTime * 5;
          
          // Sync physics
          // Rotating a kinematic body around a pivot point manually
          // The visual pivot is at local (0,0,0) of the pivot group.
          // The door mesh is offset by +0.9 (w/2).
          // So the door center orbits the pivot.
          
          const angle = door.meshPivot.rotation.y;
          const r = 0.9; // Radius from hinge to center
          
          // Original Z is 0 (relative to hinge). Original X is +0.9.
          // New X = cos(angle) * r
          // New Z = -sin(angle) * r  (Check sign)
          
          const dx = Math.cos(angle) * r;
          const dz = Math.sin(angle) * r;
          
          // World Hinge Pos + Offset
          door.body.position.x = door.hingePos.x + dx;
          door.body.position.z = door.hingePos.z - dz; // -sin for clockwise visual Y rot? ThreeJS rot Y is counter-clockwise.
          
          // Match rotation
          door.body.quaternion.setFromEuler(0, angle, 0);
      });
  }

  checkInteractions() {
      const playerPos = this.game.player.mesh.position;
      
      // Find nearest door
      let nearestDist = 3.0;
      let nearestDoor = null;

      this.doors.forEach(door => {
          // Check distance to door center (body)
          const dist = new THREE.Vector3(door.body.position.x, door.body.position.y, door.body.position.z).distanceTo(playerPos);
          if (dist < nearestDist) {
              nearestDist = dist;
              nearestDoor = door;
          }
      });

      if (nearestDoor) {
          nearestDoor.isOpen = !nearestDoor.isOpen;
      }
  }
}
