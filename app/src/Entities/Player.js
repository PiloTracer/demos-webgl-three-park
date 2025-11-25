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
    this.characterVisual = new THREE.Group();
    this.mesh.add(this.characterVisual);
    
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3366ff });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.7;
    this.characterVisual.add(this.head);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.y = 0.15;
    this.characterVisual.add(this.torso);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    armGeo.translate(0, -0.2, 0); // Apply pivot once to the shared geometry
    
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.35, 0.2, 0);
    this.characterVisual.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.35, 0.2, 0);
    this.characterVisual.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    legGeo.translate(0, -0.2, 0); // Apply pivot once
    
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.15, -0.4, 0);
    this.characterVisual.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.15, -0.4, 0);
    this.characterVisual.add(this.rightLeg);
    
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
    
    // Jump state
    this.jumpCount = 0;
    this.canJump = true; // To prevent holding key
    this.isSwimming = false;
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
    // Interpolate visual mesh position for smoothness
    // Instead of hard copy, we lerp slightly to hide physics steps
    // Or just hard copy if we trust 60fps.
    // Let's hard copy but ensure the offset is correct.
    this.mesh.position.copy(this.body.position);
    this.mesh.position.y += 0.1; 
    
    // Tank controls are already smooth (rotation += speed * dt)
    
    this.handleMovement(deltaTime);
    this.updateCamera();
    this.checkWater();
    this.animateCharacter(deltaTime);
  }

  animateCharacter(deltaTime) {
    const time = this.game.clock.getElapsedTime();
    
    // Swimming Animation
    if (this.isSwimming) {
        // Rotate body to horizontal
        // Three.js Right Hand Rule: Rotate around X axis.
        // +Y (Head) rotates to +Z (Back/Camera) with positive rotation.
        // We want Head to point to -Z (Forward). So we need -PI/2.
        this.characterVisual.rotation.x = -Math.PI / 2; // Face down, Head Forward
        this.characterVisual.position.y = 0.2; // Adjust height center

        // Swim stroke
        const swimSpeed = 8;
        this.leftArm.rotation.x = Math.sin(time * swimSpeed) * 0.8 + Math.PI; 
        this.rightArm.rotation.x = Math.sin(time * swimSpeed + Math.PI) * 0.8 + Math.PI;
        
        // Kick legs
        this.leftLeg.rotation.x = Math.sin(time * swimSpeed * 1.5) * 0.3;
        this.rightLeg.rotation.x = Math.sin(time * swimSpeed * 1.5 + Math.PI) * 0.3;
        
        return;
    }

    // Reset rotation if not swimming
    this.characterVisual.rotation.x = 0;
    this.characterVisual.position.y = 0;

    // Get speed
    const velocity = new CANNON.Vec3(this.body.velocity.x, 0, this.body.velocity.z);
    const speed = velocity.length();
    
    if (speed > 0.1) {
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
    const isSwimming = this.isSwimming;
    let speed = this.input.keys.run ? 12 : 6;
    if (isSwimming) speed *= 0.5;

    const jumpForce = 8;
    
    // Rotation (Tank Controls)
    const rotateSpeed = 2.5 * deltaTime;
    if (this.input.keys.left) {
        this.mesh.rotation.y += rotateSpeed;
    }
    if (this.input.keys.right) {
        this.mesh.rotation.y -= rotateSpeed;
    }

    // Movement Direction based on Character Facing
    let moveForward = 0;
    if (this.input.keys.forward) moveForward = 1;
    if (this.input.keys.backward) moveForward = -1;

    if (moveForward !== 0) {
        // Calculate forward vector based on rotation
        // Character faces along +Z or -Z?
        // Let's assume standard -Z is forward in visual terms, but we can align physics.
        // If rotation is 0, we want to move towards -Z?
        // Let's test: rotation 0. sin(0)=0, cos(0)=1. 
        // We want (0,0,-1).
        // So x = -sin(rot), z = -cos(rot).
        
        const rot = this.mesh.rotation.y;
        const dx = -Math.sin(rot);
        const dz = -Math.cos(rot);
        
        this.body.velocity.x = dx * speed * moveForward;
        this.body.velocity.z = dz * speed * moveForward;
    } else {
        // Stop horizontal movement
        const friction = isSwimming ? 0.8 : 0.5;
        this.body.velocity.x *= friction;
        this.body.velocity.z *= friction;
    }

    // Jump Logic
    // Reset jump count if grounded
    if (this.isGrounded()) {
        this.jumpCount = 0;
    }

    if (this.input.keys.jump) {
        if (this.canJump) {
            // Jump logic
            let didJump = false;
            
            // Allow jumping out of water regardless of count if swimming
            if (isSwimming && this.body.position.y > -1.5) { // Near surface
                 this.body.velocity.y = 10; // Big launch
                 this.isSwimming = false; // Break state
                 didJump = true;
            } 
            // Regular triple jump
            else if (this.jumpCount < 3) { 
                this.body.velocity.y = jumpForce;
                this.jumpCount++;
                didJump = true;
            }
            
            this.canJump = false; 
        }
    } else {
        this.canJump = true; 
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
      const waterLevel = -0.5;
      
      if (this.body.position.y < waterLevel) {
          this.isSwimming = true;
          // Swimming physics: gravity reduced, linear damping increased
          this.body.linearDamping = 0.9; // Drag
          // Push up force (buoyancy)
          // Only push if significantly underwater to float at surface
          const depth = waterLevel - this.body.position.y;
          if (depth > 0) {
            this.body.applyForce(new CANNON.Vec3(0, 20 * depth, 0), this.body.position);
          }
      } else {
          this.isSwimming = false;
          this.body.linearDamping = 0.9; // Normal drag (actually this was high before, stick to 0.9?? 0.9 is very high damp)
          // Normal walking linearDamping should be low? Cannon default is 0.01.
          // Wait, previous code set it to 0.9 in init. That explains sharp stops.
          // Let's keep it consistent.
      }

      // Respawn if fell off world
      if (this.body.position.y < -20) {
          this.resetToGround();
      }
  }

  updateCamera() {
    // Camera always behind player
    // Calculate offset based on player rotation
    const relativeOffset = new THREE.Vector3(0, 5, 12);
    // Rotate offset by player rotation
    relativeOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
    
    const targetPos = this.mesh.position.clone().add(relativeOffset);
    
    // Smooth follow using frame-rate independent damping
    // Factor = 1 - Math.exp(-decay * dt)
    // Decay 5.0 is smooth, 10.0 is snappy
    const decay = 5.0;
    const factor = 1.0 - Math.exp(-decay * this.game.deltaTime);
    
    this.camera.position.lerp(targetPos, factor);
    
    // Look at player head
    const lookTarget = this.mesh.position.clone().add(new THREE.Vector3(0, 2, 0));
    this.camera.lookAt(lookTarget);
  }
}
