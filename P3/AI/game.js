const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

// --- SONIDOS ---
const shootSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-laser-weapon-shot-1681.mp3");
const explosionSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-explosion-impact-1684.mp3");

// --- INPUT ---
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// MOBILE
document.getElementById("left").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("left").ontouchend = () => keys["ArrowLeft"] = false;

document.getElementById("right").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("right").ontouchend = () => keys["ArrowRight"] = false;

document.getElementById("shoot").ontouchstart = () => keys["Space"] = true;
document.getElementById("shoot").ontouchend = () => keys["Space"] = false;

// --- PLAYER ---
const player = {
  x: 300,
  y: 550,
  width: 30,
  height: 20,
  speed: 5,
  lives: 3,

  heat: 0,
  maxHeat: 100,
  overheated: false,

  shootDelay: 0
};

// --- STATE ---
let bullets = [];
let enemyBullets = [];
let explosions = [];
let score = 0;
let gameOver = false;
let win = false;

let startTime = Date.now();
let finalTime = 0;

// --- ENEMIES ---
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

let dir = 1;

// --- UPDATE ---
function update() {
  if (gameOver) return;

  // Movimiento
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  player.x = Math.max(0, Math.min(570, player.x));

  // --- DISPARO BALANCEADO ---
  if (keys["Space"] && !player.overheated && player.shootDelay <= 0) {
    bullets.push({ x: player.x + 13, y: player.y });

    player.heat += 5; // sube más lento
    player.shootDelay = 15; // cadencia (~0.25s)

    shootSound.currentTime = 0;
    shootSound.play();

    if (player.heat >= player.maxHeat) {
      player.overheated = true;
    }
  }

  player.shootDelay--;

  // --- ENFRIAMIENTO MÁS RÁPIDO ---
  player.heat -= 1; // enfría más rápido
  if (player.heat < 0) player.heat = 0;

  if (player.overheated && player.heat <= 30) {
    player.overheated = false;
  }

  // Balas
  bullets.forEach(b => b.y -= 6);
  enemyBullets.forEach(b => b.y += 4);

  bullets = bullets.filter(b => b.y > 0);
  enemyBullets = enemyBullets.filter(b => b.y < 600);

  // --- VELOCIDAD PROGRESIVA ---
  let alive = enemies.filter(e => e.alive);
  let factor = (24 - alive.length) / 24;

  let speed = 0.5 + factor * 2.5;

  let moveDown = false;
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += dir * speed;

    if (e.x < 10 || e.x > 560) moveDown = true;
  });

  if (moveDown) {
    dir *= -1;
    enemies.forEach(e => e.y += 20);
  }

  // --- DISPARO ENEMIGO NERFEADO ---
  if (Math.random() < 0.01 + factor * 0.02 && alive.length) {
    let shooter = alive[Math.floor(Math.random() * alive.length)];
    enemyBullets.push({ x: shooter.x + 15, y: shooter.y });
  }

  // Colisiones
  bullets.forEach(b => {
    enemies.forEach(e => {
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
    });
  });

  enemyBullets.forEach(b => {
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
  });

  explosions.forEach(e => e.frame++);
  explosions = explosions.filter(e => e.frame < 15);

  enemies.forEach(e => {
    if (e.alive && e.y > player.y) {
      gameOver = true;
      finalTime = Date.now() - startTime;
    }
  });

  if (alive.length === 0) {
    win = true;
    gameOver = true;
    finalTime = Date.now() - startTime;
  }
}

// --- FORMATO TIEMPO ---
function formatTime(ms) {
  let minutes = Math.floor(ms / 60000);
  let seconds = Math.floor((ms % 60000) / 1000);
  let millis = Math.floor((ms % 1000) / 10);

  return `${minutes}:${seconds.toString().padStart(2, "0")}:${millis.toString().padStart(2, "0")}`;
}

// --- DRAW ---
function draw() {
  ctx.clearRect(0, 0, 600, 600);

  // TIEMPO CONGELADO
  let currentTime = gameOver ? finalTime : Date.now() - startTime;

  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + player.lives, 10, 40);
  ctx.fillText(formatTime(currentTime), 470, 20);

  // BARRA CALOR
  let barWidth = 150;
  let heatRatio = player.heat / player.maxHeat;

  ctx.strokeStyle = "white";
  ctx.strokeRect(220, 10, barWidth, 10);

  ctx.fillStyle = player.overheated ? "red" : "orange";
  ctx.fillRect(220, 10, barWidth * heatRatio, 10);

  // Player
  ctx.fillStyle = player.overheated ? "red" : "cyan";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + 20);
  ctx.lineTo(player.x + 15, player.y);
  ctx.lineTo(player.x + 30, player.y + 20);
  ctx.fill();

  // Balas
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

  ctx.fillStyle = "red";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

  // Enemigos
  enemies.forEach(e => {
    if (!e.alive) return;

    ctx.fillStyle = "lime";
    ctx.fillRect(e.x, e.y, 30, 20);

    ctx.fillStyle = "black";
    ctx.fillRect(e.x + 5, e.y + 5, 5, 5);
    ctx.fillRect(e.x + 20, e.y + 5, 5, 5);
  });

  // Explosiones
  explosions.forEach(e => {
    ctx.fillStyle = `rgba(255,165,0,${1 - e.frame/15})`;
    ctx.beginPath();
    ctx.arc(e.x + 15, e.y + 10, e.frame * 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // FIN
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText(win ? "VICTORIA" : "GAME OVER", 180, 300);
  }
}

// --- LOOP ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();