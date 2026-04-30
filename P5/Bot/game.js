const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;

// --- AUDIO ---
const bgMusic = new Audio("musica.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

const goalSound = new Audio("Gol.mp3");
goalSound.volume = 0.7;

const kickSound = new Audio("Chute.mp3");
kickSound.volume = 0.65;

function startMusic() {
  bgMusic.play().catch(() => {});
}

function playGoalSound() {
  goalSound.currentTime = 0;
  goalSound.play().catch(() => {});
}

function stopGoalSound() {
  goalSound.pause();
  goalSound.currentTime = 0;
}

function playKickSound() {
  kickSound.currentTime = 0;
  kickSound.play().catch(() => {});
}

// UI

const imgs = {
  jude: new Image(),
  samford: new Image(),
  mark: new Image(),
  axel: new Image()
};

imgs.jude.src = "Jude.png";
imgs.samford.src = "Samford.png";
imgs.mark.src = "Mark.png";
imgs.axel.src = "Axel.png";

const ballImg = new Image();
ballImg.src = "Balon.png";

const logoBlue = new Image();
logoBlue.src = "logo1.png";

const logoRed = new Image();
logoRed.src = "logo2.png";

let particles = [];


const overlay = document.getElementById("overlay");
const finalEl = document.getElementById("final");
const menuEl = document.getElementById("menu");
const countdownEl = document.getElementById("countdown");
const goalMsg = document.getElementById("goalMsg");

const blueScoreEl = document.getElementById("blueScore");
const redScoreEl = document.getElementById("redScore");
const timeEl = document.getElementById("time");

// --- ESTADO ---
let mode = null;
let team = null;
let playing = false;
let menuState = "mode";
let gameEnded = false;

let score = { blue: 0, red: 0 };
let gameTime = 0; // segundos
let lastTimeUpdate = 0;

const goalHeight = 150;
const PLAYER_SPEED = 2.5;

// --- INPUT ---
let keys = {};

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (menuState === "mode") {
    if (e.key === "1") {
      mode = "golden";
      menuState = "team";
      updateMenu();
    }
    if (e.key === "2") {
      mode = "3";
      menuState = "team";
      updateMenu();
    }
    return;
  }

  if (menuState === "team") {
    if (e.key === "1") {
      team = "blue";
      startGame();
    }
    if (e.key === "2") {
      team = "red";
      startGame();
    }
    return;
  }

  // 🔥 DISPARO SOLO SI ESTÁ CERCA
  if (e.key === " " && playing) {
    const player = players.find(p => p.isUser);
    if (distance(player, ball) < 35) {
      ball.vx = player.dir.x * 7;
      ball.vy = player.dir.y * 7;
      playKickSound();
    }
  }

  if (e.key === "r" && gameEnded) {
    score = { blue: 0, red: 0 };
    updateScore();
    gameEnded = false;
    gameTime = 0;
    overlay.style.display = "none";
    setupTeams();
    ball.reset();
    startCountdown();
  }

    // 🔄 RESET BALÓN EN PARTIDA (tipo saque)
  if (e.key === "r" && playing && !gameEnded) {
    ball.reset();
    resetPlayerPositions();

    // opcional: parar un momento y reanudar
    playing = false;

    setTimeout(() => {
      startCountdown();
    }, 300);
  }

  if (e.key === "m" && gameEnded) {
    location.reload();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// --- MENU ---
function updateMenu() {
  menuEl.innerHTML = `
    <h1>Elige equipo</h1>

    <div style="display:flex; justify-content:center; gap:60px; margin-top:25px;">

      <div style="text-align:center;">
        <img src="logo1.png" style="width:70px; height:70px; display:block; margin:auto;">
        <p>1 → Raimon</p>
      </div>

      <div style="text-align:center;">
        <img src="logo2.png" style="width:70px; height:70px; display:block; margin:auto;">
        <p>2 → Royal Academy</p>
      </div>

    </div>
  `;
}

// --- PLAYER ---
class Player {
  constructor(x, y, color, role, isUser = false, img = null ) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.r = 18;
    this.color = color;
    this.role = role;
    this.isUser = isUser;
    this.speed = isUser ? PLAYER_SPEED + 0.7 : PLAYER_SPEED;
    this.dir = { x: 1, y: 0 };

    this.baseX = x;
    this.baseY = y;
  }

  update() {
    if (!playing) return;

    if (this.isUser) {
      if (keys["w"]) { this.y -= this.speed; this.dir = {x:0,y:-1}; }
      if (keys["s"]) { this.y += this.speed; this.dir = {x:0,y:1}; }
      if (keys["a"]) { this.x -= this.speed; this.dir = {x:-1,y:0}; }
      if (keys["d"]) { this.x += this.speed; this.dir = {x:1,y:0}; }
    } else {
      this.botAI();
    }

    this.limit();
  }

  botAI() {
    let targetX = ball.x;
    let targetY = ball.y;

    if (this.role === "defensive") {

      // 🚫 NO PASAR DE MEDIO CAMPO
      const mid = canvas.width / 2;
      if ((this.color === "blue" && this.x > mid + 50) ||
          (this.color === "red" && this.x < mid - 50)) {
        targetX = this.baseX;
        targetY = this.baseY;
      }
      else if (distance(this, ball) < 140) {
        targetX = ball.x;
        targetY = ball.y;
      } else {
        targetX = this.baseX;
        targetY = this.baseY;
      }
    }

    if (targetX > this.x + 2) this.x += this.speed;
    else if (targetX < this.x - 2) this.x -= this.speed;

    if (targetY > this.y + 2) this.y += this.speed;
    else if (targetY < this.y - 2) this.y -= this.speed;

    players.forEach(other => {
      if (other === this) return;
      let d = distance(this, other);
      if (d < this.r * 2) {
        this.x += (this.x - other.x) * 0.1;
        this.y += (this.y - other.y) * 0.1;
      }
    });

    if (distance(this, ball) < this.r + ball.r) {
      ball.kick(this);
    }
  }

  limit() {
    this.x = Math.max(this.r, Math.min(canvas.width - this.r, this.x));
    this.y = Math.max(this.r, Math.min(canvas.height - this.r, this.y));
  }

  draw() {
    ctx.save();

    // recorte circular (para que la imagen sea redonda)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // fondo blanco (para uniformidad)
    ctx.fillStyle = "white";
    ctx.fillRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);

    // imagen
    if (this.img && this.img.complete) {
      ctx.drawImage(
        this.img,
        this.x - this.r,
        this.y - this.r,
        this.r * 2,
        this.r * 2
      );
    }

    ctx.restore();

    // borde negro fino (pro)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();

    // flecha usuario
    if (this.isUser) {
      const offset = this.r + 14;

      // posición delante del jugador
      const px = this.x + this.dir.x * offset;
      const py = this.y + this.dir.y * offset;

      // rotación según dirección
      const angle = Math.atan2(this.dir.y, this.dir.x);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // símbolo >
      ctx.beginPath();
      ctx.moveTo(-4, -4);
      ctx.lineTo(5, 0);
      ctx.lineTo(-4, 4);
      ctx.stroke();

      // glow suave
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 8;

      ctx.restore();
    }
  }
}

