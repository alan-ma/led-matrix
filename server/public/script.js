
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
};

var placeShape = function(playerID, LEDID) {
  socket.emit('placeShape', {
    playerID: playerID,
    LEDID: LEDID,
    LEDColour: app.players[playerID].selectedColour
  });
};

var incrementTurn = function(playerID) {
  socket.emit('incrementTurn', {
    playerID: playerID
  });
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
    shapes: shapesGridInit
  },
  methods: {
    getBackground: function (id) {
      if (app.grid[id].colour === 0) {
        return 'rgb(224, 224, 224)';
      }
      var parsedColour = 'rgb(';
      parsedColour += app.COLOURS[app.grid[id].colour][0];
      parsedColour += ', ';
      parsedColour += app.COLOURS[app.grid[id].colour][1];
      parsedColour += ', ';
      parsedColour += app.COLOURS[app.grid[id].colour][2];
      parsedColour += ')';

      return parsedColour;
    },
    selectTile: function (LEDID) {
      placeShape(app.currentTurn, LEDID);
      incrementTurn(app.currentTurn);
    }
  }
});








