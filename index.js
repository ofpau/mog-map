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

// Map info
const SECTOR_WIDTH  = 31;
const SECTOR_HEIGHT = 25;

function choice(v) {
    return v[Math.floor(Math.random()*v.length)];
}

// List of things used to populate the map
const tileTypes = ['grass', 'water', 'mud', 'rock'];

// Populate the map to create the world
const sector = [];
for (let i = 0; i < SECTOR_HEIGHT; ++i) {
    sector.push([]);
    for (let j = 0; j < SECTOR_WIDTH; ++j) {
        sector[i][j] = {
            type: choice(tileTypes),
            x: j,
            y: i
        }
    }
}

function logics() {
    setTimeout(logics, 16);

    const { players, enemies, coins } = state;
        
    // Player actions
    players.forEach((player) => {
        if (player.dead) return;
        
        const { keyboard } = player;
        if (keyboard.left) player.x--;
        if (keyboard.right) player.x++;
        if (keyboard.up) player.y--;
        if (keyboard.down) player.y++;
    });

    io.sockets.emit('state', state);
}

logics();

io.on('connection', (socket) => {
    console.log(`new connection`)

    const player = {
        x: Math.floor(Math.random() * SECTOR_WIDTH),
        y: Math.floor(Math.random() * SECTOR_HEIGHT),
        size: 20,
        id: socket.id,
        keyboard: {},
        score: 0,
        dead: false,
        color: '#f25d3c'
    }
    
    console.log(sector.length, sector[0].length);
    socket.emit('sector', sector);
    
    state.players.push(player);
    
    socket.on('input', (keyboard => {
        player.keyboard = keyboard;
    }));
    
    socket.on('disconnect', () => {
        const { players } = state;
        players.splice(players.indexOf(player), 1);
    })
});