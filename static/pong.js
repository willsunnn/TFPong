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
        return Math.sqrt(Math.pow(x-this.x, 2) + Math.pow(y-this.y, 2)) < this.radius;
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

        // if paddle end points are in ball
        if(ball.containsPoint(x, this.y+this.height/2)){
            return true;
        }
        if(ball.containsPoint(x, this.y-this.height/2)){
            return true;
        }

        // if ball center's y in line, and ball center x is past paddle x
        if(ball.y < this.y - this.height/2 || ball.y > this.y + this.height/2){
            return false;
        }
        if(side=="left"){
            return ball.x-ball.radius <= this.x - this.width/2 && ball.x >= this.x;
        }
        else{
            return ball.x+ball.radius >= this.x + this.width/2 && ball.x <= this.x;
        }
    }
}

class Game {
    constructor(){
        this.canvas = document.getElementById("pong");
        this.context = this.canvas.getContext("2d");

        this.running = false;
        this.playerDirection = 0;
        this.computerDirection = 0;
        this.playerScore = 0;
        this.computerScore = 0;

        this.ball = new Ball(this.canvas.width/2, this.canvas.height/2, 11, 3);
        this.leftPaddle = new Paddle(50, this.canvas.height/2, 5, this.canvas.height/15);
        this.rightPaddle = new Paddle(this.canvas.width-50, this.canvas.height/2, 5, this.canvas.height/15);

        this.lastUpdate = Date.now();
        this.period = 1000 / 30;
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
        this.reset(paddle)
        if (paddle=="player"){
            this.playerScore +=1
        }
        else{
            this.computerScore +=1
        }
    }

    reset(paddle){
        this.ball.x = this.canvas.width/2;
        this.ball.y = this.canvas.height/2;
        var direction = 2*(Math.random()-0.5) * Math.PI/6;
        if(paddle=="player"){
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
        this.writeScores(this.playerScore, this.computerScore)
    }

    update(){
        this.ball.move();
        this.updateComputerMovement(this.getState());
        this.leftPaddle.move(this.playerDirection, 0, this.canvas.height);
        this.rightPaddle.move(this.computerDirection, 0, this.canvas.height);
        this.checkCollisions();
    }

    checkCollisions(){
        // point score conditions
        if(this.ball.x - this.ball.radius > this.canvas.width){
            this.score("player");
        }
        if(this.ball.x + this.ball.radius < 0){
            this.score("computer");
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
        return [this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.leftPaddle.y, this.rightPaddle.x - this.rightPaddle.width/2, this.rightPaddle.y, this.rightPaddle.height, this.canvas.width, this.canvas.height].map(Math.round);
    }

    updateComputerMovement(state){
        var pong = this
        var url = "http://127.0.0.1:5000/tfrequest?state="+state.join(",");
        fetch(url).then(function(response){
            response.text().then(function(text){
                pong.computerDirection = parseFloat(text)
            })
        })
    }

    keyPressed(key){
        if (this.running === false) {
            this.running = true;
            start();
        }

        if (key.keyCode === 38 || key.keyCode === 87) { // up or w
            this.playerDirection = -1;
        }
        if (key.keyCode === 40 || key.keyCode === 83) { //down or d
            this.playerDirection = 1;
        }
        if (key.keyCode == 80) { // p
            this.running = !this.running;
        }
    }

    keyReleased(key){
        this.playerDirection = 0;
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


var Pong = new Game();
addListeners(Pong)
Pong.render();