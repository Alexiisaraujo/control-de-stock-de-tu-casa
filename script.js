// ===============================
// ESTADO GLOBAL
// ===============================

let state = {
    productos: [],
    listaActiva: [],
    historial: []
};

// ===============================
// INICIO
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    renderTodo();
    configurarValidaciones();
});

// ===============================
// UTILIDADES
// ===============================

function guardarDatos() {
    localStorage.setItem("hogarApp", JSON.stringify(state));
}

function cargarDatos() {
    const data = localStorage.getItem("hogarApp");
    if (data) state = JSON.parse(data);
}

function mostrarSeccion(id) {
    document.querySelectorAll(".seccion").forEach(sec => {
        sec.classList.remove("activa");
    });
    document.getElementById(id).classList.add("activa");
}

function mostrarFeedback(mensaje, tipo = "ok") {
    const div = document.getElementById("feedback");
    div.textContent = mensaje;
    div.className = "feedback mostrar " + tipo;

    setTimeout(() => {
        div.classList.remove("mostrar");
    }, 1500);
}

// ===============================
// VALIDACIONES
// ===============================

function configurarValidaciones() {
    const inputCantidad = document.getElementById("cantidadConsumida");
    const selectProducto = document.getElementById("productoConsumido");
    const boton = document.getElementById("btnRegistrarConsumo");

    function validar() {
        const id = selectProducto.value;
        const cantidad = parseFloat(inputCantidad.value);
        const producto = state.productos.find(p => p.id == id);

        if (!producto || isNaN(cantidad) || cantidad <= 0 || cantidad > producto.cantidad) {
            boton.disabled = true;
        } else {
            boton.disabled = false;
        }
    }

    inputCantidad.addEventListener("input", validar);
    selectProducto.addEventListener("change", validar);
}

// ===============================
// RENDER GENERAL
// ===============================

function renderTodo() {
    renderSelect();
    renderStock();
    generarListaAutomatica();
    renderLista();
    renderHistorial();
}

// ===============================
// STOCK
// ===============================

function agregarProducto() {
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const categoria = document.getElementById("nuevaCategoria").value;
    const cantidad = parseFloat(document.getElementById("nuevaCantidad").value);

    if (!nombre || isNaN(cantidad) || cantidad < 0) return;

    state.productos.push({
        id: Date.now(),
        nombre,
        categoria,
        cantidad
    });

    guardarDatos();
    renderTodo();

    document.getElementById("nuevoNombre").value = "";
    document.getElementById("nuevaCantidad").value = "";
}

function renderStock() {
    const cont = document.getElementById("listaStock");
    cont.innerHTML = "";

    state.productos.forEach(p => {
        let color = "verde";
        if (p.cantidad <= 1) color = "rojo";
        else if (p.cantidad <= 2) color = "amarillo";

        const div = document.createElement("div");
        div.className = "item-stock " + color;
        div.innerHTML = `
            <span>${p.nombre} (${p.cantidad})</span>
            <button onclick="eliminarProducto(${p.id})">X</button>
        `;
        cont.appendChild(div);
    });
}

function eliminarProducto(id) {
    state.productos = state.productos.filter(p => p.id !== id);
    guardarDatos();
    renderTodo();
}

function renderSelect() {
    const select = document.getElementById("productoConsumido");
    select.innerHTML = "";

    state.productos.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.nombre} (${p.cantidad})`;
        select.appendChild(option);
    });
}

// ===============================
// CONSUMO
// ===============================

function registrarConsumo() {
    const id = document.getElementById("productoConsumido").value;
    const inputCantidad = document.getElementById("cantidadConsumida");
    const cantidad = parseFloat(inputCantidad.value);

    const producto = state.productos.find(p => p.id == id);
    if (!producto) return;

    if (cantidad > producto.cantidad) {
        mostrarFeedback("Stock insuficiente", "error");
        return;
    }

    producto.cantidad -= cantidad;

    guardarDatos();
    renderTodo();

    inputCantidad.value = "";
    mostrarFeedback("Consumo registrado");
}

// ===============================
// LISTA AUTOMÁTICA
// ===============================

function generarListaAutomatica() {
    state.listaActiva = state.productos
        .filter(p => p.cantidad <= 1)
        .map(p => ({
            nombre: p.nombre,
            comprado: false,
            precio: null,
            supermercado: ""
        }));
}

function renderLista() {
    const cont = document.getElementById("listaCompra");
    cont.innerHTML = "";

    state.listaActiva.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "item-lista";

        div.innerHTML = `
            <input type="checkbox" onchange="marcarComprado(${index}, this.checked)">
            <span>${item.nombre}</span>
        `;

        cont.appendChild(div);
    });
}

function marcarComprado(index, estado) {
    state.listaActiva[index].comprado = estado;

    if (estado) {
        const precio = prompt("Precio pagado:");
        const superm = prompt("Supermercado:");

        state.listaActiva[index].precio = parseFloat(precio) || 0;
        state.listaActiva[index].supermercado = superm || "";
    }

    guardarDatos();
}

// ===============================
// CIERRE DE COMPRA
// ===============================

function cerrarLista() {
    if (state.listaActiva.length === 0) return;

    const fecha = new Date().toISOString().split("T")[0];

    state.historial.push({
        fecha,
        items: [...state.listaActiva]
    });

    state.listaActiva = [];

    guardarDatos();
    renderTodo();

    mostrarFeedback("Compra guardada");
}

// ===============================
// HISTORIAL
// ===============================

function renderHistorial() {
    const cont = document.getElementById("listaHistorial");
    cont.innerHTML = "";

    state.historial
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .forEach(h => {
            const div = document.createElement("div");
            div.className = "item-historial";
            div.innerHTML = `
                <strong>${h.fecha}</strong>
                <div>Total items: ${h.items.length}</div>
            `;
            cont.appendChild(div);
        });
}