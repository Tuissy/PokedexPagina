// Colores por tipo
const COLORES_TIPO = {
  fire:     "#FF6B35",
  water:    "#4895EF",
  grass:    "#52B788",
  electric: "#FFD60A",
  psychic:  "#F72585",
  ice:      "#90E0EF",
  dragon:   "#7B2FBE",
  dark:     "#3D405B",
  fairy:    "#FF85A1",
  normal:   "#A8A8A8",
  fighting: "#C1440E",
  flying:   "#89C4F4",
  poison:   "#9B5DE5",
  ground:   "#C9A84C",
  rock:     "#B5A642",
  bug:      "#74C476",
  ghost:    "#5E548E",
  steel:    "#748CAB",
};

// Nombres de estadisticas 
const NOMBRES_ESTADISTICA = {
  hp:               "HP",
  attack:           "Ataque",
  defense:          "Defensa",
  "special-attack": "At. Esp.",
  "special-defense":"Def. Esp.",
  speed:            "Velocidad",
};

// Referencias
const entradaBusqueda = document.getElementById("entradaBusqueda");
const botonBuscar     = document.getElementById("botonBuscar");
const mensaje         = document.getElementById("mensaje");
const cargador        = document.getElementById("cargador");
const tarjeta         = document.getElementById("tarjeta");
const sugerencias     = document.getElementById("sugerencias");

// Eventos 
botonBuscar.addEventListener("click", () => buscarPokemon(entradaBusqueda.value.trim()));

entradaBusqueda.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") buscarPokemon(entradaBusqueda.value.trim());
});

document.querySelectorAll(".boton-sugerencia").forEach((boton) => {
  boton.addEventListener("click", () => {
    const nombre = boton.dataset.nombre;
    entradaBusqueda.value = nombre;
    buscarPokemon(nombre);
  });
});

// Busqueda 
async function buscarPokemon(consulta) {
  if (!consulta) {
    mostrarMensaje("Ingresa el nombre o número de un Pokémon", "error");
    return;
  }

  mostrarMensaje("");
  tarjeta.classList.remove("visible");
  cargador.classList.add("activo");
  sugerencias.style.display = "none";

  try {
    const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${consulta.toLowerCase()}`);
    if (!respuesta.ok) throw new Error("no encontrado");
    const datos = await respuesta.json();
    renderizarTarjeta(datos);
  } catch {
    mostrarMensaje(`No se encontró "${consulta}". Revisa el nombre o número.`, "error");
    sugerencias.style.display = "block";
  } finally {
    cargador.classList.remove("activo");
  }
}

// Renderizado 
function renderizarTarjeta(pokemon) {
  // Número y nombre
  document.getElementById("numeroPokemon").textContent =
    `#${String(pokemon.id).padStart(3, "0")}`;
  document.getElementById("nombrePokemon").textContent = pokemon.name;

  // Imagen
  const urlImagen =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;
  const elementoImagen = document.getElementById("imagenPokemon");
  elementoImagen.src = urlImagen || "";
  elementoImagen.alt = pokemon.name;

  // Tipos
  const contenedorTipos = document.getElementById("tiposPokemon");
  contenedorTipos.innerHTML = "";
  pokemon.types.forEach((t) => {
    const nombreTipo = t.type.name;
    const etiqueta   = document.createElement("span");
    etiqueta.className   = "etiqueta-tipo";
    etiqueta.textContent = nombreTipo;
    etiqueta.style.background = COLORES_TIPO[nombreTipo] || "#888";
    contenedorTipos.appendChild(etiqueta);
  });

  // Color de fondo según tipo principal
  const colorPrincipal = COLORES_TIPO[pokemon.types[0].type.name] || "#444";
  document.getElementById("tarjetaSuperior").style.background = `${colorPrincipal}22`;

  // Altura y peso
  document.getElementById("altura").textContent = `${(pokemon.height / 10).toFixed(1)} m`;
  document.getElementById("peso").textContent   = `${(pokemon.weight / 10).toFixed(1)} kg`;

  // Habilidades
  const contenedorHabilidades = document.getElementById("listaHabilidades");
  contenedorHabilidades.innerHTML = "";
  pokemon.abilities.forEach((habilidad) => {
    const etiqueta       = document.createElement("span");
    etiqueta.className   = "etiqueta-habilidad" + (habilidad.is_hidden ? " oculta" : "");
    etiqueta.textContent = habilidad.ability.name + (habilidad.is_hidden ? " ★" : "");
    contenedorHabilidades.appendChild(etiqueta);
  });

  // Estadisticas
  const contenedorEstadisticas = document.getElementById("listaEstadisticas");
  contenedorEstadisticas.innerHTML = "";
  pokemon.stats.forEach((estadistica) => {
    const nombreEstat = estadistica.stat.name;
    const valor       = estadistica.base_stat;

    const fila = document.createElement("div");
    fila.className = "fila-estadistica";
    fila.innerHTML = `
      <div class="nombre-estadistica">${NOMBRES_ESTADISTICA[nombreEstat] || nombreEstat}</div>
      <div class="valor-estadistica">${valor}</div>
    `;
    contenedorEstadisticas.appendChild(fila);
  });

  // Mostrar tarjeta
  tarjeta.classList.add("visible");
}

// Mostrar mensaje
function mostrarMensaje(texto, tipo = "") {
  mensaje.textContent = texto;
  mensaje.className   = tipo;
}
