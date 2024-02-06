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

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

const START_COLOR = PS.COLOR_GREEN;
const END_COLOR = PS.COLOR_VIOLET;
const PATH_COLOR = PS.COLOR_GREEN; // Same as start color for the path
const BLANK_COLOR = PS.COLOR_WHITE; // Color for blank beads
const FORBIDDEN_COLOR = PS.COLOR_RED; // Color for forbidden beads


const levels = [
    {   // Level 1
        gridSize: { width: 3, height: 3 },
        startPosition: { x: 0, y: 0 },
        endPosition: { x: 2, y: 2 },
        forbiddenPositions: [], // No forbidden beads for this level
        checkpoints: [] // No checkpoints for this level
    },
    {   // Level 2
        gridSize: { width: 5, height: 4 },
        startPosition: { x: 1, y: 2 },
        endPosition: { x: 2, y: 0 },
        forbiddenPositions: [], // No forbidden beads for this level
        checkpoints: [] // No checkpoints for this level
    },
    {   // Level 3
        gridSize: { width: 6, height: 5 },
        startPosition: { x: 2, y: 2 },
        endPosition: { x: 0, y: 1 },
        forbiddenPositions: [ { x: 2, y: 0 }, { x: 3, y: 2 } ], // Forbidden beads positions
        checkpoints: [] // No checkpoints for this level=
    },
    {
        // Level 4
        gridSize: { width: 7, height: 6 },
        startPosition: { x: 1, y: 4 },
        endPosition: { x: 5, y: 1 },
        forbiddenPositions: [{ x: 2, y: 2 }, { x: 5, y: 4 }],
        checkpoints: [] // No checkpoints for this level
    },
    {
        // Level 5 (final level)
        gridSize: { width: 7, height: 6 },
        startPosition: { x: 3, y: 5 },
        endPosition: { x: 3, y: 0 },
        forbiddenPositions: [{ x: 1, y: 1 }, { x: 1, y: 4 }, { x: 5, y: 1 }, { x: 5, y: 4 }],
        checkpoints: [{ x: 6, y: 0, order: 1 }, { x: 2, y: 5, order: 2 }, { x: 1, y: 2, order: 3 }],
        statusText: "Checkpoints! Fill in order!"
    }
];

// Start at the first level
let currentLevelIndex = 0;

// Add a variable to track the current checkpoint index
let currentCheckpointIndex = 0;

// Track the last position clicked (start with start position)
let lastPosition;

// Flag to track if the game was won
let gameWon = false;

// Store the path (starting point initially)
let path;

// Store the timer ID for reload actions
let reloadTimer = null;
// Store the timer ID for next level actions
let nextLevelTimer = null;
// Store the timer ID for winning actions
let winTimer = null;

let canClick = true;

let reloadReason = ""; // Tracks why the game is reloading



PS.init = function( system, options ) {
	// Uncomment the following code line
	// to verify operation:

	 //PS.debug( "PS.init() called\n" );

    PS.audioLoad("fx_click", { lock: true });
    PS.audioLoad("fx_bloink", { lock: true });
    PS.audioLoad("fx_coin1", { lock: true });

    resetGameState(); // Ensure game state is reset on init

};

