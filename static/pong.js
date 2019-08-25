class Ball {
    constructor(x, y, vx, vy){
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.speed = Math.sqrt(Math.pow(this.vx, 2) + Math.pow(this.vy, 2));
        this.radius = 10;
    }

    move(){
        this.x += this.vx;
        this.y += this.vy;
    }

    bounceTop(){
        this.vy = Math.abs(this.vy)
    }

    bounceBottom(){
        this.vy = -Math.abs(this.vy)
    }

    setDirection(angle){
        this.vx = this.speed * Math.cos(angle)
        this.vy = this.speed * Math.sin(angle)
    }

    containsPoint(x, y){
        return Math.sqrt(Math.pow(x-this.x, 2) + Math.pow(y-this.y, 2)) <= this.radius;
    }
}

class Paddle {
    constructor(x,y, width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxSpeed = 7;
    }

    move(direction, min, max){
        this.y += direction * this.maxSpeed
        if(this.y - this.height/2 < min){
            this.y = min + this.height/2;
        }
        else if(this.y + this.height/2 > max){
            this.y = max - this.height/2;
        }
    }

    doesCollide(ball, side){
        if (side=="left"){
            var x = this.x + this.width/2;
        }
        else{
            var x = this.x - this.width/2;
        }
        var yVals = [this.y-this.height/2, this.y, this.y+this.height/2];

        function isInBall(y1){
            return ball.containsPoint(x, y1);
        }
        return yVals.some(isInBall);
    }
}

class Game {
    constructor(){
        this.canvas = document.getElementById("pong");
        this.context = this.canvas.getContext("2d");

        this.running = false;
        this.leftDirection = 0;
        this.rightDirection = 0;
        this.leftScore = 0;
        this.rightScore = 0;

        this.ball = new Ball(this.canvas.width/2, this.canvas.height/2, 11, 3);
        this.leftPaddle = new Paddle(50, this.canvas.height/2, 5, this.canvas.height/15);
        this.rightPaddle = new Paddle(this.canvas.width-50, this.canvas.height/2, 5, this.canvas.height/15);

        this.lastUpdate = Date.now();
        this.period = 1000 / 30;

        this.controller = "player";
        this.computer = "basic-ai";

        this.playerMoves = [];
    }

