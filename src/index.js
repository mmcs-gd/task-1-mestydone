const canvas = document.getElementById("cnvs");

const config = {
    triangels : {
        count : 150,
        size : 5
    }, 

    circles : {
        count : 150,
        size : 5
    }, 

    hexagons : {
        count : 150,
        size : 5
    }, 
}

// 5x10 500 500 500

const grid = {
    height : 5,
    width : 10
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
    drawRestartHint(context)
    drawInfo(context)
    //drawGrid(context)
}

function update(tick) {
    const objects = gameState.objects;

    // сетка
    // objects.forEach(obj => {
    //     row = Math.trunc(obj.y / (canvas.height / grid.height))
    //     col = Math.trunc(obj.x / (canvas.width / grid.width))

    //     obj.cell = grid.width * row + col
    // })
    
    objects.forEach(obj => {
        obj.x += obj.vx
        obj.y += obj.vy 

        //obj.vy += 0.1 // что-то типа гравитации

        const dir = checkWallCollision(obj)
    
        switch(dir) {
            case direction.left: if (obj.vx > 0)   obj.vx *= -1; break
            case direction.right : if (obj.vx < 0) obj.vx *= -1; break
            case direction.up : if (obj.vy > 0)    obj.vy *= -1; break
            case direction.down : if (obj.vy < 0)  obj.vy *= -1; break
        }

        if (dir === direction.none) {
            // столкновение с другим объектом
            objects
            //.filter(otherObj => obj.cell == otherObj.cell) // сетка
            .forEach(otherObj => {
                if (otherObj === obj 
                    || otherObj.processedOnTick === tick) return

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


// return bounce direction for co llision with wall
function checkWallCollision(obj) {
    if (obj.x <= 0 + obj.radius) {
        if (obj.type === "circle") {
            return direction.right
        } else {        
            for (let i = 0; i < obj.points.length; i++)
                if(obj.points[i].x + obj.x <= 0) 
                    return direction.right
        }
    } 
        
    if (obj.x >= canvas.width - obj.radius) {
        if (obj.type === "circle") {
            return direction.left
        } else {        
            for (let i = 0; i < obj.points.length; i++)
                if(obj.points[i].x + obj.x >= canvas.width) 
                    return direction.left
        }
    }
    
    if (obj.y <= 0 + obj.radius) {
        if (obj.type === "circle") {
            return direction.down
        } else {        
            for (let i = 0; i < obj.points.length; i++)
                if(obj.points[i].y + obj.y <= 0) 
                    return direction.down
        }
    }
        
    if (obj.y + obj.radius >= canvas.height) {
        if (obj.type === "circle") {
            return direction.up
        } else {        
            for (let i = 0; i < obj.points.length; i++)
                if(obj.points[i].y + obj.y >= canvas.height) 
                    return direction.up
        }
    }

    return direction.none
}

// true if objects collided
function checkObjectCollision(obj1, obj2) {
    if (obj1.type === "circle" && obj2.type === "circle") {
        // Евклидово растояние между центрами окружностей < 2R
        return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)) < obj1.radius + obj2.radius
    } else {
        const distance = Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
        if (distance > obj1.radius + obj2.radius) return false;

        // Пересечение отрезков 
        const points1 = obj1.points
        const points2 = obj2.points
    
        for (let i = 0; i < points1.length - 1; i++) {
            const ax = points1[i].x + obj1.x
            const bx = points1[i + 1].x + obj1.x
            const ay = points1[i].y + obj1.y
            const by = points1[i + 1].y + obj1.y
    
            for (let j = 0; j < points2.length - 1; j++) {
                const cx = points2[j].x + obj2.x
                const dx = points2[j + 1].x + obj2.x
                const cy = points2[j].y + obj2.y
                const dy = points2[j + 1].y + obj2.y
        
                const r = ((ay-cy)*(dx-cx)-(ax-cx)*(dy-cy)) / ((bx-ax)*(dy-cy)-(by-ay)*(dx-cx))
                const s = ((ay-cy)*(bx-ax)-(ax-cx)*(by-ay)) / ((bx-ax)*(dy-cy)-(by-ay)*(dx-cx))
    
                if (r >= 0 && r <= 1 && s >= 0 && s <= 1) return true
            }
        }
        return false
    }
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
        obj.draw(context)
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


function drawGrid(context) {
    context.beginPath();
    context.font = "32px Calibri";
    context.strokeStyle = "#CCCCCC";
    for (let i = 1; i < grid.width; i++){
        const x = canvas.width / grid.width * i
        context.moveTo(x, 0);
        context.lineTo(x , canvas.height)
        context.stroke();
    }

    // context.strokeStyle = "#00000007";    
    for (let i = 1; i < grid.height; i++){
        const y = canvas.height / grid.height * i
        context.moveTo(0, y);
        context.lineTo(canvas.width , y)
        context.stroke();
    }

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

    getSpeed = () => { return (10 - Math.round(Math.random(1) * 20)) / 3 }

    getCoordX = () => { return 32 + Math.random() * (canvas.width - 64) }

    getCoordY = () => {return 32 + Math.random() * (canvas.height - 64) }
    
    // сreates a set of corner points for a shape
    createCornerPoints = (anglesCount, radius) => {
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

    createObject = (type, anglesCount, size) => {
        return {
            type : type,
            bounceCount : 0,
            cell : 0,
            radius: size,
            processedOnTick : gameState.lastTick,
            points : createCornerPoints(anglesCount, size),
            x : getCoordX(),
            y : getCoordY(),
            vx: getSpeed(),
            vy: getSpeed()
        }
    }


    // generate triangels
    for (let i = 0; i < config.triangels.count; i++) {
        obj = createObject("triangle", 3, config.triangels.size)
        obj.draw = function(context) {
            context.beginPath();
            context.fillStyle = objectColors[this.bounceCount];
            context.moveTo(this.x + this.points[0].x, this.y + this.points[0].y);
        
            this.points.forEach(({x, y}) => {
                context.lineTo(this.x + x, this.y + y)
            })
            
            context.fill()
            context.closePath()
        }

        gameState.objects.push(obj)
    }

    // generate hexagons
    for (let i = 0; i < config.hexagons.count; i++) {
        obj = createObject("hexagon", 6, config.hexagons.size)
        obj.draw = function(context) {
            context.beginPath();
            context.fillStyle = objectColors[this.bounceCount];
            context.moveTo(this.x + this.points[0].x, this.y + this.points[0].y);
        
            this.points.forEach(({x, y}) => {
                context.lineTo(this.x + x, this.y + y)
            })
            
            context.fill()
            context.closePath()
        }

        gameState.objects.push(obj)
    }

    // generate circles
    for (let i = 0; i < config.circles.count; i++) {
        obj = createObject("circle", 16, config.circles.size)
        obj.draw = function(context) {
            context.beginPath();
            context.fillStyle = objectColors[this.bounceCount];
            context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
            context.fill()
            context.closePath()

            // context.textAlign = "center"
            // context.fillStyle = "#000000";
            // context.fillText(this.cell, this.x, this.y)
        }

        gameState.objects.push(obj)
    }

    gameState.frameTimes = []
}

canvas.addEventListener('click', onClick, false)

setup();
run();