"use strict";

/* =========================================================
   CONFIGURACIÓN DE API
   ========================================================= */

const API = {
    usuarios: "/api/usuarios",
    stock: "/api/stock",
};

/* =========================================================
   ESTADO DE LA APLICACIÓN
   ========================================================= */

const estado = {
    usuarios: [],
    productos: [],
    itemsGuia: [],
};

/* =========================================================
   REFERENCIAS DEL DOM
   ========================================================= */

const elementos = {
    estadoApi: document.getElementById("estado-api"),
    mensajeGlobal: document.getElementById("mensaje-global"),

    formularioUsuario:
        document.getElementById("formulario-usuario"),
    usuarioId:
        document.getElementById("usuario-id"),
    usuarioNombre:
        document.getElementById("usuario-nombre"),
    usuarioEmail:
        document.getElementById("usuario-email"),
    guardarUsuario:
        document.getElementById("guardar-usuario"),
    cancelarUsuario:
        document.getElementById("cancelar-edicion-usuario"),
    tablaUsuarios:
        document.getElementById("tabla-usuarios"),

    formularioProducto:
        document.getElementById("formulario-producto"),
    productoId:
        document.getElementById("producto-id"),
    productoNombre:
        document.getElementById("producto-nombre"),
    productoCantidad:
        document.getElementById("producto-cantidad"),
    productoPrecio:
        document.getElementById("producto-precio"),
    guardarProducto:
        document.getElementById("guardar-producto"),
    cancelarProducto:
        document.getElementById("cancelar-edicion-producto"),
    tablaProductos:
        document.getElementById("tabla-productos"),

    guiaUsuario:
        document.getElementById("guia-usuario"),
    guiaUsuarioNombre:
        document.getElementById("guia-usuario-nombre"),
    guiaUsuarioEmail:
        document.getElementById("guia-usuario-email"),
    guiaProducto:
        document.getElementById("guia-producto"),
    guiaCantidad:
        document.getElementById("guia-cantidad"),
    agregarProductoGuia:
        document.getElementById("agregar-producto-guia"),
    tablaGuia:
        document.getElementById("tabla-guia"),
    totalGuia:
        document.getElementById("total-guia"),
    numeroGuia:
        document.getElementById("numero-guia"),
    fechaGuia:
        document.getElementById("fecha-guia"),
    observaciones:
        document.getElementById("guia-observaciones"),
    limpiarGuia:
        document.getElementById("limpiar-guia"),
    imprimirGuia:
        document.getElementById("imprimir-guia"),
};

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

async function iniciarAplicacion() {
    establecerInformacionGuia();
    registrarEventos();

    try {
        await Promise.all([
            cargarUsuarios(),
            cargarProductos(),
        ]);

        actualizarEstadoApi(
            "API conectada",
            "correcto",
        );
    } catch (error) {
        actualizarEstadoApi(
            "API sin conexión",
            "error",
        );

        mostrarMensaje(
            error.message,
            "error",
        );
    }
}

function registrarEventos() {
    elementos.formularioUsuario.addEventListener(
        "submit",
        guardarDatosUsuario,
    );

    elementos.cancelarUsuario.addEventListener(
        "click",
        limpiarFormularioUsuario,
    );

    elementos.tablaUsuarios.addEventListener(
        "click",
        manejarAccionUsuario,
    );

    elementos.formularioProducto.addEventListener(
        "submit",
        guardarDatosProducto,
    );

    elementos.cancelarProducto.addEventListener(
        "click",
        limpiarFormularioProducto,
    );

    elementos.tablaProductos.addEventListener(
        "click",
        manejarAccionProducto,
    );

    elementos.guiaUsuario.addEventListener(
        "change",
        mostrarUsuarioSeleccionado,
    );

    elementos.agregarProductoGuia.addEventListener(
        "click",
        agregarItemGuia,
    );

    elementos.tablaGuia.addEventListener(
        "click",
        eliminarItemGuia,
    );

    elementos.limpiarGuia.addEventListener(
        "click",
        limpiarGuia,
    );

    elementos.imprimirGuia.addEventListener(
        "click",
        imprimirGuia,
    );
}

/* =========================================================
   CLIENTE HTTP
   ========================================================= */

