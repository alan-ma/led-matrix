
/*
client initialization
*/

// LED Grid initialization
var LEDGridInit = [];
var LED_COUNT = 10;
for (var i = 0; i < LED_COUNT; i++) {
  LEDGridInit.push({
    id: i,
    red: 0,
    green: 0,
    blue: 0
  });
}

// shapes grid initialization
var shapesGridInit = [];
for (var i = 0; i < LED_COUNT; i++) {
  shapesGridInit.push({
    id: -1,
    red: 0,
    green: 0,
    blue: 0
  });
}

// player icons/shapes using font awesome
const ICONS = ['fa-star', 'fa-square', 'fa-circle', 'fa-heart', 'fa-play'];


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
    players: [
      {
        id: 0,
        name: 'PlayerOne',
        playedShape: false,
        selectedColour: {
          red: 0,
          green: 0,
          blue: 0
        },
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
      if (app.grid[id].red === 0 && app.grid[id].blue === 0 && app.grid[id].green === 0) {
        return 'rgb(224, 224, 224)';
      }
      return 'rgb(' + app.grid[id].red + ', ' + app.grid[id].green + ', ' + app.grid[id].blue + ')';
    },
    selectTile: function (LEDID) {
      placeShape(app.currentTurn, LEDID);
      incrementTurn(app.currentTurn);
    }
  }
});








