import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ==================== GLOBAL VARIABLES ====================
let scene, camera, renderer, controls;
let clock, deltaTime;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, isRunning = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const WALK_SPEED = 50.0;
const RUN_SPEED = 100.0;
const JUMP_VELOCITY = 35.0; // Increased for platform climbing

// Environment
let sun, moonLight, ambientLight;
let isDay = true;
let fogEnabled = true;
let birds = [];
let trees = [];
let ponds = [];
let boardwalk;
let butterflies = [];
let dragonflies = [];
let clouds = [];
let lampLights = [];
let buildings = [];
let doors = [];

// Collision Detection
let collidableObjects = [];
let collidableMeshes = [];

// Game Elements
let collectibles = [];
let gameState = {
    score: 0,
    gemsCollected: 0,
    totalGems: 0,
    currentObjective: 0,
    gameStarted: false,
    gameWon: false,
    timeElapsed: 0,
    objectives: [
        { text: 'Explore the park and collect all gems!', completed: false },
        { text: 'Find the hidden treasure near the gazebo', completed: false },
        { text: 'Visit all three ponds', completed: false }
    ],
    pondsVisited: new Set(),
    treasureFound: false
};

// Player bounds
const PLAYER_RADIUS = 1.0;
const PLAYER_HEIGHT = 2.0;

// Ground tracking
let currentGroundHeight = 0;

// Stats
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

// ==================== INITIALIZATION ====================
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 400);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Clock
    clock = new THREE.Clock();

    // Controls
    controls = new PointerLockControls(camera, renderer.domElement);

    renderer.domElement.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        console.log('Pointer locked');
    });

    controls.addEventListener('unlock', () => {
        console.log('Pointer unlocked');
    });

    // Lighting
    setupLighting();

    // Environment
    createTerrain();
    createBoardwalk();
    createElevatedTerraces();
    createRockOutcrops();
    createStonePathways();
    createTrees();
    createPonds();
    createBirds();
    createAmbientElements();
    createBenches();
    createLampPosts();
    createBoulders();
    createButterflies();
    createDragonflies();
    createClouds();
    createGazebo();
    createParkSigns();
    createBridge();
    createBuildings();
    createAdditionalElements();

    // Game Elements
    createCollectibles();
    createTreasure();
    startGame();

    // Event Listeners
    setupEventListeners();

    // Hide loading screen
    document.getElementById('loading').style.display = 'none';

    // Start animation
    animate();
}

// ==================== LIGHTING ====================
function setupLighting() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Sun (Directional light)
    sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0001;
    scene.add(sun);

    // Moon light
    moonLight = new THREE.DirectionalLight(0x4040ff, 0);
    moonLight.position.set(-50, 100, -50);
    moonLight.castShadow = true;
    scene.add(moonLight);

    // Hemisphere light for sky
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a7c3f, 0.6);
    scene.add(hemiLight);
}

// ==================== TERRAIN ====================
function createTerrain() {
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);

    // Add dramatic hills and valleys to terrain
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];

        // Multiple octaves of noise for natural-looking terrain
        const height1 = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 8;      // Large hills
        const height2 = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 4;      // Medium hills
        const height3 = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2;        // Small bumps
        const height4 = Math.sin(x * 0.15 + y * 0.15) * 1.5;              // Detail noise

        // Combine for natural terrain
        vertices[i + 2] = height1 + height2 + height3 + height4;
    }
    groundGeometry.computeVertexNormals();

    // Create grass texture using canvas
    const grassTexture = createGrassTexture();
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(50, 50);

    const groundMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.8,
        metalness: 0.2,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base grass color
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(0, 0, 256, 256);

    // Add grass texture variation
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const shade = Math.random() * 40 - 20;
        ctx.fillStyle = `rgb(${74 + shade}, ${124 + shade}, ${63 + shade})`;
        ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// ==================== BOARDWALK ====================
function createBoardwalk() {
    const boardwalkGroup = new THREE.Group();

    // Boardwalk path - a winding path through the park
    const pathPoints = [
        new THREE.Vector3(0, 0.5, 10),
        new THREE.Vector3(20, 0.5, 15),
        new THREE.Vector3(40, 0.5, 10),
        new THREE.Vector3(60, 0.5, 20),
        new THREE.Vector3(80, 0.5, 15),
        new THREE.Vector3(100, 0.5, 5),
        new THREE.Vector3(80, 0.5, -10),
        new THREE.Vector3(60, 0.5, -20),
        new THREE.Vector3(40, 0.5, -15),
        new THREE.Vector3(20, 0.5, -10),
        new THREE.Vector3(0, 0.5, -5),
        new THREE.Vector3(-20, 0.5, 0),
        new THREE.Vector3(-40, 0.5, -5),
        new THREE.Vector3(-60, 0.5, 5),
        new THREE.Vector3(-80, 0.5, 10),
        new THREE.Vector3(-100, 0.5, 0),
    ];

    // Create wood texture
    const woodTexture = createWoodTexture();
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;

    for (let i = 0; i < pathPoints.length - 1; i++) {
        const start = pathPoints[i];
        const end = pathPoints[i + 1];
        const distance = start.distanceTo(end);
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        // Boardwalk planks
        const plankGeometry = new THREE.BoxGeometry(3, 0.2, distance);
        woodTexture.repeat.set(1, distance / 2);
        const plankMaterial = new THREE.MeshStandardMaterial({
            map: woodTexture,
            roughness: 0.9,
            metalness: 0.1,
        });
        const plank = new THREE.Mesh(plankGeometry, plankMaterial);

        plank.position.copy(midPoint);
        const angle = Math.atan2(end.x - start.x, end.z - start.z);
        plank.rotation.y = angle;
        plank.castShadow = true;
        plank.receiveShadow = true;
        boardwalkGroup.add(plank);
    }

    boardwalk = boardwalkGroup;
    scene.add(boardwalkGroup);
}

// ==================== ELEVATED PLATFORMS & TERRACES ====================
function createElevatedTerraces() {
    // Terrace configurations: varied heights and sizes
    const terraceConfigs = [
        // Viewing platform near pond 1
        { x: -45, z: 50, width: 8, depth: 8, height: 3, steps: true },
        // Rocky outcrop near pond 2
        { x: 65, z: -60, width: 10, depth: 10, height: 5, steps: false },
        // Stone terrace near gazebo
        { x: -85, z: -20, width: 12, depth: 12, height: 4, steps: true },
        // Elevated platform in forest
        { x: 35, z: 30, width: 6, depth: 6, height: 2.5, steps: true },
        // Natural rock formation
        { x: -10, z: -70, width: 9, depth: 9, height: 4, steps: false },
        // Hillside platform
        { x: 90, z: 25, width: 7, depth: 7, height: 3.5, steps: true },
        // Central overlook
        { x: 10, z: -30, width: 10, depth: 8, height: 3, steps: true },
    ];

    terraceConfigs.forEach(config => {
        createTerrace(config.x, config.z, config.width, config.depth, config.height, config.steps);
    });
}

function createTerrace(x, z, width, depth, height, createSteps) {
    const terraceGroup = new THREE.Group();

    // Create stone texture
    const stoneTexture = createStoneTexture();

    // Main platform
    const platformGeometry = new THREE.BoxGeometry(width, height, depth);
    const platformMaterial = new THREE.MeshStandardMaterial({
        map: stoneTexture,
        roughness: 0.95,
        metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = height / 2;
    platform.castShadow = true;
    platform.receiveShadow = true;
    terraceGroup.add(platform);

    // Top surface with slightly different texture
    const topGeometry = new THREE.BoxGeometry(width, 0.2, depth);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B8680,
        roughness: 0.9,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = height + 0.1;
    top.receiveShadow = true;
    terraceGroup.add(top);

    // Add some decorative stones around the base
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const distance = Math.max(width, depth) / 2 + 0.5;
        const stoneX = Math.cos(angle) * distance;
        const stoneZ = Math.sin(angle) * distance;

        const stoneSize = Math.random() * 0.4 + 0.3;
        const stoneGeometry = new THREE.DodecahedronGeometry(stoneSize, 0);
        const stone = new THREE.Mesh(stoneGeometry, platformMaterial);
        stone.position.set(stoneX, stoneSize / 2, stoneZ);
        stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        stone.castShadow = true;
        stone.receiveShadow = true;
        terraceGroup.add(stone);
    }

    // Create steps if requested
    if (createSteps) {
        const numSteps = Math.ceil(height / 0.5);
        const stepDepth = 1.0;
        const stepWidth = width * 0.6;

        for (let i = 0; i < numSteps; i++) {
            const stepHeight = 0.4;
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const step = new THREE.Mesh(stepGeometry, platformMaterial);
            step.position.set(
                0,
                i * 0.5 + stepHeight / 2,
                depth / 2 + 0.5 + i * stepDepth * 0.5
            );
            step.castShadow = true;
            step.receiveShadow = true;
            terraceGroup.add(step);
        }
    }

    terraceGroup.position.set(x, 0, z);
    scene.add(terraceGroup);

    // Add collision - platform top
    collidableObjects.push({
        position: new THREE.Vector3(x, 0, z),
        radius: Math.max(width, depth) / 2,
        type: 'terrace',
        height: height // Store height for potential vertical collision
    });
}

function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base stone color
    ctx.fillStyle = '#736F6E';
    ctx.fillRect(0, 0, 256, 256);

    // Add stone texture variation
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 3 + 1;
        const shade = Math.random() * 50 - 25;
        ctx.fillStyle = `rgb(${115 + shade}, ${111 + shade}, ${110 + shade})`;
        ctx.fillRect(x, y, size, size);
    }

    // Add cracks
    ctx.strokeStyle = '#5A5958';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 256, Math.random() * 256);
        ctx.lineTo(Math.random() * 256, Math.random() * 256);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}

