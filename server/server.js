// declare necessary dependencies
var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// python shell to execute python scipts
var PythonShell = require('python-shell');

// serve static public files
app.use(express.static('public'));

// LED Grid initialization
const SIZE = 6;
const RANDSIZE = 8;
var LEDGrid = [];
var LED_COUNT = SIZE * SIZE;
for (var i = 0; i < LED_COUNT; i++) {
  LEDGrid.push({
    id: i,
    colour: 0
  });
}

// shapes grid initialization
var shapesGrid = [];
for (var i = 0; i < LED_COUNT; i++) {
  shapesGrid.push({
    id: -1,
    colour: 0
  });
}

// special move costs
var RANDOMCOST = [4, 4, 5]; // row, column, square for random colours
var SOLIDCOST = [8, 8, 9]; // solid colours
var OWNCOST = [10, 10, 11]; // cost of selected colour

// initialize a python shell to execute the script via a child process
var shell = new PythonShell('../setColours.py', {
      args: '0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0N0,0,0'
    }, function (err) {
  if (err) {
    console.log(err);
  }
  return !err;
});

// define game information
var gameInformation = {
  currentTurn: 0,
  playingShape: false,
  usingSpecial: false,
  pointsArray: [],
  specialMoveCosts: [0, 0, 0],
  specialMoveArray: [],
  hoveredCell: -1,
  previousHover: -1,
  rankings: [],
  ICONS: ['fa-heart', 'fa-circle', 'fa-square', 'fa-3x fa-minus', 'fa-play'],
  COLOURS: [[0, 0, 0], [211, 47, 47], [0, 145, 234], [100, 221, 23], [255, 235, 59], [170, 0, 255]],
  players: [
    {
      id: 0,
      name: 'PlayerOne',
      playedShape: false,
      specialMovesLeft: [0, 4, 2, 2, 2, 2],
      shapesLeft: Math.ceil(SIZE * SIZE / 2),
      selectedColour: 1,
      specialMoveColour: -1,
      specialMoveType: -1,
      usedSpecial: false,
      rolledNumbers: -1,
      availableNumbers: [-1, -1],
      points: 0,
      score: 0
    },
    {
      id: 1,
      name: 'PlayerTwo',
      playedShape: false,
      specialMovesLeft: [0, 2, 4, 2, 2, 2],
      shapesLeft: Math.ceil(SIZE * SIZE / 2),
      selectedColour: 2,
      specialMoveColour: -1,
      specialMoveType: -1,
      usedSpecial: false,
      rolledNumbers: -1,
      availableNumbers: [-1, -1],
      points: 0,
      score: 0
    },
    {
      id: 2,
      name: 'PlayerThree',
      playedShape: false,
      specialMovesLeft: [0, 2, 2, 4, 2, 2],
      shapesLeft: Math.ceil(SIZE * SIZE / 2),
      selectedColour: 3,
      specialMoveColour: -1,
      specialMoveType: -1,
      usedSpecial: false,
      rolledNumbers: -1,
      availableNumbers: [-1, -1],
      points: 0,
      score: 0
    },
    // {
    //   id: 3,
    //   name: 'PlayerFour',
    //   playedShape: false,
    //   specialMovesLeft: [0, 2, 2, 2, 4, 2],
    //   shapesLeft: Math.ceil(SIZE * SIZE / 2),
    //   selectedColour: 4,
    //   specialMoveColour: -1,
    //   specialMoveType: -1,
    //   usedSpecial: false,
    //   rolledNumbers: -1,
    //   availableNumbers: [-1, -1],
    //   points: 0,
    //   score: 0
    // },
    // {
    //   id: 4,
    //   name: 'PlayerFive',
    //   playedShape: false,
    //   specialMovesLeft: [0, 2, 2, 2, 2, 4],
    //   shapesLeft: Math.ceil(SIZE * SIZE / 2),
    //   selectedColour: 5,
    //   specialMoveColour: -1,
    //   specialMoveType: -1,
    //   usedSpecial: false,
    //   rolledNumbers: -1,
    //   availableNumbers: [-1, -1],
    //   points: 0,
    //   score: 0
    // }
  ]
};

