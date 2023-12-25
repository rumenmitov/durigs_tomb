const socket = io();
socket.on('connect', ()=>{
  console.log('connection made');
});
const CLIENT_ID = 'client_' + Math.floor(10000 * Math.random());

let timersArray = [];
let intervalsArray = [];

// NOTE: images
let heroImageLeft = new Image();
let heroImageAttackLeft = new Image();
let heroImageRight = new Image();
let heroImageAttackRight = new Image();
let arrowImageLeft = new Image();
let arrowImageRight = new Image();
let fireballImageLeft = new Image();
let fireballImageRight = new Image();
let wildfireImageLeft = new Image();
let wildfireImageRight = new Image();
heroImageLeft.src = "../images/character_art_left.png";
heroImageAttackLeft.src = "../images/character_art_left_attack.png";
heroImageRight.src = "../images/character_art_right.png";
heroImageAttackRight.src = "../images/character_art_right_attack.png";
arrowImageLeft.src = "../images/arrows_pack_left.png";
arrowImageRight.src = "../images/arrows_pack_right.png";
fireballImageLeft.src = "../images/fireball_left.png";
fireballImageRight.src = "../images/fireball_right.png";
wildfireImageLeft.src = "../images/wildfire_left.png";
wildfireImageRight.src = "../images/wildfire_right.png";



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
};

let heroType = parseInt(prompt('enter character type'));
let heroOBJ;
let enemyOBJ;
let gameState;
let heroCanvasTracker = 0;

let canvas;
let ctx;
let HTMLElements = {};

let displayOBJ;

let gameControls = {
  fps: 10,
  isGameOver: false,
  hasLootSpawned: false
};

let arrayTracker = {
  activeArrows: [],
  activeFireballs: [],
  activeAreas: [],
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
  CLIENT_ID,
  heroType,
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

  HTMLElements.levelHeading.innerHTML = "Everdeen Plains";

  HTMLElements.startButton.onclick = () => {
    document.querySelector("#starterPrompt").remove();
    socket.emit('clientReady');
  };

  HTMLElements.quitButton.onclick = () => {
    location.href = "../index.html";
  };
};

function drawDisplay() {
  gameControls.fps = 10;

  ctx = canvas.getContext("2d");

  ctx.fillStyle = "green";

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

  ctx.fillRect(0, 0, displayOBJ.width, displayOBJ.height);
  heroOBJ.draw();
}

function generateCanvas() {
    handleHero();

    for (let target in arrayTracker.activeArrows) {
      if (arrayTracker.activeArrows[target].source === CLIENT_ID) {
        arrayTracker.activeArrows[target].checkHit();
      }
    }
    for (let target in arrayTracker.activeFireballs) {
      if (arrayTracker.activeFireballs[target].source === CLIENT_ID) {
        arrayTracker.activeFireballs[target].checkHit();
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
}

addEventListener("keydown", function (event) {
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
});

addEventListener("keyup", function (event) {
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
        socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[0].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        socket.emit('freeze', CLIENT_ID);
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
        socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[1].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        socket.emit('freeze', CLIENT_ID);
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
        socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[2].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        socket.emit('freeze', CLIENT_ID);
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
        socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[3].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        socket.emit('freeze', CLIENT_ID);
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
        socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
        heroOBJ.draw();
      } else if (
        HTMLElements.inventoryDisplay[4].firstChild.getAttribute("src") ===
        "../images/freezeSpell.png"
      ) {
        freezeAttack = true;
        socket.emit('freeze', CLIENT_ID);
        heroOBJ.draw();
      }
      HTMLElements.inventoryDisplay[4].firstChild.setAttribute("src", "../images/blank.png");
    }
  } 
});