// ==================== NATURAL ROCK OUTCROPS ====================
function createRockOutcrops() {
    const outcropPositions = [
        { x: 25, z: -55, scale: 4 },
        { x: -60, z: 30, scale: 3.5 },
        { x: 70, z: 10, scale: 3 },
        { x: -30, z: -45, scale: 3.8 },
        { x: 45, z: 60, scale: 4.2 },
    ];

    outcropPositions.forEach(pos => {
        createRockOutcrop(pos.x, pos.z, pos.scale);
    });
}

function createRockOutcrop(x, z, scale) {
    const outcropGroup = new THREE.Group();
    const stoneTexture = createStoneTexture();

    // Create multiple rocks stacked together
    const rockCount = Math.floor(Math.random() * 3) + 4;

    for (let i = 0; i < rockCount; i++) {
        const rockSize = (Math.random() * 0.5 + 0.8) * scale;
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 1);
        const rockMaterial = new THREE.MeshStandardMaterial({
            map: stoneTexture,
            roughness: 0.95,
            metalness: 0.05,
            color: new THREE.Color().setHSL(0.08, 0.1, Math.random() * 0.2 + 0.35),
        });

        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(
            (Math.random() - 0.5) * scale * 0.8,
            rockSize / 2 + i * rockSize * 0.7,
            (Math.random() - 0.5) * scale * 0.8
        );
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        outcropGroup.add(rock);
    }

    outcropGroup.position.set(x, 0, z);
    scene.add(outcropGroup);

    // Add collision for the outcrop base
    collidableObjects.push({
        position: new THREE.Vector3(x, 0, z),
        radius: scale * 1.2,
        type: 'outcrop'
    });
}

// ==================== STONE STEPS & RAMPS ====================
function createStonePathways() {
    // Stone stairway in forest
    createStoneStairs(-15, 15, 5, 0.3);

    // Ramp near pond
    createStoneRamp(55, -40, 8, 3, Math.PI / 4);

    // Stepped pathway
    createStoneStairs(80, 35, 4, 0.4);
}

function createStoneStairs(x, z, numSteps, stepHeight) {
    const stepsGroup = new THREE.Group();
    const stoneTexture = createStoneTexture();
    const stepWidth = 3;
    const stepDepth = 1.2;

    for (let i = 0; i < numSteps; i++) {
        const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
        const stepMaterial = new THREE.MeshStandardMaterial({
            map: stoneTexture,
            roughness: 0.9,
        });

        const step = new THREE.Mesh(stepGeometry, stepMaterial);
        step.position.set(0, i * stepHeight + stepHeight / 2, i * stepDepth);
        step.castShadow = true;
        step.receiveShadow = true;
        stepsGroup.add(step);
    }

    stepsGroup.position.set(x, 0, z);
    scene.add(stepsGroup);

    // Collision for top platform
    const topZ = z + (numSteps - 1) * stepDepth;
    collidableObjects.push({
        position: new THREE.Vector3(x, 0, topZ),
        radius: stepWidth / 2 + 0.5,
        type: 'stairs'
    });
}

function createStoneRamp(x, z, length, height, rotation) {
    const rampGroup = new THREE.Group();
    const stoneTexture = createStoneTexture();

    const rampGeometry = new THREE.BoxGeometry(4, height, length);
    const rampMaterial = new THREE.MeshStandardMaterial({
        map: stoneTexture,
        roughness: 0.9,
    });

    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(0, height / 2, 0);
    ramp.rotation.x = Math.atan(height / length);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    rampGroup.add(ramp);

    rampGroup.position.set(x, 0, z);
    rampGroup.rotation.y = rotation;
    scene.add(rampGroup);

    // Collision
    collidableObjects.push({
        position: new THREE.Vector3(x, 0, z),
        radius: Math.max(length, 4) / 2,
        type: 'ramp'
    });
}

function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base wood color
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(0, 0, 256, 256);

    // Wood grain
    for (let i = 0; i < 256; i++) {
        const shade = Math.sin(i * 0.1) * 20;
        ctx.fillStyle = `rgb(${139 + shade}, ${111 + shade}, ${71 + shade})`;
        ctx.fillRect(0, i, 256, 1);
    }

    // Add some knots and variations
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = Math.random() * 10 + 5;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#5C4033');
        gradient.addColorStop(1, '#8B6F47');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// ==================== TREES ====================
function createTrees() {
    const treeCount = 80;

    for (let i = 0; i < treeCount; i++) {
        // Random position, avoiding the boardwalk center
        let x, z;
        do {
            x = (Math.random() - 0.5) * 400;
            z = (Math.random() - 0.5) * 400;
        } while (Math.abs(x) < 10 && Math.abs(z) < 10); // Keep center clear

        const tree = createTree(x, z);
        trees.push(tree);
        scene.add(tree);
    }
}

function createTree(x, z) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkHeight = Math.random() * 5 + 8;
    const trunkRadius = Math.random() * 0.3 + 0.5;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);

    const barkTexture = createBarkTexture();
    const trunkMaterial = new THREE.MeshStandardMaterial({
        map: barkTexture,
        roughness: 1.0,
        metalness: 0,
    });

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Foliage - multiple layers
    const foliageColors = [0x2d5016, 0x3a6b1c, 0x4a7c3f];
    const layers = 3;

    for (let i = 0; i < layers; i++) {
        const radius = (Math.random() * 2 + 3) * (1 - i * 0.2);
        const foliageGeometry = new THREE.SphereGeometry(radius, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: foliageColors[Math.floor(Math.random() * foliageColors.length)],
            roughness: 0.9,
            metalness: 0,
        });

        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = trunkHeight + i * 2;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);
    }

    treeGroup.position.set(x, 0, z);

    // Add collision detection
    treeGroup.userData.collidable = true;
    treeGroup.userData.radius = trunkRadius * 1.5; // Slightly larger than trunk for collision
    collidableObjects.push({
        position: new THREE.Vector3(x, 0, z),
        radius: trunkRadius * 1.5,
        type: 'tree'
    });

    return treeGroup;
}

function createBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Base bark color
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(0, 0, 128, 128);

    // Bark texture
    for (let i = 0; i < 128; i++) {
        const shade = Math.random() * 30 - 15;
        ctx.fillStyle = `rgb(${74 + shade}, ${55 + shade}, ${40 + shade})`;
        ctx.fillRect(0, i, 128, 1);
    }

    // Add vertical lines for bark texture
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 128;
        ctx.strokeStyle = '#2A1F18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 128);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}

// ==================== PONDS ====================
function createPonds() {
    const pondPositions = [
        { x: -60, z: 40, size: 15, depth: 3.5 },    // Medium depth
        { x: 50, z: -50, size: 20, depth: 6.0 },    // Deep pond with fish!
        { x: -30, z: -60, size: 12, depth: 2.0 },   // Shallow pond
    ];

    pondPositions.forEach(pos => {
        const pondData = createPond(pos.x, pos.z, pos.size, pos.depth);
        ponds.push(pondData);
        scene.add(pondData.group);

        // Add fish to deep ponds (depth > 4.0)
        if (pos.depth > 4.0) {
            createFishInPond(pondData);
        }
    });
}

function createPond(x, z, size, depth) {
    const pondGroup = new THREE.Group();

    // Water surface with animated shader
    const waterGeometry = new THREE.CircleGeometry(size, 32);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e90ff,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
    });

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.3;
    water.receiveShadow = true;
    pondGroup.add(water);

    // Store for animation
    water.userData.time = Math.random() * 100;
    pondGroup.userData.water = water;

    // Pond edge with rocks
    const rockCount = 20;
    for (let i = 0; i < rockCount; i++) {
        const angle = (i / rockCount) * Math.PI * 2;
        const distance = size + Math.random() * 2;
        const rockX = Math.cos(angle) * distance;
        const rockZ = Math.sin(angle) * distance;

        const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.5);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
        });

        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(rockX, 0.3, rockZ);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        pondGroup.add(rock);
    }

    // Add some lily pads
    const lilyPadCount = 5;
    for (let i = 0; i < lilyPadCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (size - 2);
        const lilyX = Math.cos(angle) * distance;
        const lilyZ = Math.sin(angle) * distance;

        const lilyGeometry = new THREE.CircleGeometry(0.8, 6);
        const lilyMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8,
        });

        const lily = new THREE.Mesh(lilyGeometry, lilyMaterial);
        lily.rotation.x = -Math.PI / 2;
        lily.position.set(lilyX, 0.35, lilyZ);
        pondGroup.add(lily);
    }

    pondGroup.position.set(x, 0, z);

    // Return pond data including position, size, and depth for water mechanics
    return {
        group: pondGroup,
        x: x,
        z: z,
        position: new THREE.Vector3(x, 0, z),
        size: size,
        depth: depth,
        fish: [] // Will be populated for deep ponds
    };
}