// establish socket io connection
io.on('connection', function(socket) {
  // initialize client
  updateClient();

  // client places shape
  socket.on('placeShape', function(data) {
    // action takes place
    placeShape(socket, data.playerID, data.LEDID, data.LEDColour);

    // update the client information
    updateClient();
  });

  // increment turn
  socket.on('incrementTurn', function(data) {
    incrementTurn(data.playerID);

    // update the client information
    updateClient();
  });

  // action play shape
  socket.on('actionPlayShape', function(data) {
    actionPlayShape(data.playerID);

    // update the client information
    updateClient();
  });

  // select colour
  socket.on('selectColour', function(data) {
    // selectColour(data.playerID, data.colourID);

    // update the client information
    updateClient();
  });

  // finish playing shape
  socket.on('finishPlayingShape', function(data) {
    finishPlayingShape(data.playerID);

    // update the client information
    updateClient();
  });

  // roll numbers
  socket.on('rollNumbers', function(data) {
    rollNumbers(data.playerID);

    // highlight available cells
    highlightAvailableCells(data.playerID, socket);

    // update the client information
    updateClient();
  });

  // hover tile, find potential number of points
  socket.on('hoverTile', function(data) {
    hoverTile(data.playerID, data.id);

    // update the client information
    updateClient();
  });

  // action use special
  socket.on('actionUseSpecial', function(data) {
    actionUseSpecial(data.playerID);

    // update the client information
    updateClient();
  });

  // finish using special move
  socket.on('finishUsingSpecial', function(data) {
    finishUsingSpecial(data.playerID);

    // update the client information
    updateClient();
  });

  // select special move colour
  socket.on('selectSpecialColour', function(data) {
    selectSpecialColour(data.playerID, data.colourID);

    // update the client information
    updateClient();
  });

  // select special move type
  socket.on('selectSpecialType', function(data) {
    selectSpecialType(data.playerID, data.typeID);

    // update the client information
    updateClient();
  });

  // use special move
  socket.on('useSpecial', function(data) {
    useSpecial(data.playerID, data.id);

    // update the client information
    updateClient();
  });

});

// update the client information
var updateClient = function() {
  io.sockets.emit('updateClient', {
    grid: LEDGrid,
    info: gameInformation,
    shapes: shapesGrid
  });
};

// show points gained
var showPoints = function(socket, points) {
  io.sockets.emit('showPoints', {
    points: points
  });
};

// a player places a shape
var placeShape = function(socket, playerID, LEDID, LEDColour) {
  if (playerID === gameInformation.currentTurn) {
    if (canPlayShape(playerID, LEDID)) {
      updateLED(LEDID, LEDColour);
      updateShape(playerID, LEDID, LEDColour);

      finishPlayingShape(playerID);

      // update the grid
      updateGrid();

      var points = calculatePoints(playerID, LEDID);
      showPoints(socket, points);
      calculateScore();
    }
  }
};

// increment the turn
var incrementTurn = function(playerID) {
  if (playerID === gameInformation.currentTurn) {
    // reset the temporary variables for the player
    gameInformation.players[playerID].playedShape = false;
    gameInformation.players[playerID].usedSpecial = false;
    gameInformation.players[playerID].rolledNumbers = -1;
    gameInformation.currentTurn = (gameInformation.currentTurn + 1) % gameInformation.players.length;
    gameInformation.playingShape = false;
    gameInformation.usingSpecial = false;
    gameInformation.pointsArray = [];
  }
};

// action play shape
var actionPlayShape = function(playerID) {
  if (playerID === gameInformation.currentTurn &&
      !gameInformation.players[playerID].playedShape) {
    gameInformation.playingShape = true;
  }
};

// select colour while playing a shape
var selectColour = function(playerID, colourID) {
  if (playerID === gameInformation.currentTurn &&
      colourID > 0 && colourID < gameInformation.COLOURS.length) {
    gameInformation.players[playerID].selectedColour = colourID;
  }
};

// finish playing shape
var finishPlayingShape = function(playerID) {
  if (playerID === gameInformation.currentTurn &&
      gameInformation.players[playerID].rolledNumbers != 0 &&
      gameInformation.players[playerID].rolledNumbers != 1) {
    gameInformation.players[playerID].availableNumbers = [-1, -1];
    gameInformation.players[playerID].playedShape = true;
    gameInformation.playingShape = false;
    gameInformation.hoveredCell = -1;
    gameInformation.previousHover = -1;
  }
};

