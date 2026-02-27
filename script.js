// ==========================
// ESTADO GLOBAL
// ==========================

const STORAGE_KEY = "hogarApp";

let state = {
    productos: [],
    listaActiva: [],
    historial: []
};


// ==========================
// INIT
// ==========================

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    renderTodo();
});


// ==========================
// UTILIDADES DOM
// ==========================

const $ = (id) => document.getElementById(id);


// ==========================
// STORAGE
// ==========================

function guardarDatos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function cargarDatos() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) state = JSON.parse(data);
}


// ==========================
// NAVEGACIÓN
// ==========================

function mostrarSeccion(id) {
    document.querySelectorAll(".seccion")
        .forEach(s => s.classList.remove("activa"));

    $(id).classList.add("activa");
}


// ==========================
// STOCK
// ==========================

function agregarProducto() {

    const nombre = $("nuevoNombre").value.trim();
    const categoria = $("nuevaCategoria").value;
    const cantidad = parseFloat($("nuevaCantidad").value);

    if (!nombre || isNaN(cantidad) || cantidad < 0) return;

    state.productos.push({
        id: Date.now(),
        nombre,
        categoria,
        cantidad: parseFloat(cantidad.toFixed(2))
    });

    $("nuevoNombre").value = "";
    $("nuevaCantidad").value = "";

    guardarDatos();
    renderTodo();
}

function eliminarProducto(id) {

    if (!confirm("Eliminar producto del stock?")) return;

    state.productos = state.productos.filter(p => p.id !== id);

    guardarDatos();
    renderTodo();
}


// ==========================
// CONSUMO
// ==========================

function registrarConsumo() {

    const id = $("productoConsumido").value;
    const cantidad = parseFloat($("cantidadConsumida").value);

    const producto = state.productos.find(p => p.id == id);

    if (!producto || isNaN(cantidad) || cantidad <= 0) return;

    if (cantidad > producto.cantidad) {
        alert("No podés consumir más de lo que hay.");
        return;
    }

    producto.cantidad = parseFloat(
        (producto.cantidad - cantidad).toFixed(2)
    );

    $("cantidadConsumida").value = "";

    guardarDatos();
    renderTodo();
}


// ==========================
// LISTA AUTOMÁTICA
// ==========================

function generarListaAutomatica() {

    state.productos
        .filter(p => p.cantidad <= 1)
        .forEach(p => {

            const yaExiste = state.listaActiva
                .some(i => i.productoId === p.id);

            if (!yaExiste) {
                state.listaActiva.push({
                    productoId: p.id,
                    nombre: p.nombre,
                    comprado: false,
                    cantidadComprada: "",
                    precio: ""
                });
            }
        });
}


// ==========================
// LISTA MANUAL
// ==========================

function agregarManual() {

    const nombre = $("manualNombre").value.trim();
    if (!nombre) return;

    state.listaActiva.push({
        productoId: null,
        nombre,
        comprado: false,
        cantidadComprada: "",
        precio: ""
    });

    $("manualNombre").value = "";

    guardarDatos();
    renderLista();
}


// ==========================
// RENDER GENERAL
// ==========================

function renderTodo() {
    generarListaAutomatica();
    renderStock();
    renderSelect();
    renderLista();
    renderHistorial();
}


// ==========================
// RENDER STOCK
// ==========================

function renderStock() {

    const cont = $("listaStock");
    cont.innerHTML = "";

    state.productos.forEach(p => {

        let color = "verde";
        if (p.cantidad <= 1) color = "rojo";
        else if (p.cantidad <= 2) color = "amarillo";

        cont.innerHTML += `
            <div class="item-stock ${color}">
                <span>${p.nombre} (${p.cantidad})</span>
                <button onclick="eliminarProducto(${p.id})">X</button>
            </div>
        `;
    });
}


// ==========================
// RENDER SELECT
// ==========================

function renderSelect() {

    const select = $("productoConsumido");
    select.innerHTML = "";

    state.productos.forEach(p => {
        select.innerHTML += `
            <option value="${p.id}">
                ${p.nombre} (${p.cantidad})
            </option>
        `;
    });
}


// ==========================
// RENDER LISTA
// ==========================

function renderLista() {

    const cont = $("listaCompra");
    cont.innerHTML = "";

    state.listaActiva.forEach((item, index) => {

        cont.innerHTML += `
            <div class="item-lista">

                <input type="checkbox"
                    ${item.comprado ? "checked" : ""}
                    onchange="marcarComprado(${index}, this.checked)"
                >

                <span>${item.nombre}</span>

                <input type="number"
                    placeholder="Cant."
                    value="${item.cantidadComprada}"
                    min="0"
                    step="0.1"
                    onchange="guardarCantidad(${index}, this.value)"
                >

                <input type="number"
                    placeholder="Precio"
                    value="${item.precio}"
                    min="0"
                    step="0.01"
                    onchange="guardarPrecio(${index}, this.value)"
                >

            </div>
        `;
    });
}

function marcarComprado(index, estado) {
    state.listaActiva[index].comprado = estado;
    guardarDatos();
}

function guardarCantidad(index, valor) {
    state.listaActiva[index].cantidadComprada =
        valor === "" ? "" : parseFloat(valor);
    guardarDatos();
}

function guardarPrecio(index, valor) {
    state.listaActiva[index].precio =
        valor === "" ? "" : parseFloat(valor);
    guardarDatos();
}


// ==========================
// FINALIZAR COMPRA
// ==========================

function cerrarLista() {

    const comprados = state.listaActiva.filter(i => i.comprado);
    if (comprados.length === 0) return;

    const supermercado = prompt("¿Supermercado? (Opcional)") || "";

    const fecha = new Date();
    const mes = fecha.toLocaleString("default", { month: "long" });
    const anio = fecha.getFullYear();

    comprados.forEach(item => {

        const cantidadFinal =
            item.cantidadComprada && item.cantidadComprada > 0
                ? item.cantidadComprada
                : 1;

        let producto = null;

        if (item.productoId) {
            producto = state.productos
                .find(p => p.id == item.productoId);
        } else {
            producto = state.productos
                .find(p =>
                    p.nombre.toLowerCase() ===
                    item.nombre.toLowerCase()
                );
        }

        if (producto) {
            producto.cantidad = parseFloat(
                (producto.cantidad + cantidadFinal).toFixed(2)
            );
        } else {
            state.productos.push({
                id: Date.now() + Math.random(),
                nombre: item.nombre,
                categoria: "generales",
                cantidad: cantidadFinal
            });
        }

    });

    state.historial.push({
        id: Date.now(),
        fecha: fecha.toISOString(),
        mes,
        anio,
        supermercado,
        items: JSON.parse(JSON.stringify(comprados))
    });

    state.listaActiva =
        state.listaActiva.filter(i => !i.comprado);

    guardarDatos();
    renderTodo();
}


// ==========================
// HISTORIAL
// ==========================

function renderHistorial() {

    const cont = $("listaHistorial");
    cont.innerHTML = "";

    if (state.historial.length === 0) {
        cont.innerHTML = "<p>No hay compras todavía</p>";
        return;
    }

    const historialOrdenado = [...state.historial]
        .sort((a, b) =>
            new Date(b.fecha) - new Date(a.fecha)
        );

    const agrupado = {};

    historialOrdenado.forEach(compra => {
        const clave = compra.mes + " " + compra.anio;
        if (!agrupado[clave]) agrupado[clave] = [];
        agrupado[clave].push(compra);
    });

    let totalHistorico = 0;

    state.historial.forEach(compra => {
        compra.items.forEach(i => {
            totalHistorico +=
                (i.precio || 0) *
                (i.cantidadComprada || 1);
        });
    });

    const resumen = document.createElement("div");
    resumen.className = "resumen-general";
    resumen.innerHTML =
        `<h3>Total histórico: $${totalHistorico.toFixed(2)}</h3>`;
    cont.appendChild(resumen);

    Object.keys(agrupado).forEach(mesClave => {

        const comprasMes = agrupado[mesClave];
        let totalMes = 0;

        comprasMes.forEach(compra => {
            compra.items.forEach(i => {
                totalMes +=
                    (i.precio || 0) *
                    (i.cantidadComprada || 1);
            });
        });

        const mesDiv = document.createElement("div");
        mesDiv.className = "mes-bloque";

        mesDiv.innerHTML =
            `<h2>${mesClave} — Total: $${totalMes.toFixed(2)}</h2>`;

        cont.appendChild(mesDiv);
    });
}
