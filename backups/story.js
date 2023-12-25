let timersArray = [];
let intervalsArray = [];

// NOTE: custom Timer class
function Timer(callback, delay) {
  this.callback = callback;
  this.delay = delay;
  this.start = new Date().getTime();
  this.timerID = new Date().getTime();
  this.timerName = this.timerID + "_timer";
}

Timer.prototype.resume = function () {
  this.timerName = window.setTimeout(() => {
    this.callback();
    for (let index in timersArray) {
      if (timersArray[index].timerID == this.timerID) {
        timersArray.splice(index, 1);
      }
    }
  }, this.delay);
    timersArray.push(this);
};

Timer.prototype.pause = function () {
  window.clearTimeout(this.timerName);
  let timeEleapsed = Date.now() - this.start;
  this.delay = this.delay - timeEleapsed;
};

// NOTE: custom Interval class
function Interval(callback, delay) {
  this.isInitial = true;
  this.callback = callback;
  this.delay = delay;
  this.start = new Date().getTime();
  this.intervalID = new Date().getTime();
  this.intervalName = new Date().getTime() + "_interval";
}

Interval.prototype.resume = function () {
  this.intervalName = window.setInterval(() => {
    this.callback();
  }, this.delay);
  if (this.isInitial) {
    this.isInitial = false;
    intervalsArray.push(this);
  }
};

Interval.prototype.pause = function () {
  window.clearInterval(this.intervalName);
  console.log(`interval: ${this.intervalName} cleared`);
};

let heroType;
let heroOBJ;
let gameState;
let heroCanvasTracker = 0;

let canvas;
let ctx;
let HTMLElements = {};

let displayOBJ;

let gameControls = {
  fps: 10,
  level: 1,
  score: 0,
  enemiesDefeated: 0,
  isGameOver: false,
  isGamePaused: false,
  hasLootSpawned: false
};

let arrayTracker = {
  activeArrows: [],
  activeFireballs: [],
  activeAreas: [],
  activeEnemies : [],
  inventory: [],
  obstaclesArray: [],
  noAttackObstacles: []
};

let startingHealth;
let attackDamage;
let attackRange;
let attackCooldown;
let abilityCooldown;

let damageOBJ = {
  melee: 2,
  arrow: 1,
  fire: 1,
  fist: 1
};

let heroMovement = {
  forward: false,
  backward: false,
  up: false,
  down: false,
};

let heroAttack = {
  attack: false,
  ability: false,
};

if (localStorage.getItem("gameState")) {
  gameState = JSON.parse(localStorage["gameState"]);
  gameControls.level = gameState.gameLevel;
  heroType = gameState.heroType;
  heroOBJ = gameState.heroOBJ;
  gameControls.score = gameState.score;
  gameControls.enemiesDefeated = gameState.enemiesDefeated;
  arrayTracker.inventory = gameState.inventory;
  gameControls.hasLootSpawned = gameState.hasLootSpawned;
  localStorage.clear();
} else {
  heroType = sessionStorage.getItem("heroType");
  if (heroType == 1) {
    startingHealth = 15;
    attackDamage = damageOBJ.melee;
    attackRange = 30;
    attackCooldown = 600;
    abilityCooldown = 15000;
  } else if (heroType == 2) {
    startingHealth = 12;
    attackDamage = damageOBJ.arrow;
    attackRange = 400;
    attackCooldown = 800;
    abilityCooldown = 3000;
  } else if (heroType == 3) {
    startingHealth = 10;
    attackDamage = damageOBJ.fire;
    attackRange = 400;
    attackCooldown = 700;
    abilityCooldown = 7000;
  } else if (heroType == 4) {
    startingHealth = 12;
    attackDamage = damageOBJ.fist;
    attackRange = 30;
    attackCooldown = 400;
    abilityCooldown = 8000;
  }

  heroOBJ = new Character(
    startingHealth,
    startingHealth,
    15,
    "left",
    attackRange,
    attackDamage,
    attackCooldown,
    abilityCooldown,
    "",
    60,
    60,
    55,
    60
  );
}

heroOBJ.attackLock = false;
heroOBJ.isAttacking = false;
heroOBJ.draw = drawHero;
if (heroType == 1) {
  heroOBJ.attack = meleeAttack;
  heroOBJ.shield = shield;
  heroOBJ.isShield = false;
  heroOBJ.shieldLock = false;
} else if (heroType == 2) {
  heroOBJ.attack = arrowAttack;
  heroOBJ.tripleShot = tripleShot;
  heroOBJ.isTripleShot = false;
  heroOBJ.tripleShotLock = false;
} else if (heroType == 3) {
  heroOBJ.attack = fireballAttack;
  heroOBJ.wildfire = wildfire;
  heroOBJ.isWildfire = false;
  heroOBJ.wildfireLock = false;
} else if (heroType == 4) {
  heroOBJ.attack = meleeAttack;
  heroOBJ.goddess = goddess;
  heroOBJ.isGoddess = false;
  heroOBJ.goddessLock = false;
}

let availableLoot = [];

let freezeAttack = false;

window.onload = () => {
  canvas = document.getElementById("canvas");
  HTMLElements.levelHeading = document.querySelector("#levelHeading");
  HTMLElements.display = document.querySelector("#display");
  HTMLElements.HPDisplay = document.querySelector("#HPDisplay");
  HTMLElements.scoreDisplay = document.querySelector("#ScoreDisplay");
  HTMLElements.menu = document.querySelector("#menu");
  HTMLElements.startButton = document.querySelector("#startButton");
  HTMLElements.pauseButton = document.querySelector("#pauseButton");
  HTMLElements.resumeButton = document.querySelector("#resumeButton");
  HTMLElements.quitButton = document.querySelector("#quitButton");
  HTMLElements.saveAndQuitButton = document.querySelector("#saveAndQuitButton");
  HTMLElements.level1CompletedPrompt = document.getElementsByClassName(
    "levelCompletedPrompt"
  )[0];
  HTMLElements.level2CompletedPrompt = document.getElementsByClassName(
    "levelCompletedPrompt"
  )[1];
  HTMLElements.level3CompletedPrompt = document.getElementsByClassName(
    "levelCompletedPrompt"
  )[2];
  HTMLElements.level4CompletedPrompt = document.getElementsByClassName(
    "levelCompletedPrompt"
  )[3];
  HTMLElements.nextLevelButton1 = document.getElementsByClassName("nextLevelButton")[0];
  HTMLElements.nextLevelButton2 = document.getElementsByClassName("nextLevelButton")[1];
  HTMLElements.nextLevelButton3 = document.getElementsByClassName("nextLevelButton")[2];
  HTMLElements.nextLevelButton4 = document.getElementsByClassName("nextLevelButton")[3];
  HTMLElements.inventoryDisplay = document.querySelectorAll(".slot");
  HTMLElements.slotImage = document.querySelector(".slot img");
  HTMLElements.gameOverPrompt = document.querySelector("#gameOverPrompt");
  displayOBJ = {
    width: canvas.width,
    height: canvas.height,
  };

  if (gameControls.level === 1) {
    HTMLElements.levelHeading.innerHTML = "Level 1: Everdeen Plains";
  } else if (gameControls.level === 2) {
    HTMLElements.levelHeading.innerHTML = "Level 2: Sloriye Woods";
  } else if (gameControls.level === 3) {
    HTMLElements.levelHeading.innerHTML = "Level 3: Nundir Castle";
  } else if (gameControls.level === 4) {
    HTMLElements.levelHeading.innerHTML = "Level 4: Dürig's Tomb";
  }

  HTMLElements.startButton.onclick = () => {
    document.querySelector("#starterPrompt").remove();
    drawDisplay();
  };

  HTMLElements.pauseButton.onclick = () => {
    heroMovement.forward = false;
    heroMovement.backward = false;
    heroMovement.up = false;
    heroMovement.down = false;
    heroAttack.attack = false;

    for (let index in timersArray) {
      timersArray[index].pause();
    }
    for (let index in intervalsArray) {
      intervalsArray[index].pause();
    }

    gameControls.isGamePaused = true;
    HTMLElements.pauseButton.style = "display: none";
    HTMLElements.resumeButton.style = "display: block";
    HTMLElements.quitButton.style = "display: block";
    HTMLElements.saveAndQuitButton.style = "display: block";
  };

  HTMLElements.resumeButton.onclick = () => {
    for (let index in timersArray) {
      timersArray[index].resume();
    }
    for (let index in intervalsArray) {
      intervalsArray[index].resume();
    }

    gameControls.isGamePaused = false;
    HTMLElements.pauseButton.style = "display: block";
    HTMLElements.resumeButton.style = "display: none";
    HTMLElements.quitButton.style = "display: none";
    HTMLElements.saveAndQuitButton.style = "display: none";
  };

  HTMLElements.quitButton.onclick = () => {
    location.href = "../index.html";
  };

  HTMLElements.saveAndQuitButton.onclick = () => {
    saveGameState();
    location.href = "../index.html";
  };
};

function drawDisplay() {
  gameControls.fps = 10;

  ctx = canvas.getContext("2d");

  levelControl();

  for (let index in arrayTracker.inventory) {
    if (arrayTracker.inventory[index]) {
      HTMLElements.inventoryDisplay[index].firstChild.setAttribute(
        "src",
        `../images/${arrayTracker.inventory[index].type}.png`
      );
    }
  }

  let generateCanvasInterval = new Interval(() => {
    generateCanvas();
  }, 1000 / gameControls.fps).resume();
  let handleEnemyAttackInterval = new Interval(() => {
    handleEnemyAttack();
  }, 2000).resume();
}

