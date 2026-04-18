// ===== ELEMENTOS =====
const grid = document.getElementById("grid");
const message = document.getElementById("message");
const nivelUI = document.getElementById("nivel");
const estadoUI = document.getElementById("estado");
const tiempoUI = document.getElementById("tiempo");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const recordBtn = document.getElementById("recordBtn");

const wordSetSelect = document.getElementById("wordSet");
const startLevelSelect = document.getElementById("startLevel");
const showTextCheckbox = document.getElementById("showText");
const voiceCheckbox = document.getElementById("voiceMode");

const musicBtn = document.getElementById("musicBtn");

// ===== VARIABLES =====
let cards = [];
let playing = false;
let nivel = 1;
let time = 0;
let timerInterval;
let musicOn = true;

// ===== VAR =====
let spokenWords = [];
let currentSequence = [];
let totalCorrect = 0;
let totalRounds = 0;

// ===== VOZ =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

// ===== MÚSICA =====
let bgMusic = null;

const musicTracks = {
  nano: "./Nano.mp3",
  max: "./Max.mp3",
  maze: "./Maze.mp3"
};

// ===== VELOCIDADES =====
const speeds = [
  {on: 500, off: 300},
  {on: 400, off: 250},
  {on: 300, off: 200},
  {on: 220, off: 150},
  {on: 160, off: 120}
];

// ===== VOZ CONFIG =====
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.continuous = true;

  recognition.onresult = function(event) {
    const texto = event.results[event.results.length - 1][0].transcript.toUpperCase();

    texto.split(" ").forEach(word => {
      spokenWords.push(word.trim());
    });
  };
}

// ===== UTIL =====
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ===== GRID =====
function createGrid(sequence) {
  grid.innerHTML = "";
  cards = [];

  sequence.forEach(word => {
    const div = document.createElement("div");
    div.classList.add("card");

    div.dataset.word = word;

    const img = document.createElement("img");
    const text = document.createElement("div");

    text.classList.add("card-text");

    img.src = `./${word}.gif`;
    img.alt = word;

    text.textContent = showTextCheckbox.checked ? word : "";

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

// ===== CONTROL =====
function toggleControls(disabled) {
  wordSetSelect.disabled = disabled;
  startLevelSelect.disabled = disabled;
  showTextCheckbox.disabled = disabled;
}

// ===== MÚSICA =====
function loadMusic(track) {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.src = "";
  }

  bgMusic = new Audio(track);
  bgMusic.loop = true;
  bgMusic.volume = 0.5;
  bgMusic.play();
}

// ===== EVALUACIÓN =====
function evaluateRound() {
  let correct = 0;
  let index = 0;

  for (let i = 0; i < spokenWords.length; i++) {
    if (spokenWords[i] === currentSequence[index]) {
      correct++;
      index++;
    }
    if (index >= currentSequence.length) break;
  }

  return correct;
}

// ===== PLAY LEVEL =====
async function playLevel(isFirst = false) {

  spokenWords = [];
  currentSequence = cards.map(c => c.dataset.word);

  if (!isFirst) {
    message.textContent = "Are you ready...";
    await delay(1500);
  }

  const speed = speeds[nivel - 1];

  for (let i = 0; i < cards.length; i++) {
    if (!playing) return;

    cards[i].classList.add("active");

    if (voiceCheckbox.checked && recognition) {
      try { recognition.start(); } catch (e) {}
    }

    await delay(speed.on);

    cards[i].classList.remove("active");
    await delay(speed.off);
  }

  // ===== EVALUACIÓN =====
  if (voiceCheckbox.checked && recognition) {

    recognition.stop();

    message.textContent = "⏳ Calculando...";
    await delay(2000);

    const correct = evaluateRound();
    totalCorrect += correct;
    totalRounds += 8;

    let resultado = "";

    if (correct >= 7) resultado = `✅ Correcto (${correct}/8)`;
    else if (correct >= 4) resultado = `⚠️ Parcial (${correct}/8)`;
    else resultado = `❌ Incorrecto (${correct}/8)`;

    message.textContent = resultado;
    await delay(3000);

    // 🔥 RESTO HASTA 10s TOTAL
    message.textContent = "Preparado...";
    await delay(1000);

    for (let i = 3; i > 0; i--) {
      message.textContent = i;
      await delay(1000);
    }

    message.textContent = "🏁";
    await delay(1000);
  }
}

// ===== SECUENCIA =====
function generateSequence(words, level) {
  switch(level) {
    case 1: return [words[1],words[1],words[1],words[1],words[0],words[0],words[0],words[0]];
    case 2: return [words[1],words[1],words[0],words[0],words[1],words[0],words[1],words[0]];
    case 3: return [words[1],words[0],words[1],words[0],words[0],words[1],words[0],words[1]];
    case 4: return [words[1],words[0],words[1],words[0],words[1],words[0],words[1],words[0]];
    case 5: return [words[0],words[1],words[0],words[1],words[0],words[1],words[0],words[1]];
  }
}

// ===== LOOP =====
async function gameLoop(words) {

  totalCorrect = 0;
  totalRounds = 0;

  let first = true;

  for (; nivel <= 5; nivel++) {

    nivelUI.textContent = nivel;
    estadoUI.textContent = "Jugando";
    document.getElementById("gameLevel").textContent = `${nivel}/5`;

    const sequence = generateSequence(words, nivel);
    createGrid(sequence);

    if (first) {
      message.textContent = "Preparado...";
      await delay(1000);
      for (let i = 3; i > 0; i--) {
        message.textContent = i;
        await delay(1000);
      }
      message.textContent = "🏁";
      await delay(600);
    }

    await playLevel(first);
    first = false;

    if (!playing) return;
  }

  endGame();
}

// ===== START =====
function startGame() {
  if (playing) return;

  playing = true;
  nivel = parseInt(startLevelSelect.value);

  const set = wordSetSelect.value;

  const wordsMap = {
    nano: ["NANO","AMO"],
    max: ["MAX","MAD"],
    maze: ["MAZE","SPIN"]
  };

  if (musicOn) loadMusic(musicTracks[set]);

  toggleControls(true);
  startTimer();

  gameLoop(wordsMap[set]);
}

// ===== STOP =====
function stopGame() {
  playing = false;
  estadoUI.textContent = "Detenido";
  message.textContent = "Juego detenido";

  stopTimer();
  toggleControls(false);

  if (bgMusic) bgMusic.pause();
  if (recognition) recognition.stop();
}

// ===== END =====
function endGame() {
  playing = false;
  estadoUI.textContent = "Finalizado";

  const porcentaje = Math.round((totalCorrect / totalRounds) * 100);

  message.innerHTML = `
    🎉 Fin de Juego<br>
    Puntuación: ${totalCorrect}/${totalRounds} (${porcentaje}%)
  `;

  stopTimer();
  toggleControls(false);

  if (bgMusic) bgMusic.pause();
  if (recognition) recognition.stop();
}

// ===== EVENTOS =====
startBtn.onclick = startGame;
stopBtn.onclick = stopGame;

musicBtn.onclick = () => {
  musicOn = !musicOn;
  if (musicOn && bgMusic) bgMusic.play();
  else if (bgMusic) bgMusic.pause();

  musicBtn.textContent = musicOn ? "🔊 Música ON" : "🔇 Música OFF";
};

recordBtn.onclick = () => {
  if (!voiceCheckbox.checked) {
    message.textContent = "❌ Activa VAR primero";
    return;
  }

  try {
    spokenWords = [];
    recognition.start();
    message.textContent = "🎤 Grabando...";
  } catch {
    message.textContent = "⚠️ Ya activo";
  }
};