// ==================== FISH ====================
function createFishInPond(pondData) {
    const fishCount = 8;

    for (let i = 0; i < fishCount; i++) {
        const fish = createFish();

        // Random circular path in pond
        const angle = (i / fishCount) * Math.PI * 2;
        const radius = Math.random() * (pondData.size * 0.7) + pondData.size * 0.2;
        const depth = -Math.random() * (pondData.depth * 0.8) - 1.0;

        fish.userData.swimPath = {
            centerX: pondData.x,
            centerZ: pondData.z,
            radius: radius,
            speed: 0.3 + Math.random() * 0.3,
            phase: angle,
            depth: depth,
            bobAmount: 0.3 + Math.random() * 0.3
        };

        fish.position.set(
            pondData.x + Math.cos(angle) * radius,
            depth,
            pondData.z + Math.sin(angle) * radius
        );

        pondData.fish.push(fish);
        scene.add(fish);
    }
}

function createFish() {
    const fishGroup = new THREE.Group();

    // Fish body (elongated sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    bodyGeometry.scale(1.5, 0.8, 0.8); // Make it elongated

    const fishColors = [0xFF6B35, 0xF7931E, 0xFDC830, 0x4ECDC4, 0x45B7D1];
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: fishColors[Math.floor(Math.random() * fishColors.length)],
        roughness: 0.3,
        metalness: 0.6,
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    fishGroup.add(body);

    // Tail fin
    const tailGeometry = new THREE.ConeGeometry(0.2, 0.4, 3);
    const tailMaterial = new THREE.MeshStandardMaterial({
        color: bodyMaterial.color,
        roughness: 0.4,
        metalness: 0.4,
    });

    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.5;
    fishGroup.add(tail);

    // Store tail for animation
    fishGroup.userData.tail = tail;

    // Side fins
    const finGeometry = new THREE.ConeGeometry(0.1, 0.2, 3);
    const leftFin = new THREE.Mesh(finGeometry, tailMaterial);
    leftFin.rotation.z = Math.PI / 4;
    leftFin.position.set(0.1, 0, 0.3);
    fishGroup.add(leftFin);

    const rightFin = new THREE.Mesh(finGeometry, tailMaterial);
    rightFin.rotation.z = -Math.PI / 4;
    rightFin.position.set(0.1, 0, -0.3);
    fishGroup.add(rightFin);

    fishGroup.scale.set(1.2, 1.2, 1.2);
    return fishGroup;
}

// ==================== BIRDS ====================
function createBirds() {
    const birdCount = 15;

    for (let i = 0; i < birdCount; i++) {
        const bird = createBird();
        birds.push(bird);
        scene.add(bird);
    }
}

function createBird() {
    const birdGroup = new THREE.Group();

    // Simple bird shape
    const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x4169E1 : 0xDC143C,
        roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 0.7, 1.2);
    birdGroup.add(body);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.4);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F4F4F,
        roughness: 0.8,
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.4, 0, 0);
    birdGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.4, 0, 0);
    birdGroup.add(rightWing);

    // Store wings for animation
    birdGroup.userData.leftWing = leftWing;
    birdGroup.userData.rightWing = rightWing;

    // Random flight path
    const radius = Math.random() * 80 + 50;
    const speed = Math.random() * 0.3 + 0.2;
    const height = Math.random() * 20 + 15;
    const phase = Math.random() * Math.PI * 2;

    birdGroup.userData.flightPath = {
        radius: radius,
        speed: speed,
        height: height,
        phase: phase,
        offset: new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            0,
            (Math.random() - 0.5) * 100
        )
    };

    return birdGroup;
}

// ==================== AMBIENT ELEMENTS ====================
function createAmbientElements() {
    // Add some bushes
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        const bush = createBush(x, z);
        scene.add(bush);
    }

    // Add some flowers
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        const flower = createFlower(x, z);
        scene.add(flower);
    }
}

function createBush(x, z) {
    const bushGeometry = new THREE.SphereGeometry(Math.random() * 1 + 1, 8, 8);
    const bushMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        roughness: 1.0,
    });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, 1, z);
    bush.scale.set(1, 0.6, 1);
    bush.castShadow = true;
    bush.receiveShadow = true;
    return bush;
}

function createFlower(x, z) {
    const flowerGroup = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    flowerGroup.add(stem);

    // Petals
    const petalColors = [0xFF69B4, 0xFFFF00, 0xFF4500, 0x9370DB];
    const petalGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const petalMaterial = new THREE.MeshStandardMaterial({
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
    });
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    petal.position.y = 0.5;
    flowerGroup.add(petal);

    flowerGroup.position.set(x, 0, z);
    return flowerGroup;
}

// ==================== BENCHES ====================
function createBenches() {
    // Place benches along the boardwalk
    const benchPositions = [
        { x: 10, z: 12, rotation: Math.PI / 4 },
        { x: 30, z: 17, rotation: -Math.PI / 6 },
        { x: -30, z: -2, rotation: Math.PI / 3 },
        { x: 70, z: 12, rotation: Math.PI / 2 },
        { x: -50, z: 7, rotation: -Math.PI / 4 },
    ];

    benchPositions.forEach(pos => {
        const bench = createBench();
        bench.position.set(pos.x, 0, pos.z);
        bench.rotation.y = pos.rotation;
        scene.add(bench);

        // Add collision
        collidableObjects.push({
            position: new THREE.Vector3(pos.x, 0, pos.z),
            radius: 1.2,
            type: 'bench'
        });
    });
}

function createBench() {
    const benchGroup = new THREE.Group();
    const woodTexture = createWoodTexture();

    // Seat
    const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
    const seatMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.8,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.y = 0.5;
    seat.castShadow = true;
    seat.receiveShadow = true;
    benchGroup.add(seat);

    // Backrest
    const backrestGeometry = new THREE.BoxGeometry(2, 0.6, 0.1);
    const backrest = new THREE.Mesh(backrestGeometry, seatMaterial);
    backrest.position.set(0, 0.8, -0.25);
    backrest.castShadow = true;
    backrest.receiveShadow = true;
    benchGroup.add(backrest);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.9 });

    const legPositions = [
        [-0.8, 0.25, 0.2],
        [0.8, 0.25, 0.2],
        [-0.8, 0.25, -0.2],
        [0.8, 0.25, -0.2],
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        benchGroup.add(leg);
    });

    return benchGroup;
}

// ==================== LAMP POSTS ====================
function createLampPosts() {
    const lampPositions = [
        { x: 0, z: 8 },
        { x: 40, z: 12 },
        { x: 80, z: 17 },
        { x: -40, z: -3 },
        { x: -80, z: 12 },
    ];

    lampPositions.forEach(pos => {
        const lamp = createLampPost(pos.x, pos.z);
        scene.add(lamp);
    });
}

function createLampPost(x, z) {
    const lampGroup = new THREE.Group();

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 5);
    const poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x2C2C2C,
        roughness: 0.7,
        metalness: 0.3,
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2.5;
    pole.castShadow = true;
    lampGroup.add(pole);

    // Lamp head
    const lampHeadGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.5);
    const lampHeadMaterial = new THREE.MeshStandardMaterial({
        color: 0x1C1C1C,
        roughness: 0.5,
        metalness: 0.5,
    });
    const lampHead = new THREE.Mesh(lampHeadGeometry, lampHeadMaterial);
    lampHead.position.y = 5.25;
    lampHead.castShadow = true;
    lampGroup.add(lampHead);

    // Light source
    const pointLight = new THREE.PointLight(0xFFE4B5, 0.5, 20);
    pointLight.position.set(0, 5, 0);
    pointLight.castShadow = true;
    lampGroup.add(pointLight);
    lampLights.push(pointLight);

    // Lamp glow
    const glowGeometry = new THREE.SphereGeometry(0.2);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFE4B5,
        transparent: true,
        opacity: 0.8,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 5;
    lampGroup.add(glow);

    lampGroup.position.set(x, 0, z);
    return lampGroup;
}

// ==================== BOULDERS ====================
function createBoulders() {
    for (let i = 0; i < 25; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        const boulder = createBoulder(x, z);
        scene.add(boulder);
    }
}