function levelControl() {
  const SpawnEnemyTime = 3000;

  if (gameControls.level === 1) {
    ctx.fillStyle = "green";
    spawnObstacle("lake", 300, 100);
    spawnObstacle("rock", 600, 50);

    let spawnEnemyTimer1 = new Timer(() => {
      spawnEnemy("bandit");
    }, SpawnEnemyTime).resume();
    let spawnEnemyTimer2 = new Timer(() => {
      spawnEnemy("bandit");
    }, 2 * SpawnEnemyTime).resume();
    let spawnEnemyTimer3 = new Timer(() => {
      spawnEnemy("wizard");
    }, 3 * SpawnEnemyTime).resume();
    let spawnEnemyTimer4 = new Timer(() => {
      spawnEnemy("bandit");
    }, 4 * SpawnEnemyTime).resume();
    let spawnEnemyTimer5 = new Timer(() => {
      spawnEnemy("wizard");
    }, 5 * SpawnEnemyTime).resume();
  } else if (gameControls.level === 2) {
    ctx.fillStyle = "darkgreen";
    document.querySelector('html').setAttribute("style", "background:url('../images/woods.png?v1') no-repeat center center fixed;");
    spawnObstacle("tree", 600, 200);
    spawnObstacle("tree", 200, 100);

    spawnLoot(spawnRandomLoot());
    let spawnEnemyTimer6 = new Timer(() => {
      spawnEnemy("bandit");
    }, SpawnEnemyTime).resume();
    let spawnEnemyTimer7 = new Timer(() => {
      spawnEnemy("wizard");
    }, 2 * SpawnEnemyTime).resume();
    let spawnEnemyTimer8 = new Timer(() => {
      spawnEnemy("wizard");
    }, 3 * SpawnEnemyTime).resume();
    let spawnEnemyTimer9 = new Timer(() => {
      spawnEnemy("archer");
    }, 4 * SpawnEnemyTime).resume();
    let spawnEnemyTimer10 = new Timer(() => {
      spawnEnemy("bandit");
    }, 5 * SpawnEnemyTime).resume();
  } else if (gameControls.level === 3) {
    ctx.fillStyle = "rgb(180, 180, 180)";
    document.querySelector('html').setAttribute("style", "background:url('../images/cobble.png?v1') no-repeat center center fixed;");
    spawnLoot(spawnRandomLoot());
    let spawnEnemyTimer11 = new Timer(() => {
      spawnEnemy("guard");
    }, SpawnEnemyTime).resume();
    let spawnEnemyTimer12 = new Timer(() => {
      spawnEnemy("wizard");
    }, 2 * SpawnEnemyTime).resume();
    let spawnEnemyTimer13 = new Timer(() => {
      spawnEnemy("archer");
    }, 3 * SpawnEnemyTime).resume();
    let spawnEnemyTimer14 = new Timer(() => {
      spawnEnemy("guard");
    }, 4 * SpawnEnemyTime).resume();
    let spawnEnemyTimer15 = new Timer(() => {
      spawnEnemy("archer");
    }, 5 * SpawnEnemyTime).resume();
  } else if (gameControls.level === 4) {
    ctx.fillStyle = "rgb(56, 54, 54)";
    document.querySelector('html').setAttribute("style", "background:url('../images/cave.png') no-repeat center center fixed;");
    spawnObstacle("rock", 200, 175);
    spawnObstacle("rock", 500, 75);

    spawnLoot(spawnRandomLoot());
    let spawnEnemyTimer16 = new Timer(() => {
      spawnEnemy("durig");
    }, SpawnEnemyTime).resume();
    let spawnEnemyTimer17 = new Timer(() => {
      spawnEnemy("archer");
    }, 4 * SpawnEnemyTime).resume();
    let spawnEnemyTimer18 = new Timer(() => {
      spawnEnemy("archer");
    }, 6 * SpawnEnemyTime).resume();
    let spawnEnemyTimer19 = new Timer(() => {
      spawnEnemy("guard");
    }, 8 * SpawnEnemyTime).resume();
    let spawnEnemyTimer20 = new Timer(() => {
      spawnEnemy("guard");
    }, 10 * SpawnEnemyTime).resume();
  }

  ctx.fillRect(0, 0, displayOBJ.width, displayOBJ.height);
  heroOBJ.draw();
}

function generateCanvas() {
  if (!gameControls.isGamePaused) {
    handleHero();

    for (let targetEnemy in arrayTracker.activeEnemies) {
      arrayTracker.activeEnemies[targetEnemy].move();
    }

    for (let target in arrayTracker.activeArrows) {
      if (arrayTracker.activeArrows[target].attacksEvil) {
        arrayTracker.activeArrows[target].checkHit("evil");
      } else {
        arrayTracker.activeArrows[target].checkHit("good");
      }
    }
    for (let target in arrayTracker.activeFireballs) {
      if (arrayTracker.activeFireballs[target].attacksEvil) {
        arrayTracker.activeFireballs[target].checkHit("evil");
      } else {
        arrayTracker.activeFireballs[target].checkHit("good");
      }
    }
    for (let loot in availableLoot) {
      availableLoot[loot].acquireLoot();
    }

    if (heroOBJ.currentHP <= 0) {
      HTMLElements.HPDisplay.innerHTML = "HP: 0";
    } else {
      HTMLElements.HPDisplay.innerHTML = "HP: " + heroOBJ.currentHP;
    }
    HTMLElements.scoreDisplay.innerHTML = "Score: " + gameControls.score;
  }
}

addEventListener("keydown", function (event) {
  if (!gameControls.isGamePaused) {
    if (event.keyCode === 68 || event.keyCode === 100) {
      // NOTE: d key
      heroMovement.forward = true;
    } else if (event.keyCode === 65 || event.keyCode === 97) {
      // NOTE: a key
      heroMovement.backward = true;
    } else if (event.keyCode === 87 || event.keyCode === 119) {
      // NOTE: w keyn
      heroMovement.up = true;
    } else if (event.keyCode === 83 || event.keyCode === 115) {
      // NOTE: s key
      heroMovement.down = true;
    } else if (event.keyCode === 75 || event.keyCode === 107) {
      // NOTE: k key
      heroAttack.attack = true;
    } else if (event.keyCode === 76 || event.keyCode === 108) {
      // NOTE: l key
      heroAttack.ability = true;
    }
  }
});

addEventListener("keyup", function (event) {
  if (!gameControls.isGamePaused) {
    if (event.keyCode === 68 || event.keyCode === 100) {
      // NOTE: d key
      heroMovement.forward = false;
    } else if (event.keyCode === 65 || event.keyCode === 97) {
      // NOTE: a key
      heroMovement.backward = false;
    } else if (event.keyCode === 87 || event.keyCode === 119) {
      // NOTE: w key
      heroMovement.up = false;
    } else if (event.keyCode === 83 || event.keyCode === 115) {
      // NOTE: s key
      heroMovement.down = false;
    } else if (event.keyCode === 75 || event.keyCode === 107) {
      // NOTE: k key
      heroAttack.attack = false;
    } else if (event.keyCode === 76 || event.keyCode === 108) {
      // NOTE: l key
      heroAttack.ability = false;
    }
  }
});

addEventListener("keypress", function (event) {
  if (event.keyCode === 49 || event.keyCode === 105) {
    // NOTE: 1 key
    arrayTracker.inventory[0] = null;
    if (
      HTMLElements.inventoryDisplay[0].firstChild.getAttribute("src") !==
      "../images/blank.png"
    ) {
      if (
        HTMLElements.inventoryDisplay[0].firstChild.getAttribute("src") ===
        "../images/healing_potion.png"
      ) {
        heroOBJ.currentHP = heroOBJ.totalHP;
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[0].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        heroOBJ.draw();
      }
      HTMLElements.inventoryDisplay[0].firstChild.setAttribute("src", "../images/blank.png");
    }
  } else if (event.keyCode === 50 || event.keyCode === 106) {
    // NOTE: 2 key
    arrayTracker.inventory[1] = null;
    if (
      HTMLElements.inventoryDisplay[1].firstChild.getAttribute("src") !==
      "../images/blank.png"
    ) {
      if (
        HTMLElements.inventoryDisplay[1].firstChild.getAttribute("src") ===
        "../images/healing_potion.png"
      ) {
        heroOBJ.currentHP = heroOBJ.totalHP;
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[1].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        heroOBJ.draw();
      }
      HTMLElements.inventoryDisplay[1].firstChild.setAttribute("src", "../images/blank.png");
    }
  } else if (event.keyCode === 51 || event.keyCode === 107) {
    // NOTE: 3 key
    arrayTracker.inventory[2] = null;
    if (
      HTMLElements.inventoryDisplay[2].firstChild.getAttribute("src") !==
      "../images/blank.png"
    ) {
      if (
        HTMLElements.inventoryDisplay[2].firstChild.getAttribute("src") ===
        "../images/healing_potion.png"
      ) {
        heroOBJ.currentHP = heroOBJ.totalHP;
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[2].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        heroOBJ.draw();
      }
      HTMLElements.inventoryDisplay[2].firstChild.setAttribute("src", "../images/blank.png");
    }
  } else if (event.keyCode === 52 || event.keyCode === 108) {
    // NOTE: 4 key
    arrayTracker.inventory[3] = null;
    if (
      HTMLElements.inventoryDisplay[3].firstChild.getAttribute("src") !==
      "../images/blank.png"
    ) {
      if (
        HTMLElements.inventoryDisplay[3].firstChild.getAttribute("src") ===
        "../images/healing_potion.png"
      ) {
        heroOBJ.currentHP = heroOBJ.totalHP;
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[3].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        heroOBJ.draw();
      }
      HTMLElements.inventoryDisplay[3].firstChild.setAttribute("src", "../images/blank.png");
    }
  } else if (event.keyCode === 53 || event.keyCode === 109) {
    // NOTE: 5 key
    arrayTracker.inventory[4] = null;
    if (
      HTMLElements.inventoryDisplay[4].firstChild.getAttribute("src") !==
      "../images/blank.png"
    ) {
      if (
        HTMLElements.inventoryDisplay[4].firstChild.getAttribute("src") ===
        "../images/healing_potion.png"
      ) {
        heroOBJ.currentHP = heroOBJ.totalHP;
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[4].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        heroOBJ.draw();
      }
      HTMLElements.inventoryDisplay[4].firstChild.setAttribute("src", "../images/blank.png");
    }
  } else console.log(`key pressed was ${event.keyCode}`);
});

