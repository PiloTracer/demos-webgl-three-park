import * as THREE from 'three';
import { PLAYER, WORLD } from '../config/constants.js';

// Array to store all collidable objects
let collidableObjects = [];
let currentGroundHeight = 0;

/**
 * Register an object for collision detection
 */
export function registerCollidable(object) {
    collidableObjects.push(object);
}

/**
 * Clear all collidable objects
 */
export function clearCollidables() {
    collidableObjects = [];
}

/**
 * Get all collidable objects
 */
export function getCollidables() {
    return collidableObjects;
}

/**
 * Check collision at position with height awareness
 */
export function checkCollision(newX, newZ, playerY) {
    const playerPos = new THREE.Vector2(newX, newZ);

    for (let obj of collidableObjects) {
        const objPos = new THREE.Vector2(obj.position.x, obj.position.z);
        const distance = playerPos.distanceTo(objPos);

        if (distance < (PLAYER.RADIUS + obj.radius)) {
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
    if (Math.abs(newX) > WORLD.BOUNDARY || Math.abs(newZ) > WORLD.BOUNDARY) {
        return true;
    }

    return false;
}

/**
 * Get the ground height at a position (for landing on platforms)
 */
export function getGroundHeight(x, z, currentY) {
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

/**
 * Update and get current ground height
 */
export function updateGroundHeight(x, z, y) {
    currentGroundHeight = getGroundHeight(x, z, y);
    return currentGroundHeight;
}

/**
 * Get current ground height without updating
 */
export function getCurrentGroundHeight() {
    return currentGroundHeight;
}