function handleHero() {
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
            socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
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
            socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
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
            socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
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
            socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
            return;
          }
        }
      }
      heroOBJ.posY += heroOBJ.speed;
    }
    heroOBJ.draw();
  }

  for (let target in arrayTracker.activeAreas) {
    if (
      Math.abs(heroOBJ.posX + heroOBJ.width / 2 - arrayTracker.activeAreas[target].posX) <=
        arrayTracker.activeAreas[target].radius &&
      Math.abs(heroOBJ.posY + heroOBJ.height / 2 - arrayTracker.activeAreas[target].posY) <=
        arrayTracker.activeAreas[target].radius
    ) {
      if (!heroOBJ.fireDamageLock && CLIENT_ID !== arrayTracker.activeAreas[target].source) {
        heroOBJ.currentHP -= damageOBJ.fire;
        heroOBJ.fireDamageLock = true;
        socket.emit('handleHero', heroOBJ);
        let wildfireDamageLockTimer = new Timer(() => {
          heroOBJ.fireDamageLock = false;
          socket.emit('handleHero', heroOBJ);
        }, 1000).resume();
      }
    }
  }

  if (heroAttack.attack) {
    // NOTE: k key
    if (!heroOBJ.attackLock) {
      heroOBJ.attack("evil");
      heroOBJ.attackLock = true;
    } else {
      socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
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
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
}

function drawHero() {

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

  let heroImage = null;
  let heroWidthHelper;
  if (this.direction === "left") {
    heroImage = heroImageLeft;
    heroWidthHelper = 10;
  } else {
    heroImage = heroImageRight;
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
        heroImage = heroImageAttackLeft;
      } else {
        heroImage = heroImageAttackRight;
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
  // };

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

function drawEnemy() {
  // NOTE: create updated canvas
  if (document.querySelector('#canvas_enemy')) {document.querySelector('#canvas_enemy').remove();}
  let updatedCanvas = document.createElement("canvas");

  updatedCanvas.setAttribute("id", `canvas_enemy`);
  updatedCanvas.setAttribute("width", displayOBJ.width);
  updatedCanvas.setAttribute("height", displayOBJ.height);
  HTMLElements.display.appendChild(updatedCanvas);
  let localCtx = updatedCanvas.getContext("2d");

  let heroImage = null;
  let heroWidthHelper;
  if (this.direction === "left") {
    heroImage = heroImageLeft;
    heroWidthHelper = 10;
  } else {
    heroImage = heroImageRight;
    heroWidthHelper = 12;
  }
  let abilityImage = new Image();
  if (this.type == 1) {
    abilityImage.src = "../images/shieldIcon.png";
  } else if (this.type == 2) {
    abilityImage.src = "../images/arrowIcon.png";
  } else if (this.type == 3) {
    abilityImage.src = "../images/fireIcon.png";
  } else if (this.type == 4) {
    abilityImage.src = "../images/goddessIcon.png";
  }

  if (this.type == 1) {
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
  } else if (this.type == 2) {
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
  } else if (this.type == 3) {
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
  } else if (this.type == 4) {
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

  localCtx.fillStyle = "red";
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
      heroImage = heroImageAttackLeft;
    } else {
      heroImage = heroImageAttackRight;
    }
  }

  if (this.type == 1) {
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
  } else if (this.type == 2) {
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
  } else if (this.type == 3) {
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
  } else if (this.type == 4) {
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
  socket.emit('handleArrayTracker', arrayTracker);
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

  let arrowImage;
  if (this.direction === "left") {
    arrowImage = arrowImageLeft;
  } else {
    arrowImage = arrowImageRight;
  }


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

  setTimeout(()=>{
    if (document.getElementById(`canvas_${this.ID}`)) {
      document.getElementById(`canvas_${this.ID}`).remove();
    }
  }, 700);

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

  let fireballImage;
  if (this.direction === "left") {
    if (this.special === "wildfire") {
      fireballImage = wildfireImageLeft;
    } else {
      fireballImage = fireballImageLeft;
    }
  } else {
    if (this.special === "wildfire") {
      fireballImage = wildfireImageRight;
    } else {
      fireballImage = fireballImageRight;
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
    socket.emit('removeElement', areaOBJ.ID);
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
        socket.emit('handleArrayTracker', arrayTracker);
        document.querySelector(`#canvas_${areaOBJ.ID}`).remove();
        socket.emit('removeElement', areaOBJ.ID);
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

function meleeAttack() {
  // NOTE: check y axis (this is the full body of the character), then check the x axis (horizontal range)
  if (this.ID === CLIENT_ID) {
    if (this.direction === "left") {
      for (let i = this.posY; i < this.posY + this.width; i++) {
        for (let j = this.posX; j > this.posX - this.range; j--) {
          if (
            i >= enemyOBJ.posY &&
            i <=
              enemyOBJ.posY +
                enemyOBJ.width &&
            j >= enemyOBJ.posX &&
            j <=
              enemyOBJ.posX +
                enemyOBJ.width
          ) {
            if (freezeAttack) {
              enemyOBJ.effects = "freeze";
              freezeAttack = false;
            }

            if (!enemyOBJ.isShield) {
              enemyOBJ.currentHP -= this.damage;
            }

            if (enemyOBJ) {
              enemyOBJ.draw();
            }

            heroOBJ.isAttacking = true;
            heroOBJ.draw();
            let attackAnimationTimer = new Timer(() => {
              heroOBJ.isAttacking = false;
              heroOBJ.draw();
              socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
            }, 1000 / gameControls.fps).resume();

            socket.emit('handleHero', [ enemyOBJ.ID, enemyOBJ ]);
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
            i >= enemyOBJ.posY &&
            i <=
              enemyOBJ.posY +
                enemyOBJ.width &&
            j >= enemyOBJ.posX &&
            j <=
              enemyOBJ.posX +
                enemyOBJ.width
          ) {
            if (freezeAttack) {
              enemyOBJ.effects = "freeze";
              freezeAttack = false;
            }
            if (!enemyOBJ.isShield) {
              enemyOBJ.currentHP -= this.damage;
            }

            if (enemyOBJ) {
              enemyOBJ.draw();
            }

            heroOBJ.isAttacking = true;
            heroOBJ.draw();
            let attackAnimationTimer = new Timer(() => {
              heroOBJ.isAttacking = false;
              heroOBJ.draw();
              socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
            }, 1000 / gameControls.fps).resume();

            socket.emit('handleHero', [ enemyOBJ.ID, enemyOBJ ]);
            return;
          }
        }
      }
    }
    heroOBJ.isAttacking = true;
    heroOBJ.draw();
    let attackAnimationTimer = new Timer(() => {
      heroOBJ.isAttacking = false;
      heroOBJ.draw();
      socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
    }, 1000 / gameControls.fps).resume();
    socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
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
            socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
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
            socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
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
      socket.emit('handleHero', [ enemyOBJ.ID, enemyOBJ ]);
    }, 1000 / gameControls.fps).resume();
    socket.emit('handleHero', [ enemyOBJ.ID, enemyOBJ ]);
  }
}

function arrowAttack() {
  // NOTE: take the position of character and add half the width (so that arrow is released from center of character)
  let posY = this.posY + this.width / 2;
  let ID = "arrow" + new Date().getTime();
  let arrowRange = this.range;
  let arrowSpeed = 30;
  let arrowWidth = 50;
  let arrowHeight = 10;
  let special = "normal";

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
      CLIENT_ID,
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
      CLIENT_ID,
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
  socket.emit('handleArrayTracker', arrayTracker);
  heroOBJ.isAttacking = true;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  let attackAnimationTimer = new Timer(() => {
    heroOBJ.isAttacking = false;
    socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  }, 1000 / gameControls.fps).resume();
}

function fireballAttack() {
  // NOTE: take the position of character and add half the width (so that fireball is released from center of character)
  let posY = this.posY + this.width / 2;
  let ID = "fireball" + new Date().getTime();
  let fireballRange = this.range;
  let fireballSpeed = 30;
  let fireballWidth = 50;
  let fireballHeight = 10;
  let special = "normal";

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
      CLIENT_ID,
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
      CLIENT_ID,
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
  socket.emit('handleArrayTracker', arrayTracker);
  heroOBJ.isAttacking = true;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  heroOBJ.draw();
  let attackAnimationTimer = new Timer(() => {
    heroOBJ.isAttacking = false;
    socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
    heroOBJ.draw();
  }, 1000 / gameControls.fps).resume();
}

function checkIfProjectileHit() {
  let projectileDamage = 0;
  if (this.type === "arrow") {
    projectileDamage = 2;
  } else if (this.type === "fireball") {
    projectileDamage = 1;
  }

  // Only chcking if enemy is hit on each client
  if (
    this.posY >= enemyOBJ.posY &&
    this.posY <=
      enemyOBJ.posY +
        enemyOBJ.height &&
    this.posX >= enemyOBJ.posX &&
    this.posX <=
      enemyOBJ.posX + enemyOBJ.width
  ) {
    if (freezeAttack) {
      enemyOBJ.effects = "freeze";
      freezeAttack = false;
    }

    if (!enemyOBJ.isShield) {
      enemyOBJ.currentHP -= projectileDamage;
    }
    socket.emit('handleHero', [ enemyOBJ.ID, enemyOBJ ]);

    if (this.special === "wildfire") {
      let ID = "wildfire" + new Date().getTime();
      let wildfireArea = new Area(
        "wildfire",
        CLIENT_ID,
        ID,
        this.posX,
        this.posY,
        80
      );
      arrayTracker.activeAreas.push(wildfireArea);
      socket.emit('handleArrayTracker', arrayTracker);
      drawArea(wildfireArea);
    }
    if (this.type === "arrow") {
      for (let target in arrayTracker.activeArrows) {
        if (arrayTracker.activeArrows[target].ID === this.ID) {
          if (document.querySelector(`#canvas_${this.ID}`)) {
            document.querySelector(`#canvas_${this.ID}`).remove();
            socket.emit('removeElement', this.ID);
          }
          arrayTracker.activeArrows.splice(target, 1);
          socket.emit('handleArrayTracker', arrayTracker);
        }
      }
    } else {
      for (let target in arrayTracker.activeFireballs) {
        if (arrayTracker.activeFireballs[target].ID === this.ID) {
          if (document.querySelector(`#canvas_${this.ID}`)) {
            document.querySelector(`#canvas_${this.ID}`).remove();
            socket.emit('removeElement', this.ID);
          }
          arrayTracker.activeFireballs.splice(target, 1);
          socket.emit('handleArrayTracker', arrayTracker);
        }
      }
    }
    return;
  }

  if (this.direction === "left") {
    this.posX -= this.speed;
    socket.emit('handleArrayTracker', arrayTracker);
    this.draw();
    // NOTE: greater than or equal sign to make the range consistent
    if (this.posX <= this.range || this.posX < 0) {
      if (this.type === "arrow") {
        for (let target in arrayTracker.activeArrows) {
          if (arrayTracker.activeArrows[target].ID === this.ID) {
            if (document.querySelector(`#canvas_${this.ID}`)) { 
              document.querySelector(`#canvas_${this.ID}`).remove();
              socket.emit('removeElement', this.ID);
            }
            arrayTracker.activeArrows.splice(target, 1);
            socket.emit('handleArrayTracker', arrayTracker);
          }
        }
      } else {
        for (let target in arrayTracker.activeFireballs) {
          if (arrayTracker.activeFireballs[target].ID === this.ID) {
            if (arrayTracker.activeFireballs[target].special === "wildfire") {
              let ID = "wildfire" + new Date().getTime();
              let wildfireArea = new Area(
                "wildfire",
                CLIENT_ID,
                ID,
                this.posX,
                this.posY,
                80
              );
              arrayTracker.activeAreas.push(wildfireArea);
              socket.emit('handleArrayTracker', arrayTracker);
              drawArea(wildfireArea);
            }
            if (document.querySelector(`#canvas_${this.ID}`)) {
              document.querySelector(`#canvas_${this.ID}`).remove();
              socket.emit('removeElement', this.ID);
            }
            arrayTracker.activeFireballs.splice(target, 1);
            socket.emit('handleArrayTracker', arrayTracker);
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
                document.querySelector(`#canvas_${this.ID}`).remove();
                socket.emit('removeElement', this.ID);
              }
              arrayTracker.activeArrows.splice(target, 1);
              socket.emit('handleArrayTracker', arrayTracker);
            }
          } else {
            for (let target in arrayTracker.activeFireballs) {
              if (arrayTracker.activeFireballs[target].ID === this.ID) {
                if (arrayTracker.activeFireballs[target].special === "wildfire") {
                  let ID = "wildfire" + new Date().getTime();
                  let wildfireArea = new Area(
                    "wildfire",
                    CLIENT_ID,
                    ID,
                    this.posX,
                    this.posY,
                    80
                  );
                  arrayTracker.activeAreas.push(wildfireArea);
                  socket.emit('handleArrayTracker', arrayTracker);
                  drawArea(wildfireArea);
                }
                arrayTracker.activeFireballs.splice(target, 1);
                socket.emit('handleArrayTracker', arrayTracker);
                document.querySelector(`#canvas_${this.ID}`).remove();
                socket.emit('removeElement', this.ID);
              }
            }
          }
        }
      }
    }
  } else {
    this.posX += this.speed;
    socket.emit('handleArrayTracker', arrayTracker);
    this.draw();
    if (this.posX > this.range || this.posX + this.width >= canvas.width) {
      if (this.type === "arrow") {
        for (let target in arrayTracker.activeArrows) {
          if (arrayTracker.activeArrows[target].ID === this.ID) {
            if (document.querySelector(`#canvas_${this.ID}`)) {
              document.querySelector(`#canvas_${this.ID}`).remove();
              socket.emit('removeElement', this.ID);
            }
            arrayTracker.activeArrows.splice(target, 1);
            socket.emit('handleArrayTracker', arrayTracker);
          }
        }
      } else {
        for (let target in arrayTracker.activeFireballs) {
          if (arrayTracker.activeFireballs[target].ID === this.ID) {
            if (arrayTracker.activeFireballs[target].special === "wildfire") {
              let ID = "wildfire" + new Date().getTime();
              let wildfireArea = new Area(
                "wildfire",
                CLIENT_ID,
                ID,
                this.posX,
                this.posY,
                80
              );
              arrayTracker.activeAreas.push(wildfireArea);
              socket.emit('handleArrayTracker', arrayTracker);
              drawArea(wildfireArea);
            }
            if (document.querySelector(`#canvas_${this.ID}`)) {
              document.querySelector(`#canvas_${this.ID}`).remove();
              socket.emit('removeElement', this.ID);
            }
            arrayTracker.activeFireballs.splice(target, 1);
            socket.emit('handleArrayTracker', arrayTracker);
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
                if (document.querySelector(`#canvas_${this.ID}`)) {
                  document.querySelector(`#canvas_${this.ID}`).remove();
                  socket.emit('removeElement', this.ID);
                }
                arrayTracker.activeArrows.splice(target, 1);
                socket.emit('handleArrayTracker', arrayTracker);
              }
            }
          } else {
            for (let target in arrayTracker.activeFireballs) {
              if (arrayTracker.activeFireballs[target].ID === this.ID) {
                if (arrayTracker.activeFireballs[target].special === "wildfire") {
                  let ID = "wildfire" + new Date().getTime();
                  let wildfireArea = new Area(
                    "wildfire",
                    CLIENT_ID,
                    ID,
                    this.posX,
                    this.posY,
                    80
                  );
                  arrayTracker.activeAreas.push(wildfireArea);
                  socket.emit('handleArrayTracker', arrayTracker);
                  drawArea(wildfireArea);
                }
                if (document.querySelector(`#canvas_${this.ID}`)) {
                  document.querySelector(`#canvas_${this.ID}`).remove();
                  socket.emit('removeElement', this.ID);
                }
                arrayTracker.activeFireballs.splice(target, 1);
                socket.emit('handleArrayTracker', arrayTracker);
              }
            }
          }
        }
      }
    }
  }
}