/*
PS.touch ( x, y, data, options )
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.touch = function( x, y, data, options ) {
	// Uncomment the following code line
	// to inspect x/y parameters:

	//PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

    // Ignore clicks if canClick is false
    if (!canClick) {
        return;
    }

    // Ignore if the game is won or if clicking the same bead
    if (gameWon || (x === lastPosition.x && y === lastPosition.y)) {
        return;
    }

    // Check if the bead is adjacent to the last bead in the path
    if (!isAdjacent(x, y)) {
        reloadLevel();
        return;
    }

    let level = levels[currentLevelIndex]; // Load the current level configuration
    let isForbidden = level.forbiddenPositions.some(pos => pos.x === x && pos.y === y);

    if (isForbidden) {
        reloadReason = "Can't go there! Try again.";
        reloadLevel();
        return;
    }

    // Check if the clicked bead is a checkpoint and in the correct order
    let checkpointIndex = level.checkpoints.findIndex(cp => cp.x === x && cp.y === y);
    if (checkpointIndex >= 0) {
        if (checkpointIndex !== currentCheckpointIndex) {
            // Clicked out of order or the wrong checkpoint
            reloadReason = "Checkpoints must be filled in order!";
            reloadLevel();
            return;
        } else {
            // Correct checkpoint, proceed
            currentCheckpointIndex++;
        }
    }

    // Color the clicked bead, add to path, and update lastPosition
    PS.color(x, y, PATH_COLOR);
    path.push({ x, y });
    lastPosition = { x, y };
    PS.audioPlay("fx_click");

    // Check win condition if end point is clicked
    if (x === level.endPosition.x && y === level.endPosition.y) {
        if (checkWinCondition()) {
            if (gameWon) {
                // Game already won, no need to proceed further
                //PS.debug("Game already concluded.\n");
                return;
            }
            gameWon = true;
            PS.statusText("Level Complete!");
            fillGridWithColor(END_COLOR);
            PS.audioPlay("fx_coin1");

            // Ensure any existing next level timer is canceled before starting a new one
            if (winTimer !== null) {
                PS.timerStop(winTimer);
                winTimer = null;
            }

            // Start the next level transition timer
            winTimer = PS.timerStart(150, function() {
                nextLevel(); // Transition to the next level after 3 seconds
                PS.timerStop(winTimer);
                winTimer = null; // Clear the timer ID once executed
            });
        } else {
            // Incorrect path or blank beads remaining
            reloadLevel(true); // Indicates incorrect end point click
        }
    }
};


// Check if clicked bead is adjacent to the last position in the path
function isAdjacent(x, y) {
    // Check orthogonal adjacency and if bead is already part of the path
    for (let i = 0; i < path.length; i++) {
        if (path[i].x === x && path[i].y === y) {
            return false; // Bead is already part of the path
        }
    }

    // Check orthogonal adjacency (exclude diagonals)
    return (Math.abs(lastPosition.x - x) === 1 && lastPosition.y === y) ||
        (lastPosition.x === x && Math.abs(lastPosition.y - y) === 1);
}


// Check if all conditions for winning are met
function checkWinCondition() {
    let level = levels[currentLevelIndex];

    for (let x = 0; x < level.gridSize.width; x++) {
        for (let y = 0; y < level.gridSize.height; y++) {
            let beadColor = PS.color(x, y);
            if (beadColor === BLANK_COLOR) {
                return false; // Found a blank bead
            }
        }
    }
    return true; // All beads are filled except forbidden beads
}


// Reload the level by calling resetGameState
function reloadLevel(endClicked = false) {
    //PS.debug( "reloadLevel() called\n" );

    PS.audioPlay("fx_bloink");

    // Determine status text based on the reload reason
    let statusText = "Path broken! Try again."; // Default message
    if (endClicked) {
        statusText = "Need to fill in all blank grids!";
    } else if (reloadReason) {
        statusText = reloadReason; // Use specific reason if set
    }
    PS.statusText(statusText);

    canClick = false; // Disable clicking on beads

    // If a reload timer is already running, let it finish
    if (reloadTimer !== null) {
        return;
    }

    reloadTimer = PS.timerStart(150, function() {
        resetGameState();
        PS.timerStop(reloadTimer); // Ensure to stop the timer after execution
        reloadTimer = null; // Reset the timer ID for future use
        canClick = true; // Re-enable clicking on beads
        reloadReason = ""; // Reset the reload reason for the next use
    });
}


// Reset the game level
function resetGameState() {
    //PS.debug( "resetGameState() called\n" );

    let level = levels[currentLevelIndex];
    currentCheckpointIndex = 0;

    // Reset game state variables
    gameWon = false;
    canClick = true; // Ensure clicking is enabled when resetting
    path = [ { ...level.startPosition } ]; // Reset path to start position
    lastPosition = { ...level.startPosition }; // Reset last position to start

    // Set grid size and color
    PS.gridSize(level.gridSize.width, level.gridSize.height);
    PS.gridColor(PS.COLOR_GRAY);

    // Initialize all beads
    for (let x = 0; x < level.gridSize.width; x++) {
        for (let y = 0; y < level.gridSize.height; y++) {
            PS.color(x, y, BLANK_COLOR);
            PS.glyph(x, y, 0); // Clear any existing glyph
        }
    }

    // Set start and end positions
    PS.color(level.startPosition.x, level.startPosition.y, START_COLOR);
    PS.color(level.endPosition.x, level.endPosition.y, END_COLOR);
    // Optionally, set a flag glyph for the end position
    PS.glyph(level.endPosition.x, level.endPosition.y, "⚑");

    // Set forbidden beads
    level.forbiddenPositions.forEach(pos => {
        PS.color(pos.x, pos.y, FORBIDDEN_COLOR);
    });

    // Set checkpoints (if any)
    level.checkpoints.forEach(checkpoint => {
        PS.glyph(checkpoint.x, checkpoint.y, checkpoint.order.toString());
    });

    PS.statusColor(PS.COLOR_WHITE);
    PS.statusText(level.statusText || "Pathway: Mouse Click to Fill and Connect");
}


// Moving to the next level
function nextLevel() {
    // If a next level timer is already running, let it finish
    if (nextLevelTimer !== null) {
        PS.timerStop(nextLevelTimer);
        nextLevelTimer = null;
    }

    //PS.debug("nextLevel() called\n");

    if (gameWon) { // Check if the game was actually won before proceeding
        if (currentLevelIndex < levels.length - 1) {
            currentLevelIndex++; // Advance to the next level
            PS.statusText("Moving to the next level...");

            nextLevelTimer = PS.timerStart(120, function() {
                resetGameState(); // Load the next level
                PS.timerStop(nextLevelTimer);
                nextLevelTimer = null;
            });
        } else {
            PS.statusText("Congratulations! All levels completed.");
            // Optionally, restart from the first level or end the game
            currentLevelIndex = 0; // Restart from the first level

            nextLevelTimer = PS.timerStart(180, function() {
                resetGameState(); // Load the first level again
                PS.timerStop(nextLevelTimer);
                nextLevelTimer = null;
            });
        }
    } else {
        // If the game was not won, just reset the current level (safety check)
        resetGameState();
    }

}


function fillGridWithColor(color) {
    //PS.debug( "fillGridWithColor() called\n" );

    let level = levels[currentLevelIndex]; // Load the current level configuration

    for (let x = 0; x < level.gridSize.width; x++) {
        for (let y = 0; y < level.gridSize.height; y++) {
            PS.color(x, y, color);
        }
    }
}

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

