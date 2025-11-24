import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let controls = null;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isRunning = false;

export function initControls(camera, renderer) {
    controls = new PointerLockControls(camera, renderer.domElement);

    // Click to lock pointer
    renderer.domElement.addEventListener('click', () => {
        controls.lock();
    });

    return controls;
}

export function getControls() {
    return controls;
}

export function getMovementState() {
    return {
        moveForward,
        moveBackward,
        moveLeft,
        moveRight,
        canJump,
        isRunning
    };
}

export function setMovementState(state) {
    if (state.moveForward !== undefined) moveForward = state.moveForward;
    if (state.moveBackward !== undefined) moveBackward = state.moveBackward;
    if (state.moveLeft !== undefined) moveLeft = state.moveLeft;
    if (state.moveRight !== undefined) moveRight = state.moveRight;
    if (state.canJump !== undefined) canJump = state.canJump;
    if (state.isRunning !== undefined) isRunning = state.isRunning;
}

export function setCanJump(value) {
    canJump = value;
}

export function getCanJump() {
    return canJump;
}
