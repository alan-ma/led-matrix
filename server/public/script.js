
/*
led grid
*/

// LED Grid initialization
var LEDGrid = [];
var LED_COUNT = 10;
for (i=0; i<LED_COUNT; i++) {
  LEDGrid.push({
    'id': i,
    'red': 0,
    'green': 0,
    'blue': 0
  });
}


/*
communication with server
socket io
*/

var socket = io(); // localhost port 3000

// update the client-side display
socket.on('updateClient', function(data) {
  app.grid = data.grid;

  // log the event
  console.log('client updated');
  console.log(app.grid);
});

// send update to the server (display unchanged)
function updateLED(LEDid, redColour, greenColour, blueColour) {
  socket.emit('updateLED', {
    id: LEDid,
    red: redColour,
    green: greenColour,
    blue: blueColour
  });
}


/*
client side
vue js
*/

var app = new Vue({
  el: '#app',
  data: {
    players: [
      {
        'id': 1,
        'name': 'Player1',
        'points': 0,
        'score': 0,
        'icon': 'fa-star'
      },
      {
        'id': 2,
        'name': 'Player2',
        'points': 0,
        'score': 0,
        'icon': 'fa-square'
      },
      {
        'id': 3,
        'name': 'Player3',
        'points': 0,
        'score': 0,
        'icon': 'fa-circle'
      },
      {
        'id': 4,
        'name': 'Player4',
        'points': 0,
        'score': 0,
        'icon': 'fa-heart'
      },
      {
        'id': 5,
        'name': 'Player5',
        'points': 0,
        'score': 0,
        'icon': 'fa-play'
      }
    ],
    currentTurn: 3,
    grid: LEDGrid
  },
  methods: {
    getBackground: function (id) {
      if (app.grid[id].red === 0 && app.grid[id].blue === 0 && app.grid[id].green === 0) {
        return 'rgb(224, 224, 224)';
      }
      return 'rgb(' + app.grid[id].red + ', ' + app.grid[id].green + ', ' + app.grid[id].blue + ')';
    },
    hover: function (id, event) {
      updateLED(id, 0, 255, 0);
    }
  }
});








