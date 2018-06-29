// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const SECTOR = Number(process.env.SECTOR);
var port = process.env.PORT || (3000 + SECTOR);

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
const NUM_SECTORS=4;
const SECTOR_WIDTH  = 31;
const SECTOR_HEIGHT = 25;

function choice(v) {
    return v[Math.floor(Math.random()*v.length)];
}

const leftSectorSocket = SECTOR > 0? require('socket.io-client')(`http://localhost:${port-1}`): undefined;
const rightSectorSocket = SECTOR < NUM_SECTORS-1? require('socket.io-client')(`http://localhost:${port+1}`): undefined;

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

function switchSector(targetSectorSocket, targetSector) {
    console.log(`I should send this player to sector ${targetSector}`)
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
        if (keyboard.up && player.y > 0) player.y--;
        if (keyboard.down && player.y < SECTOR_HEIGHT-1) player.y++;

        if (player.x > SECTOR_WIDTH) {
            if (SECTOR === NUM_SECTORS-1) {
                player.x--;
            }
            else switchSector(rightSectorSocket, SECTOR+1);
        }
        if (player.x < 0) {
            if (SECTOR === 0) {
                player.x++;
            }
            else switchSector(leftSectorSocket, SECTOR-1);
        }
    });

    io.sockets.emit('state', state);
    if (leftSectorSocket) leftSectorSocket.emit('state', state);
    if (rightSectorSocket) rightSectorSocket.emit('state', state);
}

function ffor00 () {
    return Math.round(Math.random()) ? 'ff' : '00'
}

function getRandomNeonColor () {
    return `#${ffor00()}${ffor00()}${ffor00()}`
}

console.log(`I'M SECTOR ${SECTOR}`);

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
        color: getRandomNeonColor() //'#f25d3c'
    }
    
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

if (leftSectorSocket) {
    leftSectorSocket.on('connection', (socket) => {
        console.log(`Connected to Sector ${SECTOR-1}`)
    });    
}
if (rightSectorSocket) {
    rightSectorSocket.on('connection', (socket) => {
        console.log(`Connected to Sector ${SECTOR+1}`)
    });
}

logics();

// En canviar de sector:
//    el server li passa l'autoritat sobre 
//          aquest player al sector corresponent.
//    elient es desconnecta d'aquest i es connecta al que toca

// En un inici compartir tot l'state amb els servers adjacents
// La versió bona és compartir només algunes caselles, 
//    les més properes a les edges.