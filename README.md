# chess_local
simple chess for two players on one screen/computer

10/7/19 - first upload
Created using Javascript and JQuery
Board created using CSS and HTML table
(could be refactored into css grid or another type of grid of containers)

Current implementation (as of 10/7/19):
  - Only two player local (one person clicks a move with mouse, second person clicks move for other colored pieces)
  - Game keeps track of captured pieces
  - Game allows proper pawn diagonal capture, and en passant pawn move
  - Game has NOT implemented castling (swapping rook and king position under certain conditions)
  - Game has implemented check; will not allow moves that puts yourself in check 
  - Game has NOT properly implemented checkmate; still has problems with recognizing checkmate (so sometimes king is legally captured) 