function createBoulder(x, z) {
    const size = Math.random() * 2 + 1;
    const boulderGeometry = new THREE.DodecahedronGeometry(size, 1);

    // Random color variation for rocks
    const grayValue = Math.random() * 40 + 100;
    const boulderMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`rgb(${grayValue}, ${grayValue}, ${grayValue})`),
        roughness: 0.95,
        metalness: 0.1,
    });

    const boulder = new THREE.Mesh(boulderGeometry, boulderMaterial);
    boulder.position.set(x, size * 0.5, z);
    boulder.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    boulder.castShadow = true;
    boulder.receiveShadow = true;

    // Add collision (only for larger boulders)
    if (size > 1.5) {
        collidableObjects.push({
            position: new THREE.Vector3(x, 0, z),
            radius: size,
            type: 'boulder'
        });
    }

    return boulder;
}

// ==================== BUTTERFLIES ====================
function createButterflies() {
    const butterflyCount = 12;

    for (let i = 0; i < butterflyCount; i++) {
        const butterfly = createButterfly();
        butterflies.push(butterfly);
        scene.add(butterfly);
    }
}

function createButterfly() {
    const butterflyGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1C1C1C });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    butterflyGroup.add(body);

    // Wings
    const wingColors = [0xFF69B4, 0xFF1493, 0xFFD700, 0xFF4500, 0x9370DB];
    const wingColor = wingColors[Math.floor(Math.random() * wingColors.length)];

    const wingGeometry = new THREE.CircleGeometry(0.15, 8);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: wingColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0.1, 0);
    leftWing.rotation.y = Math.PI / 4;
    butterflyGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, -0.1, 0);
    rightWing.rotation.y = -Math.PI / 4;
    butterflyGroup.add(rightWing);

    // Store wings for animation
    butterflyGroup.userData.leftWing = leftWing;
    butterflyGroup.userData.rightWing = rightWing;

    // Random flight path
    butterflyGroup.userData.flightPath = {
        center: new THREE.Vector3(
            (Math.random() - 0.5) * 150,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * 150
        ),
        radius: Math.random() * 10 + 5,
        speed: Math.random() * 0.5 + 0.3,
        phase: Math.random() * Math.PI * 2,
        heightOffset: Math.random() * Math.PI * 2,
    };

    return butterflyGroup;
}

// ==================== DRAGONFLIES ====================
function createDragonflies() {
    const dragonflyCount = 10;

    ponds.forEach(pond => {
        for (let i = 0; i < dragonflyCount / 3; i++) {
            const dragonfly = createDragonfly(pond.group.position);
            dragonflies.push(dragonfly);
            scene.add(dragonfly);
        }
    });
}

function createDragonfly(pondPosition) {
    const dragonflyGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x00CED1,
        metalness: 0.6,
        roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    dragonflyGroup.add(body);

    // Wings
    const wingGeometry = new THREE.PlaneGeometry(0.3, 0.15);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0xE0FFFF,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
    });

    const wingPositions = [
        { x: -0.1, y: 0.15, z: 0 },
        { x: -0.1, y: -0.15, z: 0 },
        { x: 0.1, y: 0.15, z: 0 },
        { x: 0.1, y: -0.15, z: 0 },
    ];

    const wings = [];
    wingPositions.forEach(pos => {
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set(pos.x, pos.y, pos.z);
        dragonflyGroup.add(wing);
        wings.push(wing);
    });

    dragonflyGroup.userData.wings = wings;

    // Flight path around pond
    dragonflyGroup.userData.flightPath = {
        center: pondPosition.clone(),
        radius: Math.random() * 15 + 10,
        speed: Math.random() * 0.8 + 0.5,
        phase: Math.random() * Math.PI * 2,
        height: Math.random() * 2 + 1.5,
    };

    return dragonflyGroup;
}

// ==================== CLOUDS ====================
function createClouds() {
    const cloudCount = 15;

    for (let i = 0; i < cloudCount; i++) {
        const cloud = createCloud();
        clouds.push(cloud);
        scene.add(cloud);
    }
}

function createCloud() {
    const cloudGroup = new THREE.Group();

    // Multiple spheres to create cloud shape
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8,
        roughness: 1.0,
    });

    const puffCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < puffCount; i++) {
        const puffGeometry = new THREE.SphereGeometry(
            Math.random() * 3 + 2,
            8,
            8
        );
        const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
        puff.position.set(
            (Math.random() - 0.5) * 8,
            Math.random() * 2,
            (Math.random() - 0.5) * 8
        );
        puff.scale.set(1, 0.6, 1);
        cloudGroup.add(puff);
    }

    // Random position in sky
    cloudGroup.position.set(
        (Math.random() - 0.5) * 400,
        Math.random() * 30 + 60,
        (Math.random() - 0.5) * 400
    );

    cloudGroup.userData.speed = Math.random() * 2 + 1;

    return cloudGroup;
}

// ==================== GAZEBO ====================
function createGazebo() {
    const gazeboGroup = new THREE.Group();
    const gazeboX = -70;
    const gazeboZ = -30;

    // Floor
    const floorGeometry = new THREE.CylinderGeometry(6, 6, 0.3, 8);
    const woodTexture = createWoodTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0.15;
    floor.castShadow = true;
    floor.receiveShadow = true;
    gazeboGroup.add(floor);

    // Pillars
    const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4);
    const pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0xF5F5DC,
        roughness: 0.8,
    });

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(
            Math.cos(angle) * 5,
            2.3,
            Math.sin(angle) * 5
        );
        pillar.castShadow = true;
        gazeboGroup.add(pillar);
    }

    // Roof
    const roofGeometry = new THREE.ConeGeometry(7, 2, 8);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5.3;
    roof.castShadow = true;
    gazeboGroup.add(roof);

    gazeboGroup.position.set(gazeboX, 0, gazeboZ);
    scene.add(gazeboGroup);

    // Add collision for gazebo
    collidableObjects.push({
        position: new THREE.Vector3(gazeboX, 0, gazeboZ),
        radius: 6.5,
        type: 'gazebo'
    });
}

// ==================== PARK SIGNS ====================
function createParkSigns() {
    const signPositions = [
        { x: 5, z: 15, text: 'Welcome\nto Park' },
        { x: -45, z: -8, text: 'Nature\nTrail' },
        { x: 85, z: 18, text: 'Scenic\nView' },
    ];

    signPositions.forEach(pos => {
        const sign = createParkSign(pos.text);
        sign.position.set(pos.x, 0, pos.z);
        scene.add(sign);

        // Add collision
        collidableObjects.push({
            position: new THREE.Vector3(pos.x, 0, pos.z),
            radius: 0.8,
            type: 'sign'
        });
    });
}

function createParkSign(text) {
    const signGroup = new THREE.Group();

    // Post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3728,
        roughness: 0.9,
    });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = 1;
    post.castShadow = true;
    signGroup.add(post);

    // Sign board
    const boardGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    const woodTexture = createWoodTexture();
    const boardMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.8,
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = 2.5;
    board.castShadow = true;
    board.receiveShadow = true;
    signGroup.add(board);

    return signGroup;
}

// ==================== BRIDGE ====================
function createBridge() {
    const bridgeGroup = new THREE.Group();
    const bridgeX = 50;
    const bridgeZ = -45;

    // Bridge deck
    const deckGeometry = new THREE.BoxGeometry(8, 0.3, 3);
    const woodTexture = createWoodTexture();
    const deckMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.9,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 1;
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Railings
    const railingMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
    });

    // Side rails
    for (let side = -1; side <= 1; side += 2) {
        const railGeometry = new THREE.BoxGeometry(8, 0.1, 0.1);
        const rail = new THREE.Mesh(railGeometry, railingMaterial);
        rail.position.set(0, 2, side * 1.5);
        rail.castShadow = true;
        bridgeGroup.add(rail);

        // Vertical posts
        for (let i = -3; i <= 3; i += 1.5) {
            const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1);
            const post = new THREE.Mesh(postGeometry, railingMaterial);
            post.position.set(i, 1.5, side * 1.5);
            post.castShadow = true;
            bridgeGroup.add(post);
        }
    }

    // Support beams underneath
    const beamGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
    const beamMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3728,
        roughness: 0.9,
    });

    for (let i = -3; i <= 3; i += 2) {
        for (let side = -1; side <= 1; side += 2) {
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(i, 0, side * 1);
            beam.castShadow = true;
            bridgeGroup.add(beam);
        }
    }

    bridgeGroup.position.set(bridgeX, 0, bridgeZ);
    scene.add(bridgeGroup);
}

// ==================== BUILDINGS ====================
function createBuildings() {
    // Create 2 multi-story buildings in the park
    createBuilding(-100, -80, 2); // 2-story building
    createBuilding(120, 50, 3);   // 3-story building
}