// roll numbers
var rollNumbers = function(playerID) {
  if (playerID === gameInformation.currentTurn &&
      gameInformation.players[playerID].rolledNumbers === -1) {
    // generate available numbers
    gameInformation.players[playerID].availableNumbers[0] = getRandomInt(RANDSIZE);
    gameInformation.players[playerID].availableNumbers[1] = getRandomInt(RANDSIZE);
    gameInformation.players[playerID].rolledNumbers = 0; // 0 is rolling
  }
};

// generate random integer from 0 to max - 1
var getRandomInt = function(max) {
  return Math.floor(Math.random() * Math.floor(max));
};

// generate a floating point between min and less than max
var getRandomArbitrary = function(min, max) {
  return Math.random() * (max - min) + min;
};

// breadth first search to find how many shapes are connected
var findAdjacent = function(playerID, id) {
  var visited = []; // visited array
  var queue = []; // priority queue

  queue.push(id); // enqueue initial node
  visited.push(id); // add initial node to visited array

  while (queue.length > 0) {
    // dequeue vertex from queue and set it to currentNode
    var currentNode = queue.shift();

    // get adjacent vertices of current node
    // if adjacent has not been visited, mark it visited and enqueue it
    
    // check above
    if (currentNode > SIZE - 1 && visited.indexOf(currentNode - SIZE) === -1) {
      if (LEDGrid[currentNode - SIZE].colour === gameInformation.players[playerID].selectedColour) {
        visited.push(currentNode - SIZE);
        queue.push(currentNode - SIZE);
      }
    }

    // check below
    if (currentNode < SIZE * SIZE - SIZE && visited.indexOf(currentNode + SIZE) === -1) {
      if (LEDGrid[currentNode + SIZE].colour === gameInformation.players[playerID].selectedColour) {
        visited.push(currentNode + SIZE);
        queue.push(currentNode + SIZE);
      }
    }

    // check left
    if (currentNode % SIZE > 0 && visited.indexOf(currentNode - 1) === -1) {
      if (LEDGrid[currentNode - 1].colour === gameInformation.players[playerID].selectedColour) {
        visited.push(currentNode - 1);
        queue.push(currentNode - 1);
      }
    }

    // check right
    if (currentNode % SIZE < SIZE - 1 && visited.indexOf(currentNode + 1) === -1) {
      if (LEDGrid[currentNode + 1].colour === gameInformation.players[playerID].selectedColour) {
        visited.push(currentNode + 1);
        queue.push(currentNode + 1);
      }
    }
  }

  // set the visited nodes to the highlighted cells in the board
  gameInformation.pointsArray = visited;

};

// update special move array with highlighted row/column/square
var updateSpecialMoveArray = function(playerID, id) {
  // initialize special move array
  gameInformation.specialMoveArray = [];
  var ROW = Math.floor(id / SIZE);
  var COL = id % SIZE;

  // highlights depend on special move type
  if (gameInformation.players[playerID].specialMoveType === 0) {
    // row
    for (var row = ROW * SIZE; row < ROW * SIZE + SIZE; row++) {
      gameInformation.specialMoveArray.push(row);
    }
  } else if (gameInformation.players[playerID].specialMoveType === 1) {
    // column
    for (var col = COL; col < SIZE * SIZE; col += SIZE) {
      gameInformation.specialMoveArray.push(col);
    }
  } else if (gameInformation.players[playerID].specialMoveType === 2) {
    // square

    // highlights to the right and below
    // if hovered cell is on the edge, this corrects it
    if (ROW === SIZE - 1) {
      id -= SIZE;
    }
    if (COL === SIZE - 1) {
      id--;
    }

    gameInformation.specialMoveArray.push(id); // hovered cell
    gameInformation.specialMoveArray.push(id + 1); // to the right
    gameInformation.specialMoveArray.push(id + SIZE); // below
    gameInformation.specialMoveArray.push(id + SIZE + 1); // right and below
  }
};

