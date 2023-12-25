const http = require('http'),
    express = require('express'),
    cors = require('cors'),
    { Server } = require('socket.io');

// Server code
let app = express().use(cors()).use(express.static(__dirname, { index: 'tmp-index.html' }));
let httpServer = http.createServer(app);
const io = new Server(httpServer)
io.on('connection', socket => {

    socket.on('clientReady', ()=>{
        if (io.sockets.sockets.size === 2) {
            let randIndex = Math.floor(Math.random()*obstacles.length);
            // let randIndex2 = Math.floor(Math.random()*obstacles.length);
            io.sockets.emit('startGame', [
                {
                    type: obstacles[randIndex],
                    posX: randomCoords().posX,
                    posY: randomCoords().posY
                },
                // {
                //     type: obstacles[randIndex2],
                //     posX: randomCoords().posX,
                //     posY: randomCoords().posY
                // }
            ]);
        }
    });
    socket.on('handleHero', data =>{
        if (data) socket.broadcast.emit('handleHero', data);
    });
    socket.on('handleArrayTracker', data=>{
        if (data) {
            socket.broadcast.emit('handleArrayTracker', data);
        }
    });
    socket.on('removeElement', id=>{
        if (id) socket.broadcast.emit('removeElement', `#canvas_${id}`);
    });

    socket.on('freeze', client=> {
        socket.emit('freeze', client);
    });

    socket.on('spawnLoot', lootType=>{
        socket.emit('spawnLoot', spawnLoot(lootType));
    });
    socket.on('gameOver', (loser)=>{
        io.sockets.emit('gameOver', loser);
    });
});
httpServer.listen(3000);

/*
  Stuff to keep track of:
  - Positions ✔
  - Health ✔
  - Projectiles ✔
  -- Arrows ✔
  -- Fireballs ✔
  - Areas ✔
  -- Wildfire ✔
  - Conditions
  -- Attack ✔
  -- Ability ✔
  -- Freeze
  -- Health potion
  - Obstacles
  - Arena border

  Other stuff:
  - Initialize enemy ✔
  - Attacking mechanic ✔
  - Check if enenmy is dead ✔
  - When client recieves heroOBJs, check id to deterine hero or enemy ✔
  - Area mechanic to hurt enemy ✔
*/

let obstacles = ['tree', 'rock', 'lake'];
function randomCoords() {
    let coordX = Math.floor(Math.random() * (1200 - 2 * 100)) + 100; // canvas width = 1200px
    let coordY = Math.floor(Math.random() * (500 - 2 * 100)) + 100; // canvas height = 500px
    // * The numbers at the end are for the size of the object that is being spawned. 100 is the width and height. We do not want the objects to spawn right on the edge

    // for (let index in arrayTracker.obstaclesArray) {
    //     let obstacle = arrayTracker.obstaclesArray[index];
    //     if (
    //     ((coordY > obstacle.posY && coordY < obstacle.posY + obstacle.height) ||
    //         (coordY + 100 > obstacle.posY &&
    //         coordY + 100 < obstacle.posY + obstacle.height)) ||
    //     ((coordX > obstacle.posX && coordX < obstacle.posX + obstacle.width) ||
    //         (coordX + 100 > obstacle.posX &&
    //         coordX + 100 < obstacle.posX + obstacle.width))
    //     ) {
    //     // * The 100 is the value for the obstacle's width and height (note that objects are bigger than characters)
    //     return randomCoords();
    //     }

    // }
    return {
        posX: coordX,
        posY: coordY,
    };
  }