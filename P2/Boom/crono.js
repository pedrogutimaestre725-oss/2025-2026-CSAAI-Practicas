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
});

cerrar2.addEventListener('click', () => {
    const video = popup2.querySelector('video');
    video.pause(); // pausa el video al cerrar
    popup2.style.display = 'none';
});

// Cerrar al hacer click fuera del contenido
popup2.addEventListener('click', (e) => {
    if(e.target === popup2){
        const video = popup2.querySelector('video');
        video.pause();
        popup2.style.display = 'none';
    }
});