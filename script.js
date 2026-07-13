const canvas = document.getElementById('canvas-core');
const ctx = canvas.getContext('2d');
const display = document.getElementById('display');
const hud = document.querySelector('.hud');
const barrasAudio = document.querySelectorAll('.bar');

const API_URL = 'https://cumulative-charlie-manufacturers-simpsons.trycloudflare.com/chat';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- RED NEURONAL ---
let particles = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 1.0, vy: (Math.random() - 0.5) * 1.0
}));

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isSpeaking = window.speechSynthesis.speaking;
    
    if (isSpeaking) {
        hud.classList.add('speaking');
        barrasAudio.forEach(bar => { bar.style.height = Math.floor(Math.random() * 16 + 4) + 'px'; });
    } else {
        hud.classList.remove('speaking');
        barrasAudio.forEach(bar => { bar.style.height = '4px'; });
    }

    const speed = isSpeaking ? 2 : 0.5; 
    const color = isSpeaking ? '#a78bfa' : 'rgba(224, 231, 255, 0.6)'; 
    const connectDistance = isSpeaking ? 160 : 100;

    particles.forEach((p, i) => {
        p.x += p.vx * speed; p.y += p.vy * speed;
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, isSpeaking ? 2 : 1, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        particles.slice(i + 1).forEach(p2 => {
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if(dist < connectDistance) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = isSpeaking 
                    ? `rgba(167, 139, 250, ${(1 - dist/connectDistance) * 0.4})` 
                    : `rgba(224, 231, 255, ${(1 - dist/connectDistance) * 0.15})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        });
    });
    requestAnimationFrame(animate);
}
animate();

// --- LÓGICA DE AGENDA ---
function obtenerContactos() { return JSON.parse(localStorage.getItem('lunaAgenda')) || {}; }
function guardarContacto(nombre, numero) {
    const contactos = obtenerContactos();
    contactos[nombre.toLowerCase()] = numero;
    localStorage.setItem('lunaAgenda', JSON.stringify(contactos));
    actualizarListaContactos();
}
function borrarContacto(nombre) {
    const contactos = obtenerContactos();
    delete contactos[nombre];
    localStorage.setItem('lunaAgenda', JSON.stringify(contactos));
    actualizarListaContactos();
}
function actualizarListaContactos() {
    const lista = document.getElementById('lista-contactos');
    const contactos = obtenerContactos();
    lista.innerHTML = '';
    for (const [nombre, numero] of Object.entries(contactos)) {
        const div = document.createElement('div'); div.className = 'contacto-item';
        div.innerHTML = `<span>${nombre.toUpperCase()} - ${numero}</span><button onclick="borrarContacto('${nombre}')">X</button>`;
        lista.appendChild(div);
    }
}

document.getElementById('btn-agenda').addEventListener('click', () => {
    document.getElementById('modal-agenda').classList.remove('oculto');
    actualizarListaContactos();
});
document.getElementById('btn-cerrar-agenda').addEventListener('click', () => { document.getElementById('modal-agenda').classList.add('oculto'); });
document.getElementById('btn-guardar-contacto').addEventListener('click', () => {
    const nombre = document.getElementById('nuevo-nombre').value.trim();
    const numero = document.getElementById('nuevo-numero').value.trim();
    if (nombre && numero) {
        guardarContacto(nombre, numero);
        document.getElementById('nuevo-nombre').value = ''; document.getElementById('nuevo-numero').value = '';
    }
});

// --- MODO CENTINELA ---
let wakeLock = null;
const btnCentinela = document.getElementById('btn-centinela');
async function activarModoCentinela() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        btnCentinela.textContent = "CENTINELA: ON";
        btnCentinela.classList.add('activo');
        hablar("Modo centinela activado. Pantalla asegurada.");
    } catch (err) { console.error("Error WakeLock:", err); }
}
function desactivarModoCentinela() {
    if (wakeLock !== null) {
        wakeLock.release(); wakeLock = null;
        btnCentinela.textContent = "CENTINELA: OFF";
        btnCentinela.classList.remove('activo');
        hablar("Modo centinela desactivado.");
    }
}
btnCentinela.addEventListener('click', () => { wakeLock === null ? activarModoCentinela() : desactivarModoCentinela(); });

// --- INTELIGENCIA DE VOZ Y REACTIVACIÓN ---
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new Rec();
rec.continuous = false;
rec.interimResults = false;
rec.lang = 'es-MX';
let isRecognizing = false;

rec.onstart = () => { isRecognizing = true; };
rec.onend = () => { isRecognizing = false; rec.start(); };

// Sensor de regreso a la app
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !isRecognizing) {
        try { rec.start(); } catch(e) {}
    }
});

rec.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
    
    if (transcript.includes('luna')) { 
        window.speechSynthesis.cancel(); 
        const comando = transcript.replace(/luna/gi, '').trim();
        
        if (comando.includes('llama a')) {
            const nombre = comando.replace('llama a', '').trim();
            const contactos = obtenerContactos();
            if (contactos[nombre]) {
                hablar(`Abriendo línea con ${nombre}. Confirma en pantalla.`, () => {
                    escribirTexto(`> LLAMANDO A: ${nombre.toUpperCase()}`);
                    setTimeout(() => { window.location.href = `tel:${contactos[nombre]}`; }, 1500);
                });
            } else {
                hablar(`No encontré a ${nombre} en la agenda.`, () => {
                    escribirTexto(`> CONTACTO NO ENCONTRADO.`);
                });
            }
            return; 
        }

        if (comando.length > 0) {
            display.textContent = "> PROCESANDO...";
            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ mensaje: comando })
                });
                const data = await res.json();
                
                // MAGIA DE SINCRONIZACIÓN: Pasamos la escritura como una función que espera a que inicie el audio
                hablar(data.respuesta, () => {
                    escribirTexto(data.respuesta.toUpperCase());
                });
                
            } catch (err) {
                hablar("Interferencia detectada.", () => {
                    display.textContent = "> ERROR DE CONEXIÓN.";
                });
            }
        }
    }
};
rec.start();

// --- ESCRITURA ---
function escribirTexto(texto) {
    display.textContent = "> ";
    let i = 0;
    if(window.escrituraIntervalo) clearInterval(window.escrituraIntervalo);
    
    // Incrementé ligerísimamente la velocidad a 15ms para que empate mejor con la voz de Android
    window.escrituraIntervalo = setInterval(() => {
        if (i < texto.length) { display.textContent += texto[i]; i++; } 
        else { clearInterval(window.escrituraIntervalo); }
    }, 15); 
}

// --- AUDIO SINCRONIZADO ---
function hablar(texto, callbackOnStart) {
    window.speechSynthesis.cancel(); 
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX'; 
    
    const voces = window.speechSynthesis.getVoices();
    const voz = voces.find(v => v.name.includes('Sabina')) || 
                voces.find(v => v.name.includes('Helena')) ||
                voces.find(v => v.name.toLowerCase().includes('female') && v.lang.includes('es')) ||
                voces.find(v => v.lang === 'es-MX' || v.lang === 'es-ES') || voces[0];
    u.voice = voz; u.pitch = 1.2; u.rate = 1.05; 
    
    // Cuando el celular confirme físicamente que arrancó el sonido, arranca el texto
    u.onstart = () => {
        if(callbackOnStart) callbackOnStart();
    };

    // Respaldo de seguridad: Algunos celulares Android bloquean el evento 'onstart'
    // Si la voz no avisa en 200 milisegundos, forzamos el texto de todos modos
    let arrancadorSeguro = setTimeout(() => {
        if(callbackOnStart) {
            callbackOnStart();
            callbackOnStart = null; // Evita que se ejecute dos veces
        }
    }, 200);

    u.onstart = () => {
        clearTimeout(arrancadorSeguro);
        if(callbackOnStart) {
            callbackOnStart();
            callbackOnStart = null;
        }
    };

    window.speechSynthesis.speak(u);
}

setInterval(() => {
    const elReloj = document.getElementById('reloj');
    if(elReloj) elReloj.innerText = new Date().toLocaleTimeString('es-MX', { hour12: false });
}, 1000);