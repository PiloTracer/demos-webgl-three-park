import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import InputManager from './InputManager.js';
import World from '../World/World.js';
import Player from '../Entities/Player.js';
import CollectiblesManager from '../Entities/Collectibles.js';

export default class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    
    // Time
    this.clock = new THREE.Clock();
    this.deltaTime = 0;

    // Sizes
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.initThree();
    this.initPhysics();
    this.initInput();
    
    // Components
    this.world = new World(this);
    this.player = new Player(this);
    this.collectibles = new CollectiblesManager(this);
    
    // Resize event
    window.addEventListener('resize', () => this.resize());

    // Loop
    this.update();
  }

  initThree() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#87CEEB'); // Sky blue
    this.scene.fog = new THREE.Fog('#87CEEB', 20, 100);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.scene.add(this.camera);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    this.scene.add(dirLight);
  }

  initPhysics() {
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0);
    
    // Materials
    this.defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      {
        friction: 0.1,
        restitution: 0.0 // No bounce
      }
    );
    this.physicsWorld.addContactMaterial(defaultContactMaterial);
  }

  initInput() {
    this.input = new InputManager();
  }

  resize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  update() {
    const delta = this.clock.getDelta();
    this.deltaTime = delta;

    // Physics step - Increase maxSubSteps to prevent tunneling
    // Fixed step 1/60, max 10 substeps to catch up
    this.physicsWorld.step(1 / 60, delta, 10);

    // Update entities
    if (this.world) this.world.update(delta);
    if (this.player) this.player.update(delta);
    if (this.collectibles) this.collectibles.update(delta);

    // Render
    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(() => this.update());
  }
}
