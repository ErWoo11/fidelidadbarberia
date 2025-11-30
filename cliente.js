// CONFIGURACIÓN DEL CLIENTE
const CLIENTE_ID = "cliente_default";
const CLAVE_PUNTOS = `puntos_${CLIENTE_ID}`;
const PREFIJO_QR = "BARBERIA_LA_NUEVA:puntos=";

let html5QrCode = null;

// --- Gestión de puntos ---
function getPuntos() {
  return parseInt(localStorage.getItem(CLAVE_PUNTOS)) || 0;
}

function setPuntos(valor) {
  localStorage.setItem(CLAVE_PUNTOS, parseInt(valor).toString());
}

// --- Actualización de interfaz ---
function actualizarUI() {
  const puntos = getPuntos();
  document.getElementById('puntos').textContent = puntos;

  // Cargar descuentos
  const descuentos = JSON.parse(localStorage.getItem('descuentos') || '[]');
  const ahora = new Date();
  let proximo = Infinity;

  const cont = document.getElementById('descuentos');
  cont.innerHTML = '';

  descuentos.forEach(d => {
    const expirado = ahora > new Date(d.fecha);
    const div = document.createElement('div');
    div.className = `promo ${expirado ? 'expired' : ''}`;
    div.innerHTML = `
      <h4>${d.nombre}</h4>
      <p>${d.puntos} puntos</p>
      <p>Fecha límite: ${d.fecha}</p>
    `;
    cont.appendChild(div);

    if (!expirado && d.puntos > puntos) {
      proximo = Math.min(proximo, d.puntos - puntos);
    }
  });

  document.getElementById('faltan').textContent = 
    proximo === Infinity ? 'Ninguno disponible' : proximo;

  // Animación si se alcanzó algún descuento
  descuentos.forEach(d => {
    const expirado = ahora > new Date(d.fecha);
    if (puntos >= d.puntos && !expirado) {
      // Evitar múltiples animaciones: solo si no se ha mostrado antes (simple)
      const yaMostrado = localStorage.getItem(`mostrado_${d.nombre}_${d.puntos}`);
      if (!yaMostrado) {
        setTimeout(() => {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          const msg = document.createElement('div');
          msg.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.92); display: flex; align-items: center;
            justify-content: center; z-index: 1000; font-size: 2.4rem;
            color: #d4af37; flex-direction: column; text-align: center;
          `;
          msg.innerHTML = `¡Felicidades!<br>¡Has desbloqueado ${d.nombre}!`;
          msg.onclick = () => document.body.removeChild(msg);
          document.body.appendChild(msg);
          // Marcar como mostrado (solo una vez por sesión o descuento)
          localStorage.setItem(`mostrado_${d.nombre}_${d.puntos}`, '1');
        }, 500);
      }
    }
  });
}

// --- Escaneo de QR ---
function toggleScanner() {
  const readerDiv = document.getElementById("reader");
  if (!readerDiv) return;

  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
    });
    return;
  }

  html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      const cleanText = decodedText.trim();
      if (cleanText.startsWith(PREFIJO_QR)) {
        const puntosStr = cleanText.substring(PREFIJO_QR.length).trim();
        const puntos = parseInt(puntosStr, 10);
        if (!isNaN(puntos) && puntos > 0) {
          const actuales = getPuntos();
          setPuntos(actuales + puntos);
          alert(`¡+${puntos} puntos! Total: ${actuales + puntos}`);
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
          });
          actualizarUI();
        }
      } else {
        alert("Código no válido para esta barbería");
      }
    },
    (err) => {}
  ).catch(err => {
    alert("No se pudo acceder a la cámara. Abre esta página en Safari o con un servidor local.");
    console.error(err);
  });
}

// --- FUNCIÓN GLOBAL: Simular suma de puntos (¡BOTÓN DE PRUEBA!) ---
function simularScan(puntos) {
  if (typeof puntos !== 'number' || puntos <= 0) puntos = 25;
  const actuales = getPuntos();
  const nuevos = actuales + puntos;
  setPuntos(nuevos);
  alert(`¡+${puntos} puntos! Total: ${nuevos}`);
  actualizarUI();
}

// --- Iniciar al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
  actualizarUI();
});