async function solicitar(url, opciones = {}) {
    const configuracion = {
        headers: {
            "Content-Type": "application/json",
            ...(opciones.headers ?? {}),
        },
        ...opciones,
    };

    const respuesta = await fetch(url, configuracion);

    if (!respuesta.ok) {
        const mensaje = await obtenerMensajeError(respuesta);
        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    return respuesta.json();
}

async function obtenerMensajeError(respuesta) {
    try {
        const contenido = await respuesta.json();

        return contenido.error
            ?? `Error HTTP ${respuesta.status}`;
    } catch {
        return `Error HTTP ${respuesta.status}`;
    }
}

/* =========================================================
   CRUD DE USUARIOS
   ========================================================= */

async function cargarUsuarios() {
    estado.usuarios = await solicitar(API.usuarios);

    renderizarUsuarios();
    cargarUsuariosEnGuia();
}

async function guardarDatosUsuario(evento) {
    evento.preventDefault();

    const id = elementos.usuarioId.value.trim();
    const nombre = elementos.usuarioNombre.value.trim();
    const email = elementos.usuarioEmail.value.trim();

    if (!nombre || !email) {
        mostrarMensaje(
            "Debes ingresar el nombre y el correo del usuario.",
            "error",
        );
        return;
    }

    const datos = {
        nombre,
        email,
    };

    const editando = id !== "";
    const url = editando
        ? `${API.usuarios}/${id}`
        : API.usuarios;

    const metodo = editando
        ? "PUT"
        : "POST";

    try {
        bloquearBoton(
            elementos.guardarUsuario,
            true,
            "Guardando...",
        );

        await solicitar(url, {
            method: metodo,
            body: JSON.stringify(datos),
        });

        mostrarMensaje(
            editando
                ? "Usuario actualizado correctamente."
                : "Usuario creado correctamente.",
            "correcto",
        );

        limpiarFormularioUsuario();
        await cargarUsuarios();
    } catch (error) {
        mostrarMensaje(error.message, "error");
    } finally {
        bloquearBoton(
            elementos.guardarUsuario,
            false,
            elementos.usuarioId.value
                ? "Actualizar usuario"
                : "Guardar usuario",
        );
    }
}

function renderizarUsuarios() {
    if (estado.usuarios.length === 0) {
        elementos.tablaUsuarios.innerHTML = `
            <tr>
                <td colspan="4" class="tabla-vacia">
                    No existen usuarios registrados.
                </td>
            </tr>
        `;

        return;
    }

    elementos.tablaUsuarios.innerHTML = estado.usuarios
        .map((usuario) => `
            <tr>
                <td>${usuario.id}</td>

                <td>
                    ${escaparHtml(usuario.nombre)}
                </td>

                <td>
                    ${escaparHtml(usuario.email)}
                </td>

                <td>
                    <div class="acciones-tabla">
                        <button
                            type="button"
                            class="boton boton--pequeno boton--editar"
                            data-accion="editar"
                            data-id="${usuario.id}"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="boton boton--pequeno boton--eliminar"
                            data-accion="eliminar"
                            data-id="${usuario.id}"
                        >
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `)
        .join("");
}

async function manejarAccionUsuario(evento) {
    const boton = evento.target.closest(
        "button[data-accion]",
    );

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "editar") {
        editarUsuario(id);
    }

    if (accion === "eliminar") {
        await borrarUsuario(id);
    }
}

function editarUsuario(id) {
    const usuario = estado.usuarios.find(
        (item) => item.id === id,
    );

    if (!usuario) {
        mostrarMensaje(
            "No se encontró el usuario seleccionado.",
            "error",
        );
        return;
    }

    elementos.usuarioId.value = usuario.id;
    elementos.usuarioNombre.value = usuario.nombre;
    elementos.usuarioEmail.value = usuario.email;

    elementos.guardarUsuario.textContent =
        "Actualizar usuario";

    elementos.cancelarUsuario.hidden = false;

    elementos.usuarioNombre.focus();

    elementos.formularioUsuario.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
}

async function borrarUsuario(id) {
    const usuario = estado.usuarios.find(
        (item) => item.id === id,
    );

    if (!usuario) {
        return;
    }

    const confirmado = window.confirm(
        `¿Eliminar al usuario "${usuario.nombre}"?`,
    );

    if (!confirmado) {
        return;
    }

    try {
        await solicitar(`${API.usuarios}/${id}`, {
            method: "DELETE",
        });

        mostrarMensaje(
            "Usuario eliminado correctamente.",
            "correcto",
        );

        if (String(id) === elementos.guiaUsuario.value) {
            elementos.guiaUsuario.value = "";
            mostrarUsuarioSeleccionado();
        }

        await cargarUsuarios();
    } catch (error) {
        mostrarMensaje(error.message, "error");
    }
}

