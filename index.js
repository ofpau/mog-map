// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

const state = {
    players: [],
    enemies: [],
    coins: []
}

io.on('connection', (socket) => {
    console.log(`new connection`)

    const player = {
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        size: 20,
        id: socket.id,
        keyboard: {},
        score: 0,
        dead: false,
        color: '#f25d3c'
    }
    
    state.players.push(player);
    
    socket.on('input', (keyboard => {
        player.keyboard = keyboard;
    }));
    
    socket.on('disconnect', () => {
        const { players } = state;
        players.splice(players.splice.indexOf(player), 1);
    })
});