function createBuilding(x, z, floors) {
    const buildingGroup = new THREE.Group();
    const floorHeight = 4;
    const width = 15;
    const depth = 12;

    // Create brick texture
    const brickTexture = createBrickTexture();

    // Wall material
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: brickTexture,
        roughness: 0.9,
        metalness: 0.1,
    });

    // Floor/ceiling material
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.8,
    });

    // Build each floor
    for (let floor = 0; floor < floors; floor++) {
        const floorY = floor * floorHeight;

        // Floor platform
        const floorGeometry = new THREE.BoxGeometry(width, 0.3, depth);
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.position.y = floorY;
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        buildingGroup.add(floorMesh);

        // Walls (4 sides with gaps for doors/windows)
        const wallHeight = floorHeight - 0.3;

        // Front wall (with door on ground floor)
        if (floor === 0) {
            // Left piece
            const leftWallGeom = new THREE.BoxGeometry(width * 0.3, wallHeight, 0.3);
            const leftWall = new THREE.Mesh(leftWallGeom, wallMaterial);
            leftWall.position.set(-width * 0.35, floorY + wallHeight / 2, depth / 2);
            leftWall.castShadow = true;
            leftWall.receiveShadow = true;
            buildingGroup.add(leftWall);

            // Right piece
            const rightWallGeom = new THREE.BoxGeometry(width * 0.3, wallHeight, 0.3);
            const rightWall = new THREE.Mesh(rightWallGeom, wallMaterial);
            rightWall.position.set(width * 0.35, floorY + wallHeight / 2, depth / 2);
            rightWall.castShadow = true;
            rightWall.receiveShadow = true;
            buildingGroup.add(rightWall);

            // Top piece (above door)
            const topWallGeom = new THREE.BoxGeometry(width * 0.4, wallHeight * 0.3, 0.3);
            const topWall = new THREE.Mesh(topWallGeom, wallMaterial);
            topWall.position.set(0, floorY + wallHeight * 0.85, depth / 2);
            topWall.castShadow = true;
            buildingGroup.add(topWall);

            // Create door
            createDoor(buildingGroup, x, z, 0, floorY, depth / 2);
        } else {
            // Upper floors - full wall with windows
            const frontWallGeom = new THREE.BoxGeometry(width, wallHeight, 0.3);
            const frontWall = new THREE.Mesh(frontWallGeom, wallMaterial);
            frontWall.position.set(0, floorY + wallHeight / 2, depth / 2);
            frontWall.castShadow = true;
            frontWall.receiveShadow = true;
            buildingGroup.add(frontWall);
        }

        // Back wall
        const backWallGeom = new THREE.BoxGeometry(width, wallHeight, 0.3);
        const backWall = new THREE.Mesh(backWallGeom, wallMaterial);
        backWall.position.set(0, floorY + wallHeight / 2, -depth / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        buildingGroup.add(backWall);

        // Left wall
        const leftSideWallGeom = new THREE.BoxGeometry(0.3, wallHeight, depth);
        const leftSideWall = new THREE.Mesh(leftSideWallGeom, wallMaterial);
        leftSideWall.position.set(-width / 2, floorY + wallHeight / 2, 0);
        leftSideWall.castShadow = true;
        leftSideWall.receiveShadow = true;
        buildingGroup.add(leftSideWall);

        // Right wall
        const rightSideWallGeom = new THREE.BoxGeometry(0.3, wallHeight, depth);
        const rightSideWall = new THREE.Mesh(rightSideWallGeom, wallMaterial);
        rightSideWall.position.set(width / 2, floorY + wallHeight / 2, 0);
        rightSideWall.castShadow = true;
        rightSideWall.receiveShadow = true;
        buildingGroup.add(rightSideWall);

        // Windows
        if (floor > 0) {
            createWindows(buildingGroup, floorY + wallHeight / 2, width, depth);
        }

        // Interior stairs (if not top floor)
        if (floor < floors - 1) {
            createInteriorStairs(buildingGroup, floorY, floorHeight);
        }
    }

    // Roof
    const roofGeometry = new THREE.ConeGeometry(width * 0.8, 2.5, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = floors * floorHeight + 1.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    buildingGroup.add(roof);

    buildingGroup.position.set(x, 0, z);
    scene.add(buildingGroup);

    // Add collision for building exterior
    collidableObjects.push({
        position: new THREE.Vector3(x, 0, z),
        radius: Math.max(width, depth) / 2 + 1,
        type: 'building'
    });

    // Store building data
    buildings.push({
        group: buildingGroup,
        x: x,
        z: z,
        width: width,
        depth: depth,
        floors: floors,
        floorHeight: floorHeight
    });

    // Add treasure chests to random floors
    const treasureFloor = Math.floor(Math.random() * floors);
    createHiddenTreasureInBuilding(buildingGroup, x, z, treasureFloor * floorHeight + 1, width, depth);
}

function createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base brick color
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(0, 0, 256, 256);

    // Individual bricks
    const brickWidth = 64;
    const brickHeight = 32;

    for (let y = 0; y < 256; y += brickHeight) {
        for (let x = 0; x < 256; x += brickWidth) {
            const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
            const brickX = x + offset;

            // Brick color variation
            const shade = Math.random() * 30 - 15;
            ctx.fillStyle = `rgb(${160 + shade}, ${82 + shade}, ${45 + shade})`;
            ctx.fillRect(brickX, y, brickWidth - 2, brickHeight - 2);

            // Mortar lines
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(brickX, y, brickWidth - 2, brickHeight - 2);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}

function createDoor(parent, buildingX, buildingZ, localX, localY, localZ) {
    const doorGroup = new THREE.Group();

    const doorWidth = 2.5;
    const doorHeight = 3.2;

    // Door frame
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3728,
        roughness: 0.9,
    });

    // Door
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.2);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
    });

    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(localX, localY + doorHeight / 2, localZ);
    door.castShadow = true;
    door.receiveShadow = true;
    doorGroup.add(door);

    // Door handle
    const handleGeometry = new THREE.SphereGeometry(0.1);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.9,
        roughness: 0.2,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(localX + doorWidth / 3, localY + doorHeight / 2, localZ + 0.15);
    doorGroup.add(handle);

    parent.add(doorGroup);

    // Store door data for interaction
    doors.push({
        mesh: doorGroup,
        position: new THREE.Vector3(buildingX + localX, localY + doorHeight / 2, buildingZ + localZ),
        isOpen: false,
        buildingX: buildingX,
        buildingZ: buildingZ
    });
}

function createWindows(parent, y, width, depth) {
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.6,
        metalness: 0.5,
        roughness: 0.1,
    });

    // Front windows
    for (let i = -1; i <= 1; i++) {
        const windowGeom = new THREE.BoxGeometry(1.5, 1.8, 0.1);
        const window = new THREE.Mesh(windowGeom, windowMaterial);
        window.position.set(i * 4, y, depth / 2 + 0.2);
        parent.add(window);
    }

    // Side windows
    for (let side = -1; side <= 1; side += 2) {
        const windowGeom = new THREE.BoxGeometry(0.1, 1.8, 1.5);
        const window = new THREE.Mesh(windowGeom, windowMaterial);
        window.position.set(side * (width / 2 + 0.1), y, 0);
        parent.add(window);
    }
}

function createInteriorStairs(parent, baseY, floorHeight) {
    const stairMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.8,
    });

    const numSteps = 10;
    const stepWidth = 2;
    const stepDepth = 0.8;
    const stepHeight = floorHeight / numSteps;

    for (let i = 0; i < numSteps; i++) {
        const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight * (i + 1), stepDepth);
        const step = new THREE.Mesh(stepGeometry, stairMaterial);
        step.position.set(-4, baseY + stepHeight * (i + 0.5), -3 + i * stepDepth);
        step.castShadow = true;
        step.receiveShadow = true;
        parent.add(step);
    }
}

function createHiddenTreasureInBuilding(parent, buildingX, buildingZ, floorY, width, depth) {
    // Create a gem treasure inside the building
    const gemGeometry = new THREE.OctahedronGeometry(0.5);
    const gemMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF00FF, // Purple gem - special building treasure
        emissive: 0xFF00FF,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
    });

    const gem = new THREE.Mesh(gemGeometry, gemMaterial);

    // Place in corner of room
    const roomX = (Math.random() - 0.5) * (width - 4);
    const roomZ = (Math.random() - 0.5) * (depth - 4);

    gem.position.set(roomX, floorY + 1, roomZ);
    gem.castShadow = true;
    parent.add(gem);

    // Setup userData for game logic
    gem.userData = {
        type: 'building_treasure',
        value: 200,
        collected: false,
        rotationSpeed: 1.0,
        baseHeight: floorY + 1
    };

    // Add to collectibles
    collectibles.push(gem);

    gameState.totalGems++;
}

// ==================== ADDITIONAL AMBIENT ELEMENTS ====================
function createTreeStumps() {
    for (let i = 0; i < 8; i++) {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        const stump = createTreeStump(x, z);
        scene.add(stump);
    }
}

