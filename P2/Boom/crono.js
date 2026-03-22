// =======================
// POPUP NORMAL
// =======================
const botonInfo = document.getElementById("infoBtn");
const popup = document.getElementById("popup");
const cerrar = document.getElementById("cerrarPopup");

botonInfo.addEventListener("click", () => {
    popup.style.display = "flex";
});

cerrar.addEventListener("click", () => {
    popup.style.display = "none";
});

window.addEventListener("click", (e) => {
    if(e.target == popup){
        popup.style.display = "none";
    }
});

// =======================
// POPUP VIDEO
// =======================
const infoBtn2 = document.querySelectorAll('.boton')[11];
const popup2 = document.getElementById('popup2');
const cerrar2 = document.getElementById('cerrarPopup2');

infoBtn2.addEventListener('click', () => {
    popup2.style.display = 'flex';
    const video = popup2.querySelector('video');
    video.play().catch(()=>{});
});

cerrar2.addEventListener('click', () => {
    const video = popup2.querySelector('video');
    video.pause();
    video.currentTime = 0;
    popup2.style.display = 'none';
});

popup2.addEventListener('click', (e) => {
    if(e.target === popup2){
        const video = popup2.querySelector('video');
        video.pause();
        video.currentTime = 0;
        popup2.style.display = 'none';
    }
});

// =======================
// JUEGO
// =======================
const botones = document.querySelectorAll('.boton');
const recuadros = document.querySelectorAll('.recuadro-pin');
const displayIntentos = document.getElementById('intentos');
const displayTimer = document.getElementById('timer');

const botonStart = botones[12];
const botonStop = botones[13];
const botonReset = botones[14];

let intentos = 7;
let juegoActivo = false;
let tiempo = 0;
let intervalo = null;

let PIN = [];
let progreso = ["", "", "", ""];

// =======================
// GENERAR PIN RANDOM
// =======================
function generarPIN(){
    let nums = [];
    while(nums.length < 4){
        let n = Math.floor(Math.random() * 10).toString();
        if(!nums.includes(n)){
            nums.push(n);
        }
    }
    return nums;
}

// =======================
// TIMER (mm:ss:ms)
// =======================
function actualizarTimer(){
    tiempo += 10;

    let minutos = String(Math.floor(tiempo / 60000)).padStart(2, '0');
    let segundos = String(Math.floor((tiempo % 60000) / 1000)).padStart(2, '0');
    let miliseg = String(Math.floor((tiempo % 1000) / 10)).padStart(2, '0');

    displayTimer.textContent = `${minutos}:${segundos}:${miliseg}`;
}

// =======================
// START
// =======================
botonStart.addEventListener('click', () => {
    if(juegoActivo) return;

    juegoActivo = true;
    intervalo = setInterval(actualizarTimer, 10);
});

// =======================
// STOP
// =======================
botonStop.addEventListener('click', () => {
    clearInterval(intervalo);
    juegoActivo = false;
});

// =======================
// RESET
// =======================
botonReset.addEventListener('click', () => {
    clearInterval(intervalo);

    juegoActivo = false;
    tiempo = 0;
    intentos = 7;

    PIN = generarPIN();
    progreso = ["", "", "", ""];

    displayTimer.textContent = "00:00:00";
    displayIntentos.textContent = intentos;

    recuadros.forEach(r => {
        r.value = "";
        r.style.background = "";
    });

    botones.forEach(b => {
        b.disabled = false;
        b.style.opacity = "1";
        b.style.background = "";
    });
});

// =======================
// INICIALIZAR PRIMER PIN
// =======================
PIN = generarPIN();

// =======================
// CLICK BOTONES
// =======================
botones.forEach(boton => {
    boton.addEventListener('click', () => {

        const valor = boton.textContent;

        // SOLO NUMEROS
        if(!/^\d$/.test(valor)) return;

        if(!juegoActivo) return;
        if(boton.disabled) return;

        // RESTAR INTENTO
        intentos--;
        displayIntentos.textContent = intentos;

        let acierto = false;

        // COMPROBAR PIN
        PIN.forEach((num, i) => {
            if(num === valor){
                progreso[i] = valor;
                recuadros[i].value = valor;
                recuadros[i].style.background = "lightgreen";
                acierto = true;
            }
        });

        // COLOR BOTON
        if(acierto){
            boton.style.background = "green";
        }else{
            boton.style.background = "red";
        }

        boton.disabled = true;
        boton.style.opacity = "0.5";

        // VICTORIA
        if(progreso.join('') === PIN.join('')){
            clearInterval(intervalo);
            juegoActivo = false;

            alert(`🎉 ¡Victoria!\n⏱ Tiempo: ${displayTimer.textContent}\n🔐 PIN: ${PIN.join('')}`);
        }

        // DERROTA
        if(intentos <= 0){
            clearInterval(intervalo);
            juegoActivo = false;

            alert(`💀 Derrota\n⏱ Tiempo: ${displayTimer.textContent}\n🔐 PIN correcto: ${PIN.join('')}`);
        }

    });
});