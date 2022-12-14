/**
 * To-Do:
 * - Center the blocks generated by the Canvas.generateBlocks(). (They look centered, don't let them deceive you ¬¬)
 * - Work on the end game info screen
 */

class Player {
    /**
     * @param {Braket} braket The braket of the player
     */
    constructor(braket) {
        this.braket = braket;
        this.points = 0;
    }
}

class Rectangle {
    /**
     * @param {Int} x The x coordinate of the rectangle
     * @param {Int} y The y coordinate of the rectangle
     * @param {Int} w The width of the rectangle
     * @param {Int} h The height of the rectangle
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    /**
     * Checks if a given rectangle is colliding with the object rectangle
     * and returns the colliding side, represented by a number:
     *  - 0: no collisions
     *  - 1: top
     *  - 2: left
     *  - 3: bottom
     *  - 4: right
     * 
     * @param {Rectangle} r The rectangle to check
     * @return {String} The colliding side
     */
    collide(r) {
        /**
         * Thanks to https://stackoverflow.com/users/411591/marke for the code <3
         * Steps:
         *  1. Check if the rectangle center is close enough to be colliding
         *  2. If so, check the intersection depth to determine which side was most involved in the collision
         */
        let dx = (this.x+this.w/2)-(r.x+r.w/2);
        let dy = (this.y+this.h/2)-(r.y+r.h/2);
        let width = (this.w+r.w)/2;
        let height = (this.h+r.h)/2;
        let crossWidth = width*dy;
        let crossHeight = height*dx;
        let side = 0;

        if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
            if (crossWidth > crossHeight) {
                if (crossWidth > -crossHeight) {
                    side = 3
                } else {
                    side = 2;
                }
            } else {
                if (crossWidth > -crossHeight) {
                    side = 4;
                } else {
                    side = 1;
                }
            }
        }
        return side;
    }
}

class Canvas {
    /**
     * @param {HTMLElement} canvas The HTML element of the canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        this.generateBlocks(6, 3);
    }

    /**
     * Refreshes the canvas
     */
    refresh() {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        
    }

    /**
     * Refreshes the score at the top of the canvas
     */
    refreshScore() {
        this.ctx.font = "25px Arial";
        let offset = 0;
        for (let i = 0; i < players.length; i++) {
            let points = players[i].points;
            this.ctx.fillStyle = players[i].braket.color;
            this.ctx.textAlign = "center";
            this.ctx.fillText(points, this.width()/2, 50+offset, this.width());
            offset += 10;

        }
    }

    /**
     * @returns {Int} The width of the canvas
     */
    width() {
        return this.canvas.width;
    }

    /**
     * @returns {Int} The height of the canvas
     */
    height() {
        return this.canvas.height;
    }

    /**
     * Generates a grid of blocks on the canvas
     * @param {Int} wide The number of blocks horizontally
     * @param {Int} tall The number of blocks vertically
     */
    generateBlocks(wide, tall) {
        let width = 100;
        let height = 40;
        let margin = 10;
        for (let i = 1; i <= tall; i++) {
            for (let j = 1; j <= wide; j++) {
                blocks.push(new Block(this.ctx,
                                new Rectangle(margin*j+width*j, margin*i+height*i, width, height),
                                "red"));
            }
        }
    }

    /**
     * Ends the game and displays player/s info
     */
    endGame() {
        let info = "Has perdido :(\nPuntuacion/es:\n";
        for (let i = 0; i < players.length; i++) {
            info += "   Jugador" + (i+1) + ": " + players[i].points + " ";
        }

        balls = [];

        alert(info);
        
    }
}

class Ball {
    /**
     * @param {CanvasRenderingContext2D} ctx The context of the canvas
     * @param {Rectangle} rect The rectangle of the ball
     * @param {Int[]} vel The velocity of the ball
     * @param {String} color The color of the ball
     */
    constructor(ctx, rect, vel, color) {
        this.ctx = ctx;
        this.rect = rect;
        this.vel = vel;
        this.color = color;
        
        this.velI = this.vel.map(x => x);
        this.lastPlayerColl = null;
    }

