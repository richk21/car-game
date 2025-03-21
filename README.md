# Car Game

This is a car game where the player controls a car navigating a road divided into three lanes: left, middle, and right. The goal is to avoid hurdles by jumping and switching lanes. The game tracks the player's score based on successful jumps and the number of hits from obstacles.

## Features

- **Car Movement**: The car can navigate across three lanes and jump to avoid hurdles.
- **Collision Detection**: A collision detection mechanism is implemented to detect when the car hits a hurdle. (Currently under progress)
- **Score Tracking**: The player's score is displayed based on the number of successful jumps.
- **End Condition**: The game ends when the car is hit 3 times.

## Key Controls

- **SPACE**: Jump (avoid hurdles)
- **RIGHT Arrow**: Move to the next right lane
- **LEFT Arrow**: Move to the next left lane
- **UP Arrow**: Accelerate the car

## Backend APIs

The game utilizes three backend APIs to handle player data and high scores:

1. **POST `/Players`**  
   - This API is triggered when the game starts on a new system. It prompts the user to enter their name.
   - The API checks for duplicate names in the database. If the name is unique, it is stored. If the name already exists, the user is prompted to enter a new name.

2. **GET `/high-score/${name}`**  
   - This API fetches the high score for a specific player, identified by their name.

3. **POST `/submit-score`**  
   - This API is called when the game ends. It submits the player's score and checks if it exceeds the player's current high score.
   - If the new score is higher, the player's high score is updated in the database.

## Game Flow

1. The player starts the game by entering their name.
2. The car moves across the three lanes, jumping over hurdles to avoid collisions.
3. The player's score increases with successful jumps and decreases with collisions.
4. The game ends after the car is hit 3 times.
5. The final score is submitted, and the player's high score is updated if necessary.

## Installation and Setup

To run this game locally, ensure you have the following dependencies installed:

1. Clone the repository:
   git clone https://github.com/richk21/car-game/tree/backendAdded
2. For frontend: 
    just opne the game.html page
3. for backend: 
    navigate to GameBackend folder
    do "dotnet run"

## Link for the Game
    https://richk21.github.io/car-game/frontend/game
   