// --- BALL ---
class Ball {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.vx = 0;
    this.vy = 0;
    this.r = 10;
  }

  update() {
    if (!playing) return;

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.985;
    this.vy *= 0.985;

    let goalTop = canvas.height/2 - goalHeight/2;
    let goalBottom = canvas.height/2 + goalHeight/2;

    // --- REBOTES NORMALES ---
    if (this.y <= this.r) {
      this.y = this.r;
      this.vy *= -1.2;
    }
    if (this.y >= canvas.height - this.r) {
      this.y = canvas.height - this.r;
      this.vy *= -1.2;
    }

    if (this.x <= this.r) {
      if (this.y > goalTop && this.y < goalBottom) goal("red");
      else {
        this.x = this.r;
        this.vx *= -1.2;
      }
    }

    if (this.x >= canvas.width - this.r) {
      if (this.y > goalTop && this.y < goalBottom) goal("blue");
      else {
        this.x = canvas.width - this.r;
        this.vx *= -1.2;
      }
    }

    // 🧲 FIX ESQUINAS PRO (NO STUCK REAL)
    const nearEdgeX = this.x < this.r + 3 || this.x > canvas.width - this.r - 3;
    const nearEdgeY = this.y < this.r + 3 || this.y > canvas.height - this.r - 3;

    // si está en esquina + casi parado → lo sacamos suavemente
    if (nearEdgeX && nearEdgeY && Math.abs(this.vx) < 1.5 && Math.abs(this.vy) < 1.5) {
      this.vx += (Math.random() - 0.5) * 6;
      this.vy += (Math.random() - 0.5) * 6;
    }
  }

  kick(player) {
    let angle = Math.atan2(this.y - player.y, this.x - player.x);
    this.vx = Math.cos(angle) * 6;
    this.vy = Math.sin(angle) * 6;
  }