function limpiarFormularioUsuario() {
    elementos.formularioUsuario.reset();
    elementos.usuarioId.value = "";
    elementos.guardarUsuario.textContent =
        "Guardar usuario";
    elementos.cancelarUsuario.hidden = true;
}

/* =========================================================
   CRUD DE PRODUCTOS
   ========================================================= */

async function cargarProductos() {
    estado.productos = await solicitar(API.stock);

    renderizarProductos();
    cargarProductosEnGuia();
}

async function guardarDatosProducto(evento) {
    evento.preventDefault();

    const id = elementos.productoId.value.trim();
    const producto = elementos.productoNombre.value.trim();
    const cantidad = Number(
        elementos.productoCantidad.value,
    );
    const precio = Number(
        elementos.productoPrecio.value,
    );

    if (!producto) {
        mostrarMensaje(
            "Debes ingresar el nombre del producto.",
            "error",
        );
        return;
    }

    if (
        !Number.isInteger(cantidad)
        || cantidad < 0
    ) {
        mostrarMensaje(
            "La cantidad debe ser un número entero igual o mayor que cero.",
            "error",
        );
        return;
    }

    if (
        !Number.isFinite(precio)
        || precio < 0
    ) {
        mostrarMensaje(
            "El precio debe ser igual o mayor que cero.",
            "error",
        );
        return;
    }

    const datos = {
        producto,
        cantidad,
        precio,
    };

    const editando = id !== "";
    const url = editando
        ? `${API.stock}/${id}`
        : API.stock;

    const metodo = editando
        ? "PUT"
        : "POST";

    try {
        bloquearBoton(
            elementos.guardarProducto,
            true,
            "Guardando...",
        );

        await solicitar(url, {
            method: metodo,
            body: JSON.stringify(datos),
        });

        mostrarMensaje(
            editando
                ? "Producto actualizado correctamente."
                : "Producto creado correctamente.",
            "correcto",
        );

        limpiarFormularioProducto();
        await cargarProductos();
    } catch (error) {
        mostrarMensaje(error.message, "error");
    } finally {
        bloquearBoton(
            elementos.guardarProducto,
            false,
            elementos.productoId.value
                ? "Actualizar producto"
                : "Guardar producto",
        );
    }
}

function renderizarProductos() {
    if (estado.productos.length === 0) {
        elementos.tablaProductos.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-vacia">
                    No existen productos registrados.
                </td>
            </tr>
        `;

        return;
    }

    elementos.tablaProductos.innerHTML = estado.productos
        .map((producto) => {
            const valorStock =
                producto.cantidad * producto.precio;

            return `
                <tr>
                    <td>${producto.id}</td>

                    <td>
                        ${escaparHtml(producto.producto)}
                    </td>

                    <td>
                        <span class="${claseCantidad(
                            producto.cantidad
                        )}">
                            ${producto.cantidad}
                        </span>
                    </td>

                    <td>
                        ${formatearMoneda(producto.precio)}
                    </td>

                    <td>
                        ${formatearMoneda(valorStock)}
                    </td>

                    <td>
                        <div class="acciones-tabla">
                            <button
                                type="button"
                                class="boton boton--pequeno boton--editar"
                                data-accion="editar"
                                data-id="${producto.id}"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                class="boton boton--pequeno boton--eliminar"
                                data-accion="eliminar"
                                data-id="${producto.id}"
                            >
                                Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

async function manejarAccionProducto(evento) {
    const boton = evento.target.closest(
        "button[data-accion]",
    );

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "editar") {
        editarProducto(id);
    }

    if (accion === "eliminar") {
        await borrarProducto(id);
    }
}

function editarProducto(id) {
    const producto = estado.productos.find(
        (item) => item.id === id,
    );

    if (!producto) {
        mostrarMensaje(
            "No se encontró el producto seleccionado.",
            "error",
        );
        return;
    }

    elementos.productoId.value = producto.id;
    elementos.productoNombre.value = producto.producto;
    elementos.productoCantidad.value = producto.cantidad;
    elementos.productoPrecio.value = producto.precio;

    elementos.guardarProducto.textContent =
        "Actualizar producto";

    elementos.cancelarProducto.hidden = false;

    elementos.productoNombre.focus();

    elementos.formularioProducto.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
}

