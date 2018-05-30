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

// define game information
var gameInformation = {
  currentTurn: 0,
  playingShape: false,
  usingSpecial: false,
  pointsArray: [],
  specialMoveCosts: [0, 0, 0],
  specialMoveArray: [],
  ICONS: ['fa-star', 'fa-square', 'fa-circle', 'fa-heart', 'fa-play'],
  COLOURS: [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255]],
  players: [
    {
      id: 0,
      name: 'PlayerOne',
      playedShape: false,
      specialMovesLeft: [0, 2, 2, 2, 2, 2],
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
      specialMovesLeft: [0, 2, 2, 2, 2, 2],
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
      specialMovesLeft: [0, 2, 2, 2, 2, 2],
      shapesLeft: Math.ceil(SIZE * SIZE / 2),
      selectedColour: 3,
      specialMoveColour: -1,
      specialMoveType: -1,
      usedSpecial: false,
      rolledNumbers: -1,
      availableNumbers: [-1, -1],
      points: 0,
      score: 0
    }
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
    selectColour(data.playerID, data.colourID);

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
  socket.emit('showPoints', {
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
      if (shapesGrid[currentNode - SIZE].id === playerID) {
        visited.push(currentNode - SIZE);
        queue.push(currentNode - SIZE);
      }
    }

    // check below
    if (currentNode < SIZE * SIZE - SIZE && visited.indexOf(currentNode + SIZE) === -1) {
      if (shapesGrid[currentNode + SIZE].id === playerID) {
        visited.push(currentNode + SIZE);
        queue.push(currentNode + SIZE);
      }
    }

    // check left
    if (currentNode % SIZE > 0 && visited.indexOf(currentNode - 1) === -1) {
      if (shapesGrid[currentNode - 1].id === playerID) {
        visited.push(currentNode - 1);
        queue.push(currentNode - 1);
      }
    }

    // check right
    if (currentNode % SIZE < SIZE - 1 && visited.indexOf(currentNode + 1) === -1) {
      if (shapesGrid[currentNode + 1].id === playerID) {
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
    return;
  }

  // check if shape can be played
  if (canPlayShape(playerID, id)) {
    findAdjacent(playerID, id);
  } else {
    gameInformation.pointsArray = [];
  }

  // check if special move can be used
  if (canUseSpecial(playerID)) {
    updateSpecialMoveArray(playerID, id);
  } else {
    gameInformation.specialMoveArray = [];
  }
};

// calculate points given the cell id
var calculatePoints = function(playerID, id) {
  if (canPlayShape(playerID, id)) {
    findAdjacent(playerID, id);
  }

  var points = gameInformation.pointsArray.length;
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
        gameInformation.players[a].specialMovesLeft[gameInformation
            .players[playerID].specialMoveType] -= 1;
      }
    }

    finishUsingSpecial(playerID);

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
  updateGrid(LEDGrid);
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
  }

  // update the client
  updateClient();
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

// update the physical LED grid
var updateGrid = function(LEDGridInput, row, col) {
  var parsedInput = '';

  for (var i = 0; i < LEDGridInput.length; i++) {
    // no highlight parameters were specified
    if (row === undefined && col === undefined) {
      // add the colour to the parsed input
      parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][0];
      parsedInput += ',';
      parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][1];
      parsedInput += ',';
      parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][2];
      if (i + 1 < LEDGridInput.length) {
        parsedInput += '\n';
      }
    } else { // adding highlights for availble row/columns
      // colour is specified
      if (LEDGridInput[i].colour > 0) {
        // add the colour to the parsed input
        parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][0];
        parsedInput += ',';
        parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][1];
        parsedInput += ',';
        parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][2];
        if (i + 1 < LEDGridInput.length) {
          parsedInput += '\n';
        }
      } else { // colour is unspecified, check if it is available
        // check if LED is in the highlighted column
        if (isHighlighted(playerID, row, col)) {
          parsedInput += '255,255,255\n'; // highlight as white
        }
      }
    }
  }

  var options = {
    args: parsedInput
  };

  // run a python shell to execute the script via a child process
  PythonShell.run('../setColours.py', options, function (err) {
    if (err) {
      console.log(err);
    }
    return !err;
  });
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