// function spawnLoot(lootType) {
//   if (!gameControls.hasLootSpawned) {
//     let lootWidth = 50;
//     let lootHeight = 50;
//     let position = randomCoords();
//     let ID = lootType + "" + new Date().getTime();
//     let loot = new Loot(
//       lootType,
//       ID,
//       position.posX,
//       position.posY,
//       lootWidth,
//       lootHeight
//     );
//     loot.draw = drawLoot;
//     loot.acquireLoot = getLoot;
//     availableLoot.push(loot);
//     loot.draw();
//     gameControls.hasLootSpawned = true;
//   }
// }

// function getLoot() {
//   if (
//     ((this.posX >= heroOBJ.posX && this.posX <= heroOBJ.posX + heroOBJ.width) ||
//       (this.posX + this.width >= heroOBJ.posX &&
//         this.posX + this.width <= heroOBJ.posX + heroOBJ.width)) &&
//     ((this.posY >= heroOBJ.posY &&
//       this.posY <= heroOBJ.posY + heroOBJ.height) ||
//       (this.posY + this.height >= heroOBJ.posY &&
//         this.posY + this.height <= heroOBJ.posY + heroOBJ.height))
//   ) {
//     for (let i = 0; i < 5; i++) {
//       if (!arrayTracker.inventory[i]) {
//         arrayTracker.inventory[i] = this;
//         break;
//       }
//     }
//     for (let slot in HTMLElements.inventoryDisplay) {
//       if (
//         HTMLElements.inventoryDisplay[slot].firstChild.getAttribute("src") ===
//         "../images/blank.png"
//       ) {
//         if (this.type === "healing_potion") {
//           HTMLElements.inventoryDisplay[slot].firstChild.setAttribute(
//             "src",
//             "../images/healing_potion.png"
//           );
//         } else if (this.type === "freezeSpell") {
//           HTMLElements.inventoryDisplay[slot].firstChild.setAttribute(
//             "src",
//             "../images/freezeSpell.png"
//           );
//         }
//         for (let loot in availableLoot) {
//           if (availableLoot[loot].ID === this.ID) {
//             availableLoot.splice(loot, 1);
//             if (document.querySelector(`#canvas_${this.ID}`))
//               document.querySelector(`#canvas_${this.ID}`).remove();
//             break;
//           }
//         }
//         return;
//       }
//     }
//   }
// }