async function borrarProducto(id) {
    const producto = estado.productos.find(
        (item) => item.id === id,
    );

    if (!producto) {
        return;
    }

    const confirmado = window.confirm(
        `¿Eliminar el producto "${producto.producto}"?`,
    );

    if (!confirmado) {
        return;
    }

    try {
        await solicitar(`${API.stock}/${id}`, {
            method: "DELETE",
        });

        estado.itemsGuia = estado.itemsGuia.filter(
            (item) => item.id !== id,
        );

        renderizarGuia();

        mostrarMensaje(
            "Producto eliminado correctamente.",
            "correcto",
        );

        await cargarProductos();
    } catch (error) {
        mostrarMensaje(error.message, "error");
    }
}

function limpiarFormularioProducto() {
    elementos.formularioProducto.reset();
    elementos.productoId.value = "";
    elementos.productoCantidad.value = "0";
    elementos.productoPrecio.value = "0";
    elementos.guardarProducto.textContent =
        "Guardar producto";
    elementos.cancelarProducto.hidden = true;
}

/* =========================================================
   GUÍA DE DESPACHO
   ========================================================= */

function cargarUsuariosEnGuia() {
    const seleccionado = elementos.guiaUsuario.value;

    elementos.guiaUsuario.innerHTML = `
        <option value="">
            Seleccione un usuario
        </option>

        ${estado.usuarios
            .map((usuario) => `
                <option value="${usuario.id}">
                    ${escaparHtml(usuario.nombre)}
                </option>
            `)
            .join("")}
    `;

    if (
        seleccionado
        && estado.usuarios.some(
            (usuario) =>
                String(usuario.id) === seleccionado
        )
    ) {
        elementos.guiaUsuario.value = seleccionado;
    }

    mostrarUsuarioSeleccionado();
}

function cargarProductosEnGuia() {
    const seleccionado = elementos.guiaProducto.value;

    const productosDisponibles =
        estado.productos.filter(
            (producto) => producto.cantidad > 0,
        );

    elementos.guiaProducto.innerHTML = `
        <option value="">
            Seleccione un producto
        </option>

        ${productosDisponibles
            .map((producto) => `
                <option value="${producto.id}">
                    ${escaparHtml(producto.producto)}
                    — stock: ${producto.cantidad}
                    — ${formatearMoneda(producto.precio)}
                </option>
            `)
            .join("")}
    `;

    if (
        seleccionado
        && productosDisponibles.some(
            (producto) =>
                String(producto.id) === seleccionado
        )
    ) {
        elementos.guiaProducto.value = seleccionado;
    }
}

function mostrarUsuarioSeleccionado() {
    const id = Number(elementos.guiaUsuario.value);

    const usuario = estado.usuarios.find(
        (item) => item.id === id,
    );

    elementos.guiaUsuarioNombre.textContent =
        usuario?.nombre ?? "Sin seleccionar";

    elementos.guiaUsuarioEmail.textContent =
        usuario?.email ?? "Sin seleccionar";
}

function agregarItemGuia() {
    const productoId = Number(
        elementos.guiaProducto.value,
    );

    const cantidad = Number(
        elementos.guiaCantidad.value,
    );

    const producto = estado.productos.find(
        (item) => item.id === productoId,
    );

    if (!elementos.guiaUsuario.value) {
        mostrarMensaje(
            "Selecciona primero el usuario destinatario.",
            "error",
        );
        return;
    }

    if (!producto) {
        mostrarMensaje(
            "Selecciona un producto válido.",
            "error",
        );
        return;
    }

    if (
        !Number.isInteger(cantidad)
        || cantidad <= 0
    ) {
        mostrarMensaje(
            "La cantidad a despachar debe ser mayor que cero.",
            "error",
        );
        return;
    }

    const itemExistente = estado.itemsGuia.find(
        (item) => item.id === producto.id,
    );

    const cantidadAcumulada =
        cantidad + (itemExistente?.cantidad ?? 0);

    if (cantidadAcumulada > producto.cantidad) {
        mostrarMensaje(
            `Stock insuficiente. Hay ${producto.cantidad} unidades disponibles.`,
            "error",
        );
        return;
    }

    if (itemExistente) {
        itemExistente.cantidad = cantidadAcumulada;
    } else {
        estado.itemsGuia.push({
            id: producto.id,
            producto: producto.producto,
            cantidad,
            precio: producto.precio,
            stockDisponible: producto.cantidad,
        });
    }

    elementos.guiaProducto.value = "";
    elementos.guiaCantidad.value = "1";

    renderizarGuia();

    mostrarMensaje(
        "Producto agregado a la guía.",
        "correcto",
    );
}

