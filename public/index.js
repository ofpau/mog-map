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

// Map info
const worldW = 31;
const worldH = 25;
const tileW = 34;
const tileH = 34;

const marginLeft = (canvas.width - worldW*tileW)/2;
const marginTop = (canvas.height - worldH*tileH)/2;

class WorldObject {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }

    paint() {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            marginLeft + this.x*tileW, 
            marginTop + this.y*tileH, 
            tileW, 
            tileH
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
    constructor (x, y) {
        super(x, y);
        this.color = '#f25d3c';
    }
}

// List of things used to populate the map
const mapStuff = [Grass, Water, Mud, Rock];

// Populate the map to create the world
const world = [[]];
for (let i = 0; i < worldH; ++i) {
    world.push([]);
    for (let j = 0; j < worldW; ++j) {
        let tileClass = choice(mapStuff);
        world[i][j] = new tileClass(j, i);
    }
}

player = new Player(Math.floor(worldW / 2), Math.floor(worldH / 2));

// Render
function render() {
    requestAnimationFrame(render);
    // Clear screen
    ctx.fillStyle = '#EEEEFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function paintTile(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(marginLeft + x*tileW, marginTop + y*tileH, tileW, tileH);
    }

    // Render the map
    for (let i = 0; i < worldH; ++i) {
        for (let j = 0; j < worldW; ++j) {
            world[i][j].paint();              
        }
    }

    // Render player
    player.paint();

    // Add layer to soften colors
    ctx.fillStyle = 'rgb(255,255,255,0.1)'
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (keyboard.left) player.x--;
    if (keyboard.right) player.x++;
    if (keyboard.up) player.y--;
    if (keyboard.down) player.y++;
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
    //socket.emit('input', keyboard)
});
document.addEventListener('keyup', function (event) {
    keyboard[mapping[event.key]] = false
    //socket.emit('input', keyboard)
});