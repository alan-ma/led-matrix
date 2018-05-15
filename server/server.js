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
for (i=0; i<LED_COUNT; i++) {
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
    updateGrid(LEDGrid);

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

/*
// route handler (endpoint) to execute python script

app.get('/test', test);

function test(req, res) {
  // testing endpoint http://localhost:3000/test?message1=hello&message2=world
  // options for the script
  var options = {
    args:
    [
      req.query.message1, // message1
      req.query.message2, // message2
    ]
  };

  // use python shell to run script via a child process
  PythonShell.run('../test.py', options, function (err, data) {
    if (err) res.send(err);
    // console.log(data);
    res.send(data.toString());
  });
}
*/

var shutdown = function() {
  console.log('completing shutdown process...');
  // run a python shell to execute the script via a child process
  PythonShell.run('../clear.py', function (err) {
    if (err) {
      console.log(err);
    }
    return !err;
  });
  console.log('shutting down');
};

// shutdown process, clear LEDs
process.on('exit', shutdown);

// listen for TERM signal .e.g. kill 
process.on ('SIGTERM', shutdown);

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', shutdown);   

server.listen(3000, function () {
  console.log('server running on port 3000');
});