    /**
     * Draws the ball on the canvas
     */
    draw() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    }

    /**
     * Moves the ball
     */
    move() {
        this.rect.x += this.vel[0];
        this.rect.y += this.vel[1];
    }

    /**
     * Checks the different collisions of the ball
     */
    checkColls() {
        this.checkWallColls();
        this.checkBraketColls();
        this.checkBlockColls();
        this.checkBallsColls();
    }

    /**
     * Checks if the ball is within the canvas bounds
     */
    checkWallColls() {
        /**
         * Annotation:
         *  - x & y are the ball coordinates
         *  - xp & yp are the ball coordinates + width or height
         */
        let x = this.rect.x;
        let xp = x+this.rect.w;
        let y = this.rect.y;
        let yp = y+this.rect.h;

        if (x < 0) {
            this.rect.x = 0;
            this.vel[0] *= -1;
        } else if(xp > this.ctx.canvas.clientWidth) {
            this.vel[0] *= -1;
            this.rect.x = this.ctx.canvas.clientWidth-this.rect.w;
        }
        
        if (y < 0) {
            this.vel[1] *= -1;
            this.rect.y = 0;
        } else if (yp > this.ctx.canvas.clientWidth) {
            this.vel[1] *= -1;
//            canvas.endGame();
        }
        
    }

    /**
     * Checks if the ball is colliding with the braket
     * and slightly modifies the horizontal velocity based
     * on the location of impact
     */
    checkBraketColls() {
        let collided = false;
        for (let i = 0; i < players.length && !collided; i++) {
            let player = players[i];
            let side = this.rect.collide(player.braket.rect);
            if (side != 0) {
                this.lastPlayerColl = player;
                let impact = this.calculateImpact(player.braket);
                if (side == 1 || side == 3) {
                    this.vel[0] = this.velI[0]*impact;
                    this.vel[1] *= -1;
                } else if (side == 2 || side == 4) {
                    this.vel[0] *= -1;
                    this.vel[0] *= -1;
                }
                collided = true;
            }
        }
    }
    
    /**
     * Calculates the impact of the collision from the player braket.
     * Maximum impact when hitting the sides and minimum on the center.
     * Range from [-1, 1]
     * @param {Braket} The braket of the player
     * @return {Float} The impact of the collision
     */
    calculateImpact(braket) {
        let dx = (this.rect.x+this.rect.w/2)-(braket.rect.x+braket.rect.w/2);
        let width = (this.rect.w+braket.rect.w)/2;
        let impact = dx/width;
        let min = 0.5;
        if (impact > -min && impact < 0) impact = -min;
        else if (impact < min && impact > 0) impact = min;
        return impact;
    }

    /**
     * Checks if the ball is colliding with a block, if so the block gets deleted
     * and a point is added
     */
    checkBlockColls() {
        let collided = false;
        for (let i = 0; i < blocks.length && !collided; i++) {
            let block = blocks[i];
            let side = this.rect.collide(block.rect);
            if (side != 0) {
                this.addPoint();
                let index = blocks.findIndex(b => b == block);
                blocks.splice(index, 1);
                if (side == 1 || side == 3) {
                    this.vel[1] *= -1;
                } else if (side == 2 || side == 4) {
                    this.vel[0] *= -1;
                }
                collided = true;
            }
        }
    }

    /**
     * Adds a point to the last player who touched the ball.
     * If no player is found, a point is added to all players
     */
    addPoint() {
        if (this.lastPlayerColl == null) {
            players.forEach(player => player.points += 1);
        } else {
            this.lastPlayerColl.points += 1;
        }
        this.changeVel(1.02);
    }

    /**
     * Changes the velocity of the ball by a multiplier
     * @param {Float} multiplier The amount the velocity will be multiplied by
     */
    changeVel(multiplier) {
        this.vel[0] *= multiplier;
        this.vel[1] *= multiplier;
        this.velI[0] *= multiplier;
        this.velI[1] *= multiplier;
    }

    /**
     * Checks if the ball is colliding with another ball
     */
    checkBallsColls() {
        let collided = true;
        for (let i = 0; i < balls.length && !collided; i++) {
            let ball = balls[i];
            if (this != ball) {
                let side = this.rect.collide(ball.rect);
                if (side != 0) {
                    switch (side) {
                        case 1:
                        case 3:
                            this.vel[1] *= -1;
                            break;
                        case 2:
                        case 4:
                            this.vel[0] *= -1;
                            break;
                        default:
                        break;
                    }
                }
                collided = true;
            }
        }
    }

}