function handleHero() {
  if (!gameControls.isGamePaused) {
    // heroOBJ.draw();
    if (heroMovement.forward) {
      heroOBJ.direction = "right";
      if (
        heroOBJ.posX + heroOBJ.width + heroOBJ.speed + 10 <
        displayOBJ.width
      ) {
        // NOTE: the +10 is for the ability icon
        for (let index in arrayTracker.obstaclesArray) {
          let obstacle = arrayTracker.obstaclesArray[index];
          if (
            (heroOBJ.posY >= obstacle.posY &&
              heroOBJ.posY <= obstacle.posY + obstacle.height) ||
            (heroOBJ.posY + heroOBJ.height >= obstacle.posY &&
              heroOBJ.posY + heroOBJ.height <= obstacle.posY + obstacle.height)
          ) {
            if (
              heroOBJ.posX + heroOBJ.width + heroOBJ.speed + 10 >=
                obstacle.posX &&
              heroOBJ.posX + heroOBJ.width + heroOBJ.speed + 10 <=
                obstacle.posX + obstacle.width
            ) {
              return;
            }
          }
        }
        heroOBJ.posX += heroOBJ.speed;
      }
      heroOBJ.draw();
    }
    if (heroMovement.backward) {
      heroOBJ.direction = "left";
      if (heroOBJ.posX - heroOBJ.speed > 0) {
        for (let index in arrayTracker.obstaclesArray) {
          let obstacle = arrayTracker.obstaclesArray[index];
          if (
            (heroOBJ.posY >= obstacle.posY &&
              heroOBJ.posY <= obstacle.posY + obstacle.height) ||
            (heroOBJ.posY + heroOBJ.height >= obstacle.posY &&
              heroOBJ.posY + heroOBJ.height <= obstacle.posY + obstacle.height)
          ) {
            if (
              heroOBJ.posX - heroOBJ.speed >= obstacle.posX &&
              heroOBJ.posX - heroOBJ.speed <= obstacle.posX + obstacle.width
            ) {
              return;
            }
          }
        }
        heroOBJ.posX -= heroOBJ.speed;
      }
      heroOBJ.draw();
    }
    if (heroMovement.up) {
      // NOTE: no direction as character cannot look up or down
      if (heroOBJ.posY - heroOBJ.speed > 0) {
        for (let index in arrayTracker.obstaclesArray) {
          let obstacle = arrayTracker.obstaclesArray[index];
          if (
            (heroOBJ.posX >= obstacle.posX &&
              heroOBJ.posX <= obstacle.posX + obstacle.width) ||
            (heroOBJ.posX + heroOBJ.width >= obstacle.posX &&
              heroOBJ.posX + heroOBJ.width <= obstacle.posX + obstacle.width)
          ) {
            if (
              heroOBJ.posY - heroOBJ.speed >= obstacle.posY &&
              heroOBJ.posY - heroOBJ.speed <= obstacle.posY + obstacle.height
            ) {
              return;
            }
          }
        }
        heroOBJ.posY -= heroOBJ.speed;
      }
      heroOBJ.draw();
    }
    if (heroMovement.down) {
      // NOTE: no direction as character cannot look up or down
      if (heroOBJ.posY + heroOBJ.height + heroOBJ.speed < displayOBJ.height) {
        for (let index in arrayTracker.obstaclesArray) {
          let obstacle = arrayTracker.obstaclesArray[index];
          if (
            (heroOBJ.posX >= obstacle.posX &&
              heroOBJ.posX <= obstacle.posX + obstacle.width) ||
            (heroOBJ.posX + heroOBJ.width >= obstacle.posX &&
              heroOBJ.posX + heroOBJ.width <= obstacle.posX + obstacle.width)
          ) {
            if (
              heroOBJ.posY + heroOBJ.height + heroOBJ.speed >= obstacle.posY &&
              heroOBJ.posY + heroOBJ.height + heroOBJ.speed <=
                obstacle.posY + obstacle.height
            ) {
              return;
            }
          }
        }
        heroOBJ.posY += heroOBJ.speed;
      }
      heroOBJ.draw();
    }

    if (heroAttack.attack) {
      // NOTE: k key
      if (!heroOBJ.attackLock) {
        heroOBJ.attack("evil");
        heroOBJ.attackLock = true;
      } else {
        return;
      }

      let attackLockTimer = new Timer(() => {
        heroOBJ.attackLock = false;
      }, heroOBJ.attackCooldown).resume();
    }
    if (heroAttack.ability) {
      // NOTE: l key
      if (heroType == 1) {
        if (!heroOBJ.shieldLock) {
          heroOBJ.shield();
          heroOBJ.shieldLock = true;
          heroOBJ.draw();
          let shieldLockTimer = new Timer(() => {
            heroOBJ.shieldLock = false;
            heroOBJ.draw();
          }, heroOBJ.abilityCooldown).resume();
        }
      } else if (heroType == 2) {
        if (!heroOBJ.tripleShotLock) {
          heroOBJ.tripleShot();
          heroOBJ.tripleShotLock = true;
          heroOBJ.draw();
          let tripleShotLockTimer = new Timer(() => {
            heroOBJ.tripleShotLock = false;
            heroOBJ.draw();
          }, heroOBJ.abilityCooldown).resume();
        }
      } else if (heroType == 3) {
        if (!heroOBJ.wildfireLock) {
          heroOBJ.wildfire();
          heroOBJ.wildfireLock = true;
          heroOBJ.draw();
          let wildfireLockTimer = new Timer(() => {
            heroOBJ.wildfireLock = false;
            heroOBJ.draw();
          }, heroOBJ.abilityCooldown).resume();
        }
      } else if (heroType == 4) {
        if (!heroOBJ.goddessLock) {
          heroOBJ.goddess();
          heroOBJ.goddessLock = true;
          heroOBJ.draw();
          let goddessLockTimer = new Timer(() => {
            heroOBJ.goddessLock = false;
            heroOBJ.draw();
          }, heroOBJ.abilityCooldown).resume();
        }
      }
    }
  }
}

function drawHero() {
  // NOTE: check if character is dead
  if (this.currentHP <= 0) {
    gameControls.fps = 0.5;
    this.currentHP = 0;
    gameOver();
    return;
  }

  // NOTE: create updated canvas
  let updatedCanvas = document.createElement("canvas");
  let canvasID = 0;
  if (!heroCanvasTracker) {
    canvasID = 1;
    heroCanvasTracker = 1;
  } else {
    heroCanvasTracker = 0;
  }

  updatedCanvas.setAttribute("id", `canvas_hero` + canvasID);
  updatedCanvas.setAttribute("width", displayOBJ.width);
  updatedCanvas.setAttribute("height", displayOBJ.height);
  HTMLElements.display.appendChild(updatedCanvas);
  let localCtx = updatedCanvas.getContext("2d");

  let heroImage = new Image();
  let heroWidthHelper;
  if (this.direction === "left") {
    heroImage.src = "../images/character_art_left.png";
    heroWidthHelper = 10;
  } else {
    heroImage.src = "../images/character_art_right.png";
    heroWidthHelper = 12;
  }
  let abilityImage = new Image();
  if (heroType == 1) {
    abilityImage.src = "../images/shieldIcon.png";
  } else if (heroType == 2) {
    abilityImage.src = "../images/arrowIcon.png";
  } else if (heroType == 3) {
    abilityImage.src = "../images/fireIcon.png";
  } else if (heroType == 4) {
    abilityImage.src = "../images/goddessIcon.png";
  }

  if (heroType == 1) {
    if (!this.shieldLock) {
      abilityImage.onload = () => {
        localCtx.drawImage(
          abilityImage,
          this.posX + this.width + 5,
          this.posY - 8,
          10,
          10
        );
      };
    }
  } else if (heroType == 2) {
    if (!this.tripleShotLock) {
      abilityImage.onload = () => {
        localCtx.drawImage(
          abilityImage,
          this.posX + this.width + 5,
          this.posY - 8,
          10,
          10
        );
      };
    }
  } else if (heroType == 3) {
    if (!this.wildfireLock) {
      abilityImage.onload = () => {
        localCtx.drawImage(
          abilityImage,
          this.posX + this.width + 5,
          this.posY - 8,
          10,
          10
        );
      };
    }
  } else if (heroType == 4) {
    if (!this.goddessLock) {
      abilityImage.onload = () => {
        localCtx.drawImage(
          abilityImage,
          this.posX + this.width + 5,
          this.posY - 8,
          10,
          10
        );
      };
    }
  }

  if (freezeAttack) {
    localCtx.beginPath();
    localCtx.moveTo(this.posX, this.posY);
    localCtx.lineTo(this.posX + this.width, this.posY);
    localCtx.lineTo(this.posX + this.width, this.posY + this.height);
    localCtx.lineTo(this.posX, this.posY + this.height);
    localCtx.lineTo(this.posX, this.posY);
    localCtx.strokeStyle = "rgba(0, 50, 150, 1)";
    localCtx.lineWidth = 1;
    localCtx.stroke();
  }

  heroImage.onload = () => {
    localCtx.fillStyle = "blue";
    localCtx.fillRect(
      this.posX,
      this.posY - 8,
      this.width * (this.currentHP / this.totalHP),
      5
    );

    if (this.isShield) {
      localCtx.fillStyle = "rgba(180, 0, 255, 0.3)";
      localCtx.fillRect(this.posX, this.posY, this.width, this.height);
    }

    if (this.isGoddess) {
      localCtx.fillStyle = "rgba(30, 250, 250, 0.3)";
      localCtx.fillRect(this.posX, this.posY, this.width, this.height);
    }

    if (this.isAttacking) {
      if (this.direction === "left") {
        heroImage.src = "../images/character_art_left_attack.png";
      } else {
        heroImage.src = "../images/character_art_right_attack.png";
      }
    }

    if (heroType == 1) {
      localCtx.drawImage(
        heroImage,
        heroWidthHelper,
        40,
        this.width,
        this.height,
        this.posX,
        this.posY,
        this.width,
        this.height
      );
    } else if (heroType == 2) {
      localCtx.drawImage(
        heroImage,
        550,
        250,
        this.width,
        this.height,
        this.posX,
        this.posY,
        this.width,
        this.height
      );
    } else if (heroType == 3) {
      localCtx.drawImage(
        heroImage,
        75,
        40,
        this.width,
        this.height,
        this.posX,
        this.posY,
        this.width,
        this.height
      );
    } else if (heroType == 4) {
      localCtx.drawImage(
        heroImage,
        80,
        445,
        this.width,
        this.height,
        this.posX,
        this.posY,
        this.width,
        this.height
      );
    }
  };

  // NOTE: deleting previous canvas
  if (!heroCanvasTracker) {
    if (document.getElementById(`canvas_hero1`)) {
      document.getElementById(`canvas_hero1`).remove();
    }
  } else {
    if (document.getElementById(`canvas_hero0`)) {
      document.getElementById(`canvas_hero0`).remove();
    }
  }
}