function createTreeStump(x, z) {
    const stumpGroup = new THREE.Group();

    const stumpGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.8, 8);
    const barkTexture = createBarkTexture();
    const stumpMaterial = new THREE.MeshStandardMaterial({
        map: barkTexture,
        roughness: 1.0,
    });

    const stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
    stump.position.y = 0.4;
    stump.castShadow = true;
    stump.receiveShadow = true;
    stumpGroup.add(stump);

    // Top rings
    const topGeometry = new THREE.CircleGeometry(0.6, 16);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0xD2691E,
        roughness: 0.95,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.8;
    top.receiveShadow = true;
    stumpGroup.add(top);

    stumpGroup.position.set(x, 0, z);
    return stumpGroup;
}

function createMushrooms() {
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 250;
        const z = (Math.random() - 0.5) * 250;
        const mushroom = createMushroom(x, z);
        scene.add(mushroom);
    }
}

function createMushroom(x, z) {
    const mushroomGroup = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.3);
    const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFF8DC,
        roughness: 0.9,
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.15;
    stem.castShadow = true;
    mushroomGroup.add(stem);

    // Cap
    const capGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const capColors = [0xFF6347, 0xDC143C, 0x8B4513];
    const capMaterial = new THREE.MeshStandardMaterial({
        color: capColors[Math.floor(Math.random() * capColors.length)],
        roughness: 0.7,
    });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 0.35;
    cap.scale.set(1, 0.6, 1);
    cap.castShadow = true;
    mushroomGroup.add(cap);

    mushroomGroup.position.set(x, 0, z);
    return mushroomGroup;
}

function createReeds() {
    ponds.forEach(pond => {
        const pondPos = pond.position;
        const pondSize = pond.size;

        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = pondSize + Math.random() * 3;
            const x = pondPos.x + Math.cos(angle) * distance;
            const z = pondPos.z + Math.sin(angle) * distance;

            const reed = createReed(x, z);
            scene.add(reed);
        }
    });
}

function createReed(x, z) {
    const reedGroup = new THREE.Group();

    const height = Math.random() * 1.5 + 1;
    const reedGeometry = new THREE.CylinderGeometry(0.02, 0.03, height, 4);
    const reedMaterial = new THREE.MeshStandardMaterial({
        color: 0x6B8E23,
        roughness: 0.9,
    });

    const reed = new THREE.Mesh(reedGeometry, reedMaterial);
    reed.position.y = height / 2;
    reed.rotation.set(
        Math.random() * 0.2 - 0.1,
        0,
        Math.random() * 0.2 - 0.1
    );
    reed.castShadow = true;
    reedGroup.add(reed);

    reedGroup.position.set(x, 0, z);
    return reedGroup;
}

// Call additional elements in init
function createAdditionalElements() {
    createTreeStumps();
    createMushrooms();
    createReeds();
}

// ==================== GAME ELEMENTS ====================
function createCollectibles() {
    const gemPositions = [
        // Ground level gems
        { x: 15, z: 20, type: 'gem', height: 0 },
        { x: -35, z: 15, type: 'gem', height: 0 },
        { x: 45, z: -10, type: 'gem', height: 0 },
        { x: -55, z: -25, type: 'gem', height: 0 },
        { x: 75, z: 20, type: 'gem', height: 0 },

        // Elevated platform gems (requires jumping/climbing!)
        { x: -45, z: 50, type: 'gem', height: 3.5 }, // On viewing platform
        { x: 65, z: -60, type: 'gem', height: 5.5 }, // On rocky outcrop
        { x: -85, z: -20, type: 'gem', height: 4.5 }, // On stone terrace
        { x: 35, z: 30, type: 'gem', height: 3 }, // On elevated platform
        { x: 90, z: 25, type: 'gem', height: 4 }, // On hillside platform

        // Coins at various heights
        { x: 60, z: -30, type: 'coin', height: 0 },
        { x: -25, z: 25, type: 'coin', height: 0 },
        { x: 10, z: -30, type: 'coin', height: 3.5 }, // On central overlook
        { x: -10, z: -70, type: 'coin', height: 4.5 }, // On natural rock formation
        { x: 50, z: 40, type: 'coin', height: 0 },
    ];

    gemPositions.forEach(pos => {
        const collectible = createCollectible(pos.x, pos.z, pos.type, pos.height);
        collectibles.push(collectible);
        scene.add(collectible);
    });

    gameState.totalGems = gemPositions.filter(p => p.type === 'gem').length;
}

function createCollectible(x, z, type, elevationHeight = 0) {
    const collectibleGroup = new THREE.Group();

    let geometry, material, value;
    if (type === 'gem') {
        geometry = new THREE.OctahedronGeometry(0.4);
        material = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x00FFFF,
            emissiveIntensity: 0.5,
        });
        value = 100;
    } else {
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 1.0,
            roughness: 0.2,
            emissive: 0xFFD700,
            emissiveIntensity: 0.3,
        });
        value = 10;
    }

    const mesh = new THREE.Mesh(geometry, material);
    collectibleGroup.add(mesh);

    // Glow effect
    const glowGeometry = geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: type === 'gem' ? 0x00FFFF : 0xFFD700,
        transparent: true,
        opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.set(1.3, 1.3, 1.3);
    collectibleGroup.add(glow);

    // Position at specified height (for elevated platforms)
    collectibleGroup.position.set(x, 1.5 + elevationHeight, z);
    collectibleGroup.userData.type = type;
    collectibleGroup.userData.value = value;
    collectibleGroup.userData.collected = false;
    collectibleGroup.userData.rotationSpeed = Math.random() * 2 + 1;
    collectibleGroup.userData.baseHeight = 1.5 + elevationHeight; // Store base height for animation

    return collectibleGroup;
}

function createTreasure() {
    const treasureGroup = new THREE.Group();
    const gazeboX = -70;
    const gazeboZ = -30;

    // Treasure chest
    const chestGeometry = new THREE.BoxGeometry(1, 0.8, 0.6);
    const chestMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.y = 0.4;
    treasureGroup.add(chest);

    // Lid
    const lidGeometry = new THREE.BoxGeometry(1.1, 0.2, 0.7);
    const lid = new THREE.Mesh(lidGeometry, chestMaterial);
    lid.position.set(0, 0.9, -0.15);
    lid.rotation.x = -0.5;
    treasureGroup.add(lid);

    // Gold glow
    const glowGeometry = new THREE.SphereGeometry(0.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.5,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1;
    treasureGroup.add(glow);

    treasureGroup.position.set(gazeboX, 0.3, gazeboZ);
    treasureGroup.userData.isTreasure = true;
    treasureGroup.userData.collected = false;

    scene.add(treasureGroup);
    collectibles.push(treasureGroup);
}

function startGame() {
    gameState.gameStarted = true;
    gameState.startTime = clock.getElapsedTime();
    updateGameUI();
}

function updateGameUI() {
    document.getElementById('game-score').textContent = gameState.score;
    document.getElementById('gems-collected').textContent =
        `${gameState.gemsCollected}/${gameState.totalGems}`;

    // Update objectives
    const objectivesList = document.getElementById('objectives-list');
    objectivesList.innerHTML = '';
    gameState.objectives.forEach((obj, index) => {
        const li = document.createElement('li');
        li.className = obj.completed ? 'completed' : '';
        li.innerHTML = `${obj.completed ? '✓' : '○'} ${obj.text}`;
        objectivesList.appendChild(li);
    });
}

function checkCollectibles() {
    const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
    const collectiblePos = new THREE.Vector3();

    collectibles.forEach(collectible => {
        if (collectible.userData.collected) return;

        collectible.getWorldPosition(collectiblePos);

        // Calculate horizontal and vertical distances
        const horizontalDist = Math.sqrt(
            Math.pow(playerPos.x - collectiblePos.x, 2) +
            Math.pow(playerPos.z - collectiblePos.z, 2)
        );
        const verticalDist = Math.abs(playerPos.y - collectiblePos.y);

        // Collect if close horizontally and vertically
        if (horizontalDist < 2.0 && verticalDist < 2.5) {
            collectItem(collectible);
        }
    });
}

function collectItem(collectible) {
    collectible.userData.collected = true;

    if (collectible.userData.isTreasure) {
        gameState.treasureFound = true;
        gameState.score += 500;
        gameState.objectives[1].completed = true;
        showNotification('🎉 Treasure Found! +500 points!');
        playCollectSound('treasure');
    } else if (collectible.userData.type === 'gem') {
        gameState.gemsCollected++;
        gameState.score += collectible.userData.value;
        showNotification(`💎 Gem Collected! +${collectible.userData.value}`);
        playCollectSound('gem');

        if (gameState.gemsCollected >= gameState.totalGems) {
            gameState.objectives[0].completed = true;
        }
    } else {
        gameState.score += collectible.userData.value;
        showNotification(`🪙 Coin +${collectible.userData.value}`);
        playCollectSound('coin');
    }

    // Remove from scene with animation
    const originalY = collectible.position.y;
    let animTime = 0;
    const animateCollect = () => {
        animTime += 0.05;
        collectible.position.y = originalY + animTime * 2;
        collectible.scale.set(1 - animTime, 1 - animTime, 1 - animTime);

        if (animTime < 1) {
            requestAnimationFrame(animateCollect);
        } else {
            scene.remove(collectible);
        }
    };
    animateCollect();

    updateGameUI();
    checkWinCondition();
}

function playCollectSound(type) {
    // Create simple beep sounds using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'gem') {
            oscillator.frequency.value = 800;
        } else if (type === 'coin') {
            oscillator.frequency.value = 600;
        } else if (type === 'treasure') {
            oscillator.frequency.value = 1000;
        }

        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Audio not available');
    }
}

