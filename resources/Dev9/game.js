
"use strict"; // Do NOT remove this directive!

const RAIN_DROP = "☔";
const CLOUD = "☁";
const SUN = "⛅";
const PLANT_SPRITE = "✨";

// Obstacle Types
const OBSTACLE_TYPES = { CLOUD: "cloud", SUN: "sun" };

const GRID_WIDTH = 11;
const GRID_HEIGHT = 11;

// Initial position of the raindrop
let raindropPosition = { x: 4, y: 0 };

// Arrays to track obstacles
let clouds = [];
let suns = []; // Renamed from 'birds' for clarity

let isWinningAnimation = false; // New variable to track winning animation state
let gameStarted = false; // To track if the game has started
let gameEnding = false; // New variable to manage end-game state
let shouldDelayNextMove = false; // Flag to indicate if the next move should be delayed

// Timer IDs
let gameTimer = null;
let obstacleTimer = null;
let slowDownTimer = null; // Timer for managing slowdown effect duration.
let dropRainTimer = null;
let resetToTitleTimer = null;
let resetGameTimer = null;


PS.init = function(system, options) {
    //PS.debug( "PS.init() called\n" );

    PS.gridSize(GRID_WIDTH, GRID_HEIGHT);
    makeGridLinesInvisible();
    PS.gridColor(PS.COLOR_CYAN);
    PS.seed(12345);

    displayTitleScreen();

    // Pre-load audio
    PS.audioLoad("fx_click");
    PS.audioLoad("fx_bloink");
    PS.audioLoad("fx_coin1");

};


function makeGridLinesInvisible() {
    const width = PS.gridSize().width; // Get the current grid width
    const height = PS.gridSize().height; // Get the current grid height

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            PS.borderAlpha(x, y, 0); // Set border alpha to 0 to make it invisible
        }
    }
}

function displayTitleScreen() {
    PS.debug( "displayTitleScreen() called\n" );

    // Wait for user tap to start the game
    PS.statusText("Raindrop Journey - Press 'Space' to Start");
    // Indicate the game is ready to start but not actually started
    gameStarted = false;
    gameEnding = false;
    isWinningAnimation = false;
    shouldDelayNextMove = false; // Ensure movement is enabled upon restart
}

function startGame() {
    PS.debug( "startGame() called\n" );

    gameStarted = true;
    gameEnding = false; // Ensure this is set to false when starting
    isWinningAnimation = false; // Ensure this is false when starting
    PS.statusText("Guide using 'WSAD' & Scroll Wheel");
    PS.glyph(raindropPosition.x, raindropPosition.y, "☔");

    // Reset game elements for a new game
    clouds = [];
    suns = [];
    raindropPosition = { x: 4, y: 0 }; // Reset raindrop position to the middle of the top row

    // Display the raindrop at the new position
    PS.glyph(raindropPosition.x, raindropPosition.y, "☔");

    // Start obstacle generation
    obstacleTimer = PS.timerStart(20, generateObstacles); // Adjust as needed

    // Start game loop timer for 30 seconds duration
    gameTimer = PS.timerStart(1800, endGame); // 30 * 60 ticks
}


function generateObstacles() {
    // PS.debug( "generateObstacles() called\n" );

    // Randomly decide whether to add a cloud or bird
    // For simplicity, this example just toggles between them
    let type = PS.random(2) === 1 ? OBSTACLE_TYPES.CLOUD : OBSTACLE_TYPES.SUN;
    let x = PS.random(GRID_WIDTH) - 1;

    if (type === OBSTACLE_TYPES.CLOUD) {
        clouds.push({ x: x, y: GRID_HEIGHT - 1 });
        PS.glyph(x, GRID_HEIGHT - 1, CLOUD);
    } else { // Now handling SUN as an obstacle
        suns.push({ x: x, y: GRID_HEIGHT - 1 }); // Reusing birds array for suns for simplicity
        PS.glyph(x, GRID_HEIGHT - 1, SUN);
    }
    updateObstacles();
}

function updateObstacles() {
    //PS.debug( "updateObstacles() called\n" );


    clouds.forEach((cloud, index) => {
        PS.glyph(cloud.x, cloud.y, 0); // Clear old position
        cloud.y--;
        if (cloud.y >= 0) {
            PS.glyph(cloud.x, cloud.y, CLOUD);
        } else {
            clouds.splice(index, 1); // Remove if it goes off the top
        }
    });

    // Added similar logic for suns
    suns.forEach((sun, index) => {
        PS.glyph(sun.x, sun.y, 0); // Clear old position
        sun.y--;
        if (sun.y >= 0) {
            PS.glyph(sun.x, sun.y, SUN);
        } else {
            suns.splice(index, 1); // Remove if it goes off the top
        }
    });

    // Check for collisions
    checkCollisions();
}

