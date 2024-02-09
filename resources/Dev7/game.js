/*
game.js for Perlenspiel 3.3.x
Last revision: 2022-03-15 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-22 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.
*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these two lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT remove this directive!


const RAIN_DROP = "☔"; // Example glyph for the raindrop
const CLOUD = "☁"; // Example glyph for the cloud
const SUN = "⛅"; // Changed from bird to sun
const PLANT_SPRITE = "✨"; // New plant sprite


const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
let gameStarted = false; // To track if the game has started
let raindropPosition = { x: 4, y: 0 }; // Initial position of the raindrop

// Obstacle Types
const OBSTACLE_TYPES = { CLOUD: "cloud", SUN: "sun" };

// Timer IDs for the game loop and obstacle generation
let gameTimer = null;
let obstacleTimer = null;

// Arrays to track obstacles
let clouds = [];
let suns = []; // Renamed from 'birds' for clarity

let isWinningAnimation = false; // New variable to track winning animation state
let gameEnding = false; // New variable to manage end-game state

let slowDownTimer = null; // Timer for managing slowdown effect duration.
let shouldDelayNextMove = false; // Flag to indicate if the next move should be delayed

let dropRainTimer = null;
let resetToTitleTimer = null;
let resetGameTimer = null;


PS.init = function(system, options) {
    //PS.debug( "PS.init() called\n" );

    PS.gridSize(GRID_WIDTH, GRID_HEIGHT);
    PS.gridColor(PS.COLOR_CYAN);
    displayTitleScreen();

    // Pre-load audio
    PS.audioLoad("fx_click");
    PS.audioLoad("fx_bloink");
    PS.audioLoad("fx_coin1");

};

function displayTitleScreen() {
    PS.debug( "displayTitleScreen() called\n" );

    // Wait for user tap to start the game
    PS.statusText("Raindrop Journey - Tap to Start");
    // Indicate the game is ready to start but not actually started
    gameStarted = false;
    gameEnding = false;
    isWinningAnimation = false;
}

function startGame() {
    PS.debug( "startGame() called\n" );

    gameStarted = true;
    gameEnding = false; // Ensure this is set to false when starting
    isWinningAnimation = false; // Ensure this is false when starting
    PS.statusText("Guide the Raindrop!");
    PS.glyph(raindropPosition.x, raindropPosition.y, "☔");

    // Reset game elements for a new game
    clouds = [];
    suns = [];
    raindropPosition = { x: 4, y: 0 }; // Reset raindrop position to the middle of the top row

    // Display the raindrop at the new position
    PS.glyph(raindropPosition.x, raindropPosition.y, "☔");

    // Start obstacle generation
    obstacleTimer = PS.timerStart(30, generateObstacles); // Adjust as needed

    // Start game loop timer for 25 seconds duration
    gameTimer = PS.timerStart(1200, endGame); // 25 * 60 ticks
}


function moveRaindrop(x) {
    if (gameStarted && !shouldDelayNextMove) {
        PS.glyph(raindropPosition.x, raindropPosition.y, 0); // Clear old position
        raindropPosition.x = x; // Update position
        PS.glyph(x, raindropPosition.y, "☔"); // Display at new position
    }
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
    PS.debug( "updateObstacles() called\n" );


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
    PS.debug( "checkCollisions() called\n" );

    // Check cloud collisions
    clouds.forEach((cloud, index) => {
        if (cloud.x === raindropPosition.x && cloud.y === raindropPosition.y) {
            clouds.splice(index, 1); // Remove the cloud that collided
            PS.glyph(cloud.x, cloud.y, 0); // Clear the cloud glyph
            // Instead of setting shouldDelayNextMove to true directly, call slowDownRaindrop()
            slowDownRaindrop();
            // Redraw the raindrop at the current position after collision
            PS.glyph(raindropPosition.x, raindropPosition.y, "☔");
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
    PS.debug( "slowDownRaindrop() called\n" );

    shouldDelayNextMove = true;

    PS.statusText("Oops! Hit a cloud! It's freezing...");

    // Reset the flag after a short delay to simulate slowing down
    if (slowDownTimer !== null) {
        PS.timerStop(slowDownTimer); // Ensure to stop any existing slowdown timer first
    }
    slowDownTimer = PS.timerStart(90, () => { // 180 ticks = 3 seconds
        PS.statusText("Guide the Raindrop!");
        shouldDelayNextMove = false;
        PS.timerStop(slowDownTimer);
        slowDownTimer = null; // Clear the timer reference
    });
}


function clearObstacles() {
    PS.debug( "clearObstacles() called\n" );

    clouds.forEach(cloud => PS.glyph(cloud.x, cloud.y, 0));
    suns.forEach(sun => PS.glyph(sun.x, sun.y, 0));
    clouds = [];
    suns = [];
}


function endGame() {
    clearAllTimers(); // Stop all running timers to prevent interference

    gameStarted = false;
    gameEnding = true;
    clearGrid();

    PS.statusText("You've successfully guided the raindrop!");
    let finalX = raindropPosition.x;

    // Define dropRain outside of the timer callback for clarity
    function dropRain() {
        PS.debug( "dropRain() called\n" );

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
        PS.debug( "finalizeWinningAnimation() called\n" );

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
    PS.debug( "resetGame() called\n" );

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
    // Add stopping of any other timers might have
}

function resetToTitleScreen() {
    PS.debug( "resetToTitleScreen() called\n" );

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

PS.touch = function(x, y, data, options) {
    //PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

    // Allow starting the game only from the title screen and when the game is not ending or in the winning animation
    if (!gameStarted && !gameEnding && y === 0) {
        startGame();
        return; // Prevent further execution
    }

    // Handle raindrop movement only if the game has started, is not ending, and during the gameplay phase
    if (gameStarted && !gameEnding && !isWinningAnimation && y === 0) {
        // Delayed or immediate movement based on cloud collision
        if (shouldDelayNextMove) {
            return;
        } else {
            moveRaindrop(x);
        }
    }
    // This setup prevents interaction during the winning animation and resets
    // No else part needed; this implicitly handles ignoring touches during the end game sequence or when the game hasn't started yet
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

PS.keyDown = function( key, shift, ctrl, options ) {
    // Uncomment the following code line to inspect first three parameters:

    // PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

    // Add code here for when a key is pressed.
};

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

/*
PS.input ( sensors, options )
Called when a supported input device event (other than those above) is detected.
This function doesn't have to do anything. Any value returned is ignored.
[sensors : Object] = A JavaScript object with properties indicating sensor status; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: Currently, only mouse wheel events are reported, and only when the mouse cursor is positioned directly over the grid.
*/

PS.input = function( sensors, options ) {
    // Uncomment the following code lines to inspect first parameter:

//	 var device = sensors.wheel; // check for scroll wheel
//
//	 if ( device ) {
//	   PS.debug( "PS.input(): " + device + "\n" );
//	 }

    // Add code here for when an input event is detected.
};