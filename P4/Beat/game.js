const grid = document.getElementById("grid");
const message = document.getElementById("message");
const nivelUI = document.getElementById("nivel");
const estadoUI = document.getElementById("estado");
const tiempoUI = document.getElementById("tiempo");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const wordSetSelect = document.getElementById("wordSet");
const startLevelSelect = document.getElementById("startLevel");
const showTextCheckbox = document.getElementById("showText");

const musicBtn = document.getElementById("musicBtn");

let cards = [];
let playing = false;
let nivel = 1;
let time = 0;
let timerInterval;
let musicOn = true;

// 🎵 MÚSICA DINÁMICA
let bgMusic = new Audio();
bgMusic.loop = true;

const musicTracks = {
  nano: "audio/Nano.mp3",
  max: "audio/Max.mp3",
  maze: "audio/Maze.mp3"
};

// ⚡ tiempos
const speeds = [
  {on: 500, off: 300},
  {on: 400, off: 250},
  {on: 300, off: 200},
  {on: 220, off: 150},
  {on: 160, off: 120}
];

// ===== UTIL =====
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ===== DIFICULTAD =====
function generateSequence(words, level) {

  let seq = [];

  switch(level) {

    case 1:
      seq = [
        words[1], words[1], words[1], words[1],
        words[0], words[0], words[0], words[0]
      ];
      break;

    case 2:
      seq = [
        words[1], words[1], words[0], words[0],
        words[1], words[0], words[1], words[0]
      ];
      break;

    case 3:
      seq = [
        words[1], words[0], words[1], words[0],
        words[0], words[1], words[0], words[1]
      ];
      break;

    case 4:
      seq = [
        words[1], words[0], words[1], words[0],
        words[1], words[0], words[1], words[0]
      ];
      break;

    case 5:
      seq = [
        words[0], words[1], words[0], words[1],
        words[0], words[1], words[0], words[1]
      ];
      break;
  }

  return seq;
}

// ===== GRID =====
function createGrid(sequence) {
  grid.innerHTML = "";
  cards = [];

  const images = {
    NANO: "img/nano.png",
    AMO: "img/amo.png",
    MAX: "img/max.png",
    MAD: "img/mad.png",
    MAZE: "img/maze.png",
    SPIN: "img/spin.png"
  };

  sequence.forEach(word => {
    const div = document.createElement("div");
    div.classList.add("card");

    const img = document.createElement("img");
    const text = document.createElement("div");

    text.classList.add("card-text");

    img.src = images[word];
    img.alt = word;

    if (showTextCheckbox.checked) {
      text.textContent = word;
    }

    div.appendChild(img);
    div.appendChild(text);

    grid.appendChild(div);
    cards.push(div);
  });
}

// ===== TIMER =====
function startTimer() {
  time = 0;
  timerInterval = setInterval(() => {
    time += 0.1;
    tiempoUI.textContent = time.toFixed(1);
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// ===== CONTROLES =====
function toggleControls(disabled) {
  wordSetSelect.disabled = disabled;
  startLevelSelect.disabled = disabled;
  showTextCheckbox.disabled = disabled;
}

// ===== JUEGO =====
async function playLevel(isFirst = false) {

  if (!isFirst) {
    message.textContent = "Are you ready...";
    await delay(3000);

    for (let i = 3; i > 0; i--) {
      message.textContent = i;
      await delay(1000);
    }
  }

  message.textContent = "GO!";

  const speed = speeds[nivel - 1];

  for (let i = 0; i < cards.length; i++) {
    if (!playing) return;

    cards[i].classList.add("active");
    await delay(speed.on);

    cards[i].classList.remove("active");
    await delay(speed.off);
  }
}

async function gameLoop(words) {

  let first = true;

  for (; nivel <= 5; nivel++) {

    nivelUI.textContent = nivel;
    estadoUI.textContent = "Jugando";
    document.getElementById("gameLevel").textContent = `${nivel}/5`;

    const sequence = generateSequence(words, nivel);
    createGrid(sequence);

    await playLevel(first);
    first = false;

    if (!playing) return;
  }

  endGame();
}

// ===== ESTADOS =====
function startGame() {
  if (playing) return;

  playing = true;
  nivel = parseInt(startLevelSelect.value);

  const set = wordSetSelect.value;

  // 🎵 CAMBIAR MÚSICA SEGÚN SET
  if (musicOn) {
    bgMusic.pause();
    bgMusic = new Audio(musicTracks[set]);
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.play();
  }

  let words;

  switch(set) {
    case "nano":
      words = ["NANO", "AMO"];
      break;

    case "max":
      words = ["MAX", "MAD"];
      break;

    case "maze":
      words = ["MAZE", "SPIN"];
      break;

    default:
      words = ["NANO", "AMO"];
  }

  toggleControls(true);
  startTimer();

  gameLoop(words);
}

function stopGame() {
  playing = false;
  estadoUI.textContent = "Detenido";
  message.textContent = "Juego detenido";

  stopTimer();
  toggleControls(false);

  bgMusic.pause(); // 🔇 parar música
}

function endGame() {
  playing = false;
  estadoUI.textContent = "Finalizado";
  message.textContent = "¡Juego terminado!";

  stopTimer();
  toggleControls(false);

  bgMusic.pause(); // 🔇 parar música
}

// ===== EVENTOS =====
startBtn.onclick = startGame;
stopBtn.onclick = stopGame;

musicBtn.onclick = () => {
  musicOn = !musicOn;

  if (musicOn) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }

  musicBtn.textContent = musicOn ? "🔊 Música ON" : "🔇 Música OFF";
};