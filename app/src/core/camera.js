import * as THREE from 'three';
import { RENDERING, SPAWN } from '../config/constants.js';

let camera = null;

export function initCamera() {
    camera = new THREE.PerspectiveCamera(
        RENDERING.FOV,
        window.innerWidth / window.innerHeight,
        RENDERING.NEAR_PLANE,
        RENDERING.FAR_PLANE
    );
    camera.position.set(SPAWN.X, SPAWN.Y, SPAWN.Z);
    return camera;
}

export function getCamera() {
    return camera;
}

export function resetCameraPosition() {
    camera.position.set(SPAWN.X, SPAWN.Y, SPAWN.Z);
}
