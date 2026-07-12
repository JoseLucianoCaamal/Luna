const canvas = document.getElementById('canvas-core');
const ctx = canvas.getContext('2d');
const display = document.getElementById('display');
const hud = document.querySelector('.hud');
const barrasAudio = document.querySelectorAll('.bar');

// --- CONFIGURACIÓN DE TU TÚNEL (TU URL DE CLOUDFLARE) ---
const API_URL = 'https://cumulative-charlie-manufacturers-simpsons.trycloudflare.com/chat';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- 1. RED NEURONAL LUNAR (Tus animaciones) ---
let particles = Array.from({length: 100}, () => ({
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

// --- 2. INTELIGENCIA DE VOZ Y MICRÓFONO ---
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new Rec();
rec.continuous = true;
rec.interimResults = false;
rec.lang = 'es-ES';

rec.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
    
    if (transcript.includes('luna')) { 
        window.speechSynthesis.cancel(); 
        const comando = transcript.replace(/luna/gi, '').trim();
        
        if (comando.length > 0) {
            escribirTexto(`> ESCUCHANDO: "${comando.toUpperCase()}"...`);
            
            try {
                // AQUÍ LLAMAMOS A TU SERVIDOR EN LINUX A TRAVÉS DEL TÚNEL
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ mensaje: comando })
                });
                const data = await res.json();
                
                await escribirTexto(`> ${data.respuesta.toUpperCase()}`);
                hablar(data.respuesta);
                
            } catch (err) {
                hablar("Interferencia detectada, Jefe.");
                escribirTexto("> ERROR DE ENTRADA CÓSMICA.");
            }
        } else {
            escribirTexto("> LUNA EN LÍNEA. DIME...");
        }
    }
};

rec.start();
rec.onend = () => rec.start(); 

// --- 3. EFECTO DE ESCRITURA ---
async function escribirTexto(texto) {
    display.textContent = "> "; 
    for (let char of texto) {
        display.textContent += char; 
        await new Promise(r => setTimeout(r, 15)); 
    }
}

// --- 4. CONFIGURACIÓN DE VOZ ---
let vocesDisponibles = [];
function cargarVoces() { vocesDisponibles = window.speechSynthesis.getVoices(); }
cargarVoces();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = cargarVoces;
}

function hablar(texto) {
    const u = new SpeechSynthesisUtterance(texto);
    const voces = window.speechSynthesis.getVoices();
    
    // Prioriza voces de Google para mayor calidad
    const vozFemenina = voces.find(v => v.name.includes('Google español')) || voces[0];
    
    u.voice = vozFemenina;
    u.pitch = 1.1; 
    u.rate = 1.05; 
    
    window.speechSynthesis.speak(u);
}

// --- RELOJ LOCAL ---
setInterval(() => {
    const ahora = new Date();
    const elReloj = document.getElementById('reloj');
    if(elReloj) elReloj.innerText = ahora.toLocaleTimeString('es-MX', { hour12: false });
}, 1000);