function spawnEnemy(enemyType) {
  if (arrayTracker.activeEnemies.length < 5 && !gameControls.isGamePaused) {
    let position = randomCoords();
    let randX = position.posX;
    let randY = position.posY;
    if (enemyType === "bandit") {
      let banditOBJ = new Character(
        4,
        4,
        15,
        "left",
        30,
        damageOBJ.melee,
        0,
        0,
        "",
        randX,
        randY,
        54,
        60
      );
      banditOBJ.type = "bandit";
      banditOBJ.ID = "bandit" + new Date().getTime();
      banditOBJ.draw = drawEnemy;
      banditOBJ.move = moveToHero;
      banditOBJ.attack = meleeAttack;
      banditOBJ.isAttacking = false;
      banditOBJ.checkIfDead = checkIfDead;
      arrayTracker.activeEnemies.push(banditOBJ);
    } else if (enemyType === "guard") {
      let guardOBJ = new Character(
        5,
        5,
        10,
        "left",
        60,
        damageOBJ.melee,
        0,
        0,
        "",
        randX,
        randY,
        54,
        60
      );
      guardOBJ.type = "guard";
      guardOBJ.ID = "guard" + new Date().getTime();
      guardOBJ.draw = drawEnemy;
      guardOBJ.move = moveToHero;
      guardOBJ.attack = meleeAttack;
      guardOBJ.isAttacking = false;
      guardOBJ.checkIfDead = checkIfDead;
      arrayTracker.activeEnemies.push(guardOBJ);
    } else if (enemyType === "archer") {
      let archerOBJ = new Character(
        3,
        3,
        10,
        "left",
        400,
        damageOBJ.arrow,
        0,
        0,
        "",
        randX,
        randY,
        54,
        60
      );
      archerOBJ.type = "archer";
      archerOBJ.ID = "archer" + new Date().getTime();
      archerOBJ.draw = drawEnemy;
      archerOBJ.move = archerMovement;
      archerOBJ.attack = arrowAttack;
      archerOBJ.isAttacking = false;
      archerOBJ.checkIfDead = checkIfDead;
      arrayTracker.activeEnemies.push(archerOBJ);
    } else if (enemyType === "wizard") {
      let wizardOBJ = new Character(
        3,
        3,
        10,
        "left",
        400,
        damageOBJ.fire,
        0,
        0,
        "",
        randX,
        randY,
        54,
        60
      );
      wizardOBJ.type = "wizard";
      wizardOBJ.ID = "wizard" + new Date().getTime();
      wizardOBJ.draw = drawEnemy;
      wizardOBJ.move = archerMovement;
      wizardOBJ.attack = fireballAttack;
      wizardOBJ.isAttacking = false;
      wizardOBJ.checkIfDead = checkIfDead;
      arrayTracker.activeEnemies.push(wizardOBJ);
    } else if (enemyType === "durig") {
      let durigOBJ = new Character(
        30,
        30,
        5,
        "left",
        400,
        damageOBJ.fire,
        0,
        0,
        "",
        displayOBJ.width / 2,
        displayOBJ.height / 2,
        54,
        60
      );
      durigOBJ.type = "durig";
      durigOBJ.ID = "durig" + new Date().getTime();
      durigOBJ.draw = drawEnemy;
      durigOBJ.move = moveToHero;
      durigOBJ.attack = fireballAttack;
      durigOBJ.isAttacking = false;
      durigOBJ.checkIfDead = checkIfDead;
      arrayTracker.activeEnemies.push(durigOBJ);
    }
    return;
  } else {
    return;
  }
}

function spawnObstacle(type, posX, posY) {
  let obstacle;
  if (type === "tree") {
    obstacle = new Obstacle("tree", posX, posY);
    arrayTracker.obstaclesArray.push(obstacle);
    arrayTracker.noAttackObstacles.push(obstacle);
  } else if (type === "lake") {
    obstacle = new Obstacle("lake", posX, posY);
    arrayTracker.obstaclesArray.push(obstacle);
  } else if (type === "rock") {
    obstacle = new Obstacle("rock", posX, posY);
    arrayTracker.obstaclesArray.push(obstacle);
    arrayTracker.noAttackObstacles.push(obstacle);
  }
  obstacle.draw();
}

function moveToHero() {
  if (!gameControls.isGamePaused) {
    if (this.effects === "freeze") {
      let frozenEnemyTimer = new Timer(() => {
        this.effects = "";
        this.draw();
      }, 1000).resume();
      this.draw();
      return;
    }
    // NOTE: if enemyPos > heroPos, then enemy must move backwards and vice versa
    let distanceX = this.posX - heroOBJ.posX;
    let distanceY = this.posY - heroOBJ.posY;
    if (distanceX > 0) {
      this.direction = "left";
      for (let index in arrayTracker.obstaclesArray) {
        let obstacle = arrayTracker.obstaclesArray[index];
        if (
          (this.posY >= obstacle.posY &&
            this.posY <= obstacle.posY + obstacle.height) ||
          (this.posY + this.height >= obstacle.posY &&
            this.posY + this.height <= obstacle.posY + obstacle.height)
        ) {
          if (
            this.posX - this.speed >= obstacle.posX &&
            this.posX - this.speed <= obstacle.posX + obstacle.width
          ) {
            return;
          }
        }
      }
      this.posX -= this.speed;
    } else if (distanceX < 0) {
      this.direction = "right";
      for (let index in arrayTracker.obstaclesArray) {
        let obstacle = arrayTracker.obstaclesArray[index];
        if (
          (this.posY >= obstacle.posY &&
            this.posY <= obstacle.posY + obstacle.height) ||
          (this.posY + this.height >= obstacle.posY &&
            this.posY + this.height <= obstacle.posY + obstacle.height)
        ) {
          if (
            this.posX + this.width + this.speed >= obstacle.posX &&
            this.posX + this.width + this.speed <=
              obstacle.posX + obstacle.width
          ) {
            return;
          }
        }
      }
      this.posX += this.speed;
    }
    if (distanceY > 0) {
      // NOTE: if statement so that the HP bars of the enemy does not exceed the canvas
      if (this.posY - this.speed > 8) {
        for (let index in arrayTracker.obstaclesArray) {
          let obstacle = arrayTracker.obstaclesArray[index];
          if (
            (this.posX >= obstacle.posX &&
              this.posX <= obstacle.posX + obstacle.width) ||
            (this.posX + this.width >= obstacle.posX &&
              this.posX + this.width <= obstacle.posX + obstacle.width)
          ) {
            if (
              this.posY - this.speed >= obstacle.posY &&
              this.posY - this.speed <= obstacle.posY + obstacle.height
            ) {
              return;
            }
          }
        }
        this.posY -= this.speed;
      }
    } else if (distanceY < 0) {
      for (let index in arrayTracker.obstaclesArray) {
        let obstacle = arrayTracker.obstaclesArray[index];
        if (
          (this.posX >= obstacle.posX &&
            this.posX <= obstacle.posX + obstacle.width) ||
          (this.posX + this.width >= obstacle.posX &&
            this.posX + this.width <= obstacle.posX + obstacle.width)
        ) {
          if (
            this.posY + this.height + this.speed >= obstacle.posX &&
            this.posY + this.height + this.speed <=
              obstacle.posY + obstacle.height
          ) {
            return;
          }
        }
      }
      this.posY += this.speed;
    }

    for (let target in arrayTracker.activeAreas) {
      if (
        Math.abs(this.posX + this.width / 2 - arrayTracker.activeAreas[target].posX) <=
          arrayTracker.activeAreas[target].radius &&
        Math.abs(this.posY + this.height / 2 - arrayTracker.activeAreas[target].posY) <=
          arrayTracker.activeAreas[target].radius
      ) {
        if (!this.fireDamageLock) {
          this.currentHP -= damageOBJ.fire;
          this.fireDamageLock = true;
          let wildfireDamageLockTimer = new Timer(() => {
            this.fireDamageLock = false;
          }, 1000).resume();
        }
      }
    }
    this.draw();
  }
}

