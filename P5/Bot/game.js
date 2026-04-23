const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;

// UI
const overlay = document.getElementById("overlay");
const finalEl = document.getElementById("final");
const menuEl = document.getElementById("menu");
const countdownEl = document.getElementById("countdown");
const goalMsg = document.getElementById("goalMsg");

const blueScoreEl = document.getElementById("blueScore");
const redScoreEl = document.getElementById("redScore");

// --- ESTADO ---
let mode = null;
let team = null;
let playing = false;
let menuState = "mode";
let gameEnded = false;

let score = { blue: 0, red: 0 };

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
    if (e.key === "q") {
      team = "blue";
      startGame();
    }
    if (e.key === "e") {
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
    }
  }

  if (e.key === "r" && gameEnded) {
    score = { blue: 0, red: 0 };
    updateScore();
    gameEnded = false;
    overlay.style.display = "none";
    setupTeams();
    ball.reset();
    startCountdown();
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
    <p>Q → Azul</p>
    <p>E → Rojo</p>
  `;
}

// --- PLAYER ---
class Player {
  constructor(x, y, color, role, isUser = false) {
    this.x = x;
    this.y = y;
    this.r = 15;
    this.color = color;
    this.role = role;
    this.isUser = isUser;
    this.speed = PLAYER_SPEED;
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

    if (distance(this, ball) < 22) {
      ball.kick(this);
    }
  }

  limit() {
    this.x = Math.max(this.r, Math.min(canvas.width - this.r, this.x));
    this.y = Math.max(this.r, Math.min(canvas.height - this.r, this.y));
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();

    if (this.isUser) {
      const len = 25;
      const ex = this.x + this.dir.x * len;
      const ey = this.y + this.dir.y * len;

      ctx.strokeStyle = "white";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // punta flecha
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - this.dir.x * 8 - this.dir.y * 5, ey - this.dir.y * 8 + this.dir.x * 5);
      ctx.lineTo(ex - this.dir.x * 8 + this.dir.y * 5, ey - this.dir.y * 8 - this.dir.x * 5);
      ctx.closePath();
      ctx.fillStyle = "white";
      ctx.fill();
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
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
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
}

// --- EQUIPOS ---
let players = [];

function setupTeams() {
  if (team === "blue") {
    players = [
      new Player(200, 250, "blue", "user", true),
      new Player(100, 250, "blue", "defensive"),
      new Player(700, 250, "red", "aggressive"),
      new Player(800, 250, "red", "defensive")
    ];
  } else {
    players = [
      new Player(700, 250, "red", "user", true),
      new Player(800, 250, "red", "defensive"),
      new Player(200, 250, "blue", "aggressive"),
      new Player(100, 250, "blue", "defensive")
    ];
  }
}

// --- GOAL / RESTO IGUAL (sin tocar) ---
function goal(teamScored) {
  if (gameEnded) return;

  playing = false;

  score[teamScored]++;
  updateScore();
  showGoal();

  setTimeout(() => {

    if (
      (mode === "3" && score[teamScored] >= 3) ||
      (mode === "golden")
    ) {
      endGame(teamScored);
      return;
    }

    ball.reset();
    setupTeams();
    startCountdown();

  }, 2000);
}

function updateScore() {
  blueScoreEl.textContent = score.blue;
  redScoreEl.textContent = score.red;
}

function showGoal() {
  goalMsg.innerHTML = "⚽ GOOOOOL ⚽";
  setTimeout(() => goalMsg.innerHTML = "", 2000);
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
      setTimeout(() => countdownEl.textContent = "", 500);
      clearInterval(interval);
    }
  }, 1000);
}

function startGame() {
  overlay.style.display = "none";
  menuState = "playing";

  setupTeams();
  ball.reset();
  startCountdown();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// PORTERÍAS
function drawField() {
  ctx.fillStyle = "#1e7a3a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 60, 0, Math.PI*2);
  ctx.stroke();

  let goalTop = canvas.height/2 - goalHeight/2;
  let goalBottom = canvas.height/2 + goalHeight/2;

  ctx.fillStyle = "white";

  ctx.fillRect(0, 0, 10, goalTop);
  ctx.fillRect(0, goalBottom, 10, canvas.height - goalBottom);

  ctx.fillRect(canvas.width - 10, 0, 10, goalTop);
  ctx.fillRect(canvas.width - 10, goalBottom, 10, canvas.height - goalBottom);
}

// LOOP
function loop() {
  requestAnimationFrame(loop);

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