draw() {
  ctx.save();

  // sombra
  ctx.beginPath();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.arc(this.x + 4, this.y + 5, this.r, 0, Math.PI * 2);
  ctx.fill();

  // círculo recorte
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // fondo blanco
  ctx.fillStyle = "white";
  ctx.fillRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);

  // imagen
  if (ballImg.complete) {
    ctx.drawImage(
      ballImg,
      this.x - this.r,
      this.y - this.r,
      this.r * 2,
      this.r * 2
    );
  }

  ctx.restore();

  // borde
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
}

const ball = new Ball();

// --- COLISIONES ---
function handleCollisions() {
  players.forEach(p => {
    let dx = ball.x - p.x;
    let dy = ball.y - p.y;
    let dist = Math.hypot(dx, dy);
    let minDist = ball.r + p.r;

    if (dist < minDist) {
      let nx = dx / dist;
      let ny = dy / dist;

      let overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      let dot = ball.vx * nx + ball.vy * ny;

      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;

      ball.vx += nx * 3;
      ball.vy += ny * 3;
    }
  });

  // 🧲 anti bloqueo en esquinas
  const inCorner =
    (ball.x < 25 && ball.y < 25) ||
    (ball.x > canvas.width - 25 && ball.y < 25) ||
    (ball.x < 25 && ball.y > canvas.height - 25) ||
    (ball.x > canvas.width - 25 && ball.y > canvas.height - 25);

  if (inCorner) {
    players.forEach(p => {
      let dx = ball.x - p.x;
      let dy = ball.y - p.y;
      let dist = Math.hypot(dx, dy);

      if (dist < 40) {
        // empuja al jugador suavemente fuera del balón
        p.x += dx * 0.08;
        p.y += dy * 0.08;
      }
    });
  }

  const stuck =
    Math.abs(ball.vx) < 0.2 &&
    Math.abs(ball.vy) < 0.2 &&
    (
      ball.x < 20 ||
      ball.x > canvas.width - 20 ||
      ball.y < 20 ||
      ball.y > canvas.height - 20
    );

  if (stuck) {
    ball.vx += (Math.random() - 0.5) * 5;
    ball.vy += (Math.random() - 0.5) * 5;
  }
  // 🥅 POSTES CON COLISIÓN REAL
  const goalTop = canvas.height/2 - goalHeight/2;
  const goalBottom = canvas.height/2 + goalHeight/2;

  const posts = [
    // izquierda arriba
    {x: 10, y: goalTop},
    // izquierda abajo
    {x: 10, y: goalBottom},

    // derecha arriba
    {x: canvas.width - 10, y: goalTop},
    // derecha abajo
    {x: canvas.width - 10, y: goalBottom}
  ];

  posts.forEach(post => {
    let dx = ball.x - post.x;
    let dy = ball.y - post.y;
    let dist = Math.hypot(dx, dy);

    const postRadius = 8; // tamaño del poste
    const minDist = ball.r + postRadius;

    if (dist < minDist) {
      let nx = dx / dist;
      let ny = dy / dist;

      // sacar balón fuera del poste
      let overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      // rebote tipo pared
      let dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;

      // pequeño boost para que no se quede muerto
      ball.vx += nx * 2;
      ball.vy += ny * 2;
    }
  });

  }


class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;

    this.size = Math.random() * 6 + 3;
    this.life = 60;

    const colors = ["#ffeb3b", "#ff3b3b", "#00e5ff", "#ffffff", "#00ff7f"];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    this.vy += 0.15; // gravedad
    this.life--;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life / 60;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}


function spawnGoalExplosion() {
  for (let i = 0; i < 120; i++) {
    particles.push(new Particle(canvas.width / 2, canvas.height / 2));
  }
}

  // --- EQUIPOS ---
  let players = [];

  function setupTeams() {
    if (team === "blue") {
      players = [
        new Player(200, 250, "blue", "user", true, imgs.axel),     // usuario
        new Player(100, 250, "blue", "defensive", false, imgs.mark),

        new Player(700, 250, "red", "aggressive", false, imgs.samford),
        new Player(800, 250, "red", "defensive", false, imgs.jude)
      ];
    } else {
      players = [
        new Player(700, 250, "red", "user", true, imgs.samford),
        new Player(800, 250, "red", "defensive", false, imgs.jude),

        new Player(200, 250, "blue", "aggressive", false, imgs.axel),
        new Player(100, 250, "blue", "defensive", false, imgs.mark)
      ];
    }
}

function resetPlayerPositions() {
  players.forEach(p => {
    p.x = p.baseX;
    p.y = p.baseY;
    p.dir = { x: 1, y: 0 };
  });
}