    drawRect(x, y, width, height, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x-width/2, y-height/2, width, height);
    }

    drawPaddle(paddle){
        this.drawRect(paddle.x, paddle.y, paddle.width, paddle.height, "#000000");
    }

    drawCircle(x, y, radius, color){
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 2*Math.PI);
        this.context.closePath();
        this.context.fill();
    }

    writeScores(score1, score2){
        this.context.font = "20px Arial";
        this.context.fillStyle = "#000000";
        this.context.textAlign = "center";
        this.context.fillText(""+score1, this.canvas.width/4, this.canvas.height/5);
        this.context.fillText(""+score2, this.canvas.width*3/4, this.canvas.height/5);
    }

    drawBall(ball){
        this.drawCircle(ball.x, ball.y, ball.radius, "#FF0000");
    }

    score(paddle){
        if (paddle=="left"){
            this.leftScore +=1;
            this.sendData();
        }
        else{
            this.rightScore +=1;
        }
        console.log(this.playerMoves)
        this.playerMoves = [];
        this.reset(paddle);
    }

    sendData(){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/tfteach", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({"states": this.playerMoves}));
    }

    reset(paddle){
        this.ball.x = this.canvas.width/2;
        this.ball.y = this.canvas.height/2;
        var direction = 2*(Math.random()-0.5) * Math.PI/6;
        if(paddle=="left"){
            this.ball.setDirection(direction);
        }
        else{
            this.ball.setDirection(Math.PI - direction);
        }
        this.leftPaddle.y = this.canvas.height/2;
        this.rightPaddle.y = this.canvas.height/2;
        this.running = false
    }

    render(){
        this.drawRect(this.canvas.width/2, this.canvas.height/2, this.canvas.width, this.canvas.height, "#FFFFFF");
        this.drawPaddle(this.leftPaddle);
        this.drawPaddle(this.rightPaddle);
        this.drawBall(this.ball);
        this.writeScores(this.leftScore, this.rightScore)
    }

    update(){
        if(this.ball.vx < 0){
            this.playerMoves.push([this.getState(), this.leftDirection]);
        }
        this.ball.move();
        this.updateComputerMovement(this.getState());
        this.leftPaddle.move(this.leftDirection, 0, this.canvas.height);
        this.rightPaddle.move(this.rightDirection, 0, this.canvas.height);
        this.checkCollisions();
    }

    checkCollisions(){
        // point score conditions
        if(this.ball.x - this.ball.radius > this.canvas.width){
            this.score("left");
        }
        if(this.ball.x + this.ball.radius < 0){
            this.score("right");
        }

        // top/bottom collisions
        if(this.ball.y - this.ball.radius < 0){
            this.ball.bounceTop()
        }
        else if(this.ball.y + this.ball.radius > this.canvas.height){
            this.ball.bounceBottom()
        }

        // paddle collisions
        var maxAngle = Math.PI/3;
        if(this.leftPaddle.doesCollide(this.ball, "left")){
            var offset = (this.ball.y - this.leftPaddle.y)/(this.leftPaddle.height/2); //ranges from -(height/2 + radius) to height/2 + radius
            var angle = maxAngle * (2/(1+Math.pow(Math.E, -offset)) - 1); // ranges from -maxAngle to maxAngle
            this.ball.setDirection(angle);
            //this.ball.setVelocity(Math.abs(this.ball.vx), this.ball.vy);
        }
        if(this.rightPaddle.doesCollide(this.ball, "right")){
            var offset = (this.ball.y - this.rightPaddle.y)/(this.rightPaddle.height/2); //ranges from -(height/2 + radius) to height/2 + radius
            var angle = maxAngle * (2/(1+Math.pow(Math.E, -offset)) - 1); // ranges from -maxAngle to maxAngle
            this.ball.setDirection(Math.PI - angle);
            this.playerMoves = [];
            //this.ball.setVelocity(-Math.abs(this.ball.vx), this.ball.vy)
        }
    }

    loop(){
        if(this.running){
            var now = Date.now();
            var elapsed = now - this.lastUpdate;
            if(elapsed > this.period){
                this.gameStep();
                this.lastUpdate = now - (elapsed % this.period);
            }
            window.requestAnimationFrame(() => this.loop.call(this));
        }
    }

    gameStep(){
        this.update();
        this.render();
    }

    getState(){
        return [this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height, this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width,this.rightPaddle.height, this.canvas.width, this.canvas.height].map(Math.round);
    }

    updateComputerMovement(state){
        this.updateRightMovement(state);
        if(this.controller=="computer"){this.updateLeftMovement();}
    }

    updateRightMovement(state){
        var pong = this
        if (this.computer=="basic-ai"){
            var url = "/airequest?state="+state.join(",");
        }
        else{
            var url = "/tfrequest?state="+state.join(",");
        }
        fetch(url).then(function(response){
            response.text().then(function(text){
                console.log("algorithm returned: "+text);
                pong.rightDirection = parseFloat(text);
            })
        })
    }

    updateLeftMovement(){
        if (this.ball.y - this.ball.radius > this.leftPaddle.y + this.leftPaddle.height / 2){
            this.leftDirection = 1;
        }
        else if (this.ball.y - this.ball.radius < this.leftPaddle.y - this.leftPaddle.height / 2){
            this.leftDirection = -1;
        }
        else{
            this.leftDirection = 0
        }
    }

    keyPressed(key){
        if (this.running === false) {
            this.running = true;
            start();
        }
        if (key.keyCode == 80) { // p
            this.running = !this.running;
        }
        if (this.controller == "player"){
            if (key.keyCode === 38 || key.keyCode === 87) { // up or w
                this.leftDirection = -1;
            }
            if (key.keyCode === 40 || key.keyCode === 83) { //down or d
                this.leftDirection = 1;
            }
        }
    }

    keyReleased(key){
        if (this.controller == "player"){
            this.leftDirection = 0;
        }
    }
}

function start(){
    Pong.running = true
    Pong.lastUpdate = Date.now()
    Pong.loop.call(Pong);
}

function addListeners(game){
    document.addEventListener('keydown', (key) => game.keyPressed.call(game, key))
    document.addEventListener('keyup', (key) => game.keyReleased.call(game, key))
}

function updateController(){
    var dropdown = document.getElementById("controller");
    Pong.controller = (dropdown.options[dropdown.selectedIndex].value);
}

function updateComputer(){
    var dropdown = document.getElementById("computer");
    Pong.computer = (dropdown.options[dropdown.selectedIndex].value);
}


var Pong = new Game();
addListeners(Pong)
Pong.render();