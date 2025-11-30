const CONTRASEÑA = "barber123";
let promoEditando = null;

// Firebase ya está en window
const db = window.db;
const auth = window.auth;

import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function validarAcceso() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;

  if (!email || !pass) {
    alert("Ingresa email y contraseña");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    document.getElementById('login').style.display = 'none';
    document.getElementById('panel').style.display = 'block';
    cargarTodo();
  } catch (err) {
    console.error(err);
    alert("Acceso denegado: " + (err.message || "Error desconocido"));
  }
}

async function guardarPromocion(e) {
  e.preventDefault();
  const nombre = document.getElementById('promoNombre').value.trim();
  const desc = document.getElementById('promoDesc').value.trim();
  const puntos = parseInt(document.getElementById('promoPuntos').value);
  const fecha = document.getElementById('promoFecha').value;

  if (!nombre || !puntos || !fecha) {
    alert("Completa todos los campos");
    return;
  }

  try {
    if (promoEditando !== null) {
      await updateDoc(doc(db, "promociones", promoEditando), {
        nombre, descripcion: desc, puntos, fechaExpiracion: new Date(fecha)
      });
      promoEditando = null;
      document.getElementById('btnCancelar').style.display = 'none';
    } else {
      await addDoc(collection(db, "promociones"), {
        nombre, descripcion: desc, puntos, fechaExpiracion: new Date(fecha), activa: true
      });
    }
    document.getElementById('promoForm').reset();
    renderizarPromociones();
  } catch (err) {
    console.error(err);
    alert("Error al guardar promoción");
  }
}

async function renderizarPromociones() {
  const cont = document.getElementById('promos-lista');
  try {
    const querySnapshot = await getDocs(collection(db, "promociones"));
    cont.innerHTML = querySnapshot.empty ? '<p>No hay promociones</p>' : '';

    querySnapshot.forEach(doc => {
      const p = doc.data();
      const expirado = new Date() > p.fechaExpiracion.toDate();
      const div = document.createElement('div');
      div.className = `promo ${expirado ? 'expired' : ''}`;
      div.style.marginBottom = '20px';
      div.innerHTML = `
        <strong>${p.nombre}</strong> (${p.puntos} puntos)<br>
        ${p.descripcion ? `<small>${p.descripcion}</small><br>` : ''}
        Vence: ${p.fechaExpiracion.toDate().toISOString().split('T')[0]}<br>
        <button onclick="editarPromo('${doc.id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})" class="btn" style="background:#4a4a4a;margin:5px;">✏️ Editar</button>
        <button onclick="eliminarPromo('${doc.id}')" class="btn" style="background:#b00;margin:5px;">🗑️ Eliminar</button>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

function editarPromo(id, p) {
  document.getElementById('promoNombre').value = p.nombre;
  document.getElementById('promoDesc').value = p.descripcion || '';
  document.getElementById('promoPuntos').value = p.puntos;
  document.getElementById('promoFecha').value = p.fechaExpiracion.toISOString().split('T')[0];
  promoEditando = id;
  document.getElementById('btnCancelar').style.display = 'inline-block';
}

async function eliminarPromo(id) {
  if (!confirm("¿Eliminar esta promoción?")) return;
  try {
    await deleteDoc(doc(db, "promociones", id));
    renderizarPromociones();
  } catch (err) {
    console.error(err);
  }
}

function cancelarEdicion() {
  document.getElementById('promoForm').reset();
  promoEditando = null;
  document.getElementById('btnCancelar').style.display = 'none';
}

// --- Generar QR para asignar puntos ---
async function generarQRPuntos() {
  const puntos = parseInt(document.getElementById('qrPuntos').value);
  if (isNaN(puntos) || puntos <= 0) return alert("Puntos inválidos");

  try {
    const docRef = await addDoc(collection(db, "sesiones-qr"), {
      puntosAsignar: puntos,
      usado: false,
      createdAt: serverTimestamp(),
      uidCliente: null
    });

    const qrText = `BARBERIA_LA_NUEVA:qr=${docRef.id}`;
    const cont = document.getElementById('qr-output');
    cont.innerHTML = '';
    new QRCode(cont, {
      text: qrText,
      width: 200,
      height: 200,
      colorDark: "#ffffff",
      colorLight: "#000000"
    });

    alert("¡Código generado! Válido 5 minutos.");
  } catch (err) {
    console.error(err);
    alert("Error al generar QR");
  }
}

// --- Iniciar ---
function cargarTodo() {
  renderizarPromociones();
  document.getElementById('promoForm').addEventListener('submit', guardarPromocion);
}