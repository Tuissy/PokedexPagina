

const API = "https://pokedex-back-orrs.onrender.com/api";


let session = JSON.parse(localStorage.getItem("pokedex_session") || "null");
let pokemonActual = null;

//  Colores y nombres 
const COLORES_TIPO = {
  fire:"#FF6B35",water:"#4895EF",grass:"#52B788",electric:"#FFD60A",
  psychic:"#F72585",ice:"#90E0EF",dragon:"#7B2FBE",dark:"#3D405B",
  fairy:"#FF85A1",normal:"#A8A8A8",fighting:"#C1440E",flying:"#89C4F4",
  poison:"#9B5DE5",ground:"#C9A84C",rock:"#B5A642",bug:"#74C476",
  ghost:"#5E548E",steel:"#748CAB",
};
const NOMBRES_ESTADISTICA = {
  hp:"HP",attack:"Ataque",defense:"Defensa",
  "special-attack":"At. Esp.","special-defense":"Def. Esp.",speed:"Velocidad",
};

//  Referencias DOM 
const entradaBusqueda = document.getElementById("entradaBusqueda");
const botonBuscar     = document.getElementById("botonBuscar");
const mensaje         = document.getElementById("mensaje");
const cargador        = document.getElementById("cargador");
const tarjeta         = document.getElementById("tarjeta");
const sugerencias     = document.getElementById("sugerencias");

//  Eventos de búsqueda 
botonBuscar.addEventListener("click", () => buscarPokemon(entradaBusqueda.value.trim()));
entradaBusqueda.addEventListener("keydown", (e) => {
  if (e.key === "Enter") buscarPokemon(entradaBusqueda.value.trim());
});
document.querySelectorAll(".boton-sugerencia").forEach((b) => {
  b.addEventListener("click", () => {
    entradaBusqueda.value = b.dataset.nombre;
    buscarPokemon(b.dataset.nombre);
  });
});

//  Fetch helper con token JWT 
async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error en servidor");
  return data;
}

//  Búsqueda principal 
async function buscarPokemon(consulta) {
  if (!consulta) { mostrarMensaje("Ingresa el nombre o número de un Pokémon", "error"); return; }
  mostrarMensaje("");
  tarjeta.classList.remove("visible");
  cargador.classList.add("activo");
  sugerencias.style.display = "none";

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${consulta.toLowerCase()}`);
    if (!res.ok) throw new Error("no encontrado");
    const datos = await res.json();
    pokemonActual = datos;
    renderizarTarjeta(datos);
    if (session) registrarHistorial(datos);
  } catch {
    mostrarMensaje(`No se encontró "${consulta}". Revisa el nombre o número.`, "error");
    sugerencias.style.display = "block";
  } finally {
    cargador.classList.remove("activo");
  }
}

//  Renderizado de tarjeta 
function renderizarTarjeta(p) {
  document.getElementById("numeroPokemon").textContent = `#${String(p.id).padStart(3,"0")}`;
  document.getElementById("nombrePokemon").textContent = p.name;

  const urlImg = p.sprites?.other?.["official-artwork"]?.front_default || p.sprites?.front_default;
  const img = document.getElementById("imagenPokemon");
  img.src = urlImg || ""; img.alt = p.name;

  const cTipos = document.getElementById("tiposPokemon");
  cTipos.innerHTML = "";
  p.types.forEach(t => {
    const s = document.createElement("span");
    s.className = "etiqueta-tipo"; s.textContent = t.type.name;
    s.style.background = COLORES_TIPO[t.type.name] || "#888";
    cTipos.appendChild(s);
  });

  const color = COLORES_TIPO[p.types[0].type.name] || "#444";
  document.getElementById("tarjetaSuperior").style.background = `${color}22`;
  document.getElementById("altura").textContent = `${(p.height/10).toFixed(1)} m`;
  document.getElementById("peso").textContent   = `${(p.weight/10).toFixed(1)} kg`;

  const cHab = document.getElementById("listaHabilidades");
  cHab.innerHTML = "";
  p.abilities.forEach(h => {
    const s = document.createElement("span");
    s.className = "etiqueta-habilidad" + (h.is_hidden ? " oculta" : "");
    s.textContent = h.ability.name + (h.is_hidden ? " ★" : "");
    cHab.appendChild(s);
  });

  const cStats = document.getElementById("listaEstadisticas");
  cStats.innerHTML = "";
  p.stats.forEach(st => {
    const d = document.createElement("div");
    d.className = "fila-estadistica";
    d.innerHTML = `<div class="nombre-estadistica">${NOMBRES_ESTADISTICA[st.stat.name]||st.stat.name}</div><div class="valor-estadistica">${st.base_stat}</div>`;
    cStats.appendChild(d);
  });

  actualizarBotonesAccion(p);
  tarjeta.classList.add("visible");
}

