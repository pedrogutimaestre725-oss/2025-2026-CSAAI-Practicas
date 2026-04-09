// --- CANVAS ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 700;

// --- INPUT ---
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// --- TOUCH ---
function activar(id, key) {
  let el = document.getElementById(id);

  el.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  });

  el.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  });
}
activar("btnLeft", "ArrowLeft");
activar("btnRight", "ArrowRight");
activar("btnShoot", "Space");

// --- IMÁGENES ---
const playerImg = new Image();
playerImg.src = "Curry.jpg";

const shootImg = new Image();
shootImg.src = "luna.png";

const bulletImg = new Image();
bulletImg.src = "Ball.png";

const lifeImg = new Image();
lifeImg.src = "life.png";

// --- SONIDOS ---
const shootSound = new Audio("shoot.wav");
const explosionSound = new Audio("explosion.wav");
const winSound = new Audio("win.wav");
const loseSound = new Audio("lose.wav");

// --- PLAYER ---
const player = {
  x: 300,
  y: 640,
  speed: 5,
  lives: 3,

  heat: 0,
  maxHeat: 100,
  overheated: false,

  heatPerShot: 18,
  coolRate: 0.35,

  shootDelay: 0,
  shootAnim: 0
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

function crearEnemigos() {
  const imgs = [
    "suns.png","bulls.png","gsw.png","spurs.png",
    "miami.png","lakers.jpeg","celtics.jpeg","knicks.jpeg"
  ].map(src => {
    let img = new Image();
    img.src = src;
    return img;
  });

  enemies = [];

  for (let r = 0; r < 3; r++) {
    let usados = [];

    for (let c = 0; c < 8; c++) {
      let index;
      do {
        index = Math.floor(Math.random() * imgs.length);
      } while (usados.includes(index));

      usados.push(index);

      enemies.push({
        x: 50 + c * 65,
        y: 60 + r * 70,
        width: 45,
        height: 45,
        alive: true,
        img: imgs[index]
      });
    }
  }
}
crearEnemigos();

let direction = 1;

// --- UPDATE ---
function update() {

  if (gameOver) return;

  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  player.x = Math.max(0, Math.min(560, player.x));

  // DISPARO
  if (keys["Space"] && !player.overheated && player.shootDelay <= 0) {

    bullets.push({ x: player.x + 13, y: player.y });

    player.heat += player.heatPerShot;
    player.shootDelay = 20;

    player.shootAnim = 10;

    shootSound.currentTime = 0;
    shootSound.play();

    if (player.heat >= player.maxHeat) {
      player.overheated = true;
    }
  }

  player.shootDelay--;
  if (player.shootAnim > 0) player.shootAnim--;

  // ENFRIAMIENTO
  player.heat -= player.coolRate;
  if (player.heat < 0) player.heat = 0;

  if (player.overheated && player.heat <= player.maxHeat * 0.25) {
    player.overheated = false;
  }

  // BALAS
  bullets.forEach(b => b.y -= 6);
  bullets = bullets.filter(b => b.y > 0);

  // ENEMIGOS
  let alive = enemies.filter(e => e.alive);
  let factor = (24 - alive.length) / 24;
  let speed = 0.3 + factor * 1.8;

  let moveDown = false;

  enemies.forEach(e => {
    if (!e.alive) return;

    e.x += direction * speed;
    if (e.x < 10 || e.x + e.width > 590) moveDown = true;
  });

  if (moveDown) {
    direction *= -1;
    enemies.forEach(e => e.y += 25);
  }

  // DISPARO ENEMIGO
  if (Math.random() < 0.01 + factor * 0.02 && alive.length > 0) {
    let shooter = alive[Math.floor(Math.random() * alive.length)];
    enemyBullets.push({ x: shooter.x + 20, y: shooter.y });
  }

  enemyBullets.forEach(b => b.y += 4);

  // COLISION PLAYER
  enemyBullets.forEach(b => {
    if (
      b.x > player.x &&
      b.x < player.x + 40 &&
      b.y > player.y &&
      b.y < player.y + 30
    ) {
      player.lives--;
      b.y = 800;

      if (player.lives <= 0) {
        gameOver = true;
        finalTime = Date.now() - startTime;
        loseSound.play();
      }
    }
  });

  // COLISION ENEMIGOS
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (e.alive &&
        b.x < e.x + e.width &&
        b.x > e.x &&
        b.y < e.y + e.height &&
        b.y > e.y) {

        e.alive = false;
        b.y = -100;
        score += 10;

        explosionSound.currentTime = 0;
        explosionSound.play();

        for (let i = 0; i < 20; i++) {
          explosions.push({
            x: e.x + 20,
            y: e.y + 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 20
          });
        }
      }
    });
  });

  // PARTICULAS
  explosions.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });

  explosions = explosions.filter(p => p.life > 0);

  // FIN
  enemies.forEach(e => {
    if (e.alive && e.y + e.height >= player.y) {
      gameOver = true;
      finalTime = Date.now() - startTime;
      loseSound.play();
    }
  });

  if (alive.length === 0) {
    win = true;
    gameOver = true;
    finalTime = Date.now() - startTime;
    winSound.play();
  }
}

// --- TIEMPO ---
function formatTime(ms) {
  let m = Math.floor(ms / 60000);
  let s = Math.floor((ms % 60000) / 1000);
  let ms2 = Math.floor((ms % 1000) / 10);

  return `${m}:${s.toString().padStart(2,'0')}:${ms2.toString().padStart(2,'0')}`;
}

// --- DRAW ---
function draw() {

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, 600, 700);

  let time = gameOver ? finalTime : Date.now() - startTime;

  // HUD
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 10, 20);

  ctx.textAlign = "right";
  ctx.fillText(formatTime(time), 590, 20);

  // VIDAS
  for (let i = 0; i < player.lives; i++) {
    ctx.drawImage(lifeImg, 10 + i * 25, 30, 20, 20);
  }

  // 🔥 BARRA CALOR (CÍRCULOS REALES)
  let balls = 10;
  let ratio = player.heat / player.maxHeat;

  for (let i = 0; i < balls; i++) {
    let x = 200 + i * 18;
    let y = 10;

    let active = i < ratio * balls;

    ctx.save();

    ctx.beginPath();
    ctx.arc(x + 7, y + 7, 7, 0, Math.PI * 2);
    ctx.clip();

    ctx.globalAlpha = active ? 1 : 0.2;
    ctx.drawImage(bulletImg, x, y, 14, 14);

    if (player.overheated && active) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "red";
      ctx.fillRect(x, y, 14, 14);
    }

    ctx.restore();
  }

  // PLAYER (ANIMACIÓN CORRECTA)
  let img = (keys["Space"] || player.shootAnim > 0) ? shootImg : playerImg;
  ctx.drawImage(img, player.x, player.y, 40, 30);

  // BALAS
  bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, 12, 12));

  // ENEMIGOS
  enemies.forEach(e => {
    if (!e.alive) return;

    ctx.save();
    ctx.shadowColor = "black";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.roundRect(e.x, e.y, e.width, e.height, 10);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.clip();

    ctx.drawImage(e.img, e.x, e.y, e.width, e.height);
    ctx.restore();
  });

  // EXPLOSIONES
  explosions.forEach(p => {
    ctx.fillStyle = `rgba(255,150,0,${p.life/20})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // FIN
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, 600, 700);

    ctx.textAlign = "center";
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(win ? "VICTORIA" : "GAME OVER", 300, 350);
  }
}

// LOOP
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();