// function drawLoot() {
//   // NOTE: check for pre-existing canvas
//   if (document.getElementById(`canvas_${this.ID}`)) {
//     document.getElementById(`canvas_${this.ID}`).remove();
//   }

//   // NOTE: create updated canvas
//   let updatedCanvas = document.createElement("canvas");
//   updatedCanvas.setAttribute("id", `canvas_${this.ID}`);
//   updatedCanvas.setAttribute("width", displayOBJ.width);
//   updatedCanvas.setAttribute("height", displayOBJ.height);
//   HTMLElements.display.appendChild(updatedCanvas);
//   let localCtx = updatedCanvas.getContext("2d");

//   let lootImage = new Image();
//   if (this.type === "healing_potion") {
//     lootImage.src = "../images/healing_potion.png";
//   } else if (this.type === "freezeSpell") {
//     lootImage.src = "../images/freezeSpell.png";
//   }
//   lootImage.onload = () => {
//     localCtx.drawImage(
//       lootImage,
//       this.posX,
//       this.posY,
//       this.width,
//       this.height
//     );
//   };
// }

function shield() {
  this.isShield = true;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  let activeShieldTimer = new Timer(() => {
    this.isShield = false;
    socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
    this.draw();
  }, 5000).resume();
}

function tripleShot() {
  this.isTripleShot = true;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  this.attack();
  this.attack();
  this.attack();
  this.isTripleShot = false;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  this.draw();
}