// --- GOAL / RESTO IGUAL (sin tocar) ---
function goal(teamScored) {
  if (gameEnded) return;

  playing = false;

  score[teamScored]++;
  updateScore();
  showGoal();
  playGoalSound();

  setTimeout(() => {

    if (
      (mode === "3" && score[teamScored] >= 3) ||
      (mode === "golden")
    ) {
      endGame(teamScored);
      return;
    }

    ball.reset();
    resetPlayerPositions();
    startCountdown();

  }, 2000);
}

function updateScore() {
  blueScoreEl.textContent = score.blue;
  redScoreEl.textContent = score.red;
}

function updateTime() {
  let minutes = Math.floor(gameTime / 60);
  let seconds = gameTime % 60;

  let m = minutes < 10 ? "0" + minutes : minutes;
  let s = seconds < 10 ? "0" + seconds : seconds;

  timeEl.textContent = `${m}:${s}`;
}


function showGoal() {
  goalMsg.innerHTML = "⚽ GOOOOOL ⚽";

  spawnGoalExplosion();

  setTimeout(() => {
    goalMsg.innerHTML = "";
  }, 2000);
}

function endGame(winner) {
  gameEnded = true;

  setTimeout(() => {
    overlay.style.display = "flex";
    menuEl.style.display = "none";

    finalEl.style.display = "block";
    finalEl.innerHTML = `
      <h1>${winner === team ? "🏆 GANASTE" : "💀 PERDISTE"}</h1>
      <p>${score.blue} - ${score.red}</p>
      <br>
      <p>R → Revancha</p>
      <p>M → Menú</p>
    `;
  }, 2000);
}

function startCountdown() {
  let count = 3;
  countdownEl.textContent = count;

  let interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else {
      countdownEl.textContent = "YA!";
      playing = true;
      stopGoalSound();
      setTimeout(() => countdownEl.textContent = "", 500);
      clearInterval(interval);
    }
  }, 1000);
}

function startGame() {
  overlay.style.display = "none";
  menuState = "playing";

  gameTime = 0;

  setupTeams();
  ball.reset();
  startMusic();
  startCountdown();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function resizeGame() {
  const maxWidth = window.innerWidth * 0.98;
  const maxHeight = window.innerHeight * 0.62;

  const aspectRatio = 900 / 500;

  let newWidth = maxWidth;
  let newHeight = newWidth / aspectRatio;

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;
}

window.addEventListener("resize", resizeGame);
window.addEventListener("load", resizeGame);


function drawField() {
  // --- CÉSPED BASE ---
  ctx.fillStyle = "#1e7a3a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- LÍNEAS PRINCIPALES ---
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  // medio campo
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.stroke();

  // círculo central
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 60, 0, Math.PI*2);
  ctx.stroke();

  // punto central
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 3, 0, Math.PI*2);
  ctx.fillStyle = "white";
  ctx.fill();

  let goalTop = canvas.height/2 - goalHeight/2;
  let goalBottom = canvas.height/2 + goalHeight/2;

  // --- ÁREAS GRANDES ---
  ctx.strokeRect(0, canvas.height/2 - 100, 120, 200);
  ctx.strokeRect(canvas.width - 120, canvas.height/2 - 100, 120, 200);

  // --- ÁREAS PEQUEÑAS ---
  ctx.strokeRect(0, canvas.height/2 - 60, 60, 120);
  ctx.strokeRect(canvas.width - 60, canvas.height/2 - 60, 60, 120);

  // --- LÍNEAS DE FONDO CON HUECO (PORTERÍAS) ---
ctx.strokeStyle = "white";
ctx.lineWidth = 4;

// izquierda arriba
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(0, goalTop);
ctx.stroke();

// izquierda abajo
ctx.beginPath();
ctx.moveTo(0, goalBottom);
ctx.lineTo(0, canvas.height);
ctx.stroke();

// derecha arriba
ctx.beginPath();
ctx.moveTo(canvas.width, 0);
ctx.lineTo(canvas.width, goalTop);
ctx.stroke();

// derecha abajo
ctx.beginPath();
ctx.moveTo(canvas.width, goalBottom);
ctx.lineTo(canvas.width, canvas.height);
ctx.stroke();


// --- MARCO PORTERÍA ---
ctx.lineWidth = 3;

// izquierda
ctx.beginPath();
ctx.moveTo(0, goalTop);
ctx.lineTo(15, goalTop);
ctx.lineTo(15, goalBottom);
ctx.lineTo(0, goalBottom);
ctx.stroke();

