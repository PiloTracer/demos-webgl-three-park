import * as THREE from 'three';
import { FOG } from '../config/constants.js';

let scene = null;

export function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(FOG.DAY_COLOR, FOG.DAY_NEAR, FOG.DAY_FAR);
    return scene;
}

export function getScene() {
    return scene;
}

export function setFog(enabled, isDay) {
    if (enabled) {
        const fogColor = isDay ? FOG.DAY_COLOR : FOG.NIGHT_COLOR;
        const fogNear = isDay ? FOG.DAY_NEAR : FOG.NIGHT_NEAR;
        const fogFar = isDay ? FOG.DAY_FAR : FOG.NIGHT_FAR;
        scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    } else {
        scene.fog = null;
    }
}

export function setBackground(color) {
    scene.background = new THREE.Color(color);
}
