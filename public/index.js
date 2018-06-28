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

// Create sample world

class WorldObject {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }
}

class Grass extends WorldObject {
    constructor() {
        super();
        this.color = '#33af47'
    }
}

class Water extends WorldObject {
    constructor() {
        super();
        this.color = '#3199e2'
    }
}

class Mud extends WorldObject {
    constructor() {
        super();
        this.color = '#7c5f40'
    }
}

class Rock extends WorldObject {
    constructor() {
        super();
        this.color = '#d2dadd'
    }
}

// List of things used to populate the map
const mapStuff = [Grass, Water, Mud, Rock];

const worldW = 30;
const worldH = 24;
const tileW = 34;
const tileH = 34;

const marginLeft = (canvas.width - worldW*tileW)/2;
const marginTop = (canvas.height - worldH*tileH)/2;

const world = [[]];
for (let i = 0; i < worldH; ++i) {
    world.push([]);
    for (let j = 0; j < worldW; ++j) {
        let tileClass = choice(mapStuff);
        world[i][j] = new tileClass(i, j);
    }
}

ctx.fillStyle = '#EEEEFF'
ctx.fillRect(0, 0, canvas.width, canvas.height);

for (let i = 0; i < worldH; ++i) {
    for (let j = 0; j < worldW; ++j) {
        ctx.fillStyle = world[i][j].color;
        ctx.fillRect(marginLeft + j*tileW, marginTop + i*tileH, tileW, tileH);                   
    }
}

ctx.fillStyle = 'rgb(255,255,255,0.1)'
// ctx.fillRect(0, 0, canvas.width, canvas.height);