// derecha
ctx.beginPath();
ctx.moveTo(canvas.width, goalTop);
ctx.lineTo(canvas.width - 15, goalTop);
ctx.lineTo(canvas.width - 15, goalBottom);
ctx.lineTo(canvas.width, goalBottom);
ctx.stroke();


// --- RED ---
ctx.strokeStyle = "rgba(255,255,255,0.3)";
ctx.lineWidth = 1;

// izquierda
for (let y = goalTop; y < goalBottom; y += 8) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(15, y);
  ctx.stroke();
}

// derecha
for (let y = goalTop; y < goalBottom; y += 8) {
  ctx.beginPath();
  ctx.moveTo(canvas.width, y);
  ctx.lineTo(canvas.width - 15, y);
  ctx.stroke();
}

particles.forEach((p, i) => {
  p.update();
  p.draw();

  if (p.life <= 0) {
    particles.splice(i, 1);
  }
});

}



// LOOP
function loop() {
  requestAnimationFrame(loop);

  let now = Date.now();

  if (playing && now - lastTimeUpdate >= 1000) {
    gameTime += 1;
    lastTimeUpdate = now;
  }

  updateTime();

  drawField();

  players.forEach(p => {
    p.update();
    p.draw();
  });

  ball.update();
  handleCollisions();
  ball.draw();
}

loop();

/* =========================
   CONTROLES TÁCTILES MÓVIL
========================= */

// --- MENÚ / SELECCIÓN ---
function handleMenuSelection(option) {
  if (menuState === "mode") {
    if (option === "1") {
      mode = "golden";
      menuState = "team";
      updateMenu();
    }

    if (option === "2") {
      mode = "3";
      menuState = "team";
      updateMenu();
    }

    return;
  }

  if (menuState === "team") {
    if (option === "1") {
      team = "blue";
      startGame();
    }

    if (option === "2") {
      team = "red";
      startGame();
    }

    return;
  }
}

// --- REINICIAR PARTIDA ---
function restartMatch() {
  score = { blue: 0, red: 0 };
  updateScore();

  gameEnded = false;
  gameTime = 0;

  overlay.style.display = "none";
  finalEl.style.display = "none";

  setupTeams();
  ball.reset();
  resetPlayerPositions();

  startCountdown();
}

// --- BOTONES DE MOVIMIENTO ---
function bindTouchButton(buttonId, key) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  const press = (e) => {
    e.preventDefault();

    // botones menú
    if (key === "1" || key === "2") {
      handleMenuSelection(key);
      return;
    }

    keys[key] = true;
  };

  const release = (e) => {
    e.preventDefault();
    keys[key] = false;
  };

  btn.addEventListener("touchstart", press);
  btn.addEventListener("touchend", release);
  btn.addEventListener("touchcancel", release);

  btn.addEventListener("mousedown", press);
  btn.addEventListener("mouseup", release);
  btn.addEventListener("mouseleave", release);
}

// =========================
// DIRECCIÓN
// =========================
bindTouchButton("up", "w");
bindTouchButton("down", "s");
bindTouchButton("left", "a");
bindTouchButton("right", "d");

// =========================
// BOTONES MENÚ 1 / 2
// =========================
bindTouchButton("btn1", "1");
bindTouchButton("btn2", "2");

// =========================
// BOTÓN DISPARO
// =========================
const shootBtn = document.getElementById("shoot");

if (shootBtn) {
  const shootAction = (e) => {
    e.preventDefault();

    // MENÚ FINAL → volver menú principal
    if (gameEnded) {
      location.reload();
      return;
    }

    // PARTIDA NORMAL → disparo
    if (playing) {
      const player = players.find(p => p.isUser);

      if (player && distance(player, ball) < 35) {
        ball.vx = player.dir.x * 7;
        ball.vy = player.dir.y * 7;
        playKickSound();
      }
    }
  };

  shootBtn.addEventListener("touchstart", shootAction);
  shootBtn.addEventListener("mousedown", shootAction);
}

// =========================
// BOTÓN RESET
// =========================
const resetBtn = document.getElementById("reset");

if (resetBtn) {
  const resetAction = (e) => {
    e.preventDefault();

    // MENÚ FINAL → revancha
    if (gameEnded) {
      restartMatch();
      return;
    }

    // PARTIDA NORMAL → reset saque
    if (playing && !gameEnded) {
      ball.reset();
      resetPlayerPositions();

      playing = false;

      setTimeout(() => {
        startCountdown();
      }, 300);
    }
  };

  resetBtn.addEventListener("touchstart", resetAction);
  resetBtn.addEventListener("mousedown", resetAction);
}