function archerMovement() {
  if (!gameControls.isGamePaused) {
    if (this.effects === "freeze") {
      let frozenEnemyTimer = new Timer(() => {
        this.effects = "";
        this.draw();
      }, 1000).resume();
      this.draw();
      return;
    }
    // NOTE: if enemyPos > heroPos, then enemy must move backwards and vice versa
    // NOTE: archer should maintain 100 px away from hero horizontally, but NOT vertically (so they can hit him)
    let heroMirrorPositionx1 = heroOBJ.posX - 200;
    let heroMirrorPositionx2 = heroOBJ.posX + 200;

    let heroMirrorPositionX;
    let heroMirrorPositionY = heroOBJ.posY;
    if (this.posX < heroOBJ.posX) {
      this.direction = "right";
      heroMirrorPositionX = heroMirrorPositionx1;
    } else {
      this.direction = "left";
      heroMirrorPositionX = heroMirrorPositionx2;
    }
    if (heroMirrorPositionX <= 0) {
      heroMirrorPositionX = 0;
    }
    if (heroMirrorPositionX + this.width >= displayOBJ.width) {
      heroMirrorPositionX = displayOBJ.width - this.width;
    }

    let distanceX = this.posX - heroMirrorPositionX;
    let distanceY = this.posY - heroMirrorPositionY;
    if (distanceX > 0) {
      for (let index in arrayTracker.obstaclesArray) {
        let obstacle = arrayTracker.obstaclesArray[index];
        if (
          (this.posY >= obstacle.posY &&
            this.posY <= obstacle.posY + obstacle.height) ||
          (this.posY + this.height >= obstacle.posY &&
            this.posY + this.height <= obstacle.posY + obstacle.height)
        ) {
          if (
            this.posX - this.speed >= obstacle.posX &&
            this.posX - this.speed <= obstacle.posX + obstacle.width
          ) {
            return;
          }
        }
      }
      this.posX -= this.speed;
    } else if (distanceX < 0) {
      for (let index in arrayTracker.obstaclesArray) {
        let obstacle = arrayTracker.obstaclesArray[index];
        if (
          (this.posY >= obstacle.posY &&
            this.posY <= obstacle.posY + obstacle.height) ||
          (this.posY + this.height >= obstacle.posY &&
            this.posY + this.height <= obstacle.posY + obstacle.height)
        ) {
          if (
            this.posX + this.width + this.speed >= obstacle.posX &&
            this.posX + this.width + this.speed <=
              obstacle.posX + obstacle.width
          ) {
            return;
          }
        }
      }
      this.posX += heroOBJ.speed;
    }
    if (distanceY > 0) {
      // NOTE: if statement so that the HP bars of the enemy does not exceed the canvas
      if (this.posY - this.speed > 8) {
        for (let index in arrayTracker.obstaclesArray) {
          let obstacle = arrayTracker.obstaclesArray[index];
          if (
            (this.posX >= obstacle.posX &&
              this.posX <= obstacle.posX + obstacle.width) ||
            (this.posX + this.width >= obstacle.posX &&
              this.posX + this.width <= obstacle.posX + obstacle.width)
          ) {
            if (
              this.posY - this.speed >= obstacle.posY &&
              this.posY - this.speed <= obstacle.posY + obstacle.height
            ) {
              return;
            }
          }
        }
        this.posY -= this.speed;
      }
    } else if (distanceY < 0) {
      for (let index in arrayTracker.obstaclesArray) {
        let obstacle = arrayTracker.obstaclesArray[index];
        if (
          (this.posX >= obstacle.posX &&
            this.posX <= obstacle.posX + obstacle.width) ||
          (this.posX + this.width >= obstacle.posX &&
            this.posX + this.width <= obstacle.posX + obstacle.width)
        ) {
          if (
            this.posY + this.height + this.speed >= obstacle.posX &&
            this.posY + this.height + this.speed <=
              obstacle.posY + obstacle.height
          ) {
            return;
          }
        }
      }
      this.posY += this.speed;
    }

    for (let target in arrayTracker.activeAreas) {
      if (
        Math.abs(this.posX + this.width / 2 - arrayTracker.activeAreas[target].posX) <=
          arrayTracker.activeAreas[target].radius &&
        Math.abs(this.posY + this.height / 2 - arrayTracker.activeAreas[target].posY) <=
          arrayTracker.activeAreas[target].radius
      ) {
        if (!this.fireDamageLock) {
          this.currentHP -= damageOBJ.fire;
          this.fireDamageLock = true;
          let wildfireDamageLockTimer = new Timer(() => {
            this.fireDamageLock = false;
          }, 1000).resume();
        }
      }
    }
    this.draw();
  }
}

function drawEnemy() {
  if (!gameControls.isGamePaused) {
    // NOTE: first check for pre-existing canvas
    if (document.getElementById(`canvas_${this.ID}`)) {
      document.getElementById(`canvas_${this.ID}`).remove();
    }

    if (this.currentHP <= 0) return;

    // NOTE: create updated canvas
    let updatedCanvas = document.createElement("canvas");
    updatedCanvas.setAttribute("id", `canvas_${this.ID}`);
    updatedCanvas.setAttribute("width", displayOBJ.width);
    updatedCanvas.setAttribute("height", displayOBJ.height);
    HTMLElements.display.appendChild(updatedCanvas);
    let localCtx = updatedCanvas.getContext("2d");

    let enemyImage = new Image();
    if (this.direction === "right") {
      enemyImage.src = "../images/character_art_right.png";
    } else {
      enemyImage.src = "../images/character_art_left.png";
    }
    if (this.isAttacking) {
      if (this.direction === "left") {
        enemyImage.src = "../images/character_art_left_attack.png";
      } else {
        enemyImage.src = "../images/character_art_right_attack.png";
      }
    }
    if (this.effects === "freeze") {
      localCtx.fillStyle = "rgba(0, 50, 150, 0.7)";
      localCtx.fillRect(this.posX, this.posY, this.width, this.height);
    }

    localCtx.fillStyle = "red";
    localCtx.fillRect(
      this.posX,
      this.posY - 8,
      this.width * (this.currentHP / this.totalHP),
      5
    );

    if (this.type === "bandit") {
      enemyImage.onload = () => {
        localCtx.drawImage(
          enemyImage,
          80,
          515,
          this.width,
          this.height,
          this.posX,
          this.posY,
          this.width,
          this.height
        );
      };
    } else if (this.type === "guard") {
      enemyImage.onload = () => {
        localCtx.drawImage(
          enemyImage,
          280,
          175,
          this.width,
          this.height,
          this.posX,
          this.posY,
          this.width,
          this.height
        );
      };
    } else if (this.type === "archer") {
      enemyImage.onload = () => {
        localCtx.drawImage(
          enemyImage,
          215,
          310,
          this.width,
          this.height,
          this.posX,
          this.posY,
          this.width,
          this.height
        );
      };
    } else if (this.type === "wizard") {
      enemyImage.onload = () => {
        localCtx.drawImage(
          enemyImage,
          210,
          245,
          this.width,
          this.height,
          this.posX,
          this.posY,
          this.width,
          this.height
        );
      };
    } else if (this.type === "durig") {
      enemyImage.onload = () => {
        localCtx.drawImage(
          enemyImage,
          416,
          106,
          this.width,
          this.height,
          this.posX,
          this.posY,
          this.width,
          this.height
        );
      };
    }
  }
}

function drawArrow() {
  // NOTE: check for pre-existing canvas
  if (document.getElementById(`canvas_${this.ID}`)) {
    document.getElementById(`canvas_${this.ID}`).remove();
  }

  // NOTE: create updated canvas
  let updatedCanvas = document.createElement("canvas");
  updatedCanvas.setAttribute("id", `canvas_${this.ID}`);
  updatedCanvas.setAttribute("width", displayOBJ.width);
  updatedCanvas.setAttribute("height", displayOBJ.height);
  HTMLElements.display.appendChild(updatedCanvas);
  let localCtx = updatedCanvas.getContext("2d");

  let arrowImage = new Image();
  if (this.direction === "left") {
    arrowImage.src = "../images/arrows_pack_left.png";
  } else {
    arrowImage.src = "../images/arrows_pack_right.png";
  }

  arrowImage.onload = () => {
    if (this.special === "normal") {
      localCtx.drawImage(
        arrowImage,
        200,
        400,
        600,
        120,
        this.posX,
        this.posY,
        this.width,
        this.height
      );
    } else if (this.special === "tripleShot") {
      localCtx.drawImage(
        arrowImage,
        200,
        1425,
        600,
        120,
        this.posX,
        this.posY,
        this.width,
        this.height
      );
    }
  };
}

function drawFireball() {
  // NOTE: check for pre-existing canvas
  if (document.getElementById(`canvas_${this.ID}`)) {
    document.getElementById(`canvas_${this.ID}`).remove();
  }

  // NOTE: create updated canvas
  let updatedCanvas = document.createElement("canvas");
  updatedCanvas.setAttribute("id", `canvas_${this.ID}`);
  updatedCanvas.setAttribute("width", displayOBJ.width);
  updatedCanvas.setAttribute("height", displayOBJ.height);
  HTMLElements.display.appendChild(updatedCanvas);
  let localCtx = updatedCanvas.getContext("2d");

  let fireballImage = new Image();
  if (this.direction === "left") {
    if (this.special === "wildfire") {
      fireballImage.src = "../images/wildfire_left.png";
    } else {
      fireballImage.src = "../images/fireball_left.png";
    }
  } else {
    if (this.special === "wildfire") {
      fireballImage.src = "../images/wildfire_right.png";
    } else {
      fireballImage.src = "../images/fireball_right.png";
    }
  }
  if (this.special === "normal") {
    localCtx.drawImage(
      fireballImage,
      this.posX,
      this.posY,
      this.width,
      this.height
    );
  } else if (this.special === "wildfire") {
    localCtx.drawImage(
      fireballImage,
      this.posX,
      this.posY,
      this.width,
      this.height
    );
  }
}

function drawArea(areaOBJ) {
  // NOTE: check for pre-existing canvas
  if (document.getElementById(`canvas_${areaOBJ.ID}`)) {
    document.getElementById(`canvas_${areaOBJ.ID}`).remove();
  }

  // NOTE: create updated canvas
  let updatedCanvas = document.createElement("canvas");
  updatedCanvas.setAttribute("id", `canvas_${areaOBJ.ID}`);
  updatedCanvas.setAttribute("width", displayOBJ.width);
  updatedCanvas.setAttribute("height", displayOBJ.height);
  HTMLElements.display.appendChild(updatedCanvas);
  let localCtx = updatedCanvas.getContext("2d");

  localCtx.beginPath();
  localCtx.arc(areaOBJ.posX, areaOBJ.posY, areaOBJ.radius, 0, 2 * Math.PI);
  localCtx.fillStyle = "rgba(255, 60, 60, 0.5)";
  localCtx.fill();

  let activeAreasTimer = new Timer(() => {
    for (let target in arrayTracker.activeAreas) {
      if (arrayTracker.activeAreas[target].ID === areaOBJ.ID) {
        arrayTracker.activeAreas.splice(target, 1);
        document.querySelector(`#canvas_${areaOBJ.ID}`).remove();
      }
    }
  }, 5000).resume();
}

function drawObstacle() {
  let obstacleImage = new Image();
  if (this.type === "tree") {
    obstacleImage.src = "../images/tree.png";
  } else if (this.type === "lake") {
    obstacleImage.src = "../images/lake.png";
  } else if (this.type === "rock") {
    obstacleImage.src = "../images/rock.png";
  }

  let updatedCanvas = document.querySelector(`#canvas_obstacles${gameControls.level}`);
  if (!updatedCanvas) {
    updatedCanvas = document.createElement("canvas");
    updatedCanvas.setAttribute("id", `canvas_obstacles${gameControls.level}`);
    updatedCanvas.setAttribute("width", displayOBJ.width);
    updatedCanvas.setAttribute("height", displayOBJ.height);
    HTMLElements.display.appendChild(updatedCanvas);
  }
  let localCtx = updatedCanvas.getContext("2d");

  // NOTE: Hard-coding the values because 'this' keyword gets lost in the nested callback
  const posX = this.posX;
  const posY = this.posY;
  const width = this.width;
  const height = this.height;

  obstacleImage.onload = function () {
    localCtx.drawImage(obstacleImage, posX, posY, this.width, this.height);
  };
}