// hover tile, check adjacent cells and return visited array
var hoverTile = function(playerID, id) {
  // clear highlights
  if (id < 0 || id > SIZE * SIZE - 1 || playerID != gameInformation.currentTurn) {
    gameInformation.pointsArray = [];
    gameInformation.specialMoveArray = [];
    gameInformation.hoveredCell = -1;
  } else {
    if (gameInformation.playingShape) {
      // check if shape can be played
      if (canPlayShape(playerID, id) && gameInformation.playingShape) {
        findAdjacent(playerID, id);
        gameInformation.hoveredCell = id;
      } else {
        gameInformation.pointsArray = [];
        gameInformation.hoveredCell = -1;
      }
    }
    if (gameInformation.usingSpecial) {
      // check if special move can be used
      if (canUseSpecial(playerID) && gameInformation.usingSpecial) {
        updateSpecialMoveArray(playerID, id);
        gameInformation.hoveredCell = id;
      } else {
        gameInformation.specialMoveArray = [];
        gameInformation.hoveredCell = -1;
      }
    }
  }

  // check if hover has changed
  if (gameInformation.hoveredCell != gameInformation.previousHover) {
    gameInformation.previousHover = gameInformation.hoveredCell;

    // update the grid
    updateGrid();
  }
};

// calculate points given the cell id
var calculatePoints = function(playerID, id) {
  findAdjacent(playerID, id);

  var points = 0;

  for (var i = 0; i < gameInformation.pointsArray.length; i++) {
    if (LEDGrid[gameInformation.pointsArray[i]].colour === shapesGrid[
        gameInformation.pointsArray[i]].colour) {
      points += 2;
    } else {
      points++;
    }
  }

  gameInformation.players[playerID].points += points;

  gameInformation.pointsArray = [];

  return points;
};

// calculate score
var calculateScore = function() {
  for (var j = 0; j < gameInformation.players.length; j++) {
    gameInformation.players[j].score = 0;
  }

  for (var i = 0; i < shapesGrid.length; i++) {
    // cell colour and shape colour need to be the same
    if (shapesGrid[i].id > -1 &&
        shapesGrid[i].colour === LEDGrid[i].colour) {
      gameInformation.players[shapesGrid[i].id].score += 1;
    }
  }

  updateRankings();
};

// compare function for rankings, highest to lowest
var compare = function(a, b) {
  // sort by score
  if (a.score > b.score) {
    return -1;
  }
  if (a.score < b.score) {
    return 1;
  }
  // sort by points
  if (a.points > b.points) {
    return -1;
  }
  if (a.points < b.points) {
    return 1;
  }
  // tie
  return 0;
};

// update rankings
var updateRankings = function() {
  gameInformation.rankings = [];

  // copy players object (shallow copy)
  playersCopy = gameInformation.players.slice();

  // sort using compare function
  playersCopy.sort(compare);

  gameInformation.rankings.push( [ playersCopy[0].id ] ); // push first place

  for (var i = 1; i < playersCopy.length; i++) {
    if (playersCopy[i].score === playersCopy[i - 1].score &&
        playersCopy[i].points === playersCopy[i - 1].points) {
      // same ranking tier
      gameInformation.rankings[ gameInformation.rankings.length - 1 ]
          .push(playersCopy[i].id);
    } else {
      // next ranking tier
      gameInformation.rankings.push([ playersCopy[i].id ]);
    }
  }
};

// action use special
var actionUseSpecial = function(playerID) {
  if (playerID === gameInformation.currentTurn &&
      !gameInformation.players[playerID].usedSpecial) {
    gameInformation.players[playerID].usedSpecial = true;
    gameInformation.usingSpecial = true;
  }
};

// finish using special move
var finishUsingSpecial = function(playerID) {
  if (playerID === gameInformation.currentTurn) {
    gameInformation.players[playerID].usedSpecial = true;
    gameInformation.players[playerID].specialMoveColour = -1;
    gameInformation.players[playerID].specialMoveType = -1;
    gameInformation.usingSpecial = false;
    gameInformation.specialMoveCosts = [0, 0, 0];
    gameInformation.specialMoveArray = [];
    gameInformation.hoveredCell = -1;
    gameInformation.previousHover = -1;
  }
};

// select special move colour
var selectSpecialColour = function(playerID, colourID) {
  if (playerID === gameInformation.currentTurn &&
      colourID >= 0 && colourID < gameInformation.COLOURS.length) {
    gameInformation.players[playerID].specialMoveColour = colourID;

    if (colourID === 0) {
      // cost of random colour
      gameInformation.specialMoveCosts = RANDOMCOST;
    } else if (colourID === gameInformation.players[playerID].selectedColour) {
      // cost of selected colour
      gameInformation.specialMoveCosts = OWNCOST;
    } else {
      // cost of solid colour
      gameInformation.specialMoveCosts = SOLIDCOST;
    }
  }
};

