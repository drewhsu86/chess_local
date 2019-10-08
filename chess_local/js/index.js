// Chess in Javascript and with JQuery


$(function() {

  // Initialize Chess Board
	// Board resets if page reloads


	console.log('loaded');
	//Connect to database
	//Connection variables
	var response = firebase.database();
	var data = response.ref('boardRooms');
	var dataManage = response.ref('boardManage');
	var username = '';
	var password = '';

	// ============ local game logic
	// the starting board with pieces
	// 0 = empty
	// 10s - white
	// 20s - black
	// 1-pawn, 2-knight, 3-bishop, 4-rook, 5-queen, 6-king
	var board = [
						[24, 22, 23, 25, 26, 23, 22, 24],
						[21, 21, 21, 21, 21, 21, 21, 21],
						[0,0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0,0],
						[11, 11, 11, 11, 11, 11, 11, 11],
						[14, 12, 13, 15, 16, 13, 12, 14]
	];

	var alph = ['a','b','c','d','e','f','g','h'];  // used to convert coordinates (array of 2 digits) into chess coordinates "a8" for example

// game state determines whose turn it is or if someone won
// game states: white, black, wClick, bClick, wWon, bWon
	var gameState = "white";
	var moveTemp = "";     // this will hold the move being considered so we know if the player clicks the same piece, we will store the string such as "a8"
	var legalMoves = [];   // holds legal moves as a global variable so clear legal moves can simply grab it
	var captured = [];		// holds array of 2 digit numbers for the pieces captured
	var enpassant = '';   // stores a8 format location of the last pawn to move 2 spaces from its start, and should be erased the next turn (or every turn after if statement)
												// stored enpassant location should be used to capture the pawn if necessary before erasing


  var bCastle = [true, true];   // if king or either rook moves, cannot castle. [0] for left and [1] for right, if king moves both become false
	var wCastle = [true, true];   // if king or either rook moves, cannot castle. [0] for left and [1] for right, if king moves both become false

	var blackImg = [
			'images/bPawn.png',
			'images/bKnight.png',
			'images/bBishop.png',
			'images/bRook.png',
			'images/bQueen.png',
			'images/bKing.png'
	];

	var whiteImg = [
		'images/wPawn.png',
		'images/wKnight.png',
		'images/wBishop.png',
		'images/wRook.png',
		'images/wQueen.png',
		'images/wKing.png'
	]

// alternate skin pieces
	var blackImg2 = [
			'images/bPawn2.png',
			'images/bKnight2.png',
			'images/bBishop2.png',
			'images/bRook2.png',
			'images/bQueen2.png',
			'images/bKing2.png'
	];
// alternate skin pieces
	var whiteImg2 = [
		'images/wPawn2.png',
		'images/wKnight2.png',
		'images/wBishop2.png',
		'images/wRook2.png',
		'images/wQueen2.png',
		'images/wKing2.png'
	]

// data structures for running a game off Firebase
	var gameRoom = {
		name: 'AAAA',  // will randomize 4 letter code later on
		board: []
	};

	////////////////////////////////////////////////////////
	//																										//
	//		End of variables, beginning of objects					//
	//																										//
	////////////////////////////////////////////////////////

	const pawn = {

			num: 1,
			// method for calculating legal moves. taking in the position (will check if it is actually a pawn!!!!!!)
			// return an array of strings
			legalMoves: function(strCoord, inboard) {

				let mboard = copyBoard(inboard);

				// console.log('P -- legalMoves from ' + strCoord);
				let moves = [];  // we'll return this array at the end

				// easier to work with pair of numbers (for current position)
				let coord = s2aChess(strCoord);
				let direction = 1;

				// own color of piece depends on the piece
				let piece = mboard[coord[0]][coord[1]];


				// for pawns the direction is important!!!!!
				// for reference, 0,0 is the top right of the board
				// that is FORWARD for WHITE, and BACKWARD for BLACK
				// in numbers, the y axis decreases for forward (for white)
				// the y axis increases for forward for black
				if (Math.floor(piece/10) === 2) {
						direction = 1; // numbers increase so we keep positive
				}
				else if (Math.floor(piece/10) === 1) {
						direction = -1; // we will do the same calculations but with negatives
				}

				// console.log(piece + ' in direction ' + direction);
				// make a variable to store our color
				// number map:   direction 1 -> 2 (black), direction -1 -> 1 (white)
				// slope = 1/2
				// color = 0.5(direction) + 1.5
				let ownColor = 0.5*direction + 1.5;  // only need to do this for pawn, will use gameState to do 1 or 2 for other pieces

				// // if the piece is incorrect or the color is incorrect
				// if (!pieceMatch(coord, this.num)) {
				// 	return [];
				// }


				// if black, direction = 1
				// if space is empty pawn can go there, cannot capture
				let newX = coord[0]+direction;
				let newY = coord[1];

				// console.log('P -- one ahead: ' + mboard[newX][newY]);
				if (mboard[newX][newY] === 0 && !offBoard(newX, newY)) {
					// console.log('P -- pawn one step ' + a2sChess(newX, newY))
						moves.push(a2sChess(newX, newY));
				}

				// if pawn is at the beginning it can move one or two sq if they are free
				// white starts at row 2, or 6 in our array, black starts at row 7, or 1 in our array
				// numbers map: direction = 1 -> 1 ,    direction = -1 -> 6
				// slope = -5/2				starting row = -2.5(direction) + 3.5

				// if pawn is on the original row, let it go up 2 steps
				newX = coord[0]+2*direction;
				newY = coord[1];
				if (coord[0] === (-2.5*(direction) + 3.5) && mboard[newX][newY] === 0 && mboard[newX-direction][newY] === 0) {
						// console.log('P -- pawn two step ' + a2sChess(newX, newY))
						moves.push(a2sChess(newX, newY));
				}

				// pawn can only capture diagonally
				// check if either diagonal is an enemy
				for (let i = -1; i <= 1; i += 2) {
				newX = coord[0]+direction;
				newY = coord[1] + i;

				if (mboard[newX][newY] !== 0 && Math.floor(mboard[newX][newY]/10) !== ownColor && !offBoard(newX, newY)) {
					// console.log('P -- pawn diagonal cap ' + a2sChess(newX, newY))
					moves.push(a2sChess(newX, newY));
				}
				// also check for enpassant while we're checking diagonals
				// isEnpassant() // returns true if there is an enpassant
				console.log('isEnpassant --- ' + isEnpassant(coord, [newX, newY], mboard));
				if (isEnpassant(coord, [newX, newY], mboard)) {
					// console.log('P -- pawn diagonal enp ' + a2sChess(newX, newY))
					moves.push(a2sChess(newX, newY));
				}

				}


				// if (oldCoord[0] === enpassCoord[0] && newCoord[1] === enpassCoord[1] )



				moves = [... new Set(moves)];
				console.log('P -- moves: ' + moves);
				return moves;

			} // end legalMoves

	} // end pawn

	const knight = {

			num: 2,
			// method for calculating legal moves. taking in the position (will check if it is actually a pawn!!!!!!)
			// return an array of strings
			legalMoves: function(strCoord, inboard) {

				let mboard = copyBoard(inboard);

				let moves = [];  // we'll return this array at the end

				// easier to work with pair of numbers (for current position)
				let coord = s2aChess(strCoord);

				let piece = mboard[coord[0]][coord[1]];
				let ownColor = Math.floor(piece/10);
				// console.log('ownColor ' + ownColor);
				// // determine piece's color
				// if (gameState === 'black' || gameState === 'bClick') {
				// 		ownColor = 2;
				// }
				// else if (gameState === 'white' || gameState === 'wClick') {
				// 		ownColor = 1;
				// } else {		// game state unknown
				// 	return [];
				// }

				// // if the piece is incorrect or the color is incorrect
				// if (!pieceMatch(coord, this.num)) {
				// 	return [];
				// }

				let newX;
				let newY;

			// knight can go 2 to one direction and 1 to the other
			// possible combinations +/-2 , +/-1 and +/-1, +/-2 , so 8 combinations
			for (let i = -1; i <= 1; i += 2) {
				for (let j = -1; j <= 1; j += 2) {

					newX = coord[0] + 2*i ;
					newY = coord[1] + j ;
					// console.log('N -- checking ' + newX + ', ' + newY);

				if (!offBoard(newX, newY)) {
					let nextPiece = mboard[newX][newY];
					// console.log('nextColor ' + Math.floor(nextPiece/10));
					if (( nextPiece === 0 || Math.floor(nextPiece/10) !== ownColor)) {
						// console.log('N -- knight ' + a2sChess(newX, newY))
						moves.push(a2sChess(newX, newY));
					}
				}

				}
			}

			for (let i = -1; i <= 1; i += 2) {
				for (let j = -1; j <= 1; j += 2) {

					newX = coord[0] + i ;
					newY = coord[1] + 2*j ;

					// console.log('N -- checking ' + newX + ', ' + newY);

				if (!offBoard(newX, newY)) {
					let nextPiece = mboard[newX][newY];
					// console.log('nextColor ' + Math.floor(nextPiece/10));
					if (( nextPiece === 0 || Math.floor(nextPiece/10) !== ownColor)) {
						// console.log('N -- knight ' + a2sChess(newX, newY))
						moves.push(a2sChess(newX, newY));
					}
				}

				}
			}

				moves = [... new Set(moves)];
				console.log('N -- moves: ' + moves);
				return moves;

			} // end legalMoves

	} // end knight


	const bishop = {

				num: 3,
				// method for calculating legal moves. taking in the position (will check if it is actually a pawn!!!!!!)
				// return an array of strings
				legalMoves: function(strCoord, inboard) {

					let mboard = copyBoard(inboard);

					let moves = [];  // we'll return this array at the end

					// easier to work with pair of numbers (for current position)
					let coord = s2aChess(strCoord);

					let piece =  mboard[coord[0]][coord[1]];
					let ownColor = Math.floor(piece/10);
					// // determine piece's color
					// if (gameState === 'black' || gameState === 'bClick') {
					// 		ownColor = 2;
					// }
					// else if (gameState === 'white' || gameState === 'wClick') {
					// 		ownColor = 1;
					// } else {		// game state unknown
					// 	return [];
					// }

					// // if the piece is incorrect or the color is incorrect
					// if (!pieceMatch(coord, this.num)) {
					// 	return [];
					// }

					let newX;
					let newY;

				// bishop can go diagonal until it is blocked
				// start at coord, then +/-,+/- for 1,1 2,2 3,3 4,4 until its blocked

				for (let i = -1; i <= 1; i += 2) {
					for (let j = -1; j <= 1; j += 2) {

						newX = coord[0];
						newY = coord[1];

						let keepGoing = true;

				while (keepGoing) {

					newX += i;
					newY += j;
						console.log('B -- checking ' + newX + ', ' + newY);

					if (!offBoard(newX, newY)) {
						let nextPiece = mboard[newX][newY];
						if (nextPiece === 0) {  // empty spaces can keep going until blocked
							console.log('B -- moves ' + a2sChess(newX, newY));
							moves.push(a2sChess(newX, newY));
						}	else if (Math.floor(nextPiece/10) !== ownColor){ // if enemy piece, can take that piece but also must stop
							console.log('B -- moves ' + a2sChess(newX, newY));
							moves.push(a2sChess(newX, newY));
							keepGoing = false;
						} else if (Math.floor(nextPiece/10) === ownColor) {  // same side piece, legalMove is back one space
							console.log('B -- moves ' + a2sChess(newX, newY));
							moves.push(a2sChess(newX - i, newY - j));
							keepGoing = false;
						} else {
							keepGoing = false;
						}
					} else {
						keepGoing = false;
					}

				}

					}
				}

					moves = [... new Set(moves)];
					console.log('B -- moves: ' + moves);
					return moves;

				} // end legalMoves

		} // end bishop


		const rook = {

					num: 4,
					// method for calculating legal moves. taking in the position (will check if it is actually a pawn!!!!!!)
					// return an array of strings
					legalMoves: function(strCoord, inboard) {

						let mboard = copyBoard(inboard);

						let moves = [];  // we'll return this array at the end

						// easier to work with pair of numbers (for current position)
						let coord = s2aChess(strCoord);

						let piece =  mboard[coord[0]][coord[1]];
						let ownColor = Math.floor(piece/10);
						// // determine piece's color
						// if (gameState === 'black' || gameState === 'bClick') {
						// 		ownColor = 2;
						// }
						// else if (gameState === 'white' || gameState === 'wClick') {
						// 		ownColor = 1;
						// } else {		// game state unknown
						// 	return [];
						// }

						// // if the piece is incorrect or the color is incorrect
						// if (!pieceMatch(coord, this.num)) {
						// 	return [];
						// }

						let newX;
						let newY;

					// rook can go straight until blocked
					// can use similar logic as bishop except to go straight one way and then the other
					// +/-, 0  ,  0, +/-
					// two separate for loops would work

					for (let i = -1; i <= 1; i += 2) {

							newX = coord[0];
							newY = coord[1];

							let keepGoing = true;

					while (keepGoing) {

						newX += i;

							// console.log('R -- checking ' + newX + ', ' + newY);

						if (!offBoard(newX, newY)) {
							let nextPiece = mboard[newX][newY];
							if (nextPiece === 0) {  // empty spaces can keep going until blocked
								// console.log('R -- moves ' + a2sChess(newX, newY));
								moves.push(a2sChess(newX, newY));
							}	else if (Math.floor(nextPiece/10) !== ownColor){ // if enemy piece, can take that piece but also must stop
								// console.log('R -- moves ' + a2sChess(newX, newY));
								moves.push(a2sChess(newX, newY));
								keepGoing = false;
							} else if (Math.floor(nextPiece/10) === ownColor) {  // same side piece, legalMove is back one space
								// console.log('R -- moves ' + a2sChess(newX, newY));
								moves.push(a2sChess(newX - i, newY));
								keepGoing = false;
							} else {
								keepGoing = false;
							}
						} else {
							keepGoing = false;
						}

					}

					}

					for (let j = -1; j <= 1; j += 2) {

						newX = coord[0];
						newY = coord[1];

						let keepGoing = true;

				while (keepGoing) {

					newY += j;
						// console.log('R -- checking ' + newX + ', ' + newY);

					if (!offBoard(newX, newY)) {
						let nextPiece = mboard[newX][newY];
						if (nextPiece === 0) {  // empty spaces can keep going until blocked
							// console.log('R -- moves ' + a2sChess(newX, newY));
							moves.push(a2sChess(newX, newY));
						}	else if (Math.floor(nextPiece/10) !== ownColor){ // if enemy piece, can take that piece but also must stop
							// console.log('R -- moves ' + a2sChess(newX, newY));
							moves.push(a2sChess(newX, newY));
							keepGoing = false;
						} else if (Math.floor(nextPiece/10) === ownColor) {  // same side piece, legalMove is back one space
							// console.log('R -- moves ' + a2sChess(newX, newY));
							moves.push(a2sChess(newX, newY - j));
							keepGoing = false;
						} else {
							keepGoing = false;
						}
					} else {
						keepGoing = false;
					}

				}

					}

						moves = [... new Set(moves)];
						console.log('R -- moves: ' + moves);
						return moves;

					} // end legalMoves

			} // end rook


			const queen = {

						num: 5,
						// method for calculating legal moves. taking in the position (will check if it is actually a pawn!!!!!!)
						// return an array of strings
						legalMoves: function(strCoord, inboard) {

							let mboard = copyBoard(inboard);

							let moves = [];  // we'll return this array at the end

							// easier to work with pair of numbers (for current position)
							let coord = s2aChess(strCoord);

							let piece =  mboard[coord[0]][coord[1]];
							let ownColor = Math.floor(piece/10);
							// // determine piece's color
							// if (gameState === 'black' || gameState === 'bClick') {
							// 		ownColor = 2;
							// }
							// else if (gameState === 'white' || gameState === 'wClick') {
							// 		ownColor = 1;
							// } else {		// game state unknown
							// 	return [];
							// }

							// // if the piece is incorrect or the color is incorrect
							// if (!pieceMatch(coord, this.num)) {
							// 	return [];
							// }

							let newX;
							let newY;

						// queen combines rook and bishop

						for (let i = -1; i <= 1; i += 2) {
							for (let j = -1; j <= 1; j += 2) {

								newX = coord[0];
								newY = coord[1];

								let keepGoing = true;

						while (keepGoing) {

							newX += i;
							newY += j;
								// console.log('Q -- checking ' + newX + ', ' + newY);

							if (!offBoard(newX, newY)) {
								let nextPiece = mboard[newX][newY];
								if (nextPiece === 0) {  // empty spaces can keep going until blocked
									// console.log('Q -- moves' + a2sChess(newX, newY));
									moves.push(a2sChess(newX, newY));
								}	else if (Math.floor(nextPiece/10) !== ownColor){ // if enemy piece, can take that piece but also must stop
									// console.log('Q -- moves' + a2sChess(newX, newY));
									moves.push(a2sChess(newX, newY));
									keepGoing = false;
								} else if (Math.floor(nextPiece/10) === ownColor) {  // same side piece, legalMove is back one space
									// console.log('Q -- moves' + a2sChess(newX, newY));
									moves.push(a2sChess(newX - i, newY - j));
									keepGoing = false;
								} else {
									keepGoing = false;
								}
							} else {
								keepGoing = false;
							}

						}

							}
						}

						for (let i = -1; i <= 1; i += 2) {

								newX = coord[0];
								newY = coord[1];

								let keepGoing = true;

						while (keepGoing) {

							newX += i;

								// console.log('Q -- checking ' + newX + ', ' + newY);

							if (!offBoard(newX, newY)) {
								let nextPiece = mboard[newX][newY];
								if (nextPiece === 0) {  // empty spaces can keep going until blocked
									// console.log('Q -- moves' + a2sChess(newX, newY));
									moves.push(a2sChess(newX, newY));
								}	else if (Math.floor(nextPiece/10) !== ownColor){ // if enemy piece, can take that piece but also must stop
									// console.log('Q -- moves' + a2sChess(newX, newY));
									moves.push(a2sChess(newX, newY));
									keepGoing = false;
								} else if (Math.floor(nextPiece/10) === ownColor) {  // same side piece, legalMove is back one space
									// console.log('Q -- moves' + a2sChess(newX, newY));
									moves.push(a2sChess(newX - i, newY));
									keepGoing = false;
								} else {
									keepGoing = false;
								}
							} else {
								keepGoing = false;
							}

						}

						}

						for (let j = -1; j <= 1; j += 2) {

							newX = coord[0];
							newY = coord[1];

							let keepGoing = true;

					while (keepGoing) {

						newY += j;
							// console.log('Q -- checking ' + newX + ', ' + newY);

						if (!offBoard(newX, newY)) {
							let nextPiece = mboard[newX][newY];
							if (nextPiece === 0) {  // empty spaces can keep going until blocked
								// console.log('Q -- moves ' + a2sChess(newX, newY));
								moves.push(a2sChess(newX, newY));
							}	else if (Math.floor(nextPiece/10) !== ownColor){ // if enemy piece, can take that piece but also must stop
								// console.log('Q -- moves ' + a2sChess(newX, newY));
								moves.push(a2sChess(newX, newY));
								keepGoing = false;
							} else if (Math.floor(nextPiece/10) === ownColor) {  // same side piece, legalMove is back one space
								// console.log('Q -- moves ' + a2sChess(newX, newY));
								moves.push(a2sChess(newX, newY - j));
								keepGoing = false;
							} else {
								keepGoing = false;
							}
						} else {
							keepGoing = false;
						}

					}

						}

							moves = [... new Set(moves)];
							console.log('Q -- moves: ' + moves);
							return moves;

						} // end legalMoves

				} // end queen


const king = {

							num: 6,
							// method for calculating legal moves. taking in the position (will check if it is actually a pawn!!!!!!)
							// return an array of strings
							legalMoves: function(strCoord, inboard) {

								let mboard = copyBoard(inboard);

								let moves = [];  // we'll return this array at the end

								// easier to work with pair of numbers (for current position)
								let coord = s2aChess(strCoord);

								let piece =  mboard[coord[0]][coord[1]];
								let ownColor = Math.floor(piece/10);
								// // determine piece's color
								// if (gameState === 'black' || gameState === 'bClick') {
								// 		ownColor = 2;
								// }
								// else if (gameState === 'white' || gameState === 'wClick') {
								// 		ownColor = 1;
								// } else {		// game state unknown
								// 	return [];
								// }

								// // if the piece is incorrect or the color is incorrect
								// if (!pieceMatch(coord, this.num)) {
								// 	return [];
								// }

								let newX;
								let newY;

							// queen combines rook and bishop

							for (let i = -1; i <= 1; i ++) {
								for (let j = -1; j <= 1; j ++) {

									newX = coord[0];
									newY = coord[1];



								newX += i;
								newY += j;
									// console.log('K -- checking ' + newX + ', ' + newY);

								if (!offBoard(newX, newY)) {
									let nextPiece = mboard[newX][newY];
									if (nextPiece === 0) {  // empty spaces can keep going until blocked
										// console.log('K -- moves' + a2sChess(newX, newY));
										moves.push(a2sChess(newX, newY));
									}	else if (Math.floor(nextPiece/10) !== ownColor){ // if enemy piece, can take that piece but also must stop
										// console.log('K -- moves' + a2sChess(newX, newY));
										moves.push(a2sChess(newX, newY));
										keepGoing = false;
									} else if (Math.floor(nextPiece/10) === ownColor) {  // same side piece, legalMove is back one space
										// console.log('K -- moves' + a2sChess(newX, newY));
										moves.push(a2sChess(newX - i, newY - j));
										keepGoing = false;
									} else {
										keepGoing = false;
									}
								} else {
									keepGoing = false;
								}



								}
							}

								moves = [... new Set(moves)];
								console.log('K -- moves: ' + moves);
								return moves;

							} // end legalMoves

					} // end king

const pieceArray = [
	pawn, knight, bishop, rook, queen, king
];

	////////////////////////////////////////////////////////
	//																										//
	//	 end of objects																		//
	//																										//
	////////////////////////////////////////////////////////




	// on load - run the html once to fill in everything
	htmlBoard(board);


	////////////////////////////////////////////////////////
	//																										//
	//		mouse over events 															//
	//																										//
	////////////////////////////////////////////////////////
// hovering code for if you are going to move
// on mouseenter will show you legal moves
// we use data-key attribute of each chessCell
$('#sqBoard').on('mouseenter','.chessCell', function () {

	let strCoords = $(this).data('key');
	// console.log('hovered ' + strCoords);

	if (yourPiece(gameState, strCoords) && (gameState === 'black' || gameState === 'white')) {
	$(`td[data-key=${strCoords}]`).css("background-color","red");
	}

});

// on mouseleave will remove what mouseenter did
$('#sqBoard').on('mouseleave','.chessCell', function () {

	let strCoords = $(this).data('key');
	// console.log('unhovered ' + strCoords);

	if (gameState === 'black' || gameState === 'white') {
		$(this).css("background-color","");
	}

});

////////////////////////////////////////////////////////
//																										//
//		mouse click																			//
//																										//
////////////////////////////////////////////////////////
// when we click the mouse we need to check game state to see if we can move
// mouse over should already be calculating legal moves
// so we should be able to use the same code and logic to complete the move
// we should then update the game board and html
$('#sqBoard').on('click','.chessCell', function () {

	let strCoords = $(this).data('key');
	console.log(' -- clicked ' + strCoords);

	console.log(' -- yourPiece ' + yourPiece(gameState, strCoords));

	// only do the next part if it's your turn
	// and the piece that you clicked is your piece
	if (yourPiece(gameState, strCoords) && (gameState === 'black' || gameState === 'white')) {

	let side;

	// on click, advance game state to contemplating move state
	if (gameState === 'black') {
		gameState = 'bClick';
		side = 2;
	} else if (gameState === 'white') {
		gameState = 'wClick';
		side = 1;
	}
	// we won't put an else in case there's a game over and we don't want things moving

	console.log('=== game state: ' + gameState + ' ===');


	// temporarily save the coordinates so that we can tell if it was clicked again
	moveTemp = strCoords;

	// check legal moves by matching the piece with the num identifier of each type of piece
	for (piece of pieceArray) {
		// console.log('strPiece(strCoords)[1] ' + strPiece(strCoords)[1]);
		// console.log('piece.num ' + piece.num);
		// console.log('(strPiece(strCoords)[1]) === piece.num ' + ((strPiece(strCoords)[1]) === piece.num));
		if ((strPiece(strCoords)[1]) === piece.num) {
			console.log('right before legalMoves');
			legalMoves = piece.legalMoves(strCoords, board);   // where the piece is actually determining the array of legal moves

			// remove legal moves that result in self check
			let approvedLegalMoves = [];

			for (moveID in legalMoves) {

				console.log('legalMoves loop start ' + legalMoves);

				// check if next move would be check to self
				// mock board used to simulate next move
				console.log(' on move [' + moveID + '], dest: ' + legalMoves[moveID] + ' \n' + ' side: ' + side + ' loc: ' + strCoords );
				console.log('legalMoves length ' + legalMoves.length);

				// console.log(' << mess >> ' + isCheck(side, mockBoard(strCoords, legalMoves[moveID], board)));
				// console.log(' << mess >> ' + mockBoard(strCoords, legalMoves[moveID], board));

				if (!isCheck(side, mockBoard(strCoords, legalMoves[moveID], board))) {
					console.log(' *** push moveID *** ' + moveID + ' ' + legalMoves[moveID]);
					approvedLegalMoves.push(legalMoves[moveID]);   // remove from legalMoves because it is no longer legal, cannot expose self to check

				}

				console.log('legalMoves loop end ' + legalMoves);
			} // end moveID in legalMoves

			legalMoves = approvedLegalMoves;

		}
	}


	showLegalMoves(strCoords);

} // end of if yourPiece(...), black, white

// this is if the player has clicked his own piece already
// so we have to compare moveTemp with this current click
// doing this click goes back to previous state (cancels the move)
// needs to be else if with the previous check so that it doesn't do both
	else if (strCoords === moveTemp && (gameState === 'bClick' || gameState === 'wClick')) {

	// on click, advance game state to contemplating move state
	if (gameState === 'bClick') {
		gameState = 'black';
	} else if (gameState === 'wClick') {
		gameState = 'white';
	}

	clearLegalMoves();

	console.log('=== game state: ' + gameState + ' ===');
	// we won't put an else in case there's a game over and we don't want things moving

} // end of else if you clicked the same piece



// if you click a different spot, we must check if it's on the legalMoves array list
else if (strCoords !== moveTemp && (gameState === 'bClick' || gameState === 'wClick') && legalMoves.indexOf(strCoords) !== -1) {

// on click, advance game state to contemplating move state
if (gameState === 'bClick') {
	gameState = 'white';
} else if (gameState === 'wClick') {
	gameState = 'black';
}

// unhighlight pieces
$(`td[data-key=${moveTemp}]`).css("background-color","");

// process the move on the actual game board using the old location and new location
processMove(moveTemp, strCoords);

clearLegalMoves();

console.log('=== game state: ' + gameState + ' ===');
// we won't put an else in case there's a game over and we don't want things moving

} // end of else if you clicked a different piece

});


////////////////////////////////////////////////////////
//																										//
//		Prints the Board to HTML												//
//																										//
////////////////////////////////////////////////////////
// function to print the board to sqBoard
function htmlBoard(board) {

// print game turn
	printGameTurn();
	printCaptured();

	// manage the counter so that the board prints easily via iteration
	let bwCounter = 0;   // we will alternate black and white, and do odds or evens
	$('#sqBoard').html(`<table class="chessTable">`); // reset html of order side

		// css stylesheet classes: using row and col to fill in table
	for (rowID in board) {
	// start the row

	// figure out the index->chess grid designation index 0 -> row 8
	let yAxis = 8 - parseFloat(rowID); // need to be careful because now there are 9 rows

	// add a new td to the front of the row
		$('#sqBoard').append(`<tr class="chessRow">`);


		let thisRow = board[rowID];

		// for loop for columns/elements of each row
		for (colID in thisRow)	{


			// determine black or white
			// first square is white (top left)
			let sqClass = 'whiteCell'
			if (bwCounter%2 === 1) {   // if odd change to black
				sqClass = 'blackCell';
			}
			// console.log('bwCounter: ' + bwCounter);
			bwCounter ++;

			// determine what piece to print
			// taking into account color then rank
			// blackImg and whiteImg are arrays indexed 0 - 5 from pawn to king
			let piece = board[rowID][colID];
			let pieceShow = '';

			if (Math.floor(piece/10) === 2) {
				let pieceImg = blackImg[(piece%10)-1];
				pieceShow = `<img class="pieceImg" src="${pieceImg}">`;
			} else if (Math.floor(piece/10) === 1) {
				let pieceImg = whiteImg[(piece%10)-1];
				pieceShow = `<img class="pieceImg" src="${pieceImg}">`;
			}


			// set up template
			let template = `
			<td class="chessCell ${sqClass}" data-key="${a2sChess(rowID,colID)}">

			<p> ${a2sChess(rowID,colID)} </p>

			${pieceShow}

			</td>
		`; // end of template =


		$('#sqBoard').append(template);
	} // end of for colID in board[rowID]
	// end of the for loop, add 1 to bwCounter in order to make it alternate (even number of cells per row)
	bwCounter ++;

	$('#sqBoard').append(`<td style="position: relative"> ${yAxis} </td>`);

	// close the div row
	$('#sqBoard').append(`</tr>`);

	}  // end of for rowID in board


	// draw one more row for the lower grid designations
		// for loop for top of grid designation, index 0 -> col a
		$('#sqBoard').append(`<tr> <td></td>`);
		for (colID = 0; colID < 8; colID++) {
				let xAxis = alph[colID];
				$('#sqBoard').append(`<td>${xAxis}</td>`);
		}

// close table
$('#sqBoard').append(`</tr> </table>`);



}

////////////////////////////////////////////////////////
//																										//
//		functions for processing Chess data							//
//																										//
////////////////////////////////////////////////////////

// convert pair of indexs [0][0] into chess board string 'a8'
// array to string Chess notation
function a2sChess(row, col) {
	// javascript and html start at top left, chessboard starts at bottom left
  // so a8 is 0,0, and h1 is 7,7
	// col, or x axis mapping: 0, 1, 2, 3, 4, 5, 6, 7   ->    a, b, c, d, e, f, g, h
	// row, or y axis mapping: 0 -> 8, 1 -> 7 ... and 7 -> 1 which means => str = -(digit) + 8 (linear equation)

	// console.log('a2sChess receiving: ' + row + ', ' + col)

	let xAxis = alph[col];
	let yAxis = 8 - parseFloat(row);
	let strCoord = xAxis + yAxis;

	// console.log('a2sChess printing: ' + strCoord);

	return strCoord;
}


// function to do the opposite of a2sChess (turn string back into array of 2 digits)
function s2aChess(strCoord) {

// we assume no error checking because we want our program to fail if it isn't taking correctly formatted database
	// console.log('s2aChess on string: ' + strCoord);

// we need to slice out the two pieces and then determine the right numbers
	let colAlph = strCoord.slice(0,1);
	let rowAlph = parseFloat(strCoord.slice(1));

	// we will use index of and the alph array to find col, or x axis
	let col = alph.indexOf(colAlph);

	// row, or y axis mapping: str = -(digit) + 8  so invert the function, digit = 8 - str (if calculated as a number)
	let row = 8 - rowAlph;

	let coords = [row, col];

	// console.log('row, col: ' + coords);

	return coords;
}

// function to quickly get the piece on the given position in str format
function strPiece(strCoord) {
	let coord = s2aChess(strCoord);
	let x = coord[0];
	let y = coord[1];
	// console.log('x=' + x + ' y='+y);
	let piece = board[x][y];
	// return piece;// return piece as two digit number stored on current board
	return [Math.floor(piece/10), piece%10];	// returns piece side and type separately
}


// function that determines if a piece belongs to the current side's turn using the td data-keys
// inputs are the gameState (whose turn it is) and the datakey as a string (we can convert to an array if we want)
function yourPiece(gameState, strCoord) {

		return yourPieceAr(gameState,s2aChess(strCoord));

}

// same function, but for array data of the space. we can use this to complete the string version as well
function yourPieceAr(gameState, coord) {

	// console.log(' * coord - ' + coord);
	let piece = parseFloat(board[coord[0]][coord[1]]);  //board holds coordinates as nested arrays so we use the pair of values to see what piece is there
	// console.log(' * piece - ' + piece);

	// we only want to say true for black or white. if a piece has been clicked we want to process the move instead of determining if it can be clicked at all
	// console.log(' * side calc - ' + Math.floor(piece/10));
	if (gameState === 'black' && Math.floor(piece/10) === 2) {
		return true;
	} else if (gameState === 'white' && Math.floor(piece/10) === 1) {
		return true;
	} else {
		return false;
	}

}

// reading the square, show the legal moves of that piece
// 1) identify the piece. use the objects' methods on top to process a list of legal moves
// 2) show the squares in green on the board after the user has clicked. this method is for showing
// we will also add a method to clear legal moves from the html board
// return null because we don't want to accidentally use this for calculating anything
function showLegalMoves(strCoords) {

	// CAUTION! This method is only for showing html. Calculation of legal moves should take board as an input (for possible look ahead algorithms)

	// step 1: identify the piece and use an object method to return an array of strings in "a8" format
	// legalMoves = ["a8", "h3","c5"];// dummy string for testing

	// for each move we found we will highlight the squares
	for (moveID in legalMoves){
		console.log('legalMoves[]: '+legalMoves[moveID]);
		$(`td[data-key=${legalMoves[moveID]}]`).css("background-color","lightgreen");
	}
}

function clearLegalMoves(strCoords) {

	// CAUTION! This method is only for showing html. Calculation of legal moves should take board as an input (for possible look ahead algorithms)



	// do the opposite of showLegalMoves
	for (move of legalMoves){
		$(`td[data-key=${move}]`).css("background-color","");
	}

	// actually clear out the legalMoves array
	legalMoves = [];

}

// function to be used on piece object methods to verify
function pieceMatch(coord, pieceNum) {  // using number coordinates
	// check if the piece is as selected, or return false and console.log
	// pawn always ends in 1, whether it be 11 or 21
	if (board[coord[0]][coord[1]]%10 !== pieceNum) {
		console.log('Piece wrong ' + pieceNum);
		return false;
	}
	// check if it's the right color as well
	else if (Math.floor(board[coord[0]][coord[1]]/10) === 2 && (gameState !== 'black' && gameState !== 'bClick')) {
		console.log('color wrong ' + gameState + ' piece color ' + Math.floor(board[coord[0]][coord[1]]/10));
		return false;
	}
	else if (Math.floor(board[coord[0]][coord[1]]/10) === 1 && (gameState !== 'white' && gameState !== 'wClick')) {
		console.log('color wrong ' + gameState + ' piece color ' + Math.floor(board[coord[0]][coord[1]]/10));
		return false;
	} else {
		return true;
	}
}

// returns true if the proposed location is off the board
function offBoard(x, y) {

// this assumes chessboards are always 8x8
	if (x < 0 || y < 0 || x > 7 || y > 7) {
		return true;
	} else {
		return false;
	}

}


// inputs are in string format
function processMove(oldSpace, newSpace) {

	let oldCoord = s2aChess(oldSpace);
	let newCoord = s2aChess(newSpace);

	let oldboard = copyBoard(board);



	board = mockBoard(oldSpace, newSpace, board);  // make board the mock board because we are committing board changes

	// process an en passant
	// we know the old coordinates and the new coordinates
	// custom function to process an en passant using those 2 data points
	// checking for enpassant before board changes will be made. therefore the board
	// changes will simply execute the legal move anyway
	console.log(isEnpassant(oldCoord, newCoord, oldboard) + ' ' + (oldCoord) + ' to ' + (newCoord) + ' passing ' + s2aChess(enpassant));
	if (isEnpassant(oldCoord, newCoord, oldboard)) {
		let enPawn = s2aChess(enpassant);
		oldboard[enPawn[0]][enPawn[1]] = 0;  // previous pawn has been captured
		board[enPawn[0]][enPawn[1]] = 0;  // previous pawn has been captured
	}
	enpassant = '';  // clear out enpassant string so no repeat captures can be made there


	// did a pawn move 2 (assumably for the first time)? add it to enpassant
	if ((oldboard[oldCoord[0]][oldCoord[1]])%10 === 1 && Math.abs(oldCoord[0] - newCoord[0]) >= 2) {
		enpassant = newSpace; // adding the space it moved to, to store which pawn can be enpassanted
	}

	// push the captured piece to the records
	if (oldboard[newCoord[0]][newCoord[1]] !== 0) {
		captured.push(oldboard[newCoord[0]][newCoord[1]]);
	}

	htmlBoard(board); // when we process the move we show the board
}


// processes move as a hypothetical, and returns board
function mockBoard(oldSpace, newSpace, inboard) {

	let mboard = copyBoard(inboard);

	let oldCoord = s2aChess(oldSpace);
	let newCoord = s2aChess(newSpace);


	// old space will always be empty
	// new space will always be occupied
	// capture only allowed by legalmoves so we won't check here
	// if a capture happened then the other piece gets pushed to captured array
	// we do the logic the reverse as described above to not have to use temp vars

	mboard[newCoord[0]][newCoord[1]] = mboard[oldCoord[0]][oldCoord[1]];
	mboard[oldCoord[0]][oldCoord[1]] = 0;

	return mboard;
}

// function for processing en passant using old and new coordinates
// properties of the en passant
// your pawn is next to a pawn that just moved twice from its beginning point
// 1) the ending point will be empty
// 2) the row of oldCoord is the same as the row of the piece in enpassant
// 3) the col of newCoord is the same as the col of the piece in enpassant
// 4) piece is a pawn -> (piece%10 === 1)
// 5) enpassant variable should not be an empty string

// input: old and new coords in arrays, output: true or false (true means it IS an enpassant)
// note: deleting the captured pawn and reseting enpassant string to '' should be done in the processMove function, this is just a boolean
function isEnpassant(oldCoord, newCoord, inboard) {

	mboard = copyBoard(inboard);

	console.log('enpassant storage: ' + enpassant);

	let piece = mboard[oldCoord[0]][oldCoord[0]];

	// newCoord is expected to be empty for an enpassant
	if (mboard[newCoord[0]][newCoord[1]] !== 0) {
		console.log(' ! newCoord empty ');
		return false;
	}

	if (!enpassant) {
		console.log(' !enpassant ');
		return false; // if no enpassant was stored then we can't ever do it
	}

	if (piece%10 !== 1) {
		console.log(' ----- not a pawn ----- ' + piece);
		return false; // not a pawn
	}


	// compare row and col to the enpassant piece
	let enpassCoord = s2aChess(enpassant);
	console.log(' ----- enP row match ----- ' + oldCoord[0] === enpassCoord[0]);
	console.log(' ----- enP col match ----- ' + newCoord[1] === enpassCoord[1]);


	if (oldCoord[0] === enpassCoord[0] && newCoord[1] === enpassCoord[1] ) {
		return true;
	} else {
		return false; // return false just to be safe
	}

}


function printGameTurn() {
	// first we print the game turn
	let turnInfo = '';

	if (gameState === 'black' || gameState === 'bClick') {
		turnInfo = 'Black\'s turn';
	} else if (gameState === 'white' || gameState === 'wClick') {
		turnInfo = 'White\'s turn';
	} else if (gameState === 'bWon') {
		turnInfo = 'Black Wins';
	} else if (gameState === 'wWon') {
		turnInfo = 'White Wins';
	} else {
		turnInfo = 'state unknown';
	}

	$('#gameInfo').html(`<h1> ${turnInfo} </h1>`);
}

// print captured units
// saved in array captured
function printCaptured() {

	 $('#bCap').html('<h2> Captured Pieces </h2> <b>');
	 $('#wCap').html('<h2> Captured Pieces </h2> <b>');

	let target = 'bCap';
	let pieceImg = '';
	let pieceShow = '';

	for (piece of captured) {
		if (Math.floor(piece/10) === 2) {
			target = 'wCap';
			pieceImg = blackImg[(piece%10)-1];
			pieceShow = `<img class="capImg" src="${pieceImg}">`;
		} else {
			target = 'bCap';
			pieceImg = whiteImg[(piece%10)-1];
			pieceShow = `<img class="capImg" src="${pieceImg}">`;
		}
		$(`#${target}`).append(`${pieceShow} &nbsp`);
	}

	$('#bCap').append('</b>');
	$('#wCap').append('</b>');

}

// function isCheck to determine if a side's king is under check under that board
// can be used for own or enemy side
// keep it simple, 1 = white and 2 = black for side, board is the board
// output: true or false
function isCheck(side, inBoard) {

	console.log('=====================================');
	console.log('=========== isCheck Start ===========');
	console.log('=====================================');

	let mboard = copyBoard(inBoard);

	// console.log( 'mboard rows: ' + mboard.length);
	// console.log( 'mboard col: ' + mboard[0].length);

	// need to find the location of king
	// king and other non-pawns can not be enpassanted so only direct captures work
	// if king is occupying a space, pawn cannot enpassant it anyway
	let kingArray = [];
	let legalM = [];  // store legalMoves of the whole board and match it with the king's location


// brute force method, check the legalMoves of every square (64 instead of up to 32 pieces)
// abuse the fact that chess boards are always 8x8
for (let i = 0; i <= 7; i++) {
	for (let j = 0; j <= 7; j++) {

		console.log(' ++ isCheck processing LM of ++ ' + board[i][j] + ' at ' + [i,j]);
		console.log(' ++ isCheck legalM ++ ' + legalM);
		// check only enemy pieces, so opposite of your side
		if (Math.floor(mboard[i][j]/10) === 0) {   // empty spot -> don't add legal moves
				// console.log(' +++ isCheck +++ 0 ');
	} else if (Math.floor(mboard[i][j]/10) === side) {			// same side -> not a threat dont add legal moves
			// record location of own king
			// this else if says if you're on a piece on your own side
			if ((mboard[i][j]%10) === 6){
				// if the piece type is a king
				kingArray = [i,j];	// there shouldn't be no king or the match is broken
				console.log(' +++ isCheck king detected +++ ' + mboard[i][j] + ' at ' + i + ', ' + j);
			}

		} else if (Math.floor(mboard[i][j]/10) === (-1*side + 3)) {	// maping 2->1, and 1->2,  slope = -1,  2 = -1(1) + ?? && 1 = -1(2) + ??, ?? = 3 ->  side2 = -(side) + 3

			for (piece of pieceArray) {
				if ((mboard[i][j]%10) === piece.num) {
					let theseLegalM = piece.legalMoves(a2sChess(i,j), mboard);   // where the piece is actually determining the array of legal moves
					legalM = pushArray(legalM, theseLegalM);
					// legalM = [... new Set(legalM)];
					console.log(' +++ isCheck legalM concat +++ ' + theseLegalM);
					console.log(' +++ isCheck legalM +++ ' + legalM);
					break;
				}
			}

		} else {
			// console.log(' +++ isCheck +++ same side piece, not king ');
		}




	}
}
	// check if any legal moves matches the king's location
	let kingLoc = a2sChess(kingArray[0], kingArray[1]);
	let legalMq = [... new Set(legalM)];
	// console.log('xxx isCheck king detected xxx' + strPiece(kingLoc) + 'at' + kingLoc);
	console.log('xxx Check Logic xxx indexOf kingLoc' + (legalMq.indexOf(kingLoc)));
	if (legalMq.indexOf(kingLoc) === -1) {   // indexOf is -1 if there is no match in the array
		console.log('=====================================');
		console.log('=========== isCheck End False =======');
		console.log('=====================================');
		return false;
	} else {
		console.log('=====================================');
		console.log('=========== isCheck End True ========');
		console.log('=====================================');
		return true;
	}



} // isCheck end

// copies board primitive by primitive
function copyBoard(inBoard) {
	// i think the array is passing references so need to recopy all primitives
	let mboard = [];  // reassigning just in case

	// copy this stupid board the hard way
	for (row of inBoard) {
		let newRow = [];   // complete each row then push to array of arrays
		for (cell of row) {
			newRow.push(cell);  // should be adding a primitive to this array
		}
		mboard.push(newRow);
	}

	return mboard;
}

function pushArray(first, second) {   // second pushed onto first

	for (elem of second) {
		first.push(elem);
	}

	return first;

}

////////////////////////////////////////////////////////
//																										//
//	End of on load! No global vars have scope beyond! //
//																										//
////////////////////////////////////////////////////////

});  // end on load (for whole page)