function checkIfDead() {
  if (this.currentHP <= 0) {
    for (let targetEnemy in arrayTracker.activeEnemies) {
      if (arrayTracker.activeEnemies[targetEnemy].ID === this.ID) {
        document.getElementById(`canvas_${this.ID}`).remove();
        arrayTracker.activeEnemies.splice(targetEnemy, 1);
        console.log("enemy removed");
        break;
      }
    }
    gameControls.enemiesDefeated++;

    checkNextLevel();
    gameControls.score += 50;
    return;
  }
}

function meleeAttack(faction) {
  if (!gameControls.isGamePaused) {
    // NOTE: check y axis (this is the full body of the character), then check the x axis (horizontal range)
    if (faction === "evil") {
      if (this.direction === "left") {
        for (let i = this.posY; i < this.posY + this.width; i++) {
          for (let j = this.posX; j > this.posX - this.range; j--) {
            for (let targetEnemy in arrayTracker.activeEnemies) {
              if (
                i >= arrayTracker.activeEnemies[targetEnemy].posY &&
                i <=
                  arrayTracker.activeEnemies[targetEnemy].posY +
                    arrayTracker.activeEnemies[targetEnemy].width &&
                j >= arrayTracker.activeEnemies[targetEnemy].posX &&
                j <=
                  arrayTracker.activeEnemies[targetEnemy].posX +
                    arrayTracker.activeEnemies[targetEnemy].width
              ) {
                if (freezeAttack) {
                  arrayTracker.activeEnemies[targetEnemy].effects = "freeze";
                  freezeAttack = false;
                }
                arrayTracker.activeEnemies[targetEnemy].currentHP -= this.damage;
                arrayTracker.activeEnemies[targetEnemy].checkIfDead();
                if (arrayTracker.activeEnemies[targetEnemy])
                  arrayTracker.activeEnemies[targetEnemy].draw();
                return;
              }
            }
          }
        }
      } else {
        for (let i = this.posY; i < this.posY + this.width; i++) {
          for (
            let j = this.posX;
            j < this.posX + this.width + this.range;
            j++
          ) {
            for (let targetEnemy in arrayTracker.activeEnemies) {
              if (
                i >= arrayTracker.activeEnemies[targetEnemy].posY &&
                i <=
                  arrayTracker.activeEnemies[targetEnemy].posY +
                    arrayTracker.activeEnemies[targetEnemy].width &&
                j >= arrayTracker.activeEnemies[targetEnemy].posX &&
                j <=
                  arrayTracker.activeEnemies[targetEnemy].posX +
                    arrayTracker.activeEnemies[targetEnemy].width
              ) {
                if (freezeAttack) {
                  arrayTracker.activeEnemies[targetEnemy].effects = "freeze";
                  freezeAttack = false;
                }
                arrayTracker.activeEnemies[targetEnemy].currentHP -= this.damage;
                arrayTracker.activeEnemies[targetEnemy].checkIfDead();
                if (arrayTracker.activeEnemies[targetEnemy])
                  arrayTracker.activeEnemies[targetEnemy].draw();
                return;
              }
            }
          }
        }
      }
      heroOBJ.isAttacking = true;
      heroOBJ.draw();
      let attackAnimationTimer = new Timer(() => {
        heroOBJ.isAttacking = false;
        heroOBJ.draw();
      }, 1000 / gameControls.fps).resume();
    } else {
      if (this.direction === "left") {
        for (let i = this.posY; i < this.posY + this.width; i++) {
          for (let j = this.posX; j > this.posX - this.range; j--) {
            if (
              i >= heroOBJ.posY &&
              i <= heroOBJ.posY + heroOBJ.width &&
              j >= heroOBJ.posX &&
              j <= heroOBJ.posX + heroOBJ.width
            ) {
              if (!heroOBJ.isShield) {
                heroOBJ.currentHP -= this.damage;
                heroOBJ.draw();
              }
              return;
            }
          }
        }
      } else {
        for (let i = this.posY; i < this.posY + this.width; i++) {
          for (
            let j = this.posX;
            j < this.posX + this.width + this.range;
            j++
          ) {
            if (
              i >= heroOBJ.posY &&
              i <= heroOBJ.posY + heroOBJ.width &&
              j >= heroOBJ.posX &&
              j <= heroOBJ.posX + heroOBJ.width
            ) {
              if (!heroOBJ.isShield) {
                heroOBJ.currentHP -= this.damage;
                heroOBJ.draw();
              }
              return;
            }
          }
        }
      }
      this.isAttacking = true;
      this.draw();
      let enemyAttackAnimationTimer = new Timer(() => {
        this.isAttacking = false;
        this.draw();
      }, 1000 / gameControls.fps).resume();
    }
  }
}

function arrowAttack(faction) {
  if (!gameControls.isGamePaused) {
    // NOTE: take the position of character and add half the width (so that arrow is released from center of character)
    let posY = this.posY + this.width / 2;
    let ID = "arrow" + new Date().getTime();
    let arrowRange = this.range;
    let arrowSpeed = 30;
    let arrowWidth = 50;
    let arrowHeight = 10;
    let special = "normal";

    if (faction === "evil") {
      if (heroOBJ.isTripleShot) {
        special = "tripleShot";
      } else {
        special = "normal";
      }
      if (this.direction === "left") {
        // NOTE: here it is only posX so that he fires from the front and not from the back
        let posX = this.posX;
        let arrow = new Projectile(
          "arrow",
          true,
          posX - arrowRange,
          this.direction,
          arrowSpeed,
          special,
          ID,
          posX,
          posY,
          arrowWidth,
          arrowHeight
        );
        arrow.draw = drawArrow;
        arrow.checkHit = checkIfProjectileHit;
        arrayTracker.activeArrows.push(arrow);
      } else {
        let posX = this.posX + this.width / 2;
        let arrow = new Projectile(
          "arrow",
          true,
          arrowRange + posX,
          this.direction,
          arrowSpeed,
          special,
          ID,
          posX,
          posY,
          arrowWidth,
          arrowHeight
        );
        arrow.draw = drawArrow;
        arrow.checkHit = checkIfProjectileHit;
        arrayTracker.activeArrows.push(arrow);
      }
      heroOBJ.isAttacking = true;
      let attackAnimationTimer = new Timer(() => {
        heroOBJ.isAttacking = false;
      }, 1000 / gameControls.fps).resume();
    } else {
      if (this.direction === "left") {
        // NOTE: here it is only posX so that he fires from the front and not from the back
        let posX = this.posX;
        let arrow = new Projectile(
          "arrow",
          false,
          posX - arrowRange,
          this.direction,
          arrowSpeed,
          special,
          ID,
          posX,
          posY,
          arrowWidth,
          arrowHeight
        );
        arrow.draw = drawArrow;
        arrow.checkHit = checkIfProjectileHit;
        arrayTracker.activeArrows.push(arrow);
      } else {
        let posX = this.posX + this.width / 2;
        let arrow = new Projectile(
          "arrow",
          false,
          arrowRange + posX,
          this.direction,
          arrowSpeed,
          special,
          ID,
          posX,
          posY,
          arrowWidth,
          arrowHeight
        );
        arrow.draw = drawArrow;
        arrow.checkHit = checkIfProjectileHit;
        arrayTracker.activeArrows.push(arrow);
      }
      this.isAttacking = true;
      let enemyAttackAnimationTimer = new Timer(() => {
        this.isAttacking = false;
      }, 1000 / gameControls.fps).resume();
    }
  }
}

function fireballAttack(faction) {
  if (!gameControls.isGamePaused) {
    // NOTE: take the position of character and add half the width (so that fireball is released from center of character)
    let posY = this.posY + this.width / 2;
    let ID = "fireball" + new Date().getTime();
    let fireballRange = this.range;
    let fireballSpeed = 30;
    let fireballWidth = 50;
    let fireballHeight = 10;
    let special = "normal";

    if (faction === "evil") {
      if (heroOBJ.isWildfire) {
        special = "wildfire";
      } else {
        special = "normal";
      }
      if (this.direction === "left") {
        // NOTE: here it is only posX so that he fires from the front and not from the back
        let posX = this.posX;
        let fireball = new Projectile(
          "fireball",
          true,
          posX - fireballRange,
          this.direction,
          fireballSpeed,
          special,
          ID,
          posX,
          posY,
          fireballWidth,
          fireballHeight
        );
        fireball.draw = drawFireball;
        fireball.checkHit = checkIfProjectileHit;
        arrayTracker.activeFireballs.push(fireball);
      } else {
        let posX = this.posX + this.width / 2;
        let fireball = new Projectile(
          "fireball",
          true,
          fireballRange + posX,
          this.direction,
          fireballSpeed,
          special,
          ID,
          posX,
          posY,
          fireballWidth,
          fireballHeight
        );
        fireball.draw = drawFireball;
        fireball.checkHit = checkIfProjectileHit;
        arrayTracker.activeFireballs.push(fireball);
      }
      heroOBJ.isAttacking = true;
      heroOBJ.draw();
      let attackAnimationTimer = new Timer(() => {
        heroOBJ.isAttacking = false;
        heroOBJ.draw();
      }, 1000 / gameControls.fps).resume();
    } else {
      special = "normal";
      if (this.direction === "left") {
        // NOTE: here it is only posX so that he fires from the front and not from the back
        let posX = this.posX;
        let fireball = new Projectile(
          "fireball",
          false,
          posX - fireballRange,
          this.direction,
          fireballSpeed,
          special,
          ID,
          posX,
          posY,
          fireballWidth,
          fireballHeight
        );
        fireball.draw = drawFireball;
        fireball.checkHit = checkIfProjectileHit;
        arrayTracker.activeFireballs.push(fireball);
      } else {
        let posX = this.posX + this.width / 2;
        let fireball = new Projectile(
          "fireball",
          false,
          fireballRange + posX,
          this.direction,
          fireballSpeed,
          special,
          ID,
          posX,
          posY,
          fireballWidth,
          fireballHeight
        );
        fireball.draw = drawFireball;
        fireball.checkHit = checkIfProjectileHit;
        arrayTracker.activeFireballs.push(fireball);
      }
      this.isAttacking = true;
      this.draw();
      let enemyAttackAnimationTimer = new Timer(() => {
        this.isAttacking = false;
        this.draw();
      }, 1000 / gameControls.fps).resume();
    }
  }
}

