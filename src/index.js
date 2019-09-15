const canvas = document.getElementById("cnvs");

const gameState = {};

function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY
}

function onClick(e) {
    if (gameState.isFail) {
        setup()
        run()
    }
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

    drawPlatform(context)
    drawBall(context)
    drawBonus(context)
    drawScores(context)
    drawFailScreen(context)
}

function update(tick) {
    if (gameState.isFail) 
        stopGame(gameState.stopCycle)
    
    const vx = (gameState.pointer.x - gameState.player.x) / 10
    gameState.player.x += vx

    const ball = gameState.ball
    ball.y += ball.vy
    ball.x += ball.vx

    const bonus = gameState.bonus;
    if (bonus.isVisible) {
       bonus.vy += 0.1
       bonus.y += bonus.vy
       bonus.x += bonus.vx

       // collision for bonus
        if (checkWallCollision(bonus)) bonus.vx = -bonus.vx 
        if (checkRoofCollision(bonus)) bonus.vy = -bonus.vy 
        if (checkBottomCollision(bonus)) bonus.isVisible = false
        if (checkPlayerCollision(bonus) && ball.vy > 0) {
            bonus.isVisible = false
            gameState.scores += 15
        }
    }

    // collision for ball
    if (checkWallCollision(ball)) ball.vx = -ball.vx 
    if (checkRoofCollision(ball)) ball.vy = -ball.vy 
    if (checkBottomCollision(ball)) gameState.isFail = true 
    if (checkPlayerCollision(ball) && ball.vy > 0) {
        ball.vy = - ball.vy
        ball.vx += getBounceSpeed(ball) 
    }

    // score increment
    if (gameState.lastTick - gameState.lastScoreInc >= 1000) {
        const ticks = Math.round((gameState.lastTick - gameState.lastScoreInc) / 1000);
        for (let i = 0; i < ticks; i++){
            gameState.scores++  
        } 
        gameState.lastScoreInc = gameState.lastTick;
    }

    // speedup
    if (gameState.lastTick - gameState.lastSpeedUp >= 30000) {
        ball.vx *= 1.1
        ball.vy *= 1.1
        gameState.lastSpeedUp = gameState.lastTick;
    }

    // bonus
    if (!gameState.bonus.isVisible 
        && gameState.lastTick - gameState.lastBonusSpawn >= 15000) {
        gameState.lastBonusSpawn = gameState.lastTick
        spawnBonus()
    }
}


// return true/false for collision with player platform
function checkPlayerCollision(obj) {
    const player = gameState.player
    return obj.x > player.x - player.width / 2
        && obj.x < player.x + player.width / 2
        && obj.y + obj.radius >= canvas.height - player.height;
}

// return true/false for collision with left or right wall (x) 
function checkWallCollision(obj) {
    return obj.x <= 0 + obj.radius || obj.x >= canvas.width - obj.radius
}

// return true/false for collision with roof (y)
function checkRoofCollision(obj) {
    return obj.y <= 0 + obj.radius;
}

// return true/false for collison with bottom (fail)
function checkBottomCollision(obj) {
    return obj.y + obj.radius >= canvas.height
}

// return ball (x) acceleration after bounce
function getBounceSpeed(ball) {
    return (ball.x - gameState.player.x) / 10;
}

function spawnBonus() {
    const bonus = gameState.bonus

    bonus.isVisible = true
    bonus.vy = 0
    bonus.vx = 4 - Math.random() * 8
    bonus.x = canvas.width / 5 + Math.random() * (canvas.width * 3/5)
    bonus.y = canvas.height / 5
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
    gameState.lastRender = tFrame;
}

function stopGame(handle) {
    window.cancelAnimationFrame(handle);
}

function drawPlatform(context) {
    const {x, y, width, height, color} = gameState.player;
    context.beginPath();
    context.rect(x - width / 2, y - height / 2, width, height);
    context.fillStyle = color;
    context.fill();
    context.closePath();
}

function drawBall(context) {
    const {x, y, radius, vx, vy, color} = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    context.closePath();

    //drawVector(context, x, x + vx * 5, y, y + vy *5)
}

function drawBonus(context) {
    if (!gameState.bonus.isVisible) return

    const {x, y, vx, vy, color} = gameState.bonus;

    context.fillStyle = color;
    context.font = "96px Calibri";
    context.textAlign = "center";
    context.fillText("+", x, y + 28)

    //drawVector(context, x, x + vx * 5, y, y + vy *5)
}

function drawVector(context, x1, x2, y1, y2) {
    context.beginPath();
    context.strokeStyle = "#FF0000";
    context.moveTo(x1, y1);
    context.lineTo(x2, y2)
    context.stroke();
    context.closePath();
}

function drawFailScreen(context) {
    if (gameState.isFail) {
        context.fillStyle = "#c30000";
        context.font = "48px Calibri";
        context.textAlign = "center";
        context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2)
       
        context.fillStyle = "#000000";
        context.font = "40px Calibri";        
        context.fillText("You scores: " + gameState.scores, canvas.width / 2, canvas.height / 2 + 56)
   
        context.fillStyle = "#999999";
        context.font = "24px Calibri";        
        context.fillText("Click to restart", canvas.width / 2, canvas.height / 2 + 56 + 44)        
    }
}

function drawScores(context) {
    if (!gameState.isFail) {
        context.fillStyle = "#000000";
        context.font = "28px Calibri";
        context.textAlign = "left";
        context.fillText("Scores: " + gameState.scores, 32, 32)
    }
}

function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('click', onClick, false)

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.lastScoreInc = gameState.lastTick;
    gameState.lastSpeedUp = gameState.lastTick;
    gameState.lastBonusSpawn = gameState.lastTick;
    gameState.tickLength = 15; //ms
    gameState.isFail = false;
    gameState.scores = 0;

    const platform = {
        width: 400,
        height: 50,
    };

    gameState.player = {
        color: '#000000',
        x: canvas.width / 2 - platform.width / 2,
        y: canvas.height - platform.height / 2,
        width: platform.width,
        height: platform.height
    };
    gameState.pointer = {
        x: canvas.width / 2,
        y: 0,
    };
    gameState.ball = {
        color: '#1de8b5',
        x: canvas.width / 2,
        y: 25,
        radius: 25,
        vx: 5 - Math.round(Math.random(1) * 10),
        vy: 10
    };
    gameState.bonus = {
        color: '#ffd600',
        isVisible: false,
        x: canvas.width / 2,
        y: 25,
        radius: 25,
        vx: 0,
        vy: 0
    };


}

setup();
run();