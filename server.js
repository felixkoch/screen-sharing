// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

var socket = require('socket.io');
io = socket(listener);


  //let socketRoomMap = {};
  let roomMembers = {};

io.on('connection', (socket) => {
  console.log(`Angemeldet ist: ${socket.id}`);

  socket.on('JOIN', (data) => {
    console.log(`JOIN: ${socket.id} joins ${data}`);
    socket.join(data);

    //socketRoomMap[socket.id] = data;
    if(typeof roomMembers[data] == 'undefined')
    {
      roomMembers[data] = [];
    }
    
    roomMembers[data].push(socket.id);

    socket.emit('MEMBERS', roomMembers[data]);
  });

  socket.on('SEND_MESSAGE', (data) => {
    console.log(`Nachricht von: ${socket.id}`);
    console.log(data);
    //console.log(socketRoomMap[socket.id])
    io.to(data.room).emit('RECEIVE_MESSAGE', data);
  });
});