function checkPondVisits() {
    const playerPos = new THREE.Vector3(camera.position.x, 0, camera.position.z);

    ponds.forEach((pond, index) => {
        const pondPos = pond.group.position;
        const distance = playerPos.distanceTo(pondPos);

        if (distance < 20 && !gameState.pondsVisited.has(index)) {
            gameState.pondsVisited.add(index);
            showNotification(`🌊 Pond ${index + 1} Discovered!`);

            if (gameState.pondsVisited.size >= 3) {
                gameState.objectives[2].completed = true;
                updateGameUI();
            }
        }
    });
}

function checkWinCondition() {
    if (!gameState.gameWon &&
        gameState.objectives.every(obj => obj.completed)) {
        gameState.gameWon = true;
        showGameWinScreen();
    }
}

function showGameWinScreen() {
    const winScreen = document.createElement('div');
    winScreen.id = 'win-screen';
    winScreen.innerHTML = `
        <div style="background: rgba(0, 0, 0, 0.95); color: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 500px;">
            <h1 style="color: #FFD700; font-size: 48px; margin-bottom: 20px;">🎉 YOU WIN! 🎉</h1>
            <p style="font-size: 24px; margin: 20px 0;">Final Score: ${gameState.score}</p>
            <p style="font-size: 18px; margin: 10px 0;">Time: ${Math.floor(gameState.timeElapsed)}s</p>
            <p style="font-size: 18px; margin: 10px 0;">Gems: ${gameState.gemsCollected}/${gameState.totalGems}</p>
            <p style="margin-top: 30px;">All objectives completed!</p>
            <button class="button" onclick="location.reload()" style="margin-top: 30px;">Play Again</button>
        </div>
    `;
    winScreen.style.position = 'fixed';
    winScreen.style.top = '50%';
    winScreen.style.left = '50%';
    winScreen.style.transform = 'translate(-50%, -50%)';
    winScreen.style.zIndex = '1000';
    document.body.appendChild(winScreen);

    playCollectSound('treasure');
    setTimeout(() => playCollectSound('treasure'), 200);
    setTimeout(() => playCollectSound('treasure'), 400);
}

// Collision Detection with height awareness
function checkCollision(newX, newZ, playerY) {
    const playerPos = new THREE.Vector2(newX, newZ);

    for (let obj of collidableObjects) {
        const objPos = new THREE.Vector2(obj.position.x, obj.position.z);
        const distance = playerPos.distanceTo(objPos);

        if (distance < (PLAYER_RADIUS + obj.radius)) {
            // Only platforms with defined height can be jumped over
            const objHeight = obj.height;

            // For elevated platforms: check if player is high enough to jump over
            if (objHeight !== undefined && playerY > objHeight + 1.5) {
                continue; // No collision, player is jumping over platform
            }

            // For all other objects (trees, boulders) or when at platform level: collision applies
            return true;
        }
    }

    // Check boundaries
    if (Math.abs(newX) > 240 || Math.abs(newZ) > 240) {
        return true;
    }

    return false;
}

// Get the ground height at a position (for landing on platforms)
function getGroundHeight(x, z, currentY) {
    let maxGroundHeight = 0; // Base ground level
    const playerPos = new THREE.Vector2(x, z);

    for (let obj of collidableObjects) {
        // Only check platforms (terraces, outcrops, etc.) that have height
        if (!obj.height) continue;

        const objPos = new THREE.Vector2(obj.position.x, obj.position.z);
        const distance = playerPos.distanceTo(objPos);

        // If player is above this platform
        if (distance < obj.radius) {
            const platformTop = obj.height;

            // Check if player is falling onto this platform
            // (within reasonable range above it)
            if (currentY >= platformTop - 0.5 && currentY <= platformTop + 3) {
                maxGroundHeight = Math.max(maxGroundHeight, platformTop);
            }
        }
    }

    return maxGroundHeight;
}

// Get water depth if player is in a pond
function getWaterDepth(x, z) {
    for (let pond of ponds) {
        const distanceToPondCenter = Math.sqrt(
            Math.pow(x - pond.x, 2) + Math.pow(z - pond.z, 2)
        );

        // Check if player is within pond radius
        if (distanceToPondCenter < pond.size) {
            // Calculate depth based on distance from center
            // Deeper at center, shallower at edges
            const depthFactor = 1 - (distanceToPondCenter / pond.size);
            const currentDepth = pond.depth * depthFactor;

            return {
                inWater: true,
                depth: currentDepth,
                maxDepth: pond.depth,
                distanceFromCenter: distanceToPondCenter,
                pondSize: pond.size
            };
        }
    }

    return { inWater: false, depth: 0 };
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Keyboard controls
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump) velocity.y = JUMP_VELOCITY;
                canJump = false;
                break;
            case 'ShiftLeft':
                isRunning = true;
                break;
            case 'KeyN':
                toggleDayNight();
                break;
            case 'KeyF':
                toggleFog();
                break;
            case 'KeyE':
                toggleNearbyDoor();
                break;
            case 'KeyB':
                showNotification('Bird sounds enabled! 🐦');
                break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
            case 'ShiftLeft':
                isRunning = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // UI controls
    document.getElementById('toggle-info').addEventListener('click', () => {
        const panel = document.getElementById('info-panel');
        const button = document.getElementById('toggle-info');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            button.textContent = 'Hide Info';
        } else {
            panel.style.display = 'none';
            button.textContent = 'Show Info';
        }
    });

    document.getElementById('reset-position').addEventListener('click', () => {
        camera.position.set(0, 5, 0);
        velocity.set(0, 0, 0);
        showNotification('Position Reset');
    });

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==================== INTERACTIVE FEATURES ====================
function toggleDayNight() {
    isDay = !isDay;

    if (isDay) {
        // Day time
        scene.background = new THREE.Color(0x87CEEB);
        if (fogEnabled) scene.fog = new THREE.Fog(0x87CEEB, 50, 400);
        sun.intensity = 1.5;
        moonLight.intensity = 0;
        ambientLight.intensity = 0.5;

        // Turn off lamp lights
        lampLights.forEach(light => {
            light.intensity = 0;
        });

        document.getElementById('time').textContent = 'Day';
        showNotification('Day Time ☀️');
    } else {
        // Night time
        scene.background = new THREE.Color(0x0a0a2e);
        if (fogEnabled) scene.fog = new THREE.Fog(0x0a0a2e, 30, 200);
        sun.intensity = 0;
        moonLight.intensity = 0.8;
        ambientLight.intensity = 0.2;

        // Turn on lamp lights
        lampLights.forEach(light => {
            light.intensity = 1.2;
        });

        document.getElementById('time').textContent = 'Night';
        showNotification('Night Time 🌙');
    }
}

function toggleFog() {
    fogEnabled = !fogEnabled;
    if (fogEnabled) {
        scene.fog = isDay ? new THREE.Fog(0x87CEEB, 50, 400) : new THREE.Fog(0x0a0a2e, 30, 200);
        showNotification('Fog Enabled');
    } else {
        scene.fog = null;
        showNotification('Fog Disabled');
    }
}

