const canvas = document.getElementById('canvas-core');
const ctx = canvas.getContext('2d');
const display = document.getElementById('display');
const hud = document.querySelector('.hud');
const barrasAudio = document.querySelectorAll('.bar');

const API_URL = 'https://cumulative-charlie-manufacturers-simpsons.trycloudflare.com/chat';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- RED NEURONAL LUNAR ---
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

// --- INTELIGENCIA DE VOZ ---
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new Rec();
rec.continuous = false;
rec.interimResults = false;
rec.lang = 'es-MX';

rec.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
    
    if (transcript.includes('luna')) { 
        window.speechSynthesis.cancel(); 
        const comando = transcript.replace(/luna/gi, '').trim();
        
        if (comando.length > 0) {
            display.textContent = "> PROCESANDO...";
            
            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ mensaje: comando })
                });
                const data = await res.json();
                
                // Disparo ultra-prioritario para móviles
                setTimeout(() => hablar(data.respuesta), 0);
                escribirTexto(data.respuesta.toUpperCase());
                
            } catch (err) {
                setTimeout(() => hablar("Interferencia detectada, Jefe."), 0);
                display.textContent = "> ERROR DE CONEXIÓN.";
            }
        } else {
            display.textContent = "> LUNA EN LÍNEA. DIME...";
        }
    }
};

rec.onend = () => rec.start(); 
rec.start();

// --- ESCRITURA INDEPENDIENTE ---
function escribirTexto(texto) {
    display.textContent = "> ";
    let i = 0;
    if(window.escrituraIntervalo) clearInterval(window.escrituraIntervalo);
    
    window.escrituraIntervalo = setInterval(() => {
        if (i < texto.length) {
            display.textContent += texto[i];
            i++;
        } else {
            clearInterval(window.escrituraIntervalo);
        }
    }, 20); // Ajusta la velocidad si lo deseas
}

// --- CONFIGURACIÓN DE VOZ (Corregida para Windows) ---
function hablar(texto) {
    window.speechSynthesis.cancel(); 
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX'; // Forzar que el motor sepa que es español
    
    const voces = window.speechSynthesis.getVoices();
    
    // Prioridad: Voces femeninas de Windows (Sabina, Helena) -> Google Español -> Cualquiera en español
    const voz = voces.find(v => v.name.includes('Sabina')) || 
                voces.find(v => v.name.includes('Helena')) ||
                voces.find(v => v.name.toLowerCase().includes('female') && v.lang.includes('es')) ||
                voces.find(v => v.lang === 'es-MX' || v.lang === 'es-ES') || 
                voces[0];
    
    u.voice = voz;
    u.pitch = 1.2; 
    u.rate = 1.05; 
    
    window.speechSynthesis.speak(u);
}

// Asegurarse de que las voces carguen correctamente en PC
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

// --- RELOJ ---
setInterval(() => {
    const elReloj = document.getElementById('reloj');
    if(elReloj) elReloj.innerText = new Date().toLocaleTimeString('es-MX', { hour12: false });
}, 1000);