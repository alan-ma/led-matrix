
/*
client initialization
*/

// LED Grid initialization
const SIZE = 6;
const RANDSIZE = 10;
var LEDGridInit = [];
var LED_COUNT = SIZE * SIZE;
for (var i = 0; i < LED_COUNT; i++) {
  LEDGridInit.push({
    id: i,
    colour: 0
  });
}

// shapes grid initialization
var shapesGridInit = [];
for (var i = 0; i < LED_COUNT; i++) {
  shapesGridInit.push({
    id: -1,
    colour: 0
  });
}

// player icons/shapes using font awesome
const ICONS = ['fa-star', 'fa-square', 'fa-circle', 'fa-heart', 'fa-play'];

// set colours
const COLOURS = [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255], [255, 0, 255]];

/*
communication with server
socket io
*/

var socket = io(); // localhost port 3000

// update the client information
socket.on('updateClient', function(data) {
  app.grid = data.grid;
  app.shapes = data.shapes;
  parseGameInfo(data.info);
});

// parse the game information
var parseGameInfo = function(gameInformation) {
  // set player information
  app.players = gameInformation.players;

  // set icons for players
  for (var i = 0; i < app.players.length; i++) {
    app.players[i].icon = ICONS[i];
  }

  // set other information about the game state
  app.currentTurn = gameInformation.currentTurn;
  app.ICONS = gameInformation.ICONS;
  app.COLOURS = gameInformation.COLOURS;
  app.playingShape = gameInformation.playingShape;
  app.usingSpecial = gameInformation.usingSpecial;
};

// player places a shape
var placeShape = function(playerID, LEDID) {
  // check if playing shape is possible
  if (canPlayShape(playerID, LEDID)) {
    // emit placeShape event
    socket.emit('placeShape', {
      playerID: playerID,
      LEDID: LEDID,
      LEDColour: app.players[playerID].selectedColour
    });
  }
};

// increment the turn
var incrementTurn = function(playerID) {
  socket.emit('incrementTurn', {
    playerID: playerID
  });
};

// player clicked on the play shape menu button
var actionPlayShape = function(playerID) {
  socket.emit('actionPlayShape', {
    playerID: playerID
  });
};

// player clicked on the use special menu button
var actionUseSpecial = function(playerID) {
  socket.emit('actionUseSpecial', {
    playerID: playerID
  });
};

// player selects a colour
var selectColour = function(playerID, colourID) {
  socket.emit('selectColour', {
    playerID: playerID,
    colourID: colourID
  });
};

// finish playing a shape / end turn
var finishPlayingShape = function(playerID) {
  socket.emit('finishPlayingShape', {
    playerID: playerID
  });
};

// check if player can play shape
var canPlayShape = function(playerID, LEDID) {
  return app.players[playerID].selectedColour > 0 &&
      !app.players[playerID].playedShape &&
      app.players[playerID].shapesLeft[
          app.players[playerID].selectedColour] > 0 &&
      app.shapes[LEDID].id === -1 &&
      isHighlighted(playerID, LEDID) &&
      app.players[playerID].rolledNumbers === 2;
};

// roll numbers
var rollNumbers = function(playerID) {
  if (app.players[playerID].rolledNumbers === -1) {
    socket.emit('rollNumbers', {
      playerID: playerID
    });
  }
};

// check if cell is in a row and column
var isHighlighted = function(playerID, id) {
  var row = app.players[playerID].availableNumbers[0];
  var col = app.players[playerID].availableNumbers[1];

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


/*
vue js
*/

var app = new Vue({
  el: '#app',
  data: {
    ICONS: ICONS,
    COLOURS: COLOURS,
    players: [
      {
        id: 0,
        name: 'PlayerOne',
        playedShape: false,
        shapesLeft: [0, 10, 10, 10, 10, 10],
        selectedColour: 0,
        usedSpecial: false,
        rolledNumbers: -1,
        availableNumbers: [-1, -1],
        points: 0,
        score: 0
      }
    ],
    currentTurn: 0,
    grid: LEDGridInit,
    shapes: shapesGridInit,
    playingShape: false,
    usingSpecial: false
  },
  methods: {
    // returns background colour in rgb form based on the colourID
    getBackground: function(colourID, playerID, id) {
      // colour is not specified
      if (colourID === 0) {
        // check if id is specified, i.e. checking for highlight
        if (id === undefined) {
          return 'rgb(220, 220, 220)';
        }

        // check if LED is in an available row or column
        if (isHighlighted(playerID, id)) {
          return 'rgb(250, 250, 250)'; // highlight as white
        }

        return 'rgb(220, 220, 220)'; // LED is not highlighted
      }

      // colour is specified, return parsed colour
      var parsedColour = 'rgb(';
      parsedColour += app.COLOURS[colourID][0];
      parsedColour += ', ';
      parsedColour += app.COLOURS[colourID][1];
      parsedColour += ', ';
      parsedColour += app.COLOURS[colourID][2];
      parsedColour += ')';

      return parsedColour;
    },
    // selects a tile on the LED grid
    selectTile: function(LEDID) {
      placeShape(app.currentTurn, LEDID);
      // incrementTurn(app.currentTurn);
    },
    // play shape menu button pressed
    actionPlayShape: function(playerID) {
      actionPlayShape(playerID);
    },
    // special move menu button pressed
    actionUseSpecial: function(playerID) {
      actionUseSpecial(playerID);
    },
    // select colour while playing a move
    selectColour: function(playerID, colourID) {
      selectColour(playerID, colourID);
    },
    // finish playing shape
    finishPlayingShape: function(playerID) {
      finishPlayingShape(playerID);
    },
    // roll numbers
    rollNumbers: function(playerID) {
      rollNumbers(playerID);
    }
  }
});








