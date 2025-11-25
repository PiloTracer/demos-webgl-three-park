import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class World {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.physicsWorld = game.physicsWorld;

    this.objectsToUpdate = [];

    this.createTerrain();
    this.createWater();
    this.createRocks();
    this.createVegetation();
  }

  createTerrain() {
    // Parameters
    this.terrainSize = 100;
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
        const xVal = ix / this.terrainResolution * 10;
        const zVal = iz / this.terrainResolution * 10;
        
        // Use noise-like function
        let height = Math.sin(xVal) * Math.cos(zVal) * 2 + Math.sin(xVal * 3 + zVal) * 0.5;
        
        // Flatten center
        const centerX = this.terrainResolution / 2;
        const centerZ = this.terrainResolution / 2;
        const dist = Math.sqrt((ix - centerX)**2 + (iz - centerZ)**2);
        if (dist < 10) {
            height *= (dist / 10);
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
    const geometry = new THREE.PlaneGeometry(100, 100);
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
    for(let i=0; i<20; i++) {
        const radius = (Math.random() * 0.5) + 0.5;
        const geometry = new THREE.DodecahedronGeometry(radius);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        
        const groundHeight = this.getTerrainHeightAt(x, z);
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
    // Simple tree placeholders (Cylinder + Cone)
    for(let i=0; i<30; i++) {
        const x = (Math.random() - 0.5) * 90;
        const z = (Math.random() - 0.5) * 90;
        
        // Don't place near center
        if(Math.abs(x) < 5 && Math.abs(z) < 5) continue;

        const groundHeight = this.getTerrainHeightAt(x, z);
        const y = groundHeight + 0.5; // Base of trunk at ground + half height

        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 1);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        
        const leavesGeo = new THREE.ConeGeometry(1, 2, 8);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 1.5;

        const treeGroup = new THREE.Group();
        treeGroup.add(trunk);
        treeGroup.add(leaves);
        
        treeGroup.position.set(x, y, z); 
        treeGroup.castShadow = true;
        
        this.scene.add(treeGroup);
        
        // Physics (Cylinder)
        const shape = new CANNON.Cylinder(0.2, 0.2, 1, 8);
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.set(x, y, z);
        this.physicsWorld.addBody(body);
    }
  }

  update(deltaTime) {
    // Animate water or particles if needed
  }
}
