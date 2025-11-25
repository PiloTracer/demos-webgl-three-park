import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class CollectiblesManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.physicsWorld = game.physicsWorld;
    this.player = game.player;
    
    this.items = [];
    this.itemsToRemove = [];
    this.score = 0;
    this.scoreElement = document.getElementById('score');

    this.spawnGems(20);
    this.spawnGold(5);
  }

  spawnGems(count) {
    const geometry = new THREE.OctahedronGeometry(0.3);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, 
        emissive: 0x004444,
        roughness: 0,
        metalness: 1
    });

    for (let i = 0; i < count; i++) {
        this.createItem(geometry, material, 'gem', 10);
    }
  }

  spawnGold(count) {
    const geometry = new THREE.BoxGeometry(0.6, 0.2, 0.4);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        emissive: 0x443300,
        roughness: 0.2,
        metalness: 1
    });

    for (let i = 0; i < count; i++) {
        this.createItem(geometry, material, 'gold', 50);
    }
  }

  createItem(geometry, material, type, value, overrideX, overrideY, overrideZ) {
    let x, y, z;
    
    if (overrideX !== undefined) {
        x = overrideX;
        y = overrideY;
        z = overrideZ;
    } else {
        x = (Math.random() - 0.5) * 80;
        z = (Math.random() - 0.5) * 80;
        
        // Raycast to find ground height
        y = 5; 
        const start = new CANNON.Vec3(x, 20, z);
        const end = new CANNON.Vec3(x, -10, z);
        const raycastResult = new CANNON.RaycastResult();
        this.physicsWorld.raycastClosest(start, end, {}, raycastResult);
        
        if (raycastResult.hasHit) {
            y = raycastResult.hitPointWorld.y + 0.5; 
        } else {
            y = 1; 
        }
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Physics (Trigger)
    const shape = new CANNON.Sphere(0.5);
    const body = new CANNON.Body({
        mass: 0,
        isTrigger: true,
        position: new CANNON.Vec3(x, y, z)
    });
    body.addShape(shape);
    
    // Check collision with player
    body.addEventListener('collide', (e) => {
        if (e.body === this.game.player.body) {
            this.collect(item);
        }
    });

    this.physicsWorld.addBody(body);

    const item = { mesh, body, value, type, active: true };
    this.items.push(item);
  }

  collect(item) {
    if (!item.active) return;
    item.active = false;

    // Remove visual
    this.scene.remove(item.mesh);
    
    // Queue physics removal
    this.itemsToRemove.push(item.body);

    // Update score
    this.score += item.value;
    this.scoreElement.innerText = `Score: ${this.score}`;
    
    // Optional: Play sound or particle effect
    console.log(`Collected ${item.type}! +${item.value}`);
  }

  update(deltaTime) {
    // Process removals safely outside of step
    if (this.itemsToRemove.length > 0) {
        this.itemsToRemove.forEach(body => {
            this.physicsWorld.removeBody(body);
        });
        this.itemsToRemove = [];
    }

    // Animate items (spin/float)
    const time = this.game.clock.getElapsedTime();
    this.items.forEach(item => {
        if (item.active) {
            item.mesh.rotation.y += deltaTime;
            item.mesh.position.y = item.body.position.y + Math.sin(time * 2 + item.mesh.position.x) * 0.1;
            // Sync trigger body? usually triggers don't need exact visual sync if static, but floating looks nice.
            // If we move mesh, we should move body if we want hitbox to float too.
            item.body.position.y = item.mesh.position.y;
        }
    });
  }
}
