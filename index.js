// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const SECTOR = Number(process.env.SECTOR) || 0;
var port = process.env.PORT || (3000 + SECTOR);
//var socketServerRight = require('socket.io-client')('http://localhost:300' + (SECTOR+1));

// IO for the left sector(s)
const sio = io.of('/servers');

// IO for the game namespace
const gio = io.of('/game');

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
const NUM_SECTORS = 4;
const SECTOR_WIDTH  = 10;
const SECTOR_HEIGHT = 25;

function choice(v) {
    return v[Math.floor(Math.random()*v.length)];
}

let leftSectorSocket = undefined; //SECTOR > 0? require('socket.io-client')(`http://localhost:${port-1}/servers`): undefined;
let rightSectorSocket = SECTOR < NUM_SECTORS-1? require('socket.io-client')(`http://localhost:${port+1}/servers`): undefined;
let rightSectorSocketAvailable = false;

const playersPendingConnection = new Map();

sio.on('connection', (socket) => {
    console.log(`left server connected`);
    leftSectorSocket = socket;

    leftSectorSocket.on('heyo', (incomingPlayer, fn) => {
        console.log('received new user from my left:');
        console.log(incomingPlayer);

        incomingPlayer.x = 0;
        
        // Add user to list of users pending to connect
        playersPendingConnection[incomingPlayer.id] = incomingPlayer;

        // send ack
        fn();
    });
});

if (rightSectorSocket) {
    rightSectorSocket.on('connect', () => {
        rightSectorSocketAvailable = true;
    });
    rightSectorSocket.on('disconnect', () => {
        rightSectorSocketAvailable = false;
    });
    rightSectorSocket.on('heyo', (incomingPlayer, fn) => {
        console.log('received new user from my right');
        console.log(incomingPlayer);

        incomingPlayer.x = SECTOR_WIDTH-1;

        // Add user to list of users pending to connect
        playersPendingConnection[incomingPlayer.id] = incomingPlayer;

        // ack
        fn();
    });
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

function tellClientToSwitch(player, targetSector) {
    const s = playerSockets[player];
    s.emit('switchServer', targetSector);
}

function switchSector(player, targetSectorSocket, targetSector) {
    console.log(`I should send this player to sector ${targetSector}`);
   //console.log(targetSectorSocket);

   // Tell target sector to take control of this user 
   targetSectorSocket.emit('heyo', player, () => {
        // After the other server is waiting for user,
        // tell client to switch server
        tellClientToSwitch(player, targetSector);
    });

    
    // Remove player from this sector's state
    const { players } = state;
    //players.splice(players.indexOf(player), 1);
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
            let isRightMostSector = SECTOR === NUM_SECTORS-1 || !rightSectorSocketAvailable;
            if (isRightMostSector) {
                player.x--;
            }
            else switchSector(player, rightSectorSocket, SECTOR+1);
        }
        if (player.x < 0) {
            if (SECTOR === 0) {
                player.x++;
            }
            else switchSector(player, leftSectorSocket, SECTOR-1);
        }
    });

    gio.emit('state', state);
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

const playerSockets = {}
gio.on('connection', (socket) => {
    console.log(`new player connection with id ${socket.id}`)
    
    socket.on('iam', (previousId) => {
        console.log('iam', previousId);
        let player = {};

        // If user is new, generate player
        if (playersPendingConnection[previousId]) {
            // If it was a user coming from another server, get ownership
            //  - Add to state with the props we received
            console.log('pending player connected');
            
            player = playersPendingConnection[previousId];
            
            // remove player from playersPendingConnection
            playersPendingConnection.delete(previousId);

            // adapt layer location to this sector
            // If came from left
            // player.x = 0
            // If came from right
            //player.x = SECTOR_WIDTH-1;
        }
        else {
            // should be true: 
            //assert (previousId === socket.id);
            
            socket.emit('youare', socket.id);

            // new player
            player = {
                x: Math.floor(Math.random() * SECTOR_WIDTH),
                y: Math.floor(Math.random() * SECTOR_HEIGHT),
                size: 20,
                id: socket.id,
                keyboard: {},
                score: 0,
                dead: false,
                color: getRandomNeonColor() //'#f25d3c'
            }
        }
        playerSockets[player] = socket;

        socket.emit('sector', SECTOR, sector);
        
        state.players.push(player);
        
        socket.on('input', (keyboard => {
            player.keyboard = keyboard;
        }));
        
        socket.on('disconnect', () => {
            const { players } = state;
            players.splice(players.indexOf(player), 1);
        });
    });
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


/*
TODO:
    o   c: paint all players with the correct offset (on the right sector)
    o s2s: send player that will connect
    o s2s: remove from state the player that left this sector
            -> it's already done on disconnect. Maybe consider doing it earlier 
    o s2s: add received player to set of pending players (or map id->player)
    o c2s: store first id received and never update it
    x c2s: send id right after connection -> no need, client has it
    o s2c: create player only if no id received
    o s2c: otherwise just add pending player to state
    - s2c: add sector information for each player/element received
    -   s: control attempts to go to right sectors that are unavailable
*/