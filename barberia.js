// Cambia esta contraseña por la que quieras
const CONTRASEÑA = "barber123";

function validarAcceso() {
  const pass = document.getElementById('pass').value;
  if (pass === CONTRASEÑA) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('panel').style.display = 'block';
    renderizarServicios();
  } else {
    alert("Contraseña incorrecta");
  }
}

function getServicios() {
  const raw = localStorage.getItem('servicios-barberia');
  return raw ? JSON.parse(raw) : [];
}

function setServicios(servicios) {
  localStorage.setItem('servicios-barberia', JSON.stringify(servicios));
}

document.getElementById('servicioForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const nombre = document.getElementById('servicioNombre').value.trim();
  const puntos = parseInt(document.getElementById('servicioPuntos').value);

  if (nombre && puntos > 0) {
    let servicios = getServicios();
    servicios.push({ nombre, puntos });
    setServicios(servicios);
    this.reset();
    renderizarServicios();
  }
});

function renderizarServicios() {
  const cont = document.getElementById('servicios-lista');
  cont.innerHTML = '';
  const servicios = getServicios();

  if (servicios.length === 0) {
    cont.innerHTML = '<p>No hay servicios registrados</p>';
    return;
  }

  servicios.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'promo';
    div.style.marginBottom = '20px';

    const codigo = `BARBERIA_LA_NUEVA:puntos=${s.puntos}`;
    const qrDiv = document.createElement('div');
    qrDiv.id = `qr-servicio-${i}`;
    qrDiv.style.marginTop = '10px';
    qrDiv.style.textAlign = 'center';

    div.innerHTML = `<strong>${s.nombre}</strong> (${s.puntos} puntos)`;
    div.appendChild(qrDiv);
    cont.appendChild(div);

 new QRCode(qrDiv, {
  text: codigo,
  width: 140,
  height: 140,
  colorDark: "#ffffff",     // Módulos oscuros → ¡blanco!
  colorLight: "#000000"     // Fondo claro → ¡negro!
});
});
}