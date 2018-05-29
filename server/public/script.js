
/*
client initialization
*/

// LED Grid initialization
const SIZE = 6;
const RANDSIZE = 8;
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

// show points gained
socket.on('showPoints', function(data) {
  showPoints(data.points);
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
  app.pointsArray = gameInformation.pointsArray;
  app.specialMoveCosts = gameInformation.specialMoveCosts;
  app.specialMoveArray = gameInformation.specialMoveArray;
};

// show points gained
var showPoints = function(points) {
  app.gameMessage = '+' + points + ' point';
  if (points != 1) {
    app.gameMessage += 's';
  }
  app.showGameMessage = true;

  setTimeout(function() {
    app.showGameMessage = false;
    app.gameMessage = '';
  }, 1000);
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
      app.players[playerID].shapesLeft > 0 &&
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

// hover over the tile, check number of points
var hoverTile = function(playerID, id) {
  socket.emit('hoverTile', {
    playerID: playerID,
    id: id
  });
};

// player clicked on the use special menu button
var actionUseSpecial = function(playerID) {
  socket.emit('actionUseSpecial', {
    playerID: playerID
  });
};

// finish using a special move / end turn
var finishUsingSpecial = function(playerID) {
  socket.emit('finishUsingSpecial', {
    playerID: playerID
  });
};

// generate random integer from 1 to max
var getRandomInt = function(max) {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
};

// select special move colour
var selectSpecialColour = function(playerID, colourID) {
  socket.emit('selectSpecialColour', {
    playerID: playerID,
    colourID: colourID
  });
};

// select special move type
var selectSpecialType = function(playerID, type) {
  var typeID = -1;
  if (type === 'row') {
    typeID = 0;
  } else if (type === 'column') {
    typeID = 1;
  } else if (type === 'square') {
    typeID = 2;
  } else {
    typeID = -1;
  }

  socket.emit('selectSpecialType', {
    playerID: playerID,
    typeID: typeID
  });
};

// check if player has points to use special move
var hasSufficientPoints = function(playerID) {
  if (app.players[playerID].specialMoveType > -1) {
    return app.players[playerID].points >= app
        .specialMoveCosts[app.players[playerID].specialMoveType] &&
        app.players[playerID].specialMovesLeft[app
            .players[playerID].specialMoveColour] > 0;
  } else {
    return false;
  }
};

// check if player can use a special move
var canUseSpecial = function(playerID) {
  return app.players[playerID].specialMoveColour > -1 &&
      app.players[playerID].specialMoveType > -1 &&
      app.players[playerID].specialMoveColour <= app.COLOURS.length &&
      hasSufficientPoints(playerID);
};

// use special move
var useSpecial = function(playerID, id) {
  if (canUseSpecial(playerID)) {
    socket.emit('useSpecial', {
      playerID: playerID,
      id: id
    });
  }
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
        specialMovesLeft: [0, 2, 2, 2, 2, 2],
        shapesLeft: Math.ceil(SIZE * SIZE / 2),
        selectedColour: 0,
        specialMoveColour: -1,
        specialMoveType: -1,
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
    usingSpecial: false,
    pointsArray: [],
    specialMoveCosts: [0, 0, 0],
    specialMoveArray: [],
    showGameMessage: false,
    gameMessage: '',
    randomColour: 1
  },
  created: function() {
    this.timer = setInterval(function() {
      app.randomColour = getRandomInt(app.COLOURS.length - 1);
    }, 1000);
  },
  beforeDestroy: function() {
    clearInterval(this.timer);
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
    // check if cell is part of the points array
    pointHighlight: function(id) {
      return app.pointsArray.indexOf(id) > -1;
    },
    // check if cell is part of the special move array
    specialHighlightClass: function(id) {
      return app.specialMoveArray.indexOf(id) > -1;
    },
    // return highlight colour
    specialHighlight: function(playerID, id) {
      if (app.specialMoveArray.indexOf(id) > -1) {
        var colour = app.players[playerID].specialMoveColour;
        var colourString = app.getBackground(colour);
        if (colour === 0) {
          colourString = '#757575';
        }
        return '0 0 5px 3px ' + colourString;
      } else {
        return '0 0 rgba(0, 0, 0, 0)';
      }
    },
    // selects a tile on the LED grid
    selectTile: function(id) {
      placeShape(app.currentTurn, id);
      useSpecial(app.currentTurn, id);
    },
    // play shape menu button pressed
    actionPlayShape: function(playerID) {
      actionPlayShape(playerID);
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
    },
    // hover tile
    hoverTile: function(playerID, id) {
      hoverTile(playerID, id);
    },
    // special move menu button pressed
    actionUseSpecial: function(playerID) {
      actionUseSpecial(playerID);
    },
    // finish using special move
    finishUsingSpecial: function(playerID) {
      finishUsingSpecial(playerID);
    },
    // select special move colour
    selectSpecialColour: function(playerID, colourID) {
      selectSpecialColour(playerID, colourID);
    },
    // select special move type
    selectSpecialType: function(playerID, type) {
      selectSpecialType(playerID, type);
    }
  }
});








