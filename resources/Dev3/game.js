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

const PLAYER_COLOR = PS.COLOR_BLUE;
const TRAP_COLOR = PS.COLOR_RED;
const EXIT_COLOR = PS.COLOR_GREEN;
const NORMAL_COLOR = PS.COLOR_WHITE;
let playerPosition = {x: 0, y: 0}; // Starting position of the player
const exitPosition = { x: 8, y: 8};

let gameWon = false; // to check if a game is won

PS.init = function( system, options ) {
	//PS.debug( "ARROW_UP\nARROW_DOWN\nARROW_LEFT\nARROW_RIGHT to move" );

	PS.gridSize( 9, 9);
	PS.statusText( "Escape the Grid (Use the arrow keys)" );

	PS.color(playerPosition.x, playerPosition.y, PLAYER_COLOR);

	// Exit position
	PS.color(exitPosition.x, exitPosition.y, EXIT_COLOR);

	placeTraps();
};

/**
 * To place traps on the grids
 */
function placeTraps(){
	// set trap positions
	const trapPositions = [
		{x: 3, y: 0}, {x: 6, y: 0}, {x: 7, y: 0}, {x: 8, y: 0},
		{x: 3, y: 1},
		{x: 5, y: 2}, {x: 6, y: 2}, {x: 7, y: 2},
		{x: 1, y: 3}, {x: 2, y: 3}, {x: 3, y: 3}, {x: 4, y: 3},
		{x: 1, y: 4}, {x: 2, y: 4}, {x: 3, y: 4}, {x: 4, y: 4}, {x: 6, y: 4}, {x: 7, y: 4}, {x: 8, y: 4},
		{x: 3, y: 5}, {x: 4, y: 5}, {x: 7, y: 5}, {x: 8, y: 5},
		{x: 0, y: 6}, {x: 1, y: 6}, {x: 3, y: 6}, {x: 4, y: 6}, {x: 5, y: 6},
		{x: 0, y: 7}, {x: 3, y: 7}, {x: 7, y: 7},
		{x: 0, y: 8}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8},
	];

	// set traps into data to mark them as traps
	// So I know if players hit the trap by calling PS.data
	trapPositions.forEach(function(position){
		PS.data(position.x, position.y, "trap");
	});
}

/**
 * handle winning condition
 */
function onWin(){
	gameWon = true;

	let winTimer;

	PS.statusText("You Win! :>");
	showWinningSigns();

	// use a timer to wait for 5 seconds
	winTimer = PS.timerStart(300, function(){
		PS.timerStop(winTimer); // Stop the timer

		gameWon = false;

		PS.statusText("Escape the Grid(Use the arrow keys)");
		// reset the old position color
		fillGridWithColor(NORMAL_COLOR);
		PS.color(playerPosition.x, playerPosition.y, NORMAL_COLOR);
		PS.color(0, 0, PLAYER_COLOR);
		PS.color(exitPosition.x, exitPosition.y, EXIT_COLOR);

		// reset the player position to the start
		playerPosition.x = 0;
		playerPosition.y = 0;

		placeTraps();
	});
}

/**
 * show signs on winning positions
 */
function showWinningSigns(){
	fillGridWithColor(NORMAL_COLOR);

	const winningPositions = [
		{ x: 2, y: 2, color: PS.COLOR_GREEN },
		{ x: 2, y: 3, color: PS.COLOR_GREEN },
		{ x: 2, y: 4, color: PS.COLOR_GREEN },
		{ x: 2, y: 6, color: PS.COLOR_GREEN },
		{ x: 4, y: 2, color: PS.COLOR_GREEN },
		{ x: 4, y: 3, color: PS.COLOR_GREEN },
		{ x: 4, y: 4, color: PS.COLOR_GREEN },
		{ x: 4, y: 6, color: PS.COLOR_GREEN },
		{ x: 6, y: 2, color: PS.COLOR_GREEN },
		{ x: 6, y: 3, color: PS.COLOR_GREEN },
		{ x: 6, y: 4, color: PS.COLOR_GREEN },
		{ x: 6, y: 6, color: PS.COLOR_GREEN },
	];

	winningPositions.forEach(function(pos) {
		PS.color(pos.x, pos.y, pos.color);
	});
}

/**
 * Make the whole grid turning into a color
 * @param color the specific color
 */
function fillGridWithColor(color) {
	let width = PS.gridSize().width;
	let height = PS.gridSize().height;

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			PS.color(x, y, color);
		}
	}
}
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

	// Add code here for mouse clicks/touches
	// over a bead.
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

	//PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

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

	//PS.debug( "PS.enter() @ " + x + ", " + y + "\n" );

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

	//PS.debug( "PS.exitGrid() called\n" );

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
	//PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	if(gameWon){
		return PS.DONE;
	}

	let x = playerPosition.x; // current x position
	let y = playerPosition.y; // current y position

	// Prevent moving off the grid
	switch (key){
		case PS.KEY_ARROW_UP:
			if (y > 0) {
				y -= 1;
			}
			break;

		case PS.KEY_ARROW_DOWN:
			if (y < PS.gridSize().height - 1) {
				y += 1;
			}
			break;

		case PS.KEY_ARROW_LEFT:
			if (x > 0) {
				x -= 1;
			}
			break;

		case PS.KEY_ARROW_RIGHT:
			if (x < PS.gridSize().width - 1) {
				x += 1;
			}
			break;
	}



	if (x === exitPosition.x && y === exitPosition.y){
		// players win
		onWin();
		return PS.DONE;
	}

	if (PS.data(x, y) !== "trap") {
		// move player to the new position
		PS.color(playerPosition.x, playerPosition.y, NORMAL_COLOR); // Reset the color of the old position
		PS.color(x, y, PLAYER_COLOR); // color the new position
		playerPosition.x = x;
		playerPosition.y = y;
	}
	else // means player hits the trap, game should over and restart
	{
		// also, I set that the trap being hit will become visible in future runs
		PS.color(x, y, TRAP_COLOR);

		// reset player position
		PS.statusText("You hit a trap! Let's start over");
		PS.color(playerPosition.x, playerPosition.y, NORMAL_COLOR);
		PS.color(0, 0, PLAYER_COLOR);

		playerPosition.x = 0;
		playerPosition.y = 0;
	}

	// consume the event so it won't do anything else
	return PS.DONE;
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

