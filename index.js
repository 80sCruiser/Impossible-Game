/* Author: Sachin Jain
 * Name: The Impossible Game
 * Date: 9/27/2017
 */

var game = {}

function createGame() {
	game.canvas = document.querySelector("canvas")
	game.c = game.canvas.getContext("2d")
	
	game.score = 0
	if (localStorage.getItem('highScore')) {
		game.highScore = localStorage.getItem('highScore')
	}
	else {
		game.highScore = 0
	}
	game.numObstacles = 0
	
	game.scoreBox = document.getElementById("scoreBox")
	game.resetBox = document.getElementById("resetBox")

	game.period = 25 // Redraw game every 33 milliseconds
	game.speedUpPeriod = 10000 // Game speeds up every 10 seconds
	game.dx = 5 // Distance obstacle moves in between frames
	
	// Game background
	game.mid = game.canvas.height / 2
	game.grad = game.c.createLinearGradient(0, game.mid, 0, game.canvas.height)
	game.grad.addColorStop(0, "#24DDF4")
	game.grad.addColorStop(1, "black")
	game.floorHeight = 3
	
	game.obstacles = []
	
	// Defines an obstacle in the game that destroys the square.
	function Obstacle() {
		this.height = 35
		this.length = 30
		this.x = game.canvas.width
		this.y = game.mid
		this.color = "#336666"
		this.borderThickness = 3
		this.borderColor = "white"
		
		// Draws the obstacle on the canvas.
		this.draw = function() {
			game.c.fillStyle = this.borderColor
			game.c.beginPath()
			game.c.moveTo(this.x - this.borderThickness * 2, this.y)
			game.c.lineTo(this.x + this.length, this.y - this.height - this.borderThickness * 2)
			game.c.lineTo(this.x + 2 * this.length + this.borderThickness * 2, this.y)
			game.c.fill()
			
			game.c.fillStyle = this.color
			game.c.beginPath()
			game.c.moveTo(this.x, this.y - this.borderThickness)
			game.c.lineTo(this.x + this.length, this.y - this.height)
			game.c.lineTo(this.x + 2 * this.length, this.y - this.borderThickness)
			game.c.fill()
		}
		
		// Moves the obstacle from frame to frame.
		this.move = function() {
			this.x -= game.dx
			// Remove obstacle from list if it is outside of the canvas.
			if (this.x < this.length * (-2) - 10) {
				game.numObstacles++
				return false
			}
			return true
		}
	}
	
	// Periodically generates new obstacles over a random time interval.
	game.generateObstacles = function() {
		clearInterval(game.obstacleInterval)
		game.obstacles.push(new Obstacle())
		var nextObstacleTime = Math.floor((1.25 + Math.random() * 2) * 1000)
		game.obstacleInterval = setInterval(game.generateObstacles, nextObstacleTime)
	}
	
	game.square = {length: 45, color: "#FB7520", borderColor: "#661B08", borderThickness: 3, jumpHeight: 90, inJump: false, goingDown: false, dy: 5}
	game.square.x = (game.canvas.width / 2) - game.canvas.width / 5
	game.square.y = game.mid - game.square.length
	
	// Makes the square jump.
	game.square.jump = function() {
		if (!this.goingDown) {
			if (this.y > game.mid - game.square.length - this.jumpHeight) {
				this.y -= this.dy
			}
			// Square is at peak of jump
			if (this.y <= game.mid - this.length - this.jumpHeight) {
				this.y = game.mid - this.length - this.jumpHeight
				this.goingDown = true
			}
		}
		else { // Square is going down
			if (this.y < game.mid - this.length) {
				this.y += this.dy
			}
			// Square has reached the ground
			if (this.y >= game.mid - this.length) {
				this.y = game.mid - this.length
				this.goingDown = false
				this.inJump = false
			}
		}
	}
	
	// Returns true if the square is touching an obstacle and false otherwise.
	game.square.touchingObstacle = function() {
		var i
		var obstacle
		for (i = 0; i < game.obstacles.length; i++) {
			obstacle = game.obstacles[i]
			// Check for overlap between square and obstacle.
			if (this.x + this.length >= obstacle.x && this.x <= obstacle.x + obstacle.length * 2 && this.y >= game.mid - game.square.length - this.jumpHeight / 10) {
				return true
			}
		}
		return false
	}
	
	// Draws the square
	game.square.draw = function() {
		if (this.inJump) this.jump()
		if (this.touchingObstacle()) { // Check if square is touching obstacle and reset if it is.
			game.reset()
			return
		}
		game.c.fillStyle = this.borderColor
		game.c.fillRect(this.x - this.borderThickness, this.y - this.borderThickness - game.floorHeight, this.length + this.borderThickness * 2, this.length + this.borderThickness * 2)
		game.c.fillStyle = this.color
		game.c.fillRect(this.x, this.y - game.floorHeight, this.length, this.length)
	}
	
	// Draws a frame of the game.
	game.draw = function() {
		this.c.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
		// Draw the background
		this.c.fillStyle = this.grad
		this.c.fillRect(0, 0, this.canvas.width, this.canvas.height)
		// Draw the floor
		this.c.fillStyle = "white"
		this.c.fillRect(0, this.mid, this.canvas.width, this.floorHeight)
		// Draw the square
		this.square.draw()
		// Draw the obstacles
		var i
		var obstaclesToRemove = []
		for (i = 0; i < game.obstacles.length; i++) {
			if (game.obstacles[i].move()) {
				game.obstacles[i].draw()
			}
			else {
				obstaclesToRemove.push(game.obstacles[i])
			}
		}
		//Remove obstacles that are no longer in the canvas.
		var index
		for (i = 0; i < obstaclesToRemove.length; i++) {
			index = game.obstacles.indexOf(obstaclesToRemove[i])
			if (index > -1) {
				game.obstacles.splice(index, 1);
			}
		}
	}
	
	// Repeatedly draws the frame in over an interval.
	game.animate = function() {
		game.draw()
	}
	
	// Speeds up the game periodically
	game.speedUp = function() {
		game.dx = game.dx + Math.max(game.dx / 10, 1)
		game.square.dy = game.square.dy + Math.max(game.square.dy / 10, 1)
	}
	
	// Updates the score of the game periodically.
	game.updateScore = function() {
		game.score++
		game.scoreBox.innerHTML = "Score: " + game.score
		game.scoreBox.style.left = game.canvas.width / 2 - game.scoreBox.offsetWidth / 2 + "px"
		game.scoreBox.style.top = 10 + "px";
	}
	
	// Causes the square to jump if the space bar is pressed.
	game.spacePressed = function(evt) {
		if (evt.keyCode == 32) {
			game.square.inJump = true;
		}
	}
	
	// Causes the square to jump if the mouse is clicked.
	game.mouseClicked = function(evt) {
		game.square.inJump = true;
	}
	
	// Resets the game back to original settings.
	game.reset = function() {
		game.highScore = Math.max(game.highScore, game.score)
		localStorage.setItem('highScore', game.highScore) // Store the high score in local storage.
		
		// Update the reset box and make it visible.
		game.resetBox.style.visibility = "visible";
		document.getElementById("finalScoreInfo").innerHTML = "Final Score: " + game.score
		document.getElementById("highScoreInfo").innerHTML = "High Score: " + game.highScore
		document.getElementById("numObstaclesInfo").innerHTML = "Number of Obstacles: " + game.numObstacles
		game.resetBox.style.left = game.canvas.width / 2 - game.resetBox.offsetWidth / 2 + "px"
		game.resetBox.style.top = game.canvas.height / 10 + "px"
		
		// Reset the settings of the game.
		game.score = 0
		game.obstacles = []
		game.numObstacles = 0;
		game.dx = 5
		game.square.inJump = false 
		game.square.goingDown = false 
		game.square.dy = 5
		game.square.y = game.mid - game.square.length
		
		// Clear all intervals so periodic updates no longer happen.
		clearInterval(game.redrawInterval)
		clearInterval(game.speedUpInterval)
		clearInterval(game.scoreInterval)
		clearInterval(game.obstacleInterval)
	}
	
	// Starts the game
	game.start = function() {
		// Create score box
		game.scoreBox.innerHTML = "Score: " + game.score
		game.scoreBox.style.left = game.canvas.width / 2 - game.scoreBox.offsetWidth / 2 + "px"
		game.scoreBox.style.top = 10+ "px";
		game.resetBox.style.visibility = "hidden";
		
		window.addEventListener('keydown', this.spacePressed)
		window.addEventListener('click', this.mouseClicked)
		
		game.redrawInterval = setInterval(game.animate, game.period) // Redraw the game periodically
		game.speedUpInterval = setInterval(game.speedUp, game.speedUpPeriod) // Speed up the game periodically
		game.scoreInterval = setInterval(game.updateScore, 1000) // Increase score every second
		var nextObstacleTime = Math.floor((1.25 + Math.random() * 2) * 1000) // Time to create next obstacle
		game.obstacleInterval = setInterval(game.generateObstacles, nextObstacleTime) // Periodically generate new obstacles.
	}
	document.getElementById("resetButton").addEventListener("click", game.start);
	game.start()
}