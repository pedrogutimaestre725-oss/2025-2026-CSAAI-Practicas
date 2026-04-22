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

let score = { blue: 0, red: 0 };

const goalHeight = 150;

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

  if (e.key === " " && playing) {
    const player = players.find(p => p.isUser);
    ball.vx = player.dir.x * 7;
    ball.vy = player.dir.y * 7;
  }

  if (e.key === "r") location.reload();
  if (e.key === "m") location.reload();
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
    this.speed = 2.5;
    this.dir = { x: 1, y: 0 };
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

    // DEFENSIVO MEJORADO
    if (this.role === "defensive") {
      let baseX = this.color === "blue" ? 80 : canvas.width - 80;
      let baseY = canvas.height / 2;

      if (distance(this, ball) < 160) {
        targetX = ball.x;
        targetY = ball.y;
      } else {
        targetX = baseX;
        targetY = baseY + Math.sin(Date.now() * 0.002) * 60;
      }
    }

    // separación bots
    players.forEach(other => {
      if (other === this) return;
      let d = distance(this, other);
      if (d < this.r * 2) {
        this.x += (this.x - other.x) * 0.05;
        this.y += (this.y - other.y) * 0.05;
      }
    });

    this.x += (targetX - this.x) * 0.03;
    this.y += (targetY - this.y) * 0.03;

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
      ctx.strokeStyle = "white";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.dir.x * 25, this.y + this.dir.y * 25);
      ctx.stroke();
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

    if (Math.abs(this.vx) < 0.05) this.vx = 0;
    if (Math.abs(this.vy) < 0.05) this.vy = 0;

    let goalTop = canvas.height/2 - goalHeight/2;
    let goalBottom = canvas.height/2 + goalHeight/2;

    // ARRIBA / ABAJO
    if (this.y <= this.r) {
      this.y = this.r;
      this.vy *= -1.2;
    }
    if (this.y >= canvas.height - this.r) {
      this.y = canvas.height - this.r;
      this.vy *= -1.2;
    }

    // IZQUIERDA
    if (this.x <= this.r) {
      if (this.y > goalTop && this.y < goalBottom) {
        goal("red");
      } else {
        this.x = this.r;
        this.vx *= -1.2;
      }
    }

    // DERECHA
    if (this.x >= canvas.width - this.r) {
      if (this.y > goalTop && this.y < goalBottom) {
        goal("blue");
      } else {
        this.x = canvas.width - this.r;
        this.vx *= -1.2;
      }
    }

    // anti-atasco
    if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
      this.vx += (Math.random() - 0.5) * 4;
      this.vy += (Math.random() - 0.5) * 4;
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
}

// --- EQUIPOS ---
let players = [];

function setupTeams() {
  if (team === "blue") {
    players = [
      new Player(200, 250, "blue", "user", true),
      new Player(100, 250, "blue", "defensive"),
      new Player(700, 200, "red", "aggressive"),
      new Player(750, 300, "red", "defensive")
    ];
  } else {
    players = [
      new Player(700, 250, "red", "user", true),
      new Player(800, 250, "red", "defensive"),
      new Player(200, 200, "blue", "aggressive"),
      new Player(150, 300, "blue", "defensive")
    ];
  }
}

// --- GOAL ---
function goal(teamScored) {
  playing = false;

  score[teamScored]++;
  updateScore();
  showGoal();

  if (
    (mode === "3" && score[teamScored] >= 3) ||
    (mode === "golden")
  ) {
    endGame(teamScored);
    return;
  }

  setTimeout(() => {
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
  playing = false;

  overlay.style.display = "flex";
  menuEl.style.display = "none";

  finalEl.style.display = "block";
  finalEl.innerHTML = `
    <h1>${winner === team ? "🏆 GANASTE" : "💀 PERDISTE"}</h1>
    <p>${score.blue} - ${score.red}</p>
    <br>
    <p>R → Reiniciar</p>
    <p>M → Menú</p>
  `;
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

// 🔥 PORTERÍAS BIEN DIBUJADAS
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

  // izquierda
  ctx.fillRect(0, 0, 10, goalTop);
  ctx.fillRect(0, goalBottom, 10, canvas.height - goalBottom);

  // derecha
  ctx.fillRect(canvas.width - 10, 0, 10, goalTop);
  ctx.fillRect(canvas.width - 10, goalBottom, 10, canvas.height - goalBottom);
}

// --- LOOP ---
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