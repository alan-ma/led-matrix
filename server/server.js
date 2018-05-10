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
  LEDGrid.push([0, 0, 0]);
}

// establish socket io connection
io.on('connection', function(socket) {
  // initialize client
  socket.emit('updateClient', { grid: LEDGrid });

  // receive client input
  socket.on('updateServer', function(data) {
    LEDGrid = data.grid;
    // update the client
    socket.emit('updateClient', { grid: LEDGrid });

    // update the physical LED grid
    updateGrid();

    // log the event
    console.log('\nserver updated');
    console.log(LEDGrid);
  });
});


// update the physical LED grid
function updateGrid(gridInput) {
  var options = {
    args: gridInput
  };

  // run a python shell to execute the script via a child process
  PythonShell.run('../setColours.py', options, function (err, data) {
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

server.listen(3000, function () {
  console.log('server running on port 3000');
});



