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
var LEDGrid = [];
var LED_COUNT = 100;
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
  ICONS: ['fa-star', 'fa-square', 'fa-circle', 'fa-heart', 'fa-play'],
  COLOURS: [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255], [255, 0, 255]],
  players: [
    {
      id: 0,
      name: 'PlayerOne',
      playedShape: false,
      selectedColour: 1,
      usedSpecial: false,
      rolledNumbers: false,
      availableNumbers: [-1, -1],
      points: 0,
      score: 0
    },
    {
      id: 1,
      name: 'PlayerTwo',
      playedShape: false,
      selectedColour: 2,
      usedSpecial: false,
      rolledNumbers: false,
      availableNumbers: [-1, -1],
      points: 0,
      score: 0
    },
    {
      id: 2,
      name: 'PlayerThree',
      playedShape: false,
      selectedColour: 3,
      usedSpecial: false,
      rolledNumbers: false,
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
    updateLED(LEDID, LEDColour);
    updateShape(playerID, LEDID, LEDColour);
  }
};

// increment the turn
var incrementTurn = function(playerID) {
  if (playerID === gameInformation.currentTurn) {
    gameInformation.currentTurn = (gameInformation.currentTurn + 1) % gameInformation.players.length;
  }
};


// update the tile with the player's shape
var updateShape = function(playerID, LEDID, LEDColour) {
  if (shapesGrid[LEDID].id === -1) {
    shapesGrid[LEDID].id = playerID;
    shapesGrid[LEDID].colour = LEDColour;
  }
};


// update LED Grid
var updateLED = function(LEDID, LEDColour) {
  LEDGrid[LEDID].colour = LEDColour;

  updateGrid(LEDGrid);
};


// update the physical LED grid
var updateGrid = function(LEDGridInput) {
  var parsedInput = '';

  for (var i = 0; i < LEDGridInput.length; i++) {
    console.log(LEDGridInput[i].colour);
    parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][0];
    parsedInput += ',';
    parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][1];
    parsedInput += ',';
    parsedInput += gameInformation.COLOURS[LEDGridInput[i].colour][2];
    if (i + 1 < LEDGridInput.length) {
      parsedInput += '\n';
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