function toggleNearbyDoor() {
    const playerPos = camera.position;

    // Check each door
    for (let door of doors) {
        const distance = playerPos.distanceTo(door.position);

        // If player is within 3 units of door
        if (distance < 3) {
            door.isOpen = !door.isOpen;

            // Animate door opening/closing
            if (door.isOpen) {
                // Slide door to the side
                door.mesh.position.x += 2.5;
                showNotification('Door opened');
            } else {
                // Close door
                door.mesh.position.x -= 2.5;
                showNotification('Door closed');
            }

            return; // Only toggle one door at a time
        }
    }

    // No door nearby
    showNotification('No door nearby (Press E near a door)');
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// ==================== ANIMATION ====================
function animate() {
    requestAnimationFrame(animate);

    deltaTime = clock.getDelta();

    // Update controls
    if (controls.isLocked) {
        updateMovement();
    }

    // Animate birds
    animateBirds();

    // Animate fish
    animateFish();

    // Animate water
    animateWater();

    // Animate butterflies
    animateButterflies();

    // Animate dragonflies
    animateDragonflies();

    // Animate clouds
    animateClouds();

    // Animate collectibles
    animateCollectibles();

    // Check game elements
    if (gameState.gameStarted && !gameState.gameWon) {
        checkCollectibles();
        checkPondVisits();
        gameState.timeElapsed = clock.getElapsedTime() - gameState.startTime;
    }

    // Update stats
    updateStats();

    // Render
    renderer.render(scene, camera);
}

function updateMovement() {
    // Apply gravity
    velocity.y -= 9.8 * 5.0 * deltaTime;

    // Update current ground height based on position
    currentGroundHeight = getGroundHeight(camera.position.x, camera.position.z, camera.position.y);

    // Check if on ground (with tolerance)
    const groundLevel = currentGroundHeight + PLAYER_HEIGHT;
    const isGrounded = camera.position.y <= groundLevel + 0.1;

    // Apply friction (less in air for better control)
    if (isGrounded) {
        // Strong friction on ground
        velocity.x -= velocity.x * 10.0 * deltaTime;
        velocity.z -= velocity.z * 10.0 * deltaTime;
    } else {
        // Light friction in air (air resistance)
        velocity.x -= velocity.x * 2.0 * deltaTime;
        velocity.z -= velocity.z * 2.0 * deltaTime;
    }

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    // Check if player is in water
    const waterData = getWaterDepth(camera.position.x, camera.position.z);
    let waterResistance = 1.0;
    let sinkRate = 0;

    if (waterData.inWater && isGrounded) {
        // Progressive sinking based on depth
        // Shallow water (depth < 1.0): minimal sinking
        // Medium water (depth 1.0-3.0): moderate sinking
        // Deep water (depth > 3.0): significant sinking, need to run

        if (waterData.depth < 1.0) {
            // Shallow - barely notice
            waterResistance = 0.9;
            sinkRate = 0.2;
        } else if (waterData.depth < 3.0) {
            // Medium - noticeable slowdown
            waterResistance = 0.6;
            sinkRate = 0.5;
        } else {
            // Deep - need to run to make progress!
            if (isRunning) {
                waterResistance = 0.4; // Still slower when running
                sinkRate = 0.8;
            } else {
                waterResistance = 0.2; // Very slow walking
                sinkRate = 1.2; // Sinking faster
            }
        }

        // Apply sinking effect (lower camera position gradually)
        camera.position.y -= sinkRate * deltaTime;

        // Prevent sinking below water depth
        const waterBottom = -waterData.depth;
        if (camera.position.y < waterBottom + PLAYER_HEIGHT) {
            camera.position.y = waterBottom + PLAYER_HEIGHT;
        }
    }

    const speed = isRunning ? RUN_SPEED : WALK_SPEED;

    // Air control multiplier (can move less effectively in air)
    const airControlFactor = isGrounded ? 1.0 : 0.7;

    // Apply water resistance to movement
    const finalSpeedFactor = airControlFactor * waterResistance;

    if (moveForward || moveBackward) velocity.z -= direction.z * speed * deltaTime * finalSpeedFactor;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * deltaTime * finalSpeedFactor;

    // Calculate potential new position
    const moveVector = new THREE.Vector3();
    camera.getWorldDirection(moveVector);
    moveVector.y = 0;
    moveVector.normalize();

    const strafeVector = new THREE.Vector3();
    strafeVector.crossVectors(camera.up, moveVector).normalize();

    const potentialX = camera.position.x - strafeVector.x * velocity.x * deltaTime - moveVector.x * velocity.z * deltaTime;
    const potentialZ = camera.position.z - strafeVector.z * velocity.x * deltaTime - moveVector.z * velocity.z * deltaTime;

    // Check collision before moving (pass current Y for height-aware collision)
    if (!checkCollision(potentialX, potentialZ, camera.position.y)) {
        controls.moveRight(-velocity.x * deltaTime);
        controls.moveForward(-velocity.z * deltaTime);
    } else {
        // Stop horizontal velocity on collision
        velocity.x = 0;
        velocity.z = 0;
    }

    // Apply vertical movement
    camera.position.y += velocity.y * deltaTime;

    // Ground collision - use dynamic ground height
    if (camera.position.y < groundLevel) {
        velocity.y = 0;
        camera.position.y = groundLevel;
        canJump = true;
    }
}

function animateBirds() {
    const time = clock.getElapsedTime();

    birds.forEach((bird, index) => {
        const path = bird.userData.flightPath;
        const angle = time * path.speed + path.phase;

        bird.position.x = Math.cos(angle) * path.radius + path.offset.x;
        bird.position.z = Math.sin(angle) * path.radius + path.offset.z;
        bird.position.y = path.height + Math.sin(time * 2 + index) * 2;

        // Bird rotation to face movement direction
        bird.rotation.y = angle + Math.PI / 2;

        // Wing flapping
        const flapSpeed = 10;
        const flapAngle = Math.sin(time * flapSpeed + index) * 0.5;
        bird.userData.leftWing.rotation.z = flapAngle;
        bird.userData.rightWing.rotation.z = -flapAngle;
    });
}

function animateFish() {
    const time = clock.getElapsedTime();

    ponds.forEach(pond => {
        pond.fish.forEach((fish, index) => {
            const path = fish.userData.swimPath;
            const angle = time * path.speed + path.phase;

            // Circular swimming path
            fish.position.x = path.centerX + Math.cos(angle) * path.radius;
            fish.position.z = path.centerZ + Math.sin(angle) * path.radius;

            // Bobbing motion
            fish.position.y = path.depth + Math.sin(time * 2 + index) * path.bobAmount;

            // Face swimming direction
            fish.rotation.y = angle + Math.PI / 2;

            // Tail swishing animation
            const swishSpeed = 6;
            const swishAngle = Math.sin(time * swishSpeed + index) * 0.4;
            if (fish.userData.tail) {
                fish.userData.tail.rotation.y = swishAngle;
            }
        });
    });
}

function animateWater() {
    const time = clock.getElapsedTime();

    ponds.forEach(pond => {
        const water = pond.group.userData.water;
        if (water) {
            water.userData.time += 0.01;
            water.position.y = 0.3 + Math.sin(water.userData.time) * 0.05;
        }
    });
}

function animateButterflies() {
    const time = clock.getElapsedTime();

    butterflies.forEach((butterfly, index) => {
        const path = butterfly.userData.flightPath;
        const angle = time * path.speed + path.phase;

        // Circular flight path with height variation
        butterfly.position.x = path.center.x + Math.cos(angle) * path.radius;
        butterfly.position.z = path.center.z + Math.sin(angle) * path.radius;
        butterfly.position.y = path.center.y + Math.sin(time * 2 + path.heightOffset) * 0.5;

        // Rotation to face movement direction
        butterfly.rotation.y = angle + Math.PI / 2;

        // Wing flapping
        const flapSpeed = 15;
        const flapAngle = Math.sin(time * flapSpeed + index) * 0.6;
        butterfly.userData.leftWing.rotation.y = Math.PI / 4 + flapAngle;
        butterfly.userData.rightWing.rotation.y = -Math.PI / 4 - flapAngle;
    });
}

function animateDragonflies() {
    const time = clock.getElapsedTime();

    dragonflies.forEach((dragonfly, index) => {
        const path = dragonfly.userData.flightPath;
        const angle = time * path.speed + path.phase;

        // Fast darting motion around pond
        dragonfly.position.x = path.center.x + Math.cos(angle) * path.radius;
        dragonfly.position.z = path.center.z + Math.sin(angle) * path.radius;
        dragonfly.position.y = path.height + Math.sin(time * 4 + index) * 0.3;

        // Rotation to face movement direction
        dragonfly.rotation.y = angle + Math.PI / 2;

        // Fast wing vibration
        const vibrationSpeed = 50;
        const vibrationAngle = Math.sin(time * vibrationSpeed + index) * 0.1;
        dragonfly.userData.wings.forEach((wing, wingIndex) => {
            wing.rotation.z = vibrationAngle * (wingIndex % 2 === 0 ? 1 : -1);
        });
    });
}

function animateClouds() {
    clouds.forEach(cloud => {
        // Slow drift across the sky
        cloud.position.x += cloud.userData.speed * 0.01;

        // Wrap around
        if (cloud.position.x > 250) {
            cloud.position.x = -250;
        }
    });
}

function animateCollectibles() {
    const time = clock.getElapsedTime();

    collectibles.forEach(collectible => {
        if (collectible.userData.collected) return;

        // Rotate
        collectible.rotation.y += deltaTime * (collectible.userData.rotationSpeed || 1.0);

        // Bob up and down (use baseHeight for correct elevation)
        const bobOffset = Math.sin(time * 2 + collectible.position.x) * 0.2;
        const baseHeight = collectible.userData.baseHeight || 1.5;
        collectible.position.y = baseHeight + bobOffset;

        // Scale pulsing effect
        const scale = 1 + Math.sin(time * 3 + collectible.position.z) * 0.1;
        collectible.scale.set(scale, scale, scale);
    });
}

function updateStats() {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        document.getElementById('fps').textContent = fps;
        frameCount = 0;
        lastTime = currentTime;
    }

    // Update position
    const pos = camera.position;
    document.getElementById('position').textContent =
        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
}

// ==================== START APPLICATION ====================
init();