function renderizarGuia() {
    if (estado.itemsGuia.length === 0) {
        elementos.tablaGuia.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-vacia">
                    No se han agregado productos.
                </td>
            </tr>
        `;

        elementos.totalGuia.textContent =
            formatearMoneda(0);

        return;
    }

    elementos.tablaGuia.innerHTML = estado.itemsGuia
        .map((item) => {
            const subtotal = item.cantidad * item.precio;

            return `
                <tr>
                    <td>${item.id}</td>

                    <td>
                        ${escaparHtml(item.producto)}
                    </td>

                    <td>${item.cantidad}</td>

                    <td>
                        ${formatearMoneda(item.precio)}
                    </td>

                    <td>
                        ${formatearMoneda(subtotal)}
                    </td>

                    <td class="no-imprimir">
                        <button
                            type="button"
                            class="boton boton--pequeno boton--eliminar"
                            data-id="${item.id}"
                        >
                            Quitar
                        </button>
                    </td>
                </tr>
            `;
        })
        .join("");

    const total = estado.itemsGuia.reduce(
        (acumulado, item) =>
            acumulado + item.cantidad * item.precio,
        0,
    );

    elementos.totalGuia.textContent =
        formatearMoneda(total);
}

function eliminarItemGuia(evento) {
    const boton = evento.target.closest(
        "button[data-id]",
    );

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);

    estado.itemsGuia = estado.itemsGuia.filter(
        (item) => item.id !== id,
    );

    renderizarGuia();
}

function limpiarGuia() {
    const tieneContenido =
        estado.itemsGuia.length > 0
        || elementos.guiaUsuario.value
        || elementos.observaciones.value.trim();

    if (
        tieneContenido
        && !window.confirm(
            "¿Deseas limpiar completamente la guía?",
        )
    ) {
        return;
    }

    estado.itemsGuia = [];

    elementos.guiaUsuario.value = "";
    elementos.guiaProducto.value = "";
    elementos.guiaCantidad.value = "1";
    elementos.observaciones.value = "";

    mostrarUsuarioSeleccionado();
    renderizarGuia();
    establecerInformacionGuia();
}

function imprimirGuia() {
    if (!elementos.guiaUsuario.value) {
        mostrarMensaje(
            "Selecciona un usuario antes de imprimir.",
            "error",
        );
        return;
    }

    if (estado.itemsGuia.length === 0) {
        mostrarMensaje(
            "Agrega al menos un producto antes de imprimir.",
            "error",
        );
        return;
    }

    window.print();
}

function establecerInformacionGuia() {
    const ahora = new Date();

    const numero =
        String(ahora.getTime()).slice(-6);

    elementos.numeroGuia.textContent =
        `N.º ${numero}`;

    elementos.fechaGuia.textContent =
        new Intl.DateTimeFormat("es-CL", {
            dateStyle: "long",
            timeStyle: "short",
        }).format(ahora);
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function mostrarMensaje(texto, tipo) {
    elementos.mensajeGlobal.textContent = texto;
    elementos.mensajeGlobal.hidden = false;
    elementos.mensajeGlobal.className =
        `mensaje mensaje--${tipo}`;

    window.clearTimeout(
        mostrarMensaje.temporizador,
    );

    mostrarMensaje.temporizador = window.setTimeout(
        () => {
            elementos.mensajeGlobal.hidden = true;
        },
        4500,
    );
}

function actualizarEstadoApi(texto, tipo) {
    elementos.estadoApi.textContent = texto;
    elementos.estadoApi.className =
        `estado estado--${tipo}`;
}

function bloquearBoton(
    boton,
    bloqueado,
    texto,
) {
    boton.disabled = bloqueado;
    boton.textContent = texto;
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(Number(valor) || 0);
}

function claseCantidad(cantidad) {
    if (cantidad === 0) {
        return "cantidad cantidad--sin-stock";
    }

    if (cantidad <= 5) {
        return "cantidad cantidad--baja";
    }

    return "cantidad";
}

function escaparHtml(valor) {
    const elemento = document.createElement("div");
    elemento.textContent = String(valor ?? "");

    return elemento.innerHTML;
}