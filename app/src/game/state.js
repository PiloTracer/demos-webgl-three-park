/**
 * Centralized game state management
 */

const gameState = {
    score: 0,
    gemsCollected: 0,
    totalGems: 0,
    currentObjective: 0,
    gameStarted: false,
    gameWon: false,
    timeElapsed: 0,
    startTime: 0,
    objectives: [
        { text: 'Explore the park and collect all gems!', completed: false },
        { text: 'Find the hidden treasure near the gazebo', completed: false },
        { text: 'Visit all three ponds', completed: false }
    ],
    pondsVisited: new Set(),
    treasureFound: false
};

export function getGameState() {
    return gameState;
}

export function startGame() {
    gameState.gameStarted = true;
    gameState.startTime = performance.now() / 1000;
}

export function addScore(points) {
    gameState.score += points;
    return gameState.score;
}

export function collectGem() {
    gameState.gemsCollected++;
    if (gameState.gemsCollected >= gameState.totalGems) {
        gameState.objectives[0].completed = true;
    }
}

export function collectTreasure() {
    gameState.treasureFound = true;
    gameState.objectives[1].completed = true;
}

export function visitPond(pondIndex) {
    gameState.pondsVisited.add(pondIndex);
    if (gameState.pondsVisited.size >= 3) {
        gameState.objectives[2].completed = true;
    }
}

export function checkWinCondition() {
    const allCompleted = gameState.objectives.every(obj => obj.completed);
    if (allCompleted && !gameState.gameWon) {
        gameState.gameWon = true;
        return true;
    }
    return false;
}

export function setTotalGems(count) {
    gameState.totalGems = count;
}

export function incrementTotalGems() {
    gameState.totalGems++;
}

export function isGameStarted() {
    return gameState.gameStarted;
}

export function isGameWon() {
    return gameState.gameWon;
}

export function updateElapsedTime(time) {
    gameState.timeElapsed = time - gameState.startTime;
}
