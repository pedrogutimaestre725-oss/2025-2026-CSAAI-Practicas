const botonInfo = document.getElementById("infoBtn");
const popup = document.getElementById("popup");
const cerrar = document.getElementById("cerrarPopup");

botonInfo.addEventListener("click", function(){
    popup.style.display = "flex";
});

cerrar.addEventListener("click", function(){
    popup.style.display = "none";
});

window.addEventListener("click", function(e){
    if(e.target == popup){
        popup.style.display = "none";
    }
});

// BOTON VACIO PARA VIDEO
const infoBtn2 = document.querySelectorAll('.boton')[11]; // el otro botón vacío
const popup2 = document.getElementById('popup2');
const cerrar2 = document.getElementById('cerrarPopup2');

infoBtn2.addEventListener('click', () => {
    popup2.style.display = 'flex';
    const video = popup2.querySelector('video');
    video.play().catch(err => {
        // En móviles, a veces la reproducción automática falla
        console.log("Reproducción automática bloqueada:", err);
    });
});

cerrar2.addEventListener('click', () => {
    const video = popup2.querySelector('video');
    video.pause();              // Pausa el video al cerrar
    video.currentTime = 0;      // Reinicia el video al principio
    popup2.style.display = 'none';
});

// Cerrar al hacer click fuera del contenido
popup2.addEventListener('click', (e) => {
    if(e.target === popup2){
        const video = popup2.querySelector('video');
        video.pause();
        video.currentTime = 0;  // Reinicia el video al principio
        popup2.style.display = 'none';
    }
});