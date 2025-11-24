import * as THREE from 'three';

/**
 * Create procedural grass texture
 */
export function createGrassTexture() {
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

/**
 * Create procedural wood texture
 */
export function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base wood color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 256, 256);

    // Wood grain
    for (let i = 0; i < 50; i++) {
        const y = Math.random() * 256;
        const shade = Math.random() * 30 - 15;
        ctx.strokeStyle = `rgb(${139 + shade}, ${69 + shade}, ${19 + shade})`;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y + (Math.random() - 0.5) * 20);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}

/**
 * Create procedural bark texture
 */
export function createBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base bark color
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(0, 0, 256, 256);

    // Bark texture
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const shade = Math.random() * 40 - 20;
        ctx.fillStyle = `rgb(${74 + shade}, ${55 + shade}, ${40 + shade})`;
        ctx.fillRect(x, y, Math.random() * 4 + 2, Math.random() * 10 + 5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}

/**
 * Create procedural stone texture
 */
export function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base stone color
    ctx.fillStyle = '#736F6E';
    ctx.fillRect(0, 0, 256, 256);

    // Stone texture
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 3 + 1;
        const shade = Math.random() * 20 - 10;
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

/**
 * Create procedural brick texture
 */
export function createBrickTexture() {
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
