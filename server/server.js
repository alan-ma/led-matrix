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
var LED_COUNT = 10;
for (i = 0; i < LED_COUNT; i++) {
  LEDGrid.push({
    'id': i,
    'red': 0,
    'green': 0,
    'blue': 0
  });
}

// define game information
var gameInformation = {
  'turn': 0,
  'players': [
    {
      'id': 0
    }
  ]
};

// establish socket io connection
io.on('connection', function(socket) {
  // initialize client
  socket.emit('updateClient', { grid: LEDGrid });

  // receive client input
  socket.on('updateLED', function(data) {
    LEDGrid[data.id].red = data.red;
    LEDGrid[data.id].green = data.green;
    LEDGrid[data.id].blue = data.blue;

    // update the client
    socket.emit('updateClient', { grid: LEDGrid });

    // update the physical LED grid
    updateLED(data.id, data.red, data.green, data.blue);

    // log the event
    console.log('server updated');
  });
});


// update the physical LED grid
function updateGrid(gridInput) {
  var parsedInput = '';

  for (var i = 0; i < gridInput.length; i++) {
    parsedInput += gridInput[i].red;
    parsedInput += ',';
    parsedInput += gridInput[i].green;
    parsedInput += ',';
    parsedInput += gridInput[i].blue;
    if (i + 1 < gridInput.length) {
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
}


// update a single LED
function updateLED(id, red, green, blue) {
  var parsedInput = '';
  parsedInput += LED_COUNT;
  parsedInput += '\n';
  parsedInput += id;
  parsedInput += '\n';
  parsedInput += red;
  parsedInput += ',';
  parsedInput += green;
  parsedInput += ',';
  parsedInput += blue;
  parsedInput += ',';

  var options = {
    args: parsedInput
  };

  // run a python shell to execute the script via a child process
  PythonShell.run('../setLED.py', options, function (err) {
    if (err) {
      console.log(err);
    }
    return !err;
  });
}

var shutdown = function() {
  console.log('\ncompleting shutdown process...');
  // run a python shell to execute the script via a child process
  PythonShell.run('../clear.py', function (err) {
    if (err) {
      console.log(err);
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
process.on ('SIGTERM', shutdown);

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', shutdown);   

server.listen(3000, function () {
  console.log('server running on port 3000');
});



