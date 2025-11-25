import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class Player {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.physicsWorld = game.physicsWorld;
    this.input = game.input;
    this.camera = game.camera;

    this.initPlayer();
  }

  initPlayer() {
    // Create Character Group
    this.mesh = new THREE.Group();
    
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3366ff });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.7;
    this.mesh.add(this.head);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.y = 0.15;
    this.mesh.add(this.torso);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    armGeo.translate(0, -0.2, 0); // Apply pivot once to the shared geometry
    
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.35, 0.2, 0);
    this.mesh.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.35, 0.2, 0);
    this.mesh.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    legGeo.translate(0, -0.2, 0); // Apply pivot once
    
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.15, -0.4, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.15, -0.4, 0);
    this.mesh.add(this.rightLeg);
    
    // Shadows
    this.mesh.traverse((object) => {
        if (object.isMesh) object.castShadow = true;
    });

    this.scene.add(this.mesh);

    // Physics
    const radius = 0.8;
    const shape = new CANNON.Sphere(radius); 
    this.body = new CANNON.Body({
      mass: 5, 
      position: new CANNON.Vec3(0, 10, 0), 
      shape: shape,
      material: this.game.defaultMaterial
    });
    this.body.linearDamping = 0.9;
    this.body.angularDamping = 1.0; 
    this.body.fixedRotation = true; 

    this.physicsWorld.addBody(this.body);

    // Initial safe position
    this.resetToGround();
  }

  resetToGround() {
    // Force reset to center safely
    const height = this.game.world.getTerrainHeightAt(0, 0);
    this.body.position.set(0, height + 2, 0);
    this.body.velocity.set(0,0,0);
  }

  update(deltaTime) {
    // 1. Safety Clamp: Ensure player never falls below terrain
    const terrainHeight = this.game.world.getTerrainHeightAt(this.body.position.x, this.body.position.z);
    
    // If player is sinking below ground (with small buffer), snap them up
    // We expect player Y to be at least terrainHeight + radius (0.8)
    const minHeight = terrainHeight + 0.8;
    
    if (this.body.position.y < minHeight) {
        // Only clamp if not underwater swimming (assuming water is at -0.5)
        // If terrain is below water, we allow swimming logic to handle it, 
        // BUT we must not go through the terrain floor of the pond.
        this.body.position.y = minHeight;
        this.body.velocity.y = Math.max(0, this.body.velocity.y); // Cancel downward velocity
    }

    // Sync visual with physics
    // Feet (Mesh Y -0.9) must match Sphere Bottom (Body Y - 0.8)
    // Mesh Y - 0.9 = Body Y - 0.8
    // Mesh Y = Body Y + 0.1
    this.mesh.position.copy(this.body.position);
    this.mesh.position.y += 0.1; 
    
    this.handleMovement(deltaTime);
    this.updateCamera();
    this.checkWater();
    this.animateCharacter(deltaTime);
  }

  animateCharacter(deltaTime) {
    // Get speed
    const velocity = new CANNON.Vec3(this.body.velocity.x, 0, this.body.velocity.z);
    const speed = velocity.length();
    
    if (speed > 0.1) {
        const time = this.game.clock.getElapsedTime();
        const walkSpeed = speed * 2; // Animation speed based on move speed
        
        // Walk cycle
        this.leftLeg.rotation.x = Math.sin(time * walkSpeed) * 0.5;
        this.rightLeg.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.5;
        
        this.leftArm.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.5;
        this.rightArm.rotation.x = Math.sin(time * walkSpeed) * 0.5;
    } else {
        // Idle
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
        
        // Breathing
        this.torso.scale.y = 1 + Math.sin(this.game.clock.getElapsedTime() * 2) * 0.02;
    }
  }

  handleMovement(deltaTime) {
    const speed = this.input.keys.run ? 12 : 6;
    const jumpForce = 8;
    
    // Get camera direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();

    const direction = new THREE.Vector3();

    if (this.input.keys.forward) direction.add(forward);
    if (this.input.keys.backward) direction.sub(forward);
    if (this.input.keys.right) direction.add(right);
    if (this.input.keys.left) direction.sub(right);

    if (direction.length() > 0) {
      direction.normalize();
      
      this.body.velocity.x = direction.x * speed;
      this.body.velocity.z = direction.z * speed;
      
      // Rotate character to face direction
      const angle = Math.atan2(direction.x, direction.z);
      this.mesh.rotation.y = angle; 
    } else {
        // Stop horizontal movement if no input (friction does this too, but we want snapping)
        this.body.velocity.x *= 0.5; // Faster stop
        this.body.velocity.z *= 0.5;
    }

    // Jump
    if (this.input.keys.jump) {
        // Raycast to check if grounded
        if(this.isGrounded()) {
            this.body.velocity.y = jumpForce;
        }
    }
  }

  isGrounded() {
      // Simple check: Raycast down
      const start = new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z);
      const end = new CANNON.Vec3(this.body.position.x, this.body.position.y - 1.0, this.body.position.z);
      const raycastResult = new CANNON.RaycastResult();
      this.physicsWorld.raycastClosest(start, end, {}, raycastResult);
      return raycastResult.hasHit;
  }

  checkWater() {
      if (this.body.position.y < -0.5) {
          // Swimming physics: gravity reduced, linear damping increased
          this.body.linearDamping = 0.95; // High drag
          // Push up force (buoyancy)
          this.body.applyForce(new CANNON.Vec3(0, 15, 0), this.body.position);
      } else {
          this.body.linearDamping = 0.9; // Normal drag
      }

      // Respawn if fell off world
      if (this.body.position.y < -20) {
          this.resetToGround();
      }
  }

  updateCamera() {
    // Third person camera
    const offset = new THREE.Vector3(0, 5, 10);
    const playerPos = new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
    
    // Smooth follow
    // For now, fixed offset relative to world (simple 3/4 view)
    // Or relative to player rotation?
    // Let's do simple follow first
    
    const targetPos = playerPos.clone().add(offset);
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(playerPos);
  }
}
