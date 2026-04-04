// --- CANVAS ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

// --- SONIDOS ---
const shootSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-laser-weapon-shot-1681.mp3");
const explosionSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-explosion-impact-1684.mp3");

// --- INPUT ---
const keys = {};

document.addEventListener("keydown", function(e) {
  keys[e.code] = true;
});

document.addEventListener("keyup", function(e) {
  keys[e.code] = false;
});

// --- CONTROLES MÓVIL ---
document.getElementById("btnLeft").ontouchstart = function() { keys["ArrowLeft"] = true; };
document.getElementById("btnLeft").ontouchend = function() { keys["ArrowLeft"] = false; };

document.getElementById("btnRight").ontouchstart = function() { keys["ArrowRight"] = true; };
document.getElementById("btnRight").ontouchend = function() { keys["ArrowRight"] = false; };

document.getElementById("btnShoot").ontouchstart = function() { keys["Space"] = true; };
document.getElementById("btnShoot").ontouchend = function() { keys["Space"] = false; };

// --- PLAYER ---
const player = {
  x: 300,
  y: 550,
  speed: 5,
  lives: 3,

  heat: 0,
  maxHeat: 100,
  overheated: false,

  heatPerShot: 18,
  coolRate: 0.35,

  shootDelay: 0
};

// --- ESTADO ---
let bullets = [];
let enemyBullets = [];
let explosions = [];
let score = 0;
let gameOver = false;
let win = false;

let startTime = Date.now();
let finalTime = 0;

// --- ENEMIGOS ---
let enemies = [];

for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 8; c++) {
    enemies.push({
      x: 60 + c * 60,
      y: 60 + r * 50,
      alive: true
    });
  }
}

let direction = 1;

// --- UPDATE ---
function update() {

  if (gameOver) return;

  // Movimiento
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  if (player.x < 0) player.x = 0;
  if (player.x > 570) player.x = 570;

  // Disparo
  if (keys["Space"] && !player.overheated && player.shootDelay <= 0) {

    bullets.push({ x: player.x + 13, y: player.y });

    player.heat += player.heatPerShot;
    player.shootDelay = 18;

    shootSound.currentTime = 0;
    shootSound.play();

    if (player.heat >= player.maxHeat) {
      player.heat = player.maxHeat;
      player.overheated = true;
    }
  }

  player.shootDelay--;

  // Enfriamiento
  player.heat -= player.coolRate;
  if (player.heat < 0) player.heat = 0;

  if (player.overheated && player.heat <= player.maxHeat * 0.25) {
    player.overheated = false;
  }

  // --- BALAS ---
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y -= 6;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y <= 0) {
      bullets.splice(i, 1);
    }
  }

  // --- BALAS ENEMIGAS ---
  for (let i = 0; i < enemyBullets.length; i++) {
    enemyBullets[i].y += 4;
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (enemyBullets[i].y >= 600) {
      enemyBullets.splice(i, 1);
    }
  }

  // --- ENEMIGOS ---
  let alive = [];
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) alive.push(enemies[i]);
  }

  let factor = (24 - alive.length) / 24;
  let speed = 0.5 + factor * 2.5;

  let moveDown = false;

  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];

    if (!e.alive) continue;

    e.x += direction * speed;

    if (e.x < 10 || e.x > 560) {
      moveDown = true;
    }
  }

  if (moveDown) {
    direction *= -1;
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].y += 20;
    }
  }

  // Disparo enemigo
  let probDisparo = 0.01 + factor * 0.02;

  if (Math.random() < probDisparo && alive.length > 0) {
    let index = Math.floor(Math.random() * alive.length);
    let shooter = alive[index];

    enemyBullets.push({
      x: shooter.x + 15,
      y: shooter.y
    });
  }

  // Colisiones
  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i];

    for (let j = 0; j < enemies.length; j++) {
      let e = enemies[j];

      if (e.alive &&
        b.x < e.x + 30 &&
        b.x > e.x &&
        b.y < e.y + 20 &&
        b.y > e.y) {

        e.alive = false;
        b.y = -100;
        score += 10;

        explosions.push({ x: e.x, y: e.y, frame: 0 });

        explosionSound.currentTime = 0;
        explosionSound.play();
      }
    }
  }

  // Impacto jugador
  for (let i = 0; i < enemyBullets.length; i++) {
    let b = enemyBullets[i];

    if (
      b.x > player.x &&
      b.x < player.x + 30 &&
      b.y > player.y &&
      b.y < player.y + 20
    ) {
      player.lives--;
      b.y = 700;

      if (player.lives <= 0) {
        gameOver = true;
        finalTime = Date.now() - startTime;
      }
    }
  }

  // Explosiones
  for (let i = 0; i < explosions.length; i++) {
    explosions[i].frame++;
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    if (explosions[i].frame >= 15) {
      explosions.splice(i, 1);
    }
  }

  // Fin
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].alive && enemies[i].y > player.y) {
      gameOver = true;
      finalTime = Date.now() - startTime;
    }
  }

  if (alive.length === 0) {
    win = true;
    gameOver = true;
    finalTime = Date.now() - startTime;
  }
}

// --- TIEMPO ---
function formatTime(ms) {
  let m = Math.floor(ms / 60000);
  let s = Math.floor((ms % 60000) / 1000);
  let ms2 = Math.floor((ms % 1000) / 10);

  if (s < 10) s = "0" + s;
  if (ms2 < 10) ms2 = "0" + ms2;

  return m + ":" + s + ":" + ms2;
}

// --- DRAW ---
function draw() {
  ctx.clearRect(0, 0, 600, 600);

  let time = gameOver ? finalTime : Date.now() - startTime;

  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + player.lives, 10, 40);
  ctx.fillText(formatTime(time), 470, 20);

  // Barra calor
  let ratio = player.heat / player.maxHeat;

  ctx.strokeRect(220, 10, 150, 10);
  ctx.fillStyle = player.overheated ? "red" : "orange";
  ctx.fillRect(220, 10, 150 * ratio, 10);

  // Player
  ctx.fillStyle = player.overheated ? "red" : "cyan";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + 20);
  ctx.lineTo(player.x + 15, player.y);
  ctx.lineTo(player.x + 30, player.y + 20);
  ctx.fill();

  // Balas
  ctx.fillStyle = "yellow";
  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i];
    ctx.fillRect(b.x, b.y, 4, 10);
  }

  // Balas enemigas
  ctx.fillStyle = "red";
  for (let i = 0; i < enemyBullets.length; i++) {
    let b = enemyBullets[i];
    ctx.fillRect(b.x, b.y, 4, 10);
  }

  // Enemigos
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];

    if (!e.alive) continue;

    ctx.fillStyle = "lime";
    ctx.fillRect(e.x, e.y, 30, 20);
  }

  // Explosiones
  for (let i = 0; i < explosions.length; i++) {
    let e = explosions[i];

    ctx.fillStyle = "rgba(255,165,0," + (1 - e.frame / 15) + ")";
    ctx.beginPath();
    ctx.arc(e.x + 15, e.y + 10, e.frame * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fin
  if (gameOver) {
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(win ? "VICTORIA" : "GAME OVER", 180, 300);
  }
}

// --- LOOP ---
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();