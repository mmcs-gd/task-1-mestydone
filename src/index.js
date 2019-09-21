const canvas = document.getElementById("cnvs");

const config = {
    triangels : {
        count : 50,
        size : 15
    }, 

    circles : {
        count : 200,
        size : 5
    }, 

    hexagons : {
        count : 20,
        size : 15
    }, 
}

const objectColors = ["#666666", "#9c6b43", "#ff7300"]

const direction = {
    left : 0,
    right : 1,
    up : 2,
    down : 3,
    none : -1
}

const gameState = {}

function onClick(e) {
    setup()
}

function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

function draw(tFrame) {
    const context = canvas.getContext('2d');

    // clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawObjects(context)
    drawInfo(context)
    drawRestartHint(context)
}

function update(tick) {
   const objects = gameState.objects;
    objects.forEach(obj => {
        obj.x += obj.vx
        obj.y += obj.vy 

        //obj.vy += 0.2 // что-то типа гравитации

        const dir = checkWallCollision(obj)
    
        switch(dir) {
            case direction.left: if (obj.vx > 0)   obj.vx *= -1; break
            case direction.right : if (obj.vx < 0) obj.vx *= -1; break
            case direction.up : if (obj.vy > 0)    obj.vy *= -1; break
            case direction.down : if (obj.vy < 0)  obj.vy *= -1; break
        }

        if (dir !== direction.none) {
            obj.bounceCount++;
        } else {
            objects.forEach(otherObj => {
                if (otherObj === obj || otherObj.processedOnTick === tick) return

                if (checkObjectCollision(obj, otherObj)) {
                    const otherObjVx = otherObj.vx
                    const otherObjVy = otherObj.vy

                    otherObj.vx = obj.vx
                    otherObj.vy = obj.vy

                    obj.vx = otherObjVx
                    obj.vy = otherObjVy
                   
                    obj.bounceCount++;
                    otherObj.bounceCount++;
                }
            })
        }

        obj.processedOnTick = tick
    })

    gameState.objects = objects.filter(obj => obj.bounceCount < 3)
}


// return bounce direction for collision with wall
function checkWallCollision(obj) {
    if (obj.x <= 0 + obj.radius) return direction.right
    else if (obj.x >= canvas.width - obj.radius) return direction.left
    else if (obj.y <= 0 + obj.radius) return direction.down
    else if (obj.y + obj.radius >= canvas.height) return direction.up
    else return direction.none
}

// true if objects collided
function checkObjectCollision(obj1, obj2) {
    return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)) < obj1.radius + obj2.radius
}


function run(tFrame) {
    gameState.stopCycle = window.requestAnimationFrame(run);

    const nextTick = gameState.lastTick + gameState.tickLength;
    let numTicks = 0;

    if (tFrame > nextTick) {
        const timeSinceTick = tFrame - gameState.lastTick;
        numTicks = Math.floor(timeSinceTick / gameState.tickLength);
    }

    queueUpdates(numTicks);
    draw(tFrame);

    // save last 240 frame times
    gameState.frameTimes.push(tFrame - gameState.lastRender)
    gameState.lastRender = tFrame;

    if (gameState.frameTimes.length > 240) {
        gameState.frameTimes.splice(0, 1)
    }
}

function stopGame(handle) {
    window.cancelAnimationFrame(handle);
}

function drawObjects(context) {
    gameState.objects.forEach(obj => {
        context.beginPath();
        context.fillStyle = objectColors[obj.bounceCount];
        context.moveTo(obj.x + obj.points[0].x, obj.y + obj.points[0].y);
    
        obj.points.forEach(({x, y}) => {
            context.lineTo(obj.x + x, obj.y + y)
        })
        
        context.fill()
        context.closePath()

        //drawVector(context, obj.x, obj.x + obj.vx * 10, obj.y,  obj.y + obj.vy * 10)
    })
}

function drawVector(context, x1, x2, y1, y2) {
    context.beginPath();
    context.strokeStyle = "#000000";
    context.moveTo(x1, y1);
    context.lineTo(x2 , y2)
    context.stroke();
    context.closePath();
}

// draw info about objects count, FPS and frame time statistics
function drawInfo(context) {
    context.textAlign = "right";
    context.fillStyle = "#333333";
    context.font = "18px Calibri";
    context.fillText("Objects count: " + gameState.objects.length, canvas.width - 24, 32)


    let ftX = canvas.width - 24
    const ftLen = gameState.frameTimes.length
    
    context.beginPath()
    context.strokeStyle = "#333333";
    context.moveTo(ftX--, 140 - gameState.frameTimes[ftLen - 1]);
    for(let i = 2; i < ftLen; i++) {
        context.lineTo(ftX--, 140 - gameState.frameTimes[ftLen - i])
    }
    
    context.stroke();
    context.closePath();

    if (ftLen > 0) {
        const fps = 1000 / gameState.frameTimes[ftLen - 1]
        context.fillText("Frame time " + gameState.frameTimes[ftLen - 1].toFixed(1) + " ms, " + Math.floor(fps)+ " fps", canvas.width - 24, 60)
    }
}

// draw "click to restart" hint
function drawRestartHint(context) {
    if (gameState.objects.length > 10) return
    context.textAlign = "center";
    context.fillStyle = "#00000016";
    context.font = "48px Calibri";
    context.fillText("click to restart", canvas.width / 2, canvas.height / 2)
}

function setup() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    gameState.lastTick = performance.now()
    gameState.lastRender = gameState.lastTick
    gameState.tickLength = 15

    gameState.objects = []


    getSpeed = function() {
        return (10 - Math.round(Math.random(1) * 20)) / 3
    }

    getCoordX = function() {
        return 64 + Math.random() * (canvas.width - 128)
    }

    getCoordY = function() {
        return 64 + Math.random() * (canvas.height - 128)
    }

    // generate triangels
    for (let i = 0; i < config.triangels.count; i++) {
        gameState.objects.push({
            bounceCount : 0,
            radius: config.triangels.size,
            processedOnTick : gameState.lastTick,
            angles : 3,
            points : createCornerPoints(3, config.triangels.size),
            x : getCoordX(),
            y : getCoordY(),
            vx: getSpeed(),
            vy: getSpeed()
        })
    }

    // generate hexagons
    for (let i = 0; i < config.hexagons.count; i++) {
        gameState.objects.push({
            bounceCount : 0,
            radius: config.hexagons.size,
            processedOnTick : gameState.lastTick,
            angles : 6,
            points : createCornerPoints(6, config.hexagons.size),
            x : getCoordX(),
            y : getCoordY(),
            vx: getSpeed(),
            vy: getSpeed()
        })
    }

    // generate circles
    for (let i = 0; i < config.circles.count; i++) {
        gameState.objects.push({
            bounceCount : 0,
            radius: config.circles.size,
            processedOnTick : gameState.lastTick,
            angles : 24,
            points : createCornerPoints(24, config.circles.size),
            x : getCoordX(),
            y : getCoordY(),
            vx: getSpeed(),
            vy: getSpeed()
        })
    }

    gameState.frameTimes = []
}

// сreates a set of corner points for a shape
function createCornerPoints(anglesCount, radius) {
    const points = []
    let angle = 0

    while (angle <= 2 * Math.PI) {
        const px = Math.sin(angle) * (-radius)
        const py = Math.cos(angle) * (-radius)
        
        points.push({x : px, y : py})
        
        angle += (360 / anglesCount) * Math.PI / 180
    }

    return points
}

canvas.addEventListener('click', onClick, false)

setup();
run();