// select special move type
var selectSpecialType = function(playerID, typeID) {
  if (playerID === gameInformation.currentTurn &&
      typeID > -1 && typeID < 3 &&
      gameInformation.players[playerID].points >= gameInformation
          .specialMoveCosts[typeID]) {
    gameInformation.players[playerID].specialMoveType = typeID;
  }
};

// check if player has points to use special move
var hasSufficientPoints = function(playerID) {
  if (gameInformation.players[playerID].specialMoveType > -1) {
    if (gameInformation.players[playerID].specialMoveColour === 0) {
      return gameInformation.players[playerID].points >= gameInformation
          .specialMoveCosts[gameInformation.players[playerID].specialMoveType];
    } else {
      return gameInformation.players[playerID].points >= gameInformation
          .specialMoveCosts[gameInformation.players[playerID].specialMoveType] &&
          gameInformation.players[playerID].specialMovesLeft[gameInformation
              .players[playerID].specialMoveColour] > 0;
    }
  } else {
    return false;
  }
};

// check if player can use special move
var canUseSpecial = function(playerID) {
  return gameInformation.players[playerID].specialMoveColour > -1 &&
      gameInformation.players[playerID].specialMoveType > -1 &&
      gameInformation.players[playerID]
          .specialMoveColour <= gameInformation.COLOURS.length &&
      hasSufficientPoints(playerID);
};

// generate random integer from 1 to max
var getRandomInt = function(max) {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
};

// use special move
var useSpecial = function(playerID, id) {
  if (canUseSpecial(playerID)) {
    updateSpecialMoveArray(playerID, id);

    // change led colour of affected cells
    for (var i = 0; i < gameInformation.specialMoveArray.length; i++) {
      // there must be a colour there already
      if (LEDGrid[gameInformation.specialMoveArray[i]].colour > 0) {
        if (gameInformation.players[playerID].specialMoveColour === 0) {
          // random colour
          LEDGrid[gameInformation.specialMoveArray[i]].colour = getRandomInt(
              gameInformation.COLOURS.length - 1);
        } else {
          // solid colour
          LEDGrid[gameInformation.specialMoveArray[i]]
              .colour = gameInformation.players[playerID].specialMoveColour;
        }
      }
    }

    // use up points
    gameInformation.players[playerID].points -= gameInformation
        .specialMoveCosts[gameInformation.players[playerID].specialMoveType];

    // use up special moves
    if (gameInformation.players[playerID].specialMoveColour > 0) {
      for (var a = 0; a < gameInformation.players.length; a++) {
        if (gameInformation.players[a].specialMovesLeft[gameInformation
            .players[playerID].specialMoveColour] > 0) {
          gameInformation.players[a].specialMovesLeft[gameInformation
            .players[playerID].specialMoveColour] -= 1;
        }
      }
    }

    finishUsingSpecial(playerID);

    // update the grid
    updateGrid();

    // calculate scores
    calculateScore();
  }
};

// check the tile for availability
var canPlayShape = function(playerID, id) {
  return shapesGrid[id].id === -1 &&
      gameInformation.players[playerID].selectedColour > 0 &&
      gameInformation.players[playerID].shapesLeft > 0 &&
      !gameInformation.players[playerID].playedShape &&
      gameInformation.players[playerID].rolledNumbers === 2 &&
      isHighlighted(id,
          gameInformation.players[playerID].availableNumbers[0],
          gameInformation.players[playerID].availableNumbers[1]);
};

// update the tile with the player's shape
var updateShape = function(playerID, LEDID, LEDColour) {
  shapesGrid[LEDID].id = playerID;
  shapesGrid[LEDID].colour = LEDColour;
  gameInformation.players[playerID].shapesLeft -= 1;
};

// update LED Grid
var updateLED = function(LEDID, LEDColour) {
  LEDGrid[LEDID].colour = LEDColour;
};

// check if tile is in a row or col
var isHighlighted = function(id, row, col) {
  // check if LED is in the highlighted column
  if (id % RANDSIZE === col) {
    return true;
  } else {
    // check if LED is in the highlighted row
    if (Math.floor( id / RANDSIZE ) === row) {
      return true;
    }
  }

  return false;
};

