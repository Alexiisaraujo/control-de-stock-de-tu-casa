// =========================
// ESTADO GLOBAL
// =========================

let state = {
    productos: [],
    listaActiva: [],
    historial: []
};

// =========================
// INIT
// =========================

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    renderTodo();
});

// =========================
// STORAGE
// =========================

function guardarDatos() {
    localStorage.setItem("hogarApp", JSON.stringify(state));
}

function cargarDatos() {
    const data = localStorage.getItem("hogarApp");
    if (data) state = JSON.parse(data);
}

// =========================
// NAVEGACION
// =========================

function mostrarSeccion(id) {
    document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activa"));
    document.getElementById(id).classList.add("activa");
}

// =========================
// STOCK
// =========================

function agregarProducto() {
    const nombre = nuevoNombre.value.trim();
    const categoria = nuevaCategoria.value;
    const cantidad = parseFloat(nuevaCantidad.value);

    if (!nombre || isNaN(cantidad) || cantidad < 0) return;

    state.productos.push({
        id: Date.now(),
        nombre,
        categoria,
        cantidad: parseFloat(cantidad.toFixed(2))
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

// =========================
// CONSUMO
// =========================

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

// =========================
// LISTA AUTOMATICA
// =========================

function generarListaAutomatica() {
    state.productos
        .filter(p => p.cantidad <= 1)
        .forEach(p => {
            if (!state.listaActiva.find(i => i.productoId === p.id)) {
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

// =========================
// AGREGAR MANUAL
// =========================

function agregarManual() {
    const nombre = manualNombre.value.trim();
    if (!nombre) return;

    state.listaActiva.push({
        productoId: null,
        nombre,
        comprado: false,
        cantidadComprada: "",
        precio: ""
    });

    manualNombre.value = "";
    guardarDatos();
    renderLista();
}

// =========================
// RENDER GENERAL
// =========================

function renderTodo() {
    generarListaAutomatica();
    renderStock();
    renderSelect();
    renderLista();
    renderHistorial();
}

// =========================
// RENDER STOCK
// =========================

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

// =========================
// RENDER SELECT CONSUMO
// =========================

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

// =========================
// RENDER LISTA
// =========================

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
    state.listaActiva[index].cantidadComprada = parseFloat(valor) || "";
    guardarDatos();
}

function guardarPrecio(index, valor) {
    state.listaActiva[index].precio = parseFloat(valor) || "";
    guardarDatos();
}

// =========================
// FINALIZAR COMPRA
// =========================

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

        item.cantidadComprada = cantidadFinal;

        // 🔹 Buscar si ya existe en stock
        let producto = null;

        if (item.productoId) {
            producto = state.productos.find(p => p.id == item.productoId);
        } else {
            // Buscar por nombre (por si ya existe uno igual)
            producto = state.productos.find(
                p => p.nombre.toLowerCase() === item.nombre.toLowerCase()
            );
        }

        if (producto) {
            // Sumar al stock existente
            producto.cantidad = parseFloat(
                (producto.cantidad + cantidadFinal).toFixed(2)
            );
        } else {
            // Crear nuevo producto automáticamente
            state.productos.push({
                id: Date.now() + Math.random(),
                nombre: item.nombre,
                categoria: "generales",
                cantidad: cantidadFinal
            });
        }

    });

    // Guardar historial
    state.historial.push({
    id: Date.now(),
    fecha: fecha.toISOString(),
    mes,
    anio,
    supermercado,
    items: JSON.parse(JSON.stringify(comprados))
});
    // Dejar solo los no comprados
    state.listaActiva = state.listaActiva.filter(i => !i.comprado);

    guardarDatos();
    renderTodo();
}

// =========================
// HISTORIAL AGRUPADO POR MES
// =========================

function renderHistorial() {

    const cont = document.getElementById("historial");
    cont.innerHTML = "";

    if (state.historial.length === 0) {
        cont.innerHTML = "<p>No hay compras todavía</p>";
        return;
    }

    // 🔹 ORDENAR POR FECHA DESC
    const historialOrdenado = [...state.historial].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    // 🔹 AGRUPAR POR MES
    const agrupado = {};

    historialOrdenado.forEach(compra => {
        const clave = compra.mes + " " + compra.anio;
        if (!agrupado[clave]) agrupado[clave] = [];
        agrupado[clave].push(compra);
    });

    // 🔹 RESUMEN GENERAL
    let totalHistorico = 0;

    state.historial.forEach(compra => {
        compra.items.forEach(i => {
            totalHistorico += (i.precio || 0) * (i.cantidadComprada || 1);
        });
    });

    const resumen = document.createElement("div");
    resumen.className = "resumen-general";
    resumen.innerHTML = `
        <h3>Total histórico: $${totalHistorico.toFixed(2)}</h3>
    `;
    cont.appendChild(resumen);

    // 🔹 RENDER POR MES
    Object.keys(agrupado).forEach(mesClave => {

        const comprasMes = agrupado[mesClave];

        let totalMes = 0;

        comprasMes.forEach(compra => {
            compra.items.forEach(i => {
                totalMes += (i.precio || 0) * (i.cantidadComprada || 1);
            });
        });

        const mesDiv = document.createElement("div");
        mesDiv.className = "mes-bloque";

        mesDiv.innerHTML = `
            <h2>${mesClave} — Total: $${totalMes.toFixed(2)}</h2>
        `;

        comprasMes.forEach(compra => {

            let totalCompra = 0;

            compra.items.forEach(i => {
                totalCompra += (i.precio || 0) * (i.cantidadComprada || 1);
            });

            const compraDiv = document.createElement("div");
            compraDiv.className = "compra-card";

            let tabla = `
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            compra.items.forEach(i => {
                const subtotal = (i.precio || 0) * (i.cantidadComprada || 1);
                tabla += `
                    <tr>
                        <td>${i.nombre}</td>
                        <td>${i.cantidadComprada || 1}</td>
                        <td>$${(i.precio || 0).toFixed(2)}</td>
                        <td>$${subtotal.toFixed(2)}</td>
                    </tr>
                `;
            });

            tabla += `
                    </tbody>
                </table>
            `;

            compraDiv.innerHTML = `
                <div class="compra-header">
                    <strong>${new Date(compra.fecha).toLocaleDateString()}</strong>
                    ${compra.supermercado ? " - " + compra.supermercado : ""}
                    <span>Total: $${totalCompra.toFixed(2)}</span>
                    <button onclick="eliminarCompra(${compra.id})">Eliminar</button>
                </div>
                ${tabla}
            `;

            mesDiv.appendChild(compraDiv);
        });

        cont.appendChild(mesDiv);
    });

}
function eliminarCompra(id) {

    if (!confirm("¿Eliminar esta compra?")) return;

    state.historial = state.historial.filter(c => c.id !== id);

    guardarDatos();
    renderTodo();
}
