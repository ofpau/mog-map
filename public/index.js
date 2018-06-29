let canvas = document.getElementById('gameCanvas');

// const canvas = document.createElement('gameCanvas');
// canvas.id = 'gameCanvas';
// document.body.appendChild(canvas);
console.log(canvas);


canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

const ctx = canvas.getContext('2d');

function choice(v) {
    return v[Math.floor(Math.random()*v.length)];
}

class WorldObject {
    constructor (x, y) {
        this.x = x;
        this.y = y;
        this.w = tileW;
        this.h = tileH;
    }

    paint() {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            marginLeft + this.x*tileW + (tileW - this.w)/2, 
            marginTop + this.y*tileH + (tileH - this.h)/2, 
            this.w, 
            this.h
        );   
    }
}

class Grass extends WorldObject {
    constructor (x, y) {
        super(x, y);
        this.color = '#33af47';
    }
}

class Water extends WorldObject {
    constructor (x, y) {
        super(x, y);
        this.color = '#3199e2';
    }
}

class Mud extends WorldObject {
    constructor (x, y) {
        super(x, y);
        this.color = '#7c5f40';
    }
}

class Rock extends WorldObject {
    constructor (x, y) {
        super(x, y);
        this.color = '#d2dadd';
    }
}

class Player extends WorldObject {
    constructor (_player) {
        super(_player.x, _player.y);
        this.color = '#f25d3c';
        this.w = tileW-4;
        this.h = tileH-4;
        this.color = _player.color;
    }
}

//player = new Player(Math.floor(worldW / 2), Math.floor(worldH / 2));
let state = {};
let sector = []; //[new Rock(0, 0)];
let myPlayer = undefined;
let sectorH = 0;
let sectorW = 0;

const tileW = 34;
const tileH = 34;
const marginLeft = 60; //(canvas.width - sectorW*tileW)/2;
const marginTop = 60; //(canvas.height - sectorH*tileH)/2;

// Render
function render() {
    requestAnimationFrame(render);

    const { players } = state;

    // Clear screen
    ctx.fillStyle = '#EEEEFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.7;

    // Render the map
    for (let i = 0; i < sectorH; i++) {
        for (let j = 0; j < sectorW; j++) {
          //  console.log(i,j, sector[i][j])
            sector[i][j].paint();              
        }
    }
    
    ctx.globalAlpha = 1;

    // Render player
    if (myPlayer) myPlayer.paint();

    // Render the other players
    if (players) {
        players.forEach((p) => {
            (new Player(p)).paint();
        });
    }
    // Add layer to soften colors
    ctx.fillStyle = 'rgb(255,255,255,0.1)'
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
}

requestAnimationFrame(render);

const keyboard = {};
const mapping = {
    'a': 'left',
    'd': 'right',
    'w': 'up',
    's': 'down'
};

document.addEventListener('keydown', function (event) {
    keyboard[mapping[event.key]] = true
    socket.emit('input', keyboard)
});

document.addEventListener('keyup', function (event) {
    keyboard[mapping[event.key]] = false
    socket.emit('input', keyboard)
});

const socket = io();

const typeToClass = {
    'grass': Grass,
    'water': Water,
    'mud': Mud,
    'rock': Rock
}

function toDrawableSector(server_sector) {
   const s = [];
    for (let i = 0; i < server_sector.length; ++i) {
        s.push([]);
        for (let j = 0; j < server_sector[i].length; ++j) {
            const p = server_sector[i][j];
            const tileClass = typeToClass[p.type];
            s[i][j] = new tileClass(p.x, p.y);
        }
    }
    return s;
}

socket.on('sector', (_sector) => {
    sector = toDrawableSector(_sector);
    sectorH = sector.length;
    sectorW = sector[0].length;

    //console.log(sector);
});

socket.on('state', function (newState) {
    state = newState;

    const p = state.players.find(player => {
        return (player.id === socket.id);
    });

    myPlayer = new Player(p)
    //console.log(state, myPlayer);
});

socket.on('switchServer', (targetSector) => {
    console.log(`I should switch to sector ${targetSector}`);
})