function checkCollisions() {
    //PS.debug( "checkCollisions() called\n" );

    // Check cloud collisions
    clouds.forEach((cloud, index) => {
        if (cloud.x === raindropPosition.x && cloud.y === raindropPosition.y) {
            clouds.splice(index, 1); // Remove the cloud that collided
            PS.glyph(cloud.x, cloud.y, 0); // Clear the cloud glyph
            slowDownRaindrop(); // Handle freezing effect
        }
    });

    // Check sun collisions
    suns.forEach((sun, index) => {
        if (sun.x === raindropPosition.x && sun.y === raindropPosition.y) {
            resetGame(); // Reset the game if hit a sun
            return; // Exit function early
        }
    });
}

function slowDownRaindrop() {
    //PS.debug( "slowDownRaindrop() called\n" );

    shouldDelayNextMove = true;

    PS.glyph(raindropPosition.x, raindropPosition.y, 0x2744);
    PS.statusText("Oops! Hit a cloud! It's freezing...");

    // Reset the flag after a short delay to simulate slowing down
    if (slowDownTimer !== null) {
        PS.timerStop(slowDownTimer); // Ensure to stop any existing slowdown timer first
    }
    slowDownTimer = PS.timerStart(90, () => { // 180 ticks = 3 seconds
        PS.statusText("Guide using 'WSAD' & Scroll Wheel");
        shouldDelayNextMove = false;
        PS.glyph(raindropPosition.x, raindropPosition.y, "☔");
        PS.timerStop(slowDownTimer);
        slowDownTimer = null; // Clear the timer reference
    });
}


function endGame() {
    clearAllTimers(); // Stop all running timers to prevent interference

    gameStarted = false;
    gameEnding = true;
    clearGrid();

    PS.statusText("Congrats! You've successfully guided raindrop!");
    let finalX = raindropPosition.x;

    // Define dropRain outside of the timer callback for clarity
    function dropRain() {
        //PS.debug( "dropRain() called\n" );

        if (raindropPosition.y < GRID_HEIGHT - 1) {
            PS.glyph(raindropPosition.x, raindropPosition.y, 0); // Clear current glyph
            raindropPosition.y++; // Move down
            PS.glyph(finalX, raindropPosition.y, RAIN_DROP); // Show raindrop at new position
        } else {
            // Once at the bottom, finalize the winning animation
            finalizeWinningAnimation(finalX);
            return; // Stop the recursion
        }
    }

    // Initiate the dropRain process with a timer
    dropRainTimer = PS.timerStart(30, dropRain);

    // Helper function to finalize the winning animation
    function finalizeWinningAnimation(finalX) {
        //PS.debug( "finalizeWinningAnimation() called\n" );

        PS.timerStop(dropRainTimer); // Ensure to stop the timer
        dropRainTimer = null; // Clear the timer ID

        // Display the plant sprite and update the status
        PS.color(finalX, GRID_HEIGHT - 1, PS.COLOR_GREEN);
        PS.glyph(finalX, GRID_HEIGHT - 1, PLANT_SPRITE);
        PS.statusText("It helps the seed grow into a plant!");

        // Transition back to the title screen after a delay
        resetToTitleTimer = PS.timerStart(300, function(){
            resetToTitleScreen();
            PS.timerStop(resetToTitleTimer);
            resetToTitleTimer = null;
        });
    }
}



function resetGame() {
    //PS.debug( "resetGame() called\n" );

    clearAllTimers();

    // Reset game state and display a message
    gameStarted = false; // Mark game as not started
    gameEnding = true; // Indicate reset scenario is active

    clearGrid();
    raindropPosition = { x: 4, y: 0 }; // Reset raindrop position to ensure it starts fresh

    PS.statusText("Oops! Hit a sun! Restarting...");
    // Delay before restarting to display message
    resetGameTimer = PS.timerStart(180, function() {
        gameEnding = false; // Reset end-game state
        displayTitleScreen(); // Go back to title screen
        PS.timerStop(resetGameTimer);
        resetGameTimer = null;
    });
}

function clearAllTimers() {
    if (gameTimer) {
        PS.timerStop(gameTimer);
        gameTimer = null;
    }
    if (obstacleTimer) {
        PS.timerStop(obstacleTimer);
        obstacleTimer = null;
    }
    if (slowDownTimer) {
        PS.timerStop(slowDownTimer);
        slowDownTimer = null;
    }
    if (dropRainTimer) {
        PS.timerStop(dropRainTimer);
        dropRainTimer = null;
    }
    if (resetToTitleTimer) {
        PS.timerStop(resetToTitleTimer);
        resetToTitleTimer = null;
    }
    if (resetGameTimer) {
        PS.timerStop(resetGameTimer);
        resetGameTimer = null;
    }
}

function resetToTitleScreen() {
    //PS.debug( "resetToTitleScreen() called\n" );

    // Reset game state variables
    gameStarted = false;
    gameEnding = false;
    isWinningAnimation = false;
    shouldDelayNextMove = false; // Reset movement delay flag

    // Reset gameplay elements
    raindropPosition = { x: 4, y: 0 }; // Reset raindrop to initial position
    clouds = []; // Clear cloud array
    suns = []; // Clear sun array

    // Clear the grid before returning to the title screen
    clearGrid();
    PS.glyph(raindropPosition.x, raindropPosition.y, 0); // This might be redundant with clearGrid but added for clarity

    // Return to the title screen
    displayTitleScreen();
}