function mostrarMensaje(txt, tipo = "") {
  mensaje.textContent = txt; mensaje.className = tipo;
}


//   Autenticacion


function guardarSesion(data) {
  session = data;
  localStorage.setItem("pokedex_session", JSON.stringify(data));
  actualizarUI();
}

function cerrarSesion() {
  session = null;
  localStorage.removeItem("pokedex_session");
  cerrarPanel();
  actualizarUI();
}

function actualizarUI() {
  const btnAuth  = document.getElementById("btnAuth");
  const btnPanel = document.getElementById("btnPanel");
  const userInfo = document.getElementById("userInfo");
  const drawerAuth = document.getElementById("drawerAuth");

  if (session) {
    btnAuth.textContent = "Salir";
    btnAuth.onclick = cerrarSesion;
    btnPanel.style.display = "flex";
    userInfo.textContent = session.nombre || session.email;
    userInfo.style.display = "block";
    if (drawerAuth) drawerAuth.innerHTML = `
      <span class="drawer-user">${session.nombre || session.email}</span>
      <button class="drawer-btn" onclick="cerrarDrawer();abrirPanel();">☰ Mi colección</button>
      <button class="drawer-btn drawer-btn-danger" onclick="cerrarSesion();">Salir</button>
    `;
  } else {
    btnAuth.textContent = "Iniciar sesión";
    btnAuth.onclick = abrirModalAuth;
    btnPanel.style.display = "none";
    userInfo.style.display = "none";
    if (drawerAuth) drawerAuth.innerHTML = `
      <button class="drawer-btn drawer-btn-primary" onclick="cerrarDrawer();abrirModalAuth();">Iniciar sesión</button>
    `;
  }

  if (pokemonActual) actualizarBotonesAccion(pokemonActual);
}

  if (pokemonActual) actualizarBotonesAccion(pokemonActual);
}

//  Modal auth 
function abrirModalAuth() {
  document.getElementById("modalAuth").classList.add("activo");
  mostrarTabAuth("login");
}
function cerrarModalAuth() {
  document.getElementById("modalAuth").classList.remove("activo");
  limpiarFormularios();
}
function mostrarTabAuth(tab) {
  document.getElementById("formLogin").style.display    = tab === "login"    ? "block" : "none";
  document.getElementById("formRegister").style.display = tab === "register" ? "block" : "none";
  document.querySelectorAll(".tab-auth").forEach(t => {
    t.classList.toggle("activo", t.dataset.tab === tab);
  });
  document.getElementById("errorAuth").textContent = "";
}
function limpiarFormularios() {
  ["loginEmail","loginPass","regNombre","regEmail","regPass"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("errorAuth").textContent = "";
}

async function handleLogin() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPass").value;
  const errEl    = document.getElementById("errorAuth");
  errEl.textContent = "";
  try {
    const data = await apiFetch("/auth/login", { method:"POST", body: JSON.stringify({email, password}) });
    guardarSesion(data);
    cerrarModalAuth();
    cargarPanel();
  } catch(e) { errEl.textContent = e.message; }
}

async function handleRegister() {
  const nombre   = document.getElementById("regNombre").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const errEl    = document.getElementById("errorAuth");
  errEl.textContent = "";
  try {
    const data = await apiFetch("/auth/register", { method:"POST", body: JSON.stringify({nombre, email, password}) });
    guardarSesion(data);
    cerrarModalAuth();
    cargarPanel();
  } catch(e) { errEl.textContent = e.message; }
}


//  PanelLateral


let tabPanel = "favoritos";

function abrirPanel() {
  document.getElementById("panelLateral").classList.add("activo");
  document.getElementById("overlay").classList.add("activo");
  cargarPanel();
}
function cerrarPanel() {
  document.getElementById("panelLateral").classList.remove("activo");
  document.getElementById("overlay").classList.remove("activo");
}

function cambiarTabPanel(tab) {
  tabPanel = tab;
  document.querySelectorAll(".tab-panel").forEach(t => {
    t.classList.toggle("activo", t.dataset.tab === tab);
  });
  cargarPanel();
}

async function cargarPanel() {
  if (!session) return;
  const contenido = document.getElementById("contenidoPanel");
  contenido.innerHTML = `<div class="panel-cargando">Cargando...</div>`;
  try {
    if (tabPanel === "favoritos") await renderFavoritos(contenido);
    if (tabPanel === "historial") await renderHistorial(contenido);
    if (tabPanel === "equipos")   await renderEquipos(contenido);
  } catch(e) {
    contenido.innerHTML = `<p class="panel-error">${e.message}</p>`;
  }
}

