import * as THREE from 'three';
import { RENDERING } from '../config/constants.js';

let renderer = null;

export function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    return renderer;
}

export function getRenderer() {
    return renderer;
}

function onWindowResize() {
    const camera = require('./camera.js').getCamera();
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function render(scene, camera) {
    renderer.render(scene, camera);
}