// New function to clear the grid
function clearGrid() {
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            PS.glyph(x, y, 0); // Clear any glyph
            PS.color(x, y, PS.COLOR_WHITE); // Reset background color to initial grid color
        }
    }
}

function moveRaindropVertical(deltaY) {
    //PS.debug( "moveRaindropVertical() called\n" );

    if (gameStarted && !shouldDelayNextMove) {
        PS.glyph(raindropPosition.x, raindropPosition.y, 0); // Clear old position
        raindropPosition.y += deltaY; // Update vertical position
        // Prevent moving out of grid boundaries
        if (raindropPosition.y < 0) {
            raindropPosition.y = 0;
        } else if (raindropPosition.y > 5) {
            raindropPosition.y = 5;
        }
        PS.glyph(raindropPosition.x, raindropPosition.y, "☔"); // Display at new position
    }
}

function moveRaindropHorizontal(deltaX) {
    //PS.debug( "moveRaindropHorizontal() called\n" );

    if (gameStarted && !shouldDelayNextMove) {
        PS.glyph(raindropPosition.x, raindropPosition.y, 0); // Clear old position
        raindropPosition.x += deltaX; // Update horizontal position
        // Prevent moving out of grid boundaries
        let gridWidth = PS.gridSize().width;
        if (raindropPosition.x < 0) {
            raindropPosition.x = 0;
        } else if (raindropPosition.x >= gridWidth) {
            raindropPosition.x = gridWidth - 1;
        }
        PS.glyph(raindropPosition.x, raindropPosition.y, "☔"); // Display at new position
    }
}


PS.input = function(device, key, isDown) {

    if (!gameStarted) {
        return; // Ignore inputs if the game hasn't started
    }

    // Check if the event is a mouse wheel event
    var wheelEvent = device.wheel;
    if (wheelEvent) {
        if (wheelEvent === PS.WHEEL_FORWARD) {
            // Wheel scrolled forward
            if (raindropPosition.y > 0) {
                moveRaindropVertical(-1); // Move up
            }
        } else if (wheelEvent === PS.WHEEL_BACKWARD) {
            // Wheel scrolled backward
            if (raindropPosition.y < 5) {
                moveRaindropVertical(1); // Move down
            }
        }
        return; // Exit the function after handling wheel event
    }
};

PS.keyDown = function( key, shift, ctrl, options ) {
    //PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

    if (key === 32 && !gameStarted && !gameEnding && !isWinningAnimation) { // 32 is the key code for the space bar
        startGame();
        return; // Important to prevent further processing if this condition is met
    }

    // Ensure the game has started before processing any movement
    if (!gameStarted) {
        return;
    }

    // Handle arrow key movements
    switch(key) {
        case 119: // 'w'
        case 87: // 'W'
            if (raindropPosition.y > 0) { // Prevent moving up if at the top row
                moveRaindropVertical(-1);
            }
            break;
        case 115: // 's'
        case 83: // 'S'
            if (raindropPosition.y < 5) { // Prevent moving down if at the bottom row (6th row, y = 5)
                moveRaindropVertical(1);
            }
            break;
        case 97: // 'a'
        case 65: // 'A'
            if (raindropPosition.x > 0) { // Prevent moving left if at the left edge
                moveRaindropHorizontal(-1);
            }
            break;
        case 100: // 'd'
        case 68: // 'D'
            if (raindropPosition.x < PS.gridSize().width - 1) { // Prevent moving right if at the right edge
                moveRaindropHorizontal(1);
            }
            break;
    }
};


PS.touch = function(x, y, data, options) {
    //PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

};



/*
PS.release ( x, y, data, options )
Called when the left mouse button is released, or when a touch is lifted, over bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.release = function( x, y, data, options ) {
    // Uncomment the following code line to inspect x/y parameters:

    // PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

    // Add code here for when the mouse button/touch is released over a bead.
};

/*
PS.enter ( x, y, button, data, options )
Called when the mouse cursor/touch enters bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.enter = function( x, y, data, options ) {
    // Uncomment the following code line to inspect x/y parameters:

    // PS.debug( "PS.enter() @ " + x + ", " + y + "\n" );

    // Add code here for when the mouse cursor/touch enters a bead.
};

/*
PS.exit ( x, y, data, options )
Called when the mouse cursor/touch exits bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exit = function( x, y, data, options ) {
    // Uncomment the following code line to inspect x/y parameters:

    // PS.debug( "PS.exit() @ " + x + ", " + y + "\n" );

    // Add code here for when the mouse cursor/touch exits a bead.
};

/*
PS.exitGrid ( options )
Called when the mouse cursor/touch exits the grid perimeter.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exitGrid = function( options ) {
    // Uncomment the following code line to verify operation:

    // PS.debug( "PS.exitGrid() called\n" );

    // Add code here for when the mouse cursor/touch moves off the grid.
};

/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

/*
PS.keyUp ( key, shift, ctrl, options )
Called when a key on the keyboard is released.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyUp = function( key, shift, ctrl, options ) {
    // Uncomment the following code line to inspect first three parameters:

    // PS.debug( "PS.keyUp(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

    // Add code here for when a key is released.
};