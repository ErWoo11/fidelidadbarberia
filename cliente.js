// Identificador simple del cliente (puedes cambiarlo por prompt si quieres)
const CLIENTE_ID = "cliente_default";
const CLAVE_PUNTOS = `puntos_${CLIENTE_ID}`;
const PREFIJO_QR = "BARBERIA_LA_NUEVA:puntos=";

let html5QrCode = null;

function getPuntos() {
  return parseInt(localStorage.getItem(CLAVE_PUNTOS)) || 0;
}

function setPuntos(valor) {
  localStorage.setItem(CLAVE_PUNTOS, valor.toString());
}

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

  // Verificar si acaba de desbloquear algo
  descuentos.forEach(d => {
    const expirado = ahora > new Date(d.fecha);
    if (puntos >= d.puntos && !expirado) {
      // Solo mostrar si no se ha mostrado antes (opcional: usar bandera)
      // Aquí lo mostramos siempre que entre con suficientes puntos
      setTimeout(() => {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        const msg = document.createElement('div');
        msg.style = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.92); display: flex; align-items: center;
          justify-content: center; z-index: 1000; font-size: 2.4rem;
          color: var(--gold); flex-direction: column; text-align: center;
        `;
        msg.innerHTML = `¡Felicidades!<br>¡Has desbloqueado ${d.nombre}!`;
        msg.onclick = () => document.body.removeChild(msg);
        document.body.appendChild(msg);
      }, 500);
    }
  });
}

function toggleScanner() {
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
	console.log("Texto escaneado:", JSON.stringify(decodedText));
  alert("Escaneado: " + decodedText); // ← LÍNEA DE PRUEBA
      if (decodedText.startsWith(PREFIJO_QR)) {
        const puntosStr = decodedText.substring(PREFIJO_QR.length);
        const puntos = parseInt(puntosStr);
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
    (err) => {
      // Errores normales de escaneo
    }
  ).catch(err => {
    alert("Error al acceder a la cámara. Asegúrate de permitir el acceso.");
    console.error(err);
  });
}

// Iniciar
actualizarUI();