function checkIfProjectileHit(faction) {
  if (!gameControls.isGamePaused) {
    let projectileDamage = 0;
    if (this.type === "arrow") {
      projectileDamage = 2;
    } else if (this.type === "fireball") {
      projectileDamage = 1;
    }
    if (faction === "evil") {
      for (let targetEnemy in arrayTracker.activeEnemies) {
        if (
          this.posY >= arrayTracker.activeEnemies[targetEnemy].posY &&
          this.posY <=
            arrayTracker.activeEnemies[targetEnemy].posY +
              arrayTracker.activeEnemies[targetEnemy].height &&
          this.posX >= arrayTracker.activeEnemies[targetEnemy].posX &&
          this.posX <=
            arrayTracker.activeEnemies[targetEnemy].posX + arrayTracker.activeEnemies[targetEnemy].width
        ) {
          if (freezeAttack) {
            arrayTracker.activeEnemies[targetEnemy].effects = "freeze";
            freezeAttack = false;
          }
          arrayTracker.activeEnemies[targetEnemy].currentHP -= projectileDamage;
          arrayTracker.activeEnemies[targetEnemy].checkIfDead();
          if (arrayTracker.activeEnemies[targetEnemy]) arrayTracker.activeEnemies[targetEnemy].draw();
          if (this.special === "wildfire") {
            let ID = "wildfire" + new Date().getTime();
            let wildfireArea = new Area(
              "wildfire",
              ID,
              this.posX,
              this.posY,
              80
            );
            arrayTracker.activeAreas.push(wildfireArea);
            drawArea(wildfireArea);
          }
          if (this.type === "arrow") {
            for (let target in arrayTracker.activeArrows) {
              if (arrayTracker.activeArrows[target].ID === this.ID) {
                arrayTracker.activeArrows.splice(target, 1);
                if (document.querySelector(`#canvas_${this.ID}`))
                  document.querySelector(`#canvas_${this.ID}`).remove();
              }
            }
          } else {
            for (let target in arrayTracker.activeFireballs) {
              if (arrayTracker.activeFireballs[target].ID === this.ID) {
                arrayTracker.activeFireballs.splice(target, 1);
                if (document.querySelector(`#canvas_${this.ID}`))
                  document.querySelector(`#canvas_${this.ID}`).remove();
              }
            }
          }
          return;
        }
      }
    } else {
      if (
        this.posY >= heroOBJ.posY &&
        this.posY <= heroOBJ.posY + heroOBJ.width &&
        this.posX >= heroOBJ.posX &&
        this.posX <= heroOBJ.posX + heroOBJ.width
      ) {
        if (!heroOBJ.isShield) {
          heroOBJ.currentHP -= projectileDamage;
          heroOBJ.draw();
        }
        if (this.special === "wildfire") {
          let ID = "wildfire" + new Date().getTime();
          let wildfireArea = new Area("wildfire", ID, this.posX, this.posY, 80);
          arrayTracker.activeAreas.push(wildfireArea);
          drawArea(wildfireArea);
        }
        if (this.type === "arrow") {
          for (let target in arrayTracker.activeArrows) {
            if (arrayTracker.activeArrows[target].ID === this.ID) {
              arrayTracker.activeArrows.splice(target, 1);
              if (document.querySelector(`#canvas_${this.ID}`))
                document.querySelector(`#canvas_${this.ID}`).remove();
            }
          }
        } else {
          for (let target in arrayTracker.activeFireballs) {
            if (arrayTracker.activeFireballs[target].ID === this.ID) {
              arrayTracker.activeFireballs.splice(target, 1);
              if (document.querySelector(`#canvas_${this.ID}`))
                document.querySelector(`#canvas_${this.ID}`).remove();
            }
          }
        }

        return;
      }
    }

    if (this.direction === "left") {
      this.posX -= this.speed;
      this.draw();
      // NOTE: greater than or equal sign to make the range consistent
      if (this.posX <= this.range || this.posX < 0) {
        if (this.type === "arrow") {
          for (let target in arrayTracker.activeArrows) {
            if (arrayTracker.activeArrows[target].ID === this.ID) {
              arrayTracker.activeArrows.splice(target, 1);
              if (document.querySelector(`#canvas_${this.ID}`))
                document.querySelector(`#canvas_${this.ID}`).remove();
            }
          }
        } else {
          for (let target in arrayTracker.activeFireballs) {
            if (arrayTracker.activeFireballs[target].ID === this.ID) {
              if (arrayTracker.activeFireballs[target].special === "wildfire") {
                let ID = "wildfire" + new Date().getTime();
                let wildfireArea = new Area(
                  "wildfire",
                  ID,
                  this.posX,
                  this.posY,
                  80
                );
                arrayTracker.activeAreas.push(wildfireArea);
                drawArea(wildfireArea);
              }
              arrayTracker.activeFireballs.splice(target, 1);
              if (document.querySelector(`#canvas_${this.ID}`))
                document.querySelector(`#canvas_${this.ID}`).remove();
            }
          }
        }
      }
      for (let index in arrayTracker.noAttackObstacles) {
        let obstacle = arrayTracker.noAttackObstacles[index];
        if (
          (this.posY >= obstacle.posY &&
            this.posY <= obstacle.posY + obstacle.height) ||
          (this.posY + this.height >= obstacle.posY &&
            this.posY + this.height <= obstacle.posY + obstacle.height)
        ) {
          if (
            this.posX >= obstacle.posX &&
            this.posX < obstacle.posX + obstacle.width
          ) {
            if (this.type === "arrow") {
              for (let target in arrayTracker.activeArrows) {
                if (arrayTracker.activeArrows[target].ID === this.ID) {
                  arrayTracker.activeArrows.splice(target, 1);
                  document.querySelector(`#canvas_${this.ID}`).remove();
                }
              }
            } else {
              for (let target in arrayTracker.activeFireballs) {
                if (arrayTracker.activeFireballs[target].ID === this.ID) {
                  if (arrayTracker.activeFireballs[target].special === "wildfire") {
                    let ID = "wildfire" + new Date().getTime();
                    let wildfireArea = new Area(
                      "wildfire",
                      ID,
                      this.posX,
                      this.posY,
                      80
                    );
                    arrayTracker.activeAreas.push(wildfireArea);
                    drawArea(wildfireArea);
                  }
                  arrayTracker.activeFireballs.splice(target, 1);
                  document.querySelector(`#canvas_${this.ID}`).remove();
                }
              }
            }
          }
        }
      }
    } else {
      this.posX += this.speed;
      this.draw();
      if (this.posX > this.range || this.posX + this.width >= canvas.width) {
        if (this.type === "arrow") {
          for (let target in arrayTracker.activeArrows) {
            if (arrayTracker.activeArrows[target].ID === this.ID) {
              arrayTracker.activeArrows.splice(target, 1);
              if (document.querySelector(`#canvas_${this.ID}`))
                document.querySelector(`#canvas_${this.ID}`).remove();
            }
          }
        } else {
          for (let target in arrayTracker.activeFireballs) {
            if (arrayTracker.activeFireballs[target].ID === this.ID) {
              if (arrayTracker.activeFireballs[target].special === "wildfire") {
                let ID = "wildfire" + new Date().getTime();
                let wildfireArea = new Area(
                  "wildfire",
                  ID,
                  this.posX,
                  this.posY,
                  80
                );
                arrayTracker.activeAreas.push(wildfireArea);
                drawArea(wildfireArea);
              }
              arrayTracker.activeFireballs.splice(target, 1);
              if (document.querySelector(`#canvas_${this.ID}`))
                document.querySelector(`#canvas_${this.ID}`).remove();
            }
          }
        }
      }
      for (let index in arrayTracker.noAttackObstacles) {
        let obstacle = arrayTracker.noAttackObstacles[index];
        if (
          (this.posY >= obstacle.posY &&
            this.posY <= obstacle.posY + obstacle.height) ||
          (this.posY + this.height >= obstacle.posY &&
            this.posY + this.height <= obstacle.posY + obstacle.height)
        ) {
          if (
            this.posX + this.width >= obstacle.posX &&
            this.posX + this.width < obstacle.posX + obstacle.width
          ) {
            if (this.type === "arrow") {
              for (let target in arrayTracker.activeArrows) {
                if (arrayTracker.activeArrows[target].ID === this.ID) {
                  arrayTracker.activeArrows.splice(target, 1);
                  if (document.querySelector(`#canvas_${this.ID}`))
                    document.querySelector(`#canvas_${this.ID}`).remove();
                }
              }
            } else {
              for (let target in arrayTracker.activeFireballs) {
                if (arrayTracker.activeFireballs[target].ID === this.ID) {
                  if (arrayTracker.activeFireballs[target].special === "wildfire") {
                    let ID = "wildfire" + new Date().getTime();
                    let wildfireArea = new Area(
                      "wildfire",
                      ID,
                      this.posX,
                      this.posY,
                      80
                    );
                    arrayTracker.activeAreas.push(wildfireArea);
                    drawArea(wildfireArea);
                  }
                  arrayTracker.activeFireballs.splice(target, 1);
                  if (document.querySelector(`#canvas_${this.ID}`))
                    document.querySelector(`#canvas_${this.ID}`).remove();
                }
              }
            }
          }
        }
      }
    }
  }
}

function spawnLoot(lootType) {
  if (!gameControls.hasLootSpawned) {
    let lootWidth = 50;
    let lootHeight = 50;
    let position = randomCoords();
    let ID = lootType + "" + new Date().getTime();
    let loot = new Loot(
      lootType,
      ID,
      position.posX,
      position.posY,
      lootWidth,
      lootHeight
    );
    loot.draw = drawLoot;
    loot.acquireLoot = getLoot;
    availableLoot.push(loot);
    loot.draw();
    gameControls.hasLootSpawned = true;
  }
}

