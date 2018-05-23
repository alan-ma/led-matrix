
/*
client initialization
*/

// LED Grid initialization
var LEDGridInit = [];
var LED_COUNT = 100;
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
  app.players = gameInformation.players;

  for (var i = 0; i < app.players.length; i++) {
    app.players[i].icon = ICONS[i];
  }

  app.currentTurn = gameInformation.currentTurn;
  app.ICONS = gameInformation.ICONS;
  app.COLOURS = gameInformation.COLOURS;
  app.playingShape = gameInformation.playingShape;
  app.usingSpecial = gameInformation.usingSpecial;
};

var placeShape = function(playerID, LEDID) {
  if (canPlayShape(playerID, LEDID)) {
    socket.emit('placeShape', {
      playerID: playerID,
      LEDID: LEDID,
      LEDColour: app.players[playerID].selectedColour
    });
  }
};

var incrementTurn = function(playerID) {
  socket.emit('incrementTurn', {
    playerID: playerID
  });
};

var actionPlayShape = function(playerID) {
  socket.emit('actionPlayShape', {
    playerID: playerID
  });
};

var actionUseSpecial = function(playerID) {
  socket.emit('actionUseSpecial', {
    playerID: playerID
  });
};

var selectColour = function(playerID, colourID) {
  socket.emit('selectColour', {
    playerID: playerID,
    colourID: colourID
  });
};

var finishPlayingShape = function(playerID) {
  socket.emit('finishPlayingShape', {
    playerID: playerID
  });
};

var canPlayShape = function(playerID, LEDID) {
  return app.players[playerID].selectedColour > 0 &&
      !app.players[playerID].playedShape &&
      app.players[playerID].shapesLeft[
          app.players[playerID].selectedColour] > 0 &&
      app.shapes[LEDID].id === -1;
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
        rolledNumbers: false,
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
    getBackground: function(colourID) {
      if (colourID === 0) {
        return 'rgb(224, 224, 224)';
      }
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
    }
  }
});