class Braket {
    /**
     * @param {CanvasRenderingContext2D} ctx The context of the canvas
     * @param {Rectangle} rect The rectnagle of the braket
     * @param {Int[]} vel The velocity of the braket
     * @param {String} color The color of the braket
     */
    constructor(ctx, rect, vel, color) {
        this.ctx = ctx;
        this.rect = rect;
        this.vel = vel;
        this.color = color;

        addEventListener("keydown", (e) => this.move(e));
    }

    /**
     * Draws the braket on the canvas
     */
    draw() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    }

    /**
     * Moves the braket
     * 
     * @param {Event} e The key event
     */
    move(e) {
        switch (e.keyCode) {
            case 37:
                if (!this.isOutOfBounds([-1, 0])) {
                    this.rect.x -= this.vel[0];
                }
                break;
            case 39:
                if (!this.isOutOfBounds([1, 0])) {
                    this.rect.x += this.vel[0];
                }
                break;
            default:
                break;
        }
    }

    /**
     * Checks if the braket is outside the canvas reproducing the next movement.
     * @param {Int[]} dir The direction of the movement ([1, 1] = bottom+right)
     * @returns {Boolean} True if the braket is outside the canvas, false otherwise
     */
    isOutOfBounds(dir) {
        let isOutOfBounds = false;
        let nextPosX = this.rect.x+dir[0]*this.vel[0];
        let nextPosY = this.rect.y+dir[1]*this.vel[1];
        if (nextPosX < 0) {
            this.rect.x = 0;
            isOutOfBounds = true;
        } else if(nextPosX+this.rect.w > this.ctx.canvas.clientWidth) {
            this.rect.x = this.ctx.canvas.clientWidth-this.rect.w;
            isOutOfBounds = true;
        }
        if (nextPosY < 0) {
            this.rect.y = 0;
            isOutOfBounds = true;
        } else if(nextPosY+this.rect.w > this.ctx.canvas.clientWidth) {
            this.rect.x = this.ctx.canvas.clientWidth-this.rect.w;
            isOutOfBounds = true;
        }
        return isOutOfBounds;
    }
}

class Block {
    /**
     * @param {CanvasRenderingContext2D} ctx The context of the canvas
     * @param {Rectangle} rect The rectnagle of the block
     * @param {String} color The color of the block
     */
    constructor(ctx, rect, color) {
        this.ctx = ctx;
        this.rect = rect;
        this.color = color;
    }

    /**
     * Draws the block on the canvas
     */
    draw() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    }
}

let blocks = [];

const canvas = new Canvas(document.getElementById("canvas"));

let players = [
            new Player(
                new Braket(canvas.ctx,
                    new Rectangle(canvas.width()/2-100, canvas.height()-100, 200, 30),
                [25, 0],
                "#800869"))
];

let balls = [
    new Ball(canvas.ctx,
            new Rectangle(canvas.width()/2-25, canvas.height()/2, 50, 50),
            [2, -2], //(Math.random() < 0.5 ? -1 : 1)*
            "#069420"),
];



console.log(blocks);


function cycle() {
    canvas.refresh();
    
    blocks.forEach(block => {
        block.draw();
    });
    
    players.forEach(player => {
        player.braket.draw();
    });
    
    balls.forEach(ball => {
        ball.move();
        ball.checkColls();
        ball.draw();
    });

    canvas.refreshScore();
    
}

setInterval(cycle, 10);