// Favoritos 
async function renderFavoritos(el) {
  const lista = await apiFetch("/favoritos");
  if (!lista.length) {
    el.innerHTML = `<p class="panel-vacio">Aún no tienes favoritos.<br>Busca un Pokémon y presiona ♥</p>`; return;
  }
  el.innerHTML = lista.map(f => `
    <div class="panel-item" data-nombre="${f.nombre}">
      <img src="${f.imagen||''}" alt="${f.nombre}" class="panel-item-img" onerror="this.style.display='none'"/>
      <div class="panel-item-info">
        <span class="panel-item-nombre">${f.nombre}</span>
        <span class="panel-item-id">#${String(f.pokemonId).padStart(3,"0")}</span>
      </div>
      <button class="panel-item-del" onclick="event.stopPropagation();eliminarFavorito('${f._id}')">✕</button>
    </div>
  `).join("");
  el.querySelectorAll(".panel-item").forEach(item => {
    item.addEventListener("click", () => {
      entradaBusqueda.value = item.dataset.nombre;
      buscarPokemon(item.dataset.nombre);
      cerrarPanel();
    });
  });
}

async function eliminarFavorito(id) {
  await apiFetch(`/favoritos/${id}`, { method: "DELETE" });
  if (pokemonActual) actualizarBotonesAccion(pokemonActual);
  cargarPanel();
}

async function toggleFavorito() {
  if (!session) { abrirModalAuth(); return; }
  if (!pokemonActual) return;
  const { id, name, sprites } = pokemonActual;
  const imagen = sprites?.other?.["official-artwork"]?.front_default || sprites?.front_default || "";
  try {
    const lista = await apiFetch("/favoritos");
    const existe = lista.find(f => f.pokemonId === id);
    if (existe) {
      await apiFetch(`/favoritos/${existe._id}`, { method: "DELETE" });
    } else {
      await apiFetch("/favoritos", { method:"POST", body: JSON.stringify({ pokemonId: id, nombre: name, imagen }) });
    }
    actualizarBotonesAccion(pokemonActual);
  } catch(e) { mostrarMensaje(e.message, "error"); }
}

//  Historial 
async function registrarHistorial(p) {
  if (!session) return;
  const imagen = p.sprites?.other?.["official-artwork"]?.front_default || p.sprites?.front_default || "";
  try {
    await apiFetch("/historial", { method:"POST", body: JSON.stringify({ pokemonId: p.id, nombre: p.name, imagen }) });
  } catch { /* silencioso — duplicados son OK */ }
}

async function renderHistorial(el) {
  const lista = await apiFetch("/historial");
  if (!lista.length) {
    el.innerHTML = `<p class="panel-vacio">Tu historial está vacío.<br>Busca Pokémon para verlos aquí.</p>`; return;
  }
  el.innerHTML = `
    <div class="panel-historial-header">
      <span>${lista.length} búsqueda${lista.length!==1?"s":""}</span>
      <button class="btn-limpiar" onclick="limpiarHistorial()">Limpiar todo</button>
    </div>
  ` + lista.map(h => `
    <div class="panel-item" data-nombre="${h.nombre}">
      <img src="${h.imagen||''}" alt="${h.nombre}" class="panel-item-img" onerror="this.style.display='none'"/>
      <div class="panel-item-info">
        <span class="panel-item-nombre">${h.nombre}</span>
        <span class="panel-item-id">${new Date(h.createdAt).toLocaleDateString('es-MX')}</span>
      </div>
      <button class="panel-item-del" onclick="event.stopPropagation();eliminarHistorial('${h._id}')">✕</button>
    </div>
  `).join("");
  el.querySelectorAll(".panel-item").forEach(item => {
    item.addEventListener("click", () => {
      entradaBusqueda.value = item.dataset.nombre;
      buscarPokemon(item.dataset.nombre);
      cerrarPanel();
    });
  });
}

async function eliminarHistorial(id) {
  await apiFetch(`/historial/${id}`, { method: "DELETE" });
  cargarPanel();
}

async function limpiarHistorial() {
  if (!confirm("¿Limpiar todo el historial?")) return;
  await apiFetch("/historial", { method: "DELETE" });
  cargarPanel();
}