function getLoot() {
  if (
    ((this.posX >= heroOBJ.posX && this.posX <= heroOBJ.posX + heroOBJ.width) ||
      (this.posX + this.width >= heroOBJ.posX &&
        this.posX + this.width <= heroOBJ.posX + heroOBJ.width)) &&
    ((this.posY >= heroOBJ.posY &&
      this.posY <= heroOBJ.posY + heroOBJ.height) ||
      (this.posY + this.height >= heroOBJ.posY &&
        this.posY + this.height <= heroOBJ.posY + heroOBJ.height))
  ) {
    for (let i = 0; i < 5; i++) {
      if (!arrayTracker.inventory[i]) {
        arrayTracker.inventory[i] = this;
        break;
      }
    }
    for (let slot in HTMLElements.inventoryDisplay) {
      if (
        HTMLElements.inventoryDisplay[slot].firstChild.getAttribute("src") ===
        "../images/blank.png"
      ) {
        if (this.type === "healing_potion") {
          HTMLElements.inventoryDisplay[slot].firstChild.setAttribute(
            "src",
            "../images/healing_potion.png"
          );
        } else if (this.type === "freezeSpell") {
          HTMLElements.inventoryDisplay[slot].firstChild.setAttribute(
            "src",
            "../images/freezeSpell.png"
          );
        }
        for (let loot in availableLoot) {
          if (availableLoot[loot].ID === this.ID) {
            availableLoot.splice(loot, 1);
            if (document.querySelector(`#canvas_${this.ID}`))
              document.querySelector(`#canvas_${this.ID}`).remove();
            break;
          }
        }
        return;
      }
    }
  }
}

function drawLoot() {
  // NOTE: check for pre-existing canvas
  if (document.getElementById(`canvas_${this.ID}`)) {
    document.getElementById(`canvas_${this.ID}`).remove();
  }

  // NOTE: create updated canvas
  let updatedCanvas = document.createElement("canvas");
  updatedCanvas.setAttribute("id", `canvas_${this.ID}`);
  updatedCanvas.setAttribute("width", displayOBJ.width);
  updatedCanvas.setAttribute("height", displayOBJ.height);
  HTMLElements.display.appendChild(updatedCanvas);
  let localCtx = updatedCanvas.getContext("2d");

  let lootImage = new Image();
  if (this.type === "healing_potion") {
    lootImage.src = "../images/healing_potion.png";
  } else if (this.type === "freezeSpell") {
    lootImage.src = "../images/freezeSpell.png";
  }
  lootImage.onload = () => {
    localCtx.drawImage(
      lootImage,
      this.posX,
      this.posY,
      this.width,
      this.height
    );
  };
}

function shield() {
  this.isShield = true;
  let activeShieldTimer = new Timer(() => {
    this.isShield = false;
    this.draw();
  }, 5000).resume();
}

function tripleShot() {
  this.isTripleShot = true;
  this.attack("evil");
  this.attack("evil");
  this.attack("evil");
  this.isTripleShot = false;
  this.draw();
}

function wildfire() {
  this.isWildfire = true;
  this.attack("evil");
  this.isWildfire = false;
  this.draw();
}

function goddess() {
  this.isGoddess = true;
  heroOBJ.speed = 20;
  heroOBJ.attackCooldown = 150;
  this.damage = this.damage * 2;
  let activeGoddessTimer = new Timer(() => {
    this.isGoddess = false;
    heroOBJ.speed = 15;
    heroOBJ.attackCooldown = 300;
    this.damage = this.damage / 2;
    this.draw();
  }, 5000).resume();
}

function handleEnemyAttack() {
  for (let targetEnemy in arrayTracker.activeEnemies) {
    if (arrayTracker.activeEnemies[targetEnemy].effects !== "freeze") {
      arrayTracker.activeEnemies[targetEnemy].attack("good");
    }
  }
}

function spawnRandomLoot() {
  let lootTypes = ["healing_potion", "freezeSpell"];
  let index = Math.floor(Math.random() * lootTypes.length);
  return lootTypes[index];
}

function Character(
  totalHP,
  currentHP,
  speed,
  direction,
  range,
  damage,
  attackCooldown,
  abilityCooldown,
  effects,
  posX,
  posY,
  width,
  height
) {
  this.totalHP = totalHP;
  this.currentHP = currentHP;
  this.speed = speed;
  this.direction = direction;
  this.range = range;
  this.damage = damage;
  this.attackCooldown = attackCooldown;
  this.abilityCooldown = abilityCooldown;
  this.effects = effects;
  this.posX = posX;
  this.posY = posY;
  this.width = width;
  this.height = height;
}

function Projectile(
  type,
  attacksEvil,
  range,
  direction,
  speed,
  special,
  ID,
  posX,
  posY,
  width,
  height
) {
  this.type = type;
  this.attacksEvil = attacksEvil;
  this.range = range;
  this.direction = direction;
  this.speed = speed;
  this.special = special;
  this.ID = ID;
  this.posX = posX;
  this.posY = posY;
  this.width = width;
  this.height = height;
}

function Loot(type, ID, posX, posY, width, height) {
  this.type = type;
  this.ID = ID;
  this.posX = posX;
  this.posY = posY;
  this.width = width;
  this.height = height;
}

function Area(type, ID, posX, posY, radius) {
  this.type = type;
  this.ID = ID;
  this.posX = posX;
  this.posY = posY;
  this.radius = radius;
}

function Obstacle(type, posX, posY) {
  this.type = type;
  this.posX = posX;
  this.posY = posY;
}

Obstacle.prototype.ID = this.type + new Date().getTime();

Obstacle.prototype.width = 100;

Obstacle.prototype.height = 100;

Obstacle.prototype.draw = drawObstacle;

function randomCoords() {
  let coordX = Math.floor(Math.random() * (canvas.width - 2 * 75)) + 75;
  let coordY = Math.floor(Math.random() * (canvas.height - 2 * 60)) + 60;
  // NOTE: The numbers at the end are for the size of the object that is being spawned. 75 and 60 are the width and height respectively. We do not want the objects to spawn right on the edge

  for (let index in arrayTracker.obstaclesArray) {
    let obstacle = arrayTracker.obstaclesArray[index];
    if (
      ((coordY > obstacle.posY && coordY < obstacle.posY + obstacle.height) ||
        (coordY + 75 > obstacle.posY &&
          coordY + 75 < obstacle.posY + obstacle.height)) &&
      ((coordX > obstacle.posX && coordX < obstacle.posX + obstacle.width) ||
        (coordX + 75 > obstacle.posX &&
          coordX + 75 < obstacle.posX + obstacle.width))
    ) {
      // NOTE: The 75 is the value for the character's width and height
      return randomCoords();
    }
  }
  return {
    posX: coordX,
    posY: coordY,
  };
}

function gameOver() {
  if (!gameControls.isGameOver) {
    HTMLElements.menu.style = "display: none";
    localStorage.clear();
    HTMLElements.gameOverPrompt.innerHTML = "Game Over!<br>Your score is: " + gameControls.score + "<br>";
    let restartButton = document.createElement("button");
    restartButton.innerHTML = "Play Again";
    restartButton.onclick = () => {
      location.href = "../index.html";
    };
    HTMLElements.gameOverPrompt.appendChild(restartButton);
    HTMLElements.gameOverPrompt.style.display = "inline-block";
    gameControls.isGameOver = true;
    gameControls.isGamePaused = true;
  }
}

function handleLevelComplete() {
  heroOBJ.posX = 60;
  heroOBJ.posY = 60;
  heroMovement = {
    forward: false,
    backward: false,
    up: false,
    down: false,
  };
  heroAttack = {
    attack: false,
    ability: false,
  };
  gameControls.isGamePaused = true;
  gameControls.hasLootSpawned = false;
  arrayTracker.obstaclesArray = [];
  arrayTracker.noAttackObstacles = [];
  if (document.querySelector(`#canvas_obstacles${gameControls.level}`))
    document.querySelector(`#canvas_obstacles${gameControls.level}`).remove();

  if (gameControls.level === 1) {
    HTMLElements.levelHeading.innerHTML = "Level 2: Sloriye Woods";
    HTMLElements.level1CompletedPrompt.style.display = "inline-block";
    HTMLElements.nextLevelButton1.onclick = () => {
      HTMLElements.level1CompletedPrompt.style.display = "none";
      gameControls.level++;
      gameControls.isGamePaused = false;
      levelControl();
    };
  } else if (gameControls.level === 2) {
    HTMLElements.levelHeading.innerHTML = "Level 3: Nundir Castle";
    HTMLElements.level2CompletedPrompt.style.display = "inline-block";
    HTMLElements.nextLevelButton2.onclick = () => {
      HTMLElements.level2CompletedPrompt.style.display = "none";
      gameControls.level++;
      gameControls.isGamePaused = false;
      levelControl();
    };
  } else if (gameControls.level === 3) {
    HTMLElements.levelHeading.innerHTML = "Level 4: Dürig's Tomb";
    HTMLElements.level3CompletedPrompt.style.display = "inline-block";
    HTMLElements.nextLevelButton3.onclick = () => {
      HTMLElements.level3CompletedPrompt.style.display = "none";
      gameControls.level++;
      gameControls.isGamePaused = false;
      levelControl();
    };
  } else if (gameControls.level === 4) {
    HTMLElements.levelHeading.innerHTML = "Game Complete!";
    HTMLElements.level4CompletedPrompt.style.display = "inline-block";
    HTMLElements.nextLevelButton4.onclick = () => {
      location.href = '../index.html';
    };
  }
}

function checkNextLevel() {
  if (gameControls.enemiesDefeated % 5 === 0) {
    handleLevelComplete();
  }
}

function saveGameState() {
  let gameState = {
    gameType: "story",
    gameLevel: gameControls.level,
    heroType: heroType,
    heroOBJ: heroOBJ,
    score: gameControls.score,
    enemiesDefeated: gameControls.enemiesDefeated,
    inventory: arrayTracker.inventory,
    hasLootSpawned: gameControls.hasLootSpawned,
  };

  localStorage.setItem("gameState", JSON.stringify(gameState));
}

console.log(`Happy Sweet 1️⃣6️⃣, Sis! ❤🎉🎁,\nFrom your big Bro!🐵\n@2022`);

// * Cheat code
function jumpToLevel(level) {
  gameControls.level = level-1;
  handleLevelComplete();
}
