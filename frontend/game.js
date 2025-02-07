/* This is a car game, which has a road divided into three lanes(left, middle and right)
The car can navigate to any of the three lanes and can jump over the hurdles to save itself from hits
Hits and score(based on car's jumps) are displayed on the screen.
Actors: hurdles and car
Keys: 
    SPACE: jump, 
    RIGHT: To jump to next right lane, 
    LEFT: To jump to next left lane, 
    UP: to accelerate the car
There is a collision detection mechanism as well, when the car hits the hurdles(still under progress).
END CONDITION: when car gets hit 10 times.

BACKEND: This game is using 3 APIs.
    1. '/Players' is a POST API. When the game initially starts on a new system, it would prompt the user to enter
    their name. When that is entered, this API would check for a duplicate name. If duplicate exists, the user
    would be prompted to enter a new name. If the name is unique, it would be stored in the database.
    2. '/high-score/${name}' is a GET API. This API simply fetches the highsScore value against a player's name in
    the database.
    3. '/submit-score' is a POST API. This API is called when the game ends. It submits the score of the player and
    then checks if the score is greater than the highScore of the player. If it is, the highScore is updated in the
    database.
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Images
const carImage = new Image();
carImage.src = 'car.png';
const hurdleImage = new Image();
hurdleImage.src = 'hurdle.png';
const boomImage = new Image();
boomImage.src = 'boom.png';

// Game Variables
const roadWidth = 1000;   // Road width at the bottom (3 lanes, 200px each)
const laneWidth = roadWidth / 3;
let carWidth = 280;
let carHeight = 280;
let carX = (canvas.width - carWidth) / 2; //car is initially in the middle lane
let carY = canvas.height - carHeight + 40; // car is near the bottom of the screen
let lane = 1; // 0 = left, 1 = middle, 2 = right
let dashedLineOffset = 0;
let playerName = localStorage.getItem("playerName");

// Road variables
const roadTopWidth = 200; // The width of the road at the top
const roadBottomWidth = roadWidth; // Road width at the bottom

// Hurdle variables
let hasGameStarted = false;
let hurdleWidth = 30;
let hurdleHeight = 30;
let hurdles = []; // array of hurdles

// Collision variables
let boomVisible = false;
let boomTimeout = 0;

// Collision avoidance variables
let jump = false;
let jumpHeight = 120; // Maximum height the car can jump
let jumpSpeed = 5; // Speed of the jump (how fast the car rises)
let gravity = 10; // Speed by which car falls down

//score and hits
let score = 0;
let hitCount = 0;
const maxHits = 3; // Game over after 3 hits


let keys = {
    left: false,
    right: false,
    up: false,
    space: false
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
        keys.left = true;
    } else if (e.code === 'ArrowRight') {
        keys.right = true;
    } else if (e.code === 'ArrowUp') {
        keys.up = true;
    } else if (e.code === 'Space') {
        keys.space = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') {
        keys.left = false;
    } else if (e.code === 'ArrowRight') {
        keys.right = false;
    } else if (e.code === 'ArrowUp') {
        keys.up = false;
    } else if (e.code === 'Space') {
        keys.space = false;
    }
});

let collisionProcessed = false; //for counting collisions

function checkCollision() {
    // Car's boundaries
    const carLeft = carX;
    const carRight = carX + carWidth;
    const carTop = carY;
    const carBottom = carY + carHeight;

    // Loop through all hurdles
    for (let i = 0; i < hurdles.length; i++) {
        const hurdle = hurdles[i];

        // Hurdle's boundaries
        const hurdleLeft = hurdle.x;
        const hurdleRight = hurdle.x + hurdle.width;
        const hurdleTop = hurdle.y;
        const hurdleBottom = hurdle.y + hurdle.height;

        // Check if car overlaps with the hurdle (left, right, top, bottom)
        if (jump) {
            const verticalDistance = Math.abs(carBottom - hurdleTop);
            if (verticalDistance > 20) {
                continue;  // Ignore collision if the car is jumping and the vertical distance is greater than 20px
            }
        }

        // Check for a collision only if it's not already processed in this frame
        if (!collisionProcessed && carRight > hurdleLeft + 100 && carLeft < hurdleRight - 100 && carTop < hurdleBottom - 180 && carBottom > hurdleTop + 100) {

            if (hitCount == maxHits) {
                drawEndGameScreen();
                endGame();
            }

            boomVisible = true;
            boomTimeout = 60;
            hurdle.hasCollided = true;
            collisionProcessed = true;
            break;
        
        }
    }

    return collisionProcessed;
}

function handleCollision() {
    if (checkCollision()) {
        boomVisible = true;
        boomTimeout = 100;
    }
}
// Function to show the boom effect
function showBoomEffect() {
    if (boomVisible) {
        // Loop through all hurdles
        for (let i = 0; i < hurdles.length; i++) {
            const hurdle = hurdles[i];
            const carCenter = carX + carWidth / 2;
            const hurdleCenter = hurdle.x + hurdle.width / 2;
            let collisionDirection = 0;

            // Determine the direction of the collision for each hurdle
            if (-10 < (carCenter - hurdleCenter) && (carCenter - hurdleCenter) < 10) {
                collisionDirection = 60; //hit at the middle of car
            } else if ((carCenter - hurdleCenter) > 20) {
                collisionDirection = 0; //hit at the left of car
            } else {
                collisionDirection = 120; //hit at right of car
            }

            // Show image when collision happens
            ctx.drawImage(boomImage, carX + collisionDirection, carY - 2, 150, 150);
        }
    }
}

// Reduce the boom timeout and hide it after a certain duration
function updateBoomEffect() {
    if (boomTimeout > 0) {
        if(boomTimeout === 99){
            ++hitCount;
        }
        boomTimeout--;
        if (boomTimeout <= 0) {
            boomVisible = false;
        }
    }
}

const hurdleVerticalGap = 150;
let lastHurdleY = 0; 

// Function to create a new hurdle
function createHurdle() {
    let newHurdle;

    const laneIndex = Math.floor(Math.random() * 3); // random lane
    let newYPosition;

    if (hurdles.length === 0) {
        newYPosition = -200;
    } else {
        newYPosition = lastHurdleY - hurdleVerticalGap;
    }

    newHurdle = {
        x: (canvas.width - roadWidth) / 2 + laneIndex * laneWidth + laneWidth / 2 - hurdleWidth / 2,
        y: newYPosition,
        width: hurdleWidth,
        height: hurdleHeight,
        image: hurdleImage,
        lane: laneIndex,
        hasInitialCheckPassed: false,
        hasCollided: false,
    };

    hurdles.push(newHurdle);

    lastHurdleY = newHurdle.y;
}

// for drawing and drawing new hurdles
function moveAndDrawHurdles() {
    // Loop through all hurdles
    for (let i = 0; i < hurdles.length; i++) {
        let hurdle = hurdles[i];

        hurdle.y += 1.5;

        // Reset the hurdle if it goes off-screen
        if (hurdle.y > canvas.height || hurdle.y < -150) {

            hurdle.y = -150;
            let laneIndex = Math.floor(Math.random() * 3);
            if (laneIndex === 0) {
                hurdle.x = (canvas.width + roadTopWidth) / 2 - 250;
            } else if (laneIndex === 1) {
                hurdle.x = (canvas.width + roadTopWidth) / 2 - 180;
            } else {
                hurdle.x = (canvas.width + roadTopWidth) / 2 - 90;
            }

            hurdle.hasInitialCheckPassed = false;
        }

        // Only perform this check once when the hurdle enters the canvas
        if (!hurdle.hasInitialCheckPassed) {
            if (hurdle.x < canvas.width / 2) {
                hurdle.hasInitialCheckPassed = true;  // Hurdle is to the left of center
            } else if (hurdle.x > canvas.width / 2) {
                hurdle.hasInitialCheckPassed = true;  // Hurdle is to the right of center
            }
        }

        // Once the check has passed, move the hurdle steadily
        if (hurdle.hasInitialCheckPassed) {
            if (hurdle.x < (canvas.width + roadTopWidth) / 2 - 180) {
                hurdle.x -= 1.2;  // Adjust position towards center
            } else if (hurdle.x > (canvas.width + roadTopWidth) / 2 - 180) {
                hurdle.x += 0.8;  // Adjust position towards center
            }
        }

        if (!hurdle.hasCollided) {
            // Move the hurdle up or down depending on key press
            if (keys.up) {
                hurdle.y += 1.5;  // Move hurdle down
            } else {
                hurdle.y -= 3;  // Move hurdle up
                if (hurdle.x < (canvas.width + roadTopWidth) / 2 - 180) {
                    hurdle.x += 2;
                } else if (hurdle.x > (canvas.width + roadTopWidth) / 2 - 180) {
                    hurdle.x -= 1.3;
                }
            }

            // Adjust size based on position
            hurdle.scale = (canvas.height + hurdle.y) / canvas.height + 0.3;
            hurdle.width = 130 * hurdle.scale;
            hurdle.height = 130 * hurdle.scale;
        } else {
            if (!keys.up) {
                hurdle.y -= 1;
                hurdle.hasCollided = false;
            } else {
                hurdle.y -= 1.5;
                hurdle.x = hurdle.x;
                hurdle.hasCollided = true;
            }

            // Reset collision if the lane changes
            if (hurdle.lane !== Math.floor((hurdle.x - (canvas.width - roadWidth) / 2) / laneWidth)) {
                hurdle.hasCollided = false;
                if (keys.up) {
                    hurdle.y += 1;  // Move down immediately after changing lanes
                }
            }
        }

        // Draw the hurdle
        ctx.drawImage(hurdle.image, hurdle.x, hurdle.y, hurdle.width, hurdle.height);
    }
}

// Function to draw the green area around the road
function drawBackground() {
    ctx.fillStyle = "#E0D092";  
    ctx.fillRect(0, 0, canvas.width, canvas.height);  
}

// Handle the jump and forward movement
let lastLaneChange = -1;
function moveCar() {
    if (keys.left && lane > 0 && lastLaneChange !== 0) {
        lane--;
        lastLaneChange = 0;
    } else if (keys.right && lane < 2 && lastLaneChange !== 1) {
        lane++;
        lastLaneChange = 1;
    }

    if (lane === 0) {
        carX = (canvas.width - roadWidth) / 2 + 50;
    } else if (lane === 1) {
        carX = (canvas.width - carWidth) / 2;
    } else if (lane === 2) {
        carX = (canvas.width + roadWidth) / 2 - carWidth - 50;
    }

    if (!keys.left && !keys.right) {
        lastLaneChange = -1;  // Allow for the next change once the key is pressed again
    }

    if (keys.up) {
        move();
        hasGameStarted = true;
    }

    if (keys.space && !jump) {
        jump = true;
        jumpSpeed = 10;
    }
}

function move(){
    // Resize the car and move it bit forward
    const maxDisplacement = canvas.height - 150;
    if(carY > maxDisplacement){
        carY -= 5;
    }
    const step = 5;
    const minSize = 250;
    if(carHeight > minSize){
        carHeight -= step;
        carY += step/2;
    }
    if(carWidth > minSize){
        carWidth -= step;
        carX += step / 2;
    }

    // Move dashed line down
    dashedLineOffset += 5;
    if(dashedLineOffset >= canvas.height){
        dashedLineOffset = 0;
    }
}

let jumpSuccess = false;
// Function to handle car jump
function updateJump() {
    if (jump) {
        carY -= jumpSpeed;

        if (carY <= canvas.height - carHeight - jumpHeight) {
            jump = false;
            jumpSpeed = 0;
        }
    } else if (carY < canvas.height - carHeight + 40) {
        carY += gravity;
    }

    // Loop through each hurdle in the hurdles array
    for (let i = 0; i < hurdles.length; i++) {
        let hurdle = hurdles[i];

        // Move hurdle down when car is close to it and jumping
        if (jump && Math.abs(carY - hurdle.y) < 200 && hurdle.y > canvas.height - carHeight - 100) {
            // Check if the hurdle is in the same lane as the car
            if (Math.abs(carX - hurdle.x) < laneWidth / 2) {
                hurdle.y += 40;

                // Prevent the hurdle from moving off the canvas
                if (hurdle.x < canvas.width / 2) {
                    hurdle.x -= 30;
                } else if (hurdle.x > canvas.width / 2) {
                    hurdle.x += 20;
                }

                // Check if this hurdle hasn't been passed yet
                if (!jumpSuccess) {
                    score += 50; // Increment score only once when the car jumps over a hurdle successfully
                    jumpSuccess = true; // Set the flag to true to prevent further score increments for the current jump
                }
            }
        }
    }

    if (!jump) {
        jumpSuccess = false;
    }
}


function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "bold 30px 'Press Start 2P', cursive";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";

    // Display the score and hit count at the top-right corner
    ctx.fillText("Score: " + score, canvas.width - 20, 20);
    ctx.fillText("Hits: " + hitCount, canvas.width - 20, 60);
}

async function checkPlayerNameAlreadyExists(playerName) {
    const response = await fetch('http://localhost:5170/players', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName: playerName }),
    });

    const data = await response.json();
    
    if (data.message === "New player registered successfully") {
        localStorage.setItem('playerName', playerName);
        return true;
    } else if (data.message === "Player name already exists") {
        alert(data.message);
        return false;
    } else {
        console.error("Error registering player:", data.message);
        alert(data.message);
        return false;
    }
}

async function drawPlayerName() {
    if (!playerName) {
        playerName = prompt("Player Name:");
        
        const registrationSuccess = await checkPlayerNameAlreadyExists(playerName);
        
        if (registrationSuccess) {
            ctx.fillStyle = "black";
            ctx.font = "bold 30px 'Press Start 2P', cursive";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("Player: " + playerName, 20, 20);
        } else {
            playerName = '';  // Clear playerName on error or name already exists
        }
    } else {
        // If playerName is already set, draw it on the screen
        ctx.fillStyle = "black";
        ctx.font = "bold 30px 'Press Start 2P', cursive";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("Player: " + playerName, 20, 20);
    }
}

async function getScore(name){
    const response = await fetch(`http://localhost:5170/high-score/${name}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if(response.ok){
        const data = await response.json();
        return data.highScore;
    }else{
        console.error("error occurred: ", await response.json())
        return null;
    }
}

let highScore = null;
async function drawHighScore(){
    if(!highScore){
        highScore = await getScore(playerName);
    }
    ctx.fillStyle = "black";
    ctx.font = "bold 30px 'Press Start 2P', cursive";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`High Score:${highScore}`, 20, 60);
}
    
async function logScore(score){
    const response = await fetch('http://localhost:5170/submit-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName: playerName, score: score }),
    });

    const data = await response.json();

    if (data.message === "Score submitted") {
        console.log("Score submitted.");
    } else {
        console.error(data.message);
    }
}
function drawEndGameScreen() {
    // Draw a black circle as the background
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 200, 0, 2 * Math.PI);  // Circle in the center
    ctx.fill();

    // Draw the Game Over text
    ctx.fillStyle = "white";
    ctx.font = "bold 40px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);

    // Draw the Score text
    ctx.font = "bold 30px 'Press Start 2P', cursive";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
    logScore(score);
}

// Function to draw the road with perspective
function drawRoad() {
    ctx.fillStyle = "#504E4E";  
    ctx.beginPath();
    ctx.moveTo((canvas.width - roadBottomWidth) / 2, canvas.height); 
    ctx.lineTo((canvas.width + roadBottomWidth) / 2, canvas.height);
    ctx.lineTo((canvas.width + roadTopWidth) / 2, 0);
    ctx.lineTo((canvas.width - roadTopWidth) / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#D3D3D3";  
    ctx.setLineDash([]);
    ctx.lineWidth = 10;

    ctx.beginPath();
    ctx.setLineDash([30, 15]);
    ctx.lineWidth = 10;
    ctx.moveTo(canvas.width / 2, canvas.height + dashedLineOffset);
    ctx.lineTo(canvas.width / 2, dashedLineOffset - canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 4 + 50, canvas.height);
    ctx.lineTo((canvas.width / 2) - 27, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((canvas.width + roadWidth) / 1.8 - laneWidth - 45, canvas.height);
    ctx.lineTo(((canvas.width + roadTopWidth) / 1.5) + 60 - laneWidth, 0);
    ctx.stroke();
}

function drawCar() {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(carX + carWidth / 2, carY + carHeight - 80, carWidth / 2.8, carHeight / 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.drawImage(carImage, carX, carY, carWidth, carHeight);
}

// Function to update the game
function update() {
    collisionProcessed = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawRoad();
    
    drawScore(); 
    
    moveCar();  
    updateJump();
    
    if (hasGameStarted) {
        moveAndDrawHurdles();
    }
    
    handleCollision();
    
    showBoomEffect();
    updateBoomEffect();
    
    drawCar();
    
    requestAnimationFrame(update);
    drawPlayerName();
    drawHighScore();
}

carImage.onload = function() {
    for (let i = 0; i < 3; i++) { 
        createHurdle();
    }
    update();
};