// Equipos 
async function renderEquipos(el) {
  const equipos = await apiFetch("/equipos");

  el.innerHTML = `
    <div class="panel-equipo-header">
      <button class="btn-nuevo-equipo" onclick="crearEquipo()">+ Nuevo equipo</button>
    </div>
  `;

  if (!equipos.length) {
    el.innerHTML += `<p class="panel-vacio">No tienes equipos aún.<br>Crea uno y añade Pokémon.</p>`; return;
  }

  equipos.forEach(eq => {
    const div = document.createElement("div");
    div.className = "panel-equipo";
    const puedeAnadir = pokemonActual && eq.miembros.length < 6;
    div.innerHTML = `
      <div class="panel-equipo-titulo">
        <span>⚔ ${eq.nombre} <small>(${eq.miembros.length}/6)</small></span>
        <div class="equipo-acciones">
          ${puedeAnadir ? `<button class="btn-eq-add" onclick="agregarAlEquipo('${eq._id}')">+</button>` : ""}
          <button class="btn-eq-del" onclick="eliminarEquipo('${eq._id}')">✕</button>
        </div>
      </div>
      <div class="equipo-miembros">
        ${eq.miembros.length ? eq.miembros.map((m,i) => `
          <div class="miembro" title="${m.nombre}">
            <img src="${m.imagen||''}" alt="${m.nombre}" onerror="this.style.opacity='0'"/>
            <button class="miembro-del" onclick="quitarMiembro('${eq._id}',${i},event)">✕</button>
          </div>
        `).join("") : `<span class="equipo-vacio">Equipo vacío</span>`}
      </div>
    `;
    el.appendChild(div);
  });
}

async function crearEquipo() {
  const nombre = prompt("Nombre del equipo:");
  if (!nombre?.trim()) return;
  try {
    await apiFetch("/equipos", { method:"POST", body: JSON.stringify({ nombre: nombre.trim(), miembros: [] }) });
    cargarPanel();
  } catch(e) { mostrarMensaje(e.message, "error"); }
}

async function eliminarEquipo(id) {
  if (!confirm("¿Eliminar este equipo?")) return;
  await apiFetch(`/equipos/${id}`, { method: "DELETE" });
  cargarPanel();
}

async function agregarAlEquipo(equipoId) {
  if (!pokemonActual) return;
  const { id, name, sprites } = pokemonActual;
  const imagen = sprites?.other?.["official-artwork"]?.front_default || sprites?.front_default || "";
  try {
    const equipos = await apiFetch("/equipos");
    const equipo  = equipos.find(e => e._id === equipoId);
    if (!equipo) return;
    if (equipo.miembros.find(m => m.pokemonId === id)) {
      mostrarMensaje(`${name} ya está en este equipo`, "error"); return;
    }
    const nuevosMiembros = [...equipo.miembros, { pokemonId: id, nombre: name, imagen }];
    await apiFetch(`/equipos/${equipoId}`, { method:"PUT", body: JSON.stringify({ miembros: nuevosMiembros }) });
    cargarPanel();
  } catch(e) { mostrarMensaje(e.message, "error"); }
}

async function quitarMiembro(equipoId, indice, event) {
  event.stopPropagation();
  const equipos = await apiFetch("/equipos");
  const equipo  = equipos.find(e => e._id === equipoId);
  if (!equipo) return;
  const nuevosMiembros = equipo.miembros.filter((_,i) => i !== indice);
  await apiFetch(`/equipos/${equipoId}`, { method:"PUT", body: JSON.stringify({ miembros: nuevosMiembros }) });
  cargarPanel();
}

//  Botones de acción en tarjeta Pokémon 
async function actualizarBotonesAccion(p) {
  const contenedor = document.getElementById("botonesAccion");
  if (!contenedor) return;

  if (!session) {
    contenedor.innerHTML = `
      <button class="btn-accion btn-login-hint" onclick="abrirModalAuth()">
        Inicia sesión para guardar favoritos y equipos
      </button>`;
    return;
  }

  let esFavorito = false;
  try {
    const lista = await apiFetch("/favoritos");
    esFavorito = lista.some(f => f.pokemonId === p.id);
  } catch { /* sin red */ }

  contenedor.innerHTML = `
    <button class="btn-accion btn-fav ${esFavorito ? "activo" : ""}" onclick="toggleFavorito()">
      ${esFavorito ? "♥ En favoritos" : "♡ Favorito"}
    </button>
    <button class="btn-accion btn-equipo" onclick="abrirPanel(); setTimeout(()=>cambiarTabPanel('equipos'),150)">
      ⚔ Añadir a equipo
    </button>
  `;
}

// Inicializar UI tras cargar el DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", actualizarUI);
} else {
  actualizarUI();
}