// highlight iteration function
var highlightIteration = function(playerID, socket, rowOrCol, iteration, total) {
  gameInformation.players[playerID].availableNumbers[rowOrCol] = iteration % RANDSIZE;

  // check if this is the last iteration
  if (iteration === total) {
    // increment rolled numbers
    gameInformation.players[playerID].rolledNumbers += 1;

    // update the grid
    updateGrid();
  }

  // update the client
  updateClient();

  // update the grid
  updateGrid();
};

// highlight available cells and simulate rng
var highlightAvailableCells = function(playerID, socket) {
  const INTERVAL = 12; // delay for each iteration
  const ROWEXP = getRandomArbitrary(1.5, 1.8);
  const COLEXP = getRandomArbitrary(1.5, 1.8);
  
  // number of times that the grid loops through highlights
  var numRows = 2 * SIZE + gameInformation.players[playerID].availableNumbers[0];
  var numCols = 2 * SIZE + gameInformation.players[playerID].availableNumbers[1];

  // highlight the rows in sequence
  for (var row = 0; row <= numRows; row++) {
    // loop through number of row iterations
    // each timeout is set to be a little slower based on
    // the interval constant and the rowexp
    setTimeout(highlightIteration,
        INTERVAL * Math.pow(row, ROWEXP), playerID, socket, 0, row, numRows);
  }

  // highlight the columns in sequence
  for (var col = 0; col <= numCols; col++) {
    // same logic except for the columns
    setTimeout(highlightIteration,
        INTERVAL * Math.pow(col, COLEXP), playerID, socket, 1, col, numCols);
  }
};

// add colour to the parsed input
var addColour = function(colourID, counter) {
  var newColour = '';

  if (colourID < 0) {
    // white colour
    newColour = '255,255,255';
  } else {
    newColour += gameInformation.COLOURS[colourID][0];
    newColour += ',';
    newColour += gameInformation.COLOURS[colourID][1];
    newColour += ',';
    newColour += gameInformation.COLOURS[colourID][2];
  }

  if (counter < LEDGrid.length) {
    newColour += 'N';
  }

  return newColour;
};

// process the background colour
var processBackground = function(id) {
  // error check
  if (id < 0) {
    return 0;
  }

  // special move highlight first
  if (gameInformation.specialMoveArray.indexOf(id) > -1) {
    return gameInformation.players[gameInformation.currentTurn].specialMoveColour;
  }

  // base colour of led
  if (LEDGrid[id].colour > 0) {
    return LEDGrid[id].colour;
  }

  // if hovered
  if (gameInformation.hoveredCell === id) {
    return gameInformation.players[gameInformation.currentTurn].selectedColour;
  }

  // if highlighted
  if (isHighlighted(id, gameInformation.players[gameInformation.currentTurn]
      .availableNumbers[0], gameInformation.players[gameInformation.currentTurn]
        .availableNumbers[1])) {
    return -1;
  }

  // uncoloured
  return 0;
};

// update the physical LED grid
var updateGrid = function() {
  var parsedInput = '';
  var id = -1;
  var counter = 0;
  var colour = -1;

  for (var i = 0; i < SIZE; i++) {
    if (i % 2 === 0) {
      for (var j = 0; j < SIZE; j++) {
        id = i * SIZE + j;
        counter++;
        colour = processBackground(id);
        parsedInput += addColour(colour, counter);
      }
    } else {
      for (var k = SIZE - 1; k > -1; k--) {
        id = i * SIZE + k;
        counter++;
        colour = processBackground(id);
        parsedInput += addColour(colour, counter);
      }
    }
  }

  // run a python shell to execute the script via a child process
  shell.send(parsedInput);
};


// shutdown function
var shutdown = function() {
  console.log('\ncompleting shutdown process...');
  // run a python shell to execute the script via a child process
  PythonShell.run('../clear.py', function (err) {
    if (err) {
      console.log(err);
      console.error("something happened, forcefully shutting down");
      process.exit();
    }

    server.close(function() {
      console.log("shutting down");
      process.exit();
    });
    
    // if after 
    setTimeout(function() {
         console.error("something happened, forcefully shutting down");
         process.exit();
    }, 10*1000);

    return !err;
  });
};

// listen for TERM signal .e.g. kill 
process.on('SIGTERM', shutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', shutdown);   

server.listen(3000, function () {
  console.log('server running on port 3000');
});



