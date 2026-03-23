// =======================
// POPUP NORMAL
// =======================
var botonInfo = document.getElementById("infoBtn");
var popup = document.getElementById("popup");
var cerrar = document.getElementById("cerrarPopup");

botonInfo.onclick = function() {
    popup.style.display = "flex";
};

cerrar.onclick = function() {
    popup.style.display = "none";
};

window.onclick = function(e) {
    if (e.target == popup) {
        popup.style.display = "none";
    }
};

// =======================
// BOTONES
// =======================
var botones = document.querySelectorAll(".boton");

// =======================
// POPUP VIDEO
// =======================
var popup2 = document.getElementById("popup2");
var cerrar2 = document.getElementById("cerrarPopup2");

if (botones[11]) {
    botones[11].onclick = function() {
        popup2.style.display = "flex";
        var video = popup2.getElementsByTagName("video")[0];
        if (video) video.play();
    };
}

cerrar2.onclick = function() {
    var video = popup2.getElementsByTagName("video")[0];
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
    popup2.style.display = "none";
};

popup2.onclick = function(e) {
    if (e.target == popup2) {
        var video = popup2.getElementsByTagName("video")[0];
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
        popup2.style.display = "none";
    }
};

// =======================
// POPUPS VICTORIA / DERROTA
// =======================
var popupVictoria = document.getElementById("popupVictoria");
var popupDerrota = document.getElementById("popupDerrota");

var cerrarVictoria = document.getElementById("cerrarVictoria");
var cerrarDerrota = document.getElementById("cerrarDerrota");

var mensajeVictoria = document.getElementById("mensajeVictoria");
var mensajeDerrota = document.getElementById("mensajeDerrota");

// 🔊 AUDIOS
var audioVictoria = document.getElementById("audioVictoria");
var audioDerrota = document.getElementById("audioDerrota");

cerrarVictoria.onclick = function() {
    popupVictoria.style.display = "none";
    if (audioVictoria) {
        audioVictoria.pause();
        audioVictoria.currentTime = 0;
    }
};

cerrarDerrota.onclick = function() {
    popupDerrota.style.display = "none";
    if (audioDerrota) {
        audioDerrota.pause();
        audioDerrota.currentTime = 0;
    }
};

popupVictoria.onclick = function(e) {
    if (e.target == popupVictoria) {
        popupVictoria.style.display = "none";
        if (audioVictoria) {
            audioVictoria.pause();
            audioVictoria.currentTime = 0;
        }
    }
};

popupDerrota.onclick = function(e) {
    if (e.target == popupDerrota) {
        popupDerrota.style.display = "none";
        if (audioDerrota) {
            audioDerrota.pause();
            audioDerrota.currentTime = 0;
        }
    }
};

// =======================
// JUEGO
// =======================
var recuadros = document.getElementsByClassName("recuadro-pin");
var displayIntentos = document.getElementById("intentos");
var displayTimer = document.getElementById("timer");

var botonStart = botones[12];
var botonStop = botones[13];
var botonReset = botones[14];

var intentosIniciales = parseInt(displayIntentos.textContent);
if (isNaN(intentosIniciales)) intentosIniciales = 7;

var intentos = intentosIniciales;

var juegoActivo = false;
var tiempo = 0;
var intervalo = null;

var PIN = [];
var progreso = ["", "", "", ""];

// =======================
// GENERAR PIN SIN REPETIDOS
// =======================
function generarPIN() {

    var nums = [];

    while (nums.length < 4) {

        var n = Math.floor(Math.random() * 10).toString();
        var repetido = false;

        for (var i = 0; i < nums.length; i++) {
            if (nums[i] == n) {
                repetido = true;
                break;
            }
        }

        if (repetido == false) {
            nums.push(n);
        }
    }

    return nums;
}

// =======================
// TIMER
// =======================
function actualizarTimer() {
    tiempo = tiempo + 10;

    var minutos = Math.floor(tiempo / 60000);
    var segundos = Math.floor((tiempo % 60000) / 1000);
    var miliseg = Math.floor((tiempo % 1000) / 10);

    if (minutos < 10) minutos = "0" + minutos;
    if (segundos < 10) segundos = "0" + segundos;
    if (miliseg < 10) miliseg = "0" + miliseg;

    displayTimer.textContent = minutos + ":" + segundos + ":" + miliseg;
}

// =======================
// START
// =======================
if (botonStart) {
    botonStart.onclick = function() {
        if (juegoActivo == true) return;

        juegoActivo = true;
        intervalo = setInterval(actualizarTimer, 10);
    };
}

// =======================
// STOP
// =======================
if (botonStop) {
    botonStop.onclick = function() {
        clearInterval(intervalo);
        juegoActivo = false;
    };
}

// =======================
// RESET
// =======================
if (botonReset) {
    botonReset.onclick = function() {
        clearInterval(intervalo);

        juegoActivo = false;
        tiempo = 0;
        intentos = intentosIniciales;

        PIN = generarPIN();
        progreso = ["", "", "", ""];

        displayTimer.textContent = "00:00:00";
        displayIntentos.textContent = intentos;

        for (var i = 0; i < recuadros.length; i++) {
            recuadros[i].value = "";
            recuadros[i].style.background = "";
        }

        for (var i = 0; i < botones.length; i++) {
            botones[i].disabled = false;
            botones[i].style.opacity = "1";
            botones[i].style.background = "";
        }
    };
}

// =======================
// INICIALIZAR PIN
// =======================
PIN = generarPIN();

// =======================
// BOTONES NUMERICOS
// =======================
for (var i = 0; i < botones.length; i++) {

    botones[i].addEventListener("click", function() {

        var valor = this.textContent;

        if (!/^\d$/.test(valor)) return;
        if (juegoActivo == false) return;
        if (this.disabled == true) return;

        intentos = intentos - 1;
        displayIntentos.textContent = intentos;

        var acierto = false;

        for (var j = 0; j < PIN.length; j++) {
            if (PIN[j] == valor) {
                progreso[j] = valor;
                recuadros[j].value = valor;
                recuadros[j].style.background = "lightgreen";
                acierto = true;
            }
        }

        if (acierto == true) {
            this.style.background = "green";
        } else {
            this.style.background = "red";
        }

        this.disabled = true;
        this.style.opacity = "0.5";

        // VICTORIA
        if (progreso.join("") == PIN.join("")) {

            clearInterval(intervalo);
            juegoActivo = false;

            mensajeVictoria.textContent =
                "⏱ Tiempo: " + displayTimer.textContent +
                " | 🔐 PIN: " + PIN.join("");

            popupVictoria.style.display = "flex";

            if (audioVictoria) {
                audioVictoria.play();
            }

        }
        // DERROTA
        else if (intentos <= 0) {

            clearInterval(intervalo);
            juegoActivo = false;

            mensajeDerrota.textContent =
                "⏱ Tiempo: " + displayTimer.textContent +
                " | 🔐 PIN correcto: " + PIN.join("");

            popupDerrota.style.display = "flex";

            if (audioDerrota) {
                audioDerrota.play();
            }
        }

    });
}