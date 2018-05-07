var express = require('express');
var PythonShell = require('python-shell');
var app = express();

app.get('/test', test);

function test(req, res) {
  // http://localhost:3000/test?message1=hello&message2=world
  var options = {
    args:
    [
      req.query.message1, // message1
      req.query.message2, // message2
    ]
  };

  PythonShell.run('../test.py', options, function (err, data) {
    if (err) res.send(err);
    console.log(data);
    res.send(data.toString());
  });
}


app.listen(3000, function () {
  console.log('server running on port 3000');
});


