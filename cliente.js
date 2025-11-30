// Firebase ya está en window.db
const db = window.db;

// Generar un ID único persistente por dispositivo
function getClienteId() {
  let id = localStorage.getItem('cliente_uid');
  if (!id) {
    id = "cliente_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('cliente_uid', id);
  }
  return id;
}

// --- Firebase imports ---
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let html5QrCode = null;

async function actualizarUI() {
  const uid = getClienteId();
  try {
    // Cargar puntos del cliente
    const clienteSnap = await getDoc(doc(db, "clientes", uid));
    const puntos = clienteSnap.exists() ? clienteSnap.data().puntos || 0 : 0;
    document.getElementById('puntos').textContent = puntos;

    // Cargar promociones
    const promosSnap = await getDocs(collection(db, "promociones"));
    const ahora = new Date();
    let proximo = Infinity;

    const cont = document.getElementById('descuentos');
    cont.innerHTML = '';

    promosSnap.forEach(doc => {
      const p = doc.data();
      const expirado = ahora > p.fechaExpiracion.toDate();
      const div = document.createElement('div');
      div.className = `promo ${expirado ? 'expired' : ''}`;
      div.innerHTML = `
        <h4>${p.nombre}</h4>
        <p>${p.puntos} puntos</p>
        <p>Fecha límite: ${p.fechaExpiracion.toDate().toISOString().split('T')[0]}</p>
      `;
      cont.appendChild(div);

      if (!expirado && p.puntos > puntos) {
        proximo = Math.min(proximo, p.puntos - puntos);
      }
    });

    document.getElementById('faltan').textContent = 
      proximo === Infinity ? 'Ninguno disponible' : proximo;

    // Animación si se alcanzó algún descuento
    promosSnap.forEach(doc => {
      const p = doc.data();
      const expirado = ahora > p.fechaExpiracion.toDate();
      if (puntos >= p.puntos && !expirado) {
        const yaMostrado = localStorage.getItem(`mostrado_${doc.id}`);
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
            msg.innerHTML = `¡Felicidades!<br>¡Has desbloqueado ${p.nombre}!`;
            msg.onclick = () => document.body.removeChild(msg);
            document.body.appendChild(msg);
            localStorage.setItem(`mostrado_${doc.id}`, '1');
          }, 500);
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
}

async function reclamarPuntosQR(qrId) {
  const uid = getClienteId();
  try {
    const qrRef = doc(db, "sesiones-qr", qrId);
    const qrSnap = await getDoc(qrRef);

    if (!qrSnap.exists()) throw new Error("Código inválido");
    const data = qrSnap.data();
    if (data.usado) throw new Error("Código ya usado");

    // Marcar como usado
    await updateDoc(qrRef, {
      usado: true,
      uidCliente: uid,
      usadoEn: serverTimestamp()
    });

    // Actualizar puntos del cliente
    const clienteRef = doc(db, "clientes", uid);
    const clienteSnap = await getDoc(clienteRef);
    const puntosActuales = clienteSnap.exists() ? clienteSnap.data().puntos || 0 : 0;
    const nuevosPuntos = puntosActuales + data.puntosAsignar;

    await setDoc(clienteRef, {
      uid: uid,
      puntos: nuevosPuntos,
      ultimoAcceso: serverTimestamp()
    }, { merge: true });

    alert(`¡${data.puntosAsignar} puntos añadidos! Total: ${nuevosPuntos}`);
    actualizarUI();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

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

      // Código de asignación de puntos vía QR
      if (cleanText.startsWith("BARBERIA_LA_NUEVA:qr=")) {
        const qrId = cleanText.substring("BARBERIA_LA_NUEVA:qr=".length);
        reclamarPuntosQR(qrId);
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          html5QrCode = null;
        });
      }
      // Código de suma rápida (opcional)
      else if (cleanText.startsWith("BARBERIA_LA_NUEVA:puntos=")) {
        const puntosStr = cleanText.substring("BARBERIA_LA_NUEVA:puntos=".length);
        const puntos = parseInt(puntosStr, 10);
        if (!isNaN(puntos) && puntos > 0) {
          // Sumar puntos sin pasar por QR temporal
          const uid = getClienteId();
          const clienteRef = doc(db, "clientes", uid);
          getDoc(clienteRef).then(snap => {
            const act = snap.exists() ? snap.data().puntos || 0 : 0;
            setDoc(clienteRef, {
              uid: uid,
              puntos: act + puntos,
              ultimoAcceso: serverTimestamp()
            }, { merge: true }).then(() => {
              alert(`¡+${puntos} puntos!`);
              actualizarUI();
            });
          });
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
          });
        }
      }
      else {
        alert("Código no válido");
      }
    },
    (err) => {}
  ).catch(err => {
    alert("No se pudo acceder a la cámara. Abre en Safari o con servidor local.");
  });
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarUI();
});