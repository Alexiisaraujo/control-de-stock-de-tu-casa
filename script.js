// ======================
// ESTADO
// ======================

let state = {
    productos: [],
    listaActiva: [],
    historial: []
};

// ======================
// INIT
// ======================

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    renderTodo();
});

// ======================
// STORAGE
// ======================

function guardarDatos() {
    localStorage.setItem("hogarApp", JSON.stringify(state));
}

function cargarDatos() {
    const data = localStorage.getItem("hogarApp");
    if (data) state = JSON.parse(data);
}

// ======================
// NAVEGACION
// ======================

function mostrarSeccion(id) {
    document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activa"));
    document.getElementById(id).classList.add("activa");
}

// ======================
// STOCK
// ======================

function agregarProducto() {
    const nombre = nuevoNombre.value.trim();
    const categoria = nuevaCategoria.value;
    const cantidad = parseFloat(nuevaCantidad.value);

    if (!nombre || isNaN(cantidad) || cantidad < 0) return;

    state.productos.push({
        id: Date.now(),
        nombre,
        categoria,
        cantidad
    });

    nuevoNombre.value = "";
    nuevaCantidad.value = "";

    guardarDatos();
    renderTodo();
}

function eliminarProducto(id) {
    state.productos = state.productos.filter(p => p.id !== id);
    guardarDatos();
    renderTodo();
}

// ======================
// CONSUMO (CORREGIDO)
// ======================

function registrarConsumo() {
    const id = productoConsumido.value;
    const cantidad = parseFloat(cantidadConsumida.value);

    const producto = state.productos.find(p => p.id == id);
    if (!producto || isNaN(cantidad) || cantidad <= 0) return;

    if (cantidad > producto.cantidad) {
        alert("No podés consumir más de lo que hay.");
        return;
    }

    producto.cantidad = parseFloat((producto.cantidad - cantidad).toFixed(2));

    cantidadConsumida.value = "";

    guardarDatos();
    renderTodo();
}

// ======================
// LISTA AUTOMATICA
// ======================

function generarListaAutomatica() {
    const faltantes = state.productos.filter(p => p.cantidad <= 1);

    faltantes.forEach(p => {
        if (!state.listaActiva.find(i => i.productoId === p.id)) {
            state.listaActiva.push({
                productoId: p.id,
                nombre: p.nombre,
                comprado: false,
                precio: ""
            });
        }
    });
}

// ======================
// RENDER
// ======================

function renderTodo() {
    generarListaAutomatica();
    renderStock();
    renderSelect();
    renderLista();
    renderHistorial();
}

function renderStock() {
    listaStock.innerHTML = "";

    state.productos.forEach(p => {
        let color = "verde";
        if (p.cantidad <= 1) color = "rojo";
        else if (p.cantidad <= 2) color = "amarillo";

        listaStock.innerHTML += `
            <div class="item-stock ${color}">
                <span>${p.nombre} (${p.cantidad})</span>
                <button onclick="eliminarProducto(${p.id})">X</button>
            </div>
        `;
    });
}

function renderSelect() {
    productoConsumido.innerHTML = "";
    state.productos.forEach(p => {
        productoConsumido.innerHTML += `
            <option value="${p.id}">
                ${p.nombre} (${p.cantidad})
            </option>
        `;
    });
}

// ======================
// LISTA DE COMPRA (MEJORADA)
// ======================

function renderLista() {
    listaCompra.innerHTML = "";

    state.listaActiva.forEach((item, index) => {
        listaCompra.innerHTML += `
            <div class="item-lista">
                <input type="checkbox" 
                    ${item.comprado ? "checked" : ""} 
                    onchange="marcarComprado(${index}, this.checked)"
                >
                <span>${item.nombre}</span>
                <input type="number" 
                    placeholder="Precio"
                    value="${item.precio}"
                    onchange="guardarPrecio(${index}, this.value)"
                    step="0.01"
                    min="0"
                >
            </div>
        `;
    });
}

function marcarComprado(index, estado) {
    state.listaActiva[index].comprado = estado;
    guardarDatos();
}

function guardarPrecio(index, valor) {
    state.listaActiva[index].precio = parseFloat(valor) || "";
    guardarDatos();
}

// ======================
// FINALIZAR COMPRA (LOGICA CORRECTA)
// ======================

function cerrarLista() {

    const comprados = state.listaActiva.filter(i => i.comprado);

    if (comprados.length === 0) return;

    const supermercado = prompt("¿En qué supermercado compraste? (Opcional)") || "";

    const fecha = new Date();
    const mes = fecha.toLocaleString("default", { month: "long" });
    const anio = fecha.getFullYear();

    comprados.forEach(item => {
        const producto = state.productos.find(p => p.id == item.productoId);
        if (producto) {
            producto.cantidad += 1; // suma 1 unidad comprada
        }
    });

    state.historial.push({
        fecha: fecha.toISOString(),
        mes,
        anio,
        supermercado,
        items: comprados
    });

    // dejar solo los NO comprados en lista
    state.listaActiva = state.listaActiva.filter(i => !i.comprado);

    guardarDatos();
    renderTodo();
}

// ======================
// HISTORIAL POR MES
// ======================

function renderHistorial() {

    listaHistorial.innerHTML = "";

    const agrupado = {};

    state.historial.forEach(h => {
        const clave = `${h.mes} ${h.anio}`;
        if (!agrupado[clave]) agrupado[clave] = [];
        agrupado[clave].push(h);
    });

    Object.keys(agrupado).forEach(mes => {

        listaHistorial.innerHTML += `<h3>${mes}</h3>`;

        agrupado[mes].forEach(compra => {

            compra.items.forEach(item => {

                listaHistorial.innerHTML += `
                    <div class="item-historial">
                        <div><strong>${item.nombre}</strong></div>
                        <div>Precio: ${item.precio || "No cargado"}</div>
                        <div>Super: ${compra.supermercado || "No especificado"}</div>
                    </div>
                `;

            });

        });

    });

}
