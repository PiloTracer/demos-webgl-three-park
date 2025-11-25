import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import HouseManager from './HouseManager.js';

export default class World {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.physicsWorld = game.physicsWorld;

    this.objectsToUpdate = [];
    this.fish = [];
    this.birds = [];

    this.createTerrain();
    this.createWater();
    this.createRocks();
    this.createVegetation();
    this.createFish();
    this.createBirds();
    
    // Houses
    this.houseManager = new HouseManager(this.game, this);
    this.objectsToUpdate.push(this.houseManager);
  }

  createTerrain() {
    // Parameters
    this.terrainSize = 200; // Extended
    this.terrainResolution = 128;
    this.terrainMatrix = [];
    
    // Initialize matrix
    for(let i=0; i<this.terrainResolution; i++) {
        this.terrainMatrix.push(new Array(this.terrainResolution).fill(0));
    }

    // Create visual geometry
    this.geometry = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, this.terrainResolution - 1, this.terrainResolution - 1);
    this.geometry.rotateX(-Math.PI / 2);

    const positions = this.geometry.attributes.position.array;

    for (let iz = 0; iz < this.terrainResolution; iz++) {
      for (let ix = 0; ix < this.terrainResolution; ix++) {
        // Calculate height
        const xVal = (ix / this.terrainResolution) * 15;
        const zVal = (iz / this.terrainResolution) * 15;
        
        // Base terrain (Hills)
        let height = Math.sin(xVal) * Math.cos(zVal) * 3 + Math.sin(xVal * 3 + zVal) * 1;
        
        // Create deeper ponds using a larger low-frequency wave
        // We subtract to make pits
        const basin = Math.sin(xVal * 0.5) * Math.cos(zVal * 0.5) * 6;
        height -= basin;

        // Flatten center
        const centerX = this.terrainResolution / 2;
        const centerZ = this.terrainResolution / 2;
        const dist = Math.sqrt((ix - centerX)**2 + (iz - centerZ)**2);
        if (dist < 10) {
            height = 0; // Flat start
        }

        // Store in matrix: Cannon expects matrix[x][z]
        this.terrainMatrix[ix][iz] = height;

        // Store in geometry: Index corresponds to row-major (Z then X)
        // Index = (iz * this.terrainResolution + ix) * 3 + 1 (Y component)
        const index = (iz * this.terrainResolution + ix) * 3 + 1;
        positions[index] = height;
      }
    }
    
    this.geometry.computeVertexNormals();

    // Material
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3b8c3b,
        flatShading: true,
        roughness: 0.8
    });

    this.terrainMesh = new THREE.Mesh(this.geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Physics Body
    const shape = new CANNON.Heightfield(this.terrainMatrix, {
      elementSize: this.terrainSize / (this.terrainResolution - 1)
    });
    
    const body = new CANNON.Body({ mass: 0 }); // Static
    body.addShape(shape);
    
    // Rotate and position
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    body.position.set(-this.terrainSize / 2, 0, -this.terrainSize / 2); 

    this.physicsWorld.addBody(body);
  }

  getTerrainHeightAt(x, z) {
      const halfSize = this.terrainSize / 2;
      
      // Check bounds
      if (x < -halfSize || x > halfSize || z < -halfSize || z > halfSize) {
          return -100; // Out of bounds
      }

      // Convert world coordinate to matrix index
      const elementSize = this.terrainSize / (this.terrainResolution - 1);
      
      let ix = (x + halfSize) / elementSize;
      let iz = (z + halfSize) / elementSize;
      
      const ix1 = Math.floor(ix);
      const iz1 = Math.floor(iz);
      
      if (ix1 >= 0 && ix1 < this.terrainResolution && iz1 >= 0 && iz1 < this.terrainResolution) {
           return this.terrainMatrix[ix1][iz1];
      }
      return 0;
  }

  createWater() {
    const geometry = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
        color: 0x0077be,
        transparent: true,
        opacity: 0.6
    });
    const water = new THREE.Mesh(geometry, material);
    water.position.y = -0.5; // Water level
    this.scene.add(water);
  }

  createRocks() {
    // Add some random rocks
    for(let i=0; i<40; i++) { // More rocks for larger map
        const radius = (Math.random() * 0.5) + 0.5;
        const geometry = new THREE.DodecahedronGeometry(radius);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        
        const x = (Math.random() - 0.5) * (this.terrainSize - 10);
        const z = (Math.random() - 0.5) * (this.terrainSize - 10);
        
        const groundHeight = this.getTerrainHeightAt(x, z);
        
        // Don't spawn underwater if too deep
        if (groundHeight < -1) continue;

        const y = groundHeight + radius * 0.5; // Embed slightly

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Physics
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({ mass: 0 }); // Static obstacles
        body.addShape(shape);
        body.position.set(x, y, z);
        this.physicsWorld.addBody(body);
    }
  }

  createVegetation() {
    // Simple tree placeholders
    for(let i=0; i<80; i++) { // More trees
        const x = (Math.random() - 0.5) * (this.terrainSize - 10);
        const z = (Math.random() - 0.5) * (this.terrainSize - 10);
        
        // Don't place near center
        if(Math.abs(x) < 5 && Math.abs(z) < 5) continue;

        const groundHeight = this.getTerrainHeightAt(x, z);
        
        // Remove trees from inside ponds
        if (groundHeight < -0.5) continue;

        const y = groundHeight; 
        const type = Math.floor(Math.random() * 3);
        const treeGroup = new THREE.Group();

        if (type === 0) {
            // Pine
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 1.5);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 0.75;
            
            const leavesGeo = new THREE.ConeGeometry(1.2, 3, 8);
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1a472a });
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 2.5;

            treeGroup.add(trunk);
            treeGroup.add(leaves);
            
            // Physics
            const shape = new CANNON.Cylinder(0.3, 0.3, 2, 8);
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape, new CANNON.Vec3(0, 1, 0));
            body.position.set(x, y, z);
            this.physicsWorld.addBody(body);

        } else if (type === 1) {
            // Round Oak
            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1;
            
            const leavesGeo = new THREE.IcosahedronGeometry(1.5, 0);
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x4a6741 });
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 2.5;

            treeGroup.add(trunk);
            treeGroup.add(leaves);

            // Physics
            const shape = new CANNON.Cylinder(0.4, 0.4, 2, 8);
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape, new CANNON.Vec3(0, 1, 0));
            body.position.set(x, y, z);
            this.physicsWorld.addBody(body);

        } else {
            // Bush
            const leavesGeo = new THREE.DodecahedronGeometry(1);
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x6e8c3c });
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 0.8;
            leaves.scale.set(1.5, 1, 1.5);
            
            treeGroup.add(leaves);

            // Physics (smaller)
            const shape = new CANNON.Sphere(0.8);
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape, new CANNON.Vec3(0, 0.8, 0));
            body.position.set(x, y, z);
            this.physicsWorld.addBody(body);
        }
        
        treeGroup.position.set(x, y, z); 
        treeGroup.castShadow = true;
        this.scene.add(treeGroup);
    }
  }
  
  createFish() {
      const fishColor = 0xff8800;
      
      for(let i=0; i<40; i++) {
          const group = new THREE.Group();
          
          // Body
          const bodyGeo = new THREE.CapsuleGeometry(0.08, 0.3, 4, 8);
          bodyGeo.rotateZ(Math.PI / 2);
          const bodyMat = new THREE.MeshStandardMaterial({ color: fishColor });
          const body = new THREE.Mesh(bodyGeo, bodyMat);
          group.add(body);
          
          // Tail
          const tailGeo = new THREE.ConeGeometry(0.1, 0.2, 4);
          tailGeo.rotateZ(-Math.PI / 2);
          const tail = new THREE.Mesh(tailGeo, bodyMat);
          tail.position.x = -0.25;
          group.add(tail);

          // Find a water spot
          let x, z, h;
          let attempts = 0;
          do {
             x = (Math.random() - 0.5) * (this.terrainSize - 10);
             z = (Math.random() - 0.5) * (this.terrainSize - 10);
             h = this.getTerrainHeightAt(x, z);
             attempts++;
          } while ((h > -1.5) && attempts < 20); 
          
          if (h <= -1.5) {
              group.position.set(x, -1 - Math.random(), z); // Varied depth
              this.scene.add(group);
              
              this.fish.push({
                  mesh: group,
                  speed: 1 + Math.random() * 2,
                  direction: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize(),
                  changeTime: Math.random() * 5
              });
          }
      }
  }

  createBirds() {
      const birdColor = 0xffffff;
      
      for(let i=0; i<15; i++) {
          const group = new THREE.Group();
          
          // Simple Bird (V shape)
          const bodyGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
          bodyGeo.rotateX(Math.PI / 2);
          const mat = new THREE.MeshBasicMaterial({ color: birdColor });
          const body = new THREE.Mesh(bodyGeo, mat);
          group.add(body);
          
          const wingsGeo = new THREE.BoxGeometry(0.8, 0.05, 0.2);
          const wings = new THREE.Mesh(wingsGeo, mat);
          group.add(wings);

          // Position high up
          const x = (Math.random() - 0.5) * this.terrainSize;
          const z = (Math.random() - 0.5) * this.terrainSize;
          const y = 20 + Math.random() * 10;
          
          group.position.set(x, y, z);
          this.scene.add(group);
          
          this.birds.push({
              mesh: group,
              speed: 5 + Math.random() * 3,
              angle: Math.random() * Math.PI * 2,
              centerY: y,
              radius: 20 + Math.random() * 20,
              centerX: x, // Orbit center
              centerZ: z
          });
      }
  }

  update(deltaTime) {
    this.houseManager.update(deltaTime);

    const time = this.game.clock.getElapsedTime();
    
    // Fish AI
    this.fish.forEach(f => {
        // Move forward
        f.mesh.position.add(f.direction.clone().multiplyScalar(f.speed * deltaTime));
        f.mesh.rotation.y = Math.atan2(-f.direction.z, f.direction.x);

        // Turn randomly or near bounds
        f.changeTime -= deltaTime;
        const dist = Math.sqrt(f.mesh.position.x**2 + f.mesh.position.z**2);
        
        if (f.changeTime <= 0 || dist > 40 || this.getTerrainHeightAt(f.mesh.position.x, f.mesh.position.z) > -1) {
            f.changeTime = 2 + Math.random() * 3;
            // Pick new random direction
            f.direction.set(Math.random()-0.5, 0, Math.random()-0.5).normalize();
            // If out of bounds, point to center
            if (dist > 40) {
                f.direction.subVectors(new THREE.Vector3(0,0,0), f.mesh.position).normalize();
            }
        }
        
        // Wobble tail (visual only, simple rotation of whole fish slightly)
        f.mesh.rotation.y += Math.sin(time * 10) * 0.1;
    });

    // Bird AI
    this.birds.forEach(b => {
        b.angle += (b.speed / b.radius) * deltaTime;
        b.mesh.position.x = b.centerX + Math.cos(b.angle) * b.radius;
        b.mesh.position.z = b.centerZ + Math.sin(b.angle) * b.radius;
        // Bob up and down
        b.mesh.position.y = b.centerY + Math.sin(time + b.angle) * 2;
        // Bank
        b.mesh.rotation.y = -b.angle;
        b.mesh.rotation.z = Math.sin(time * 5) * 0.2; // Flap bank
    });
  }
}
