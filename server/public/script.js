
/*
led grid
*/

// LED Grid initialization
var LEDGrid = [];
var LED_COUNT = 100;
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
  // LEDGrid = data.grid;

  // add: update the display

  // log the event
  console.log('\nclient updated:');
  console.log(LEDGrid);
});

// send update to the server (display unchanged)
function updateServer() {
  socket.emit('updateServer', { grid: LEDGrid });
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
  }
});