function wildfire() {
  this.isWildfire = true;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  this.attack();
  this.isWildfire = false;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  this.draw();
}

function goddess() {
  this.isGoddess = true;
  heroOBJ.speed = 20;
  heroOBJ.attackCooldown = 150;
  this.damage = this.damage * 2;
  socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
  let activeGoddessTimer = new Timer(() => {
    this.isGoddess = false;
    heroOBJ.speed = 15;
    heroOBJ.attackCooldown = 300;
    this.damage = this.damage / 2;
    socket.emit('handleHero', [ CLIENT_ID, heroOBJ ]);
    this.draw();
  }, 5000).resume();
}

// function spawnRandomLoot() {
//   let lootTypes = ["healing_potion", "freezeSpell"];
//   let index = Math.floor(Math.random() * lootTypes.length);
//   return lootTypes[index];
// }

function Character(
  ID,
  type,
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
  this.ID = ID;
  this.type = type;
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
  source,
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
  this.source = source;
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

// function Loot(type, ID, posX, posY, width, height) {
//   this.type = type;
//   this.ID = ID;
//   this.posX = posX;
//   this.posY = posY;
//   this.width = width;
//   this.height = height;
// }

function Area(type, source, ID, posX, posY, radius) {
  this.type = type;
  this.source = source;
  this.ID = ID;
  this.posX = posX;
  this.posY = posY;
  this.radius = radius;
}

function Obstacle(obstacleParams) {
  this.type = obstacleParams.type;
  this.posX = obstacleParams.posX;
  this.posY = obstacleParams.posY;
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

// Server info
  socket.on('waiting', ()=>{
    alert('waiting for player');
  });
  socket.on('startGame', (obstaclesArray)=>{
    drawDisplay();
    arrayTracker.obstaclesArray = [];
    arrayTracker.noAttackObstacles = [];

    for (let i=0; i<obstaclesArray.length;i++) {
      let newObstacle = new Obstacle(obstaclesArray[i]);
      newObstacle.draw();
      arrayTracker.obstaclesArray.push(newObstacle);
      if (newObstacle.type !== 'lake') {
        arrayTracker.noAttackObstacles.push(newObstacle);
      }
    }
    socket.emit('handleArrayTracker', arrayTracker);
  });
  socket.on('handleHero', ([ id, obj ]) => {
    if (obj.currentHP <= 0) {
      socket.emit('gameOver', id);
      return;
    } else {
      if (id === CLIENT_ID) {
        let redraw = false;
        if (heroOBJ.currentHP != obj.currentHP || heroOBJ.posX != obj.posX || heroOBJ.posY != obj.posY || heroOBJ.isAttacking != obj.isAttacking || heroOBJ.direction != obj.direction || heroOBJ.isAttacking != obj.isAttacking) {
          redraw = true;
        }
        heroOBJ.currentHP = obj.currentHP;
        heroOBJ.posX = obj.posX;
        heroOBJ.posY = obj.posY;
        heroOBJ.attackLock = obj.attackLock;
        heroOBJ.isAttacking = obj.isAttacking;
        heroOBJ.direction = obj.direction;
        
        if (redraw) {
          heroOBJ.draw();
        }
  
        if (heroOBJ.type == 1) {
          heroOBJ.attack = meleeAttack;
        } else if (heroOBJ.type == 2) {
          heroOBJ.attack = arrowAttack;
        } else if (heroOBJ.type == 3) {
          heroOBJ.attack = fireballAttack;
        } else if (heroOBJ.type == 4) {
          heroOBJ.attack = meleeAttack;
        }
      }
      else {
        enemyOBJ = obj;
        enemyOBJ.draw = drawEnemy;
        enemyOBJ.draw();
      }
    }
  });
  socket.on('handleArrayTracker', (array)=>{
    arrayTracker = array;
    arrayTracker.activeArrows.forEach(arrow =>{
      arrow.draw = drawArrow;
      if (arrow.source === CLIENT_ID) {
        arrow.checkHit = checkIfProjectileHit;
      } else {
        arrow.draw();
      }
    });
    arrayTracker.activeFireballs.forEach(fireball =>{
      fireball.draw = drawFireball;
      fireball.draw();
      if (fireball.source === CLIENT_ID) {
        fireball.checkHit = checkIfProjectileHit;
      } else {
        fireball.draw();
      }
    });
    arrayTracker.activeAreas.forEach(area => {
      if (!document.querySelector(`#canvas_${area.ID}`)) {
        drawArea(area);
      }
    });
  });
  socket.on('removeElement', id =>{
    if (document.querySelector(id)) {
      document.querySelector(id).remove();
    }
  });

  
  socket.on('freeze', client=>{
    // some code here
  });
  socket.on('gameOver', (loser)=>{
    if (loser === CLIENT_ID) {
      location.href='./gameOver.html';
    } else {
      location.href='./youWin.html';
    }
  });

console.log(`Happy Sweet 1️⃣6️⃣, Sis! ❤🎉🎁,\nFrom your big Bro!🐵\n@2022`);
