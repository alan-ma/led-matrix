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


// define game information
var gameInformation = {
  currentTurn: 0,
  playingShape: false,
  usingSpecial: false,
  pointsArray: [],
  ICONS: ['fa-star', 'fa-square', 'fa-circle', 'fa-heart', 'fa-play'],
  COLOURS: [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255]],
  players: [
    {
      id: 0,
      name: 'PlayerOne',
      playedShape: false,
      specialMovesLeft: [0, 10, 10, 10, 10, 10],
      shapesLeft: Math.ceil(SIZE * SIZE / 2),
      selectedColour: 1,
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
      specialMovesLeft: [0, 10, 10, 10, 10, 10],
      shapesLeft: Math.ceil(SIZE * SIZE / 2),
      selectedColour: 2,
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
      specialMovesLeft: [0, 10, 10, 10, 10, 10],
      shapesLeft: Math.ceil(SIZE * SIZE / 2),
      selectedColour: 3,
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
  updateClient(socket);

  // client places shape
  socket.on('placeShape', function(data) {
    // action takes place
    placeShape(data.playerID, data.LEDID, data.LEDColour);

    // update the client information
    updateClient(socket);
  });

  // increment turn
  socket.on('incrementTurn', function(data) {
    incrementTurn(data.playerID);

    // update the client information
    updateClient(socket);
  });

  // action play shape
  socket.on('actionPlayShape', function(data) {
    actionPlayShape(data.playerID);

    // update the client information
    updateClient(socket);
  });

  // action use special
  socket.on('actionUseSpecial', function(data) {
    actionPlayShape(data.playerID);

    // update the client information
    updateClient(socket);
  });

  // select colour
  socket.on('selectColour', function(data) {
    selectColour(data.playerID, data.colourID);

    // update the client information
    updateClient(socket);
  });

  // finish playing shape
  socket.on('finishPlayingShape', function(data) {
    finishPlayingShape(data.playerID);

    // update the client information
    updateClient(socket);
  });

  // roll numbers
  socket.on('rollNumbers', function(data) {
    rollNumbers(data.playerID);

    // highlight available cells
    highlightAvailableCells(data.playerID, socket);

    // update the client information
    updateClient(socket);
  });

  // hover tile, find potential number of points
  socket.on('hoverTile', function(data) {
    hoverTile(data.playerID, data.id);

    // update the client information
    updateClient(socket);
  });

});

// update the client information
var updateClient = function(socket) {
  socket.emit('updateClient', {
    grid: LEDGrid,
    info: gameInformation,
    shapes: shapesGrid
  });
};

// a player places a shape
var placeShape = function(playerID, LEDID, LEDColour) {
  if (playerID === gameInformation.currentTurn) {
    if (checkTile(playerID, LEDID)) {
      updateLED(LEDID, LEDColour);
      updateShape(playerID, LEDID, LEDColour);

      finishPlayingShape(playerID);
      // calculatePoints(playerID, LEDID);
      // calculateScore(playerID);
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

// action use shape
var actionUseSpecial = function(playerID) {
  if (playerID === gameInformation.currentTurn &&
      !gameInformation.players[playerID].usedSpecial) {
    gameInformation.players[playerID].usedSpecial = true;
    gameInformation.usingSpecial = true;
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

// hover tile, check adjacent cells and return visited array
var hoverTile = function(playerID, id) {
  if (checkTile(playerID, id)) {
    findAdjacent(playerID, id);
  } else {
    gameInformation.pointsArray = [];
  }
};




// check the tile for availability
var checkTile = function(playerID, id) {
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
  updateClient(socket);
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



