/* =========================================================
   DIAMOND SHOP - main.js
   Preloader, scroll, menu, reveal, filtros, FAQ, canvas.
   Vanilla JS, sin dependencias.
   ========================================================= */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- PRELOADER ---------- */
  var pre = $("#preloader");
  var oculto = false;
  function ocultarPreloader() {
    if (oculto || !pre) return;
    oculto = true;
    pre.classList.add("oculto");
    document.body.classList.remove("carga-activa");
    setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 700);
  }
  window.addEventListener("load", function () { setTimeout(ocultarPreloader, 450); });
  setTimeout(ocultarPreloader, 4000); /* seguridad */

  /* ---------- HEADER / PROGRESO / ARRIBA ---------- */
  var topbar = $("#topbar");
  var barra = $("#progress") ? $("#progress i") : null;
  var btnTop = $("#btnTop");
  var ticking = false;

  function alScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (topbar) topbar.classList.toggle("scroll", y > 24);
    if (btnTop) btnTop.classList.toggle("is-on", y > 620);
    if (barra) {
      var alto = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.width = (alto > 0 ? Math.min(100, (y / alto) * 100) : 0) + "%";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(alScroll); }
  }, { passive: true });
  alScroll();

  if (btnTop) {
    btnTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- MENU MOVIL ---------- */
  var burger = $("#burger");
  var nav = $("#nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var abierto = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- REVEAL AL HACER SCROLL ---------- */
  var reveal = $$("[data-reveal]");
  if (!("IntersectionObserver" in window) || reduce) {
    reveal.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -55px 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  }

  /* ---------- LINK ACTIVO EN EL NAV ---------- */
  var enlaces = $$(".nav a");
  var secciones = enlaces
    .map(function (a) { var id = a.getAttribute("href"); return id && id.charAt(0) === "#" ? $(id) : null; })
    .filter(Boolean);

  if ("IntersectionObserver" in window && secciones.length) {
    var ioSec = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        enlaces.forEach(function (a) {
          a.classList.toggle("activo", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secciones.forEach(function (s) { ioSec.observe(s); });
  }

  /* ---------- FILTROS DE PRODUCTOS ---------- */
  var chips = $$("#filtros .chip");
  var productos = $$("#grid .product");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("is-on"); });
      chip.classList.add("is-on");
      var f = chip.getAttribute("data-filter");
      productos.forEach(function (p) {
        var coincide = f === "todos" || p.getAttribute("data-cat") === f;
        if (p._t) clearTimeout(p._t);
        if (coincide) {
          p.classList.remove("is-hidden");
          requestAnimationFrame(function () { p.classList.remove("is-out"); });
        } else {
          p.classList.add("is-out");
          p._t = setTimeout(function () { p.classList.add("is-hidden"); }, 260);
        }
      });
    });
  });

  /* ---------- FAQ (solo una abierta) ---------- */
  var faqItems = $$(".faq-item");
  faqItems.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      faqItems.forEach(function (otro) { if (otro !== d) otro.open = false; });
    });
  });

  /* ---------- TILT EN TARJETAS (escritorio) ---------- */
  if (fino && !reduce) {
    $$(".product, .ventaja, .paso").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "translateY(-7px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 5).toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- CANVAS DEL HERO: diamantes flotantes ---------- */
  var canvas = $("#heroCanvas");
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (canvas && ctx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, piezas = [], activo = true, raf = null;

    function medir() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function crear(n) {
      piezas = [];
      for (var i = 0; i < n; i++) {
        piezas.push({
          x: Math.random() * w,
          y: Math.random() * h,
          s: 1.6 + Math.random() * 5.4,
          v: 0.14 + Math.random() * 0.5,
          a: Math.random() * Math.PI,
          va: (Math.random() - 0.5) * 0.02,
          o: 0.16 + Math.random() * 0.55,
          d: Math.random() > 0.68
        });
      }
    }

    function diamante(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.globalAlpha = p.o;
      ctx.fillStyle = p.d ? "#FFE49B" : "#F5C546";
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.lineTo(p.s * 0.72, 0);
      ctx.lineTo(0, p.s);
      ctx.lineTo(-p.s * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function pintar() {
      if (!activo) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < piezas.length; i++) {
        var p = piezas[i];
        p.y -= p.v;
        p.a += p.va;
        if (p.y < -14) { p.y = h + 14; p.x = Math.random() * w; }
        diamante(p);
      }
      raf = window.requestAnimationFrame(pintar);
    }

    function reiniciar() { medir(); crear(Math.max(26, Math.round(w / 26))); }

    reiniciar();
    window.addEventListener("resize", function () {
      clearTimeout(window._rz);
      window._rz = setTimeout(reiniciar, 180);
    });

    if (reduce) {
      activo = false;
      ctx.clearRect(0, 0, w, h);
      for (var j = 0; j < piezas.length; j++) diamante(piezas[j]);
    } else {
      pintar();
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { activo = false; if (raf) cancelAnimationFrame(raf); }
        else if (!activo) { activo = true; pintar(); }
      });
    }
  }

  /* ---------- CARRITO DE COMPRAS ---------- */
  var DISCORD_URL = "https://discord.gg/yzvatpkUu";
  var CLAVE_CARRITO = "diamondshop_carrito_v1";
  var carrito = [];

  try {
    var guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    if (Object.prototype.toString.call(guardado) === "[object Array]") carrito = guardado;
  } catch (e) { carrito = []; }

  var cartBtn = $("#cartBtn");
  var cartCount = $("#cartCount");
  var cartDrawer = $("#cartDrawer");
  var cartOverlay = $("#cartOverlay");
  var cartLista = $("#cartLista");
  var cartVacio = $("#cartVacio");
  var cartResumen = $("#cartResumen");
  var cartCerrar = $("#cartCerrar");
  var cartVer = $("#cartVer");
  var cartVaciar = $("#cartVaciar");
  var toast = $("#toast");
  var facturaModal = $("#facturaModal");

  function dosDig(n) { return (n < 10 ? "0" : "") + n; }

  function guardarCarrito() {
    try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch (e) {}
  }

  function totalUnidades() {
    return carrito.reduce(function (a, it) { return a + it.cantidad; }, 0);
  }

  function mostrarToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    if (toast._t) clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove("is-on"); }, 2300);
  }

  function renderCarrito() {
    var unidades = totalUnidades();
    if (cartCount) {
      cartCount.textContent = unidades;
      cartCount.classList.toggle("is-on", unidades > 0);
    }
    if (cartResumen) {
      cartResumen.textContent = unidades === 1 ? "1 producto" : unidades + " productos";
    }
    if (cartVer) cartVer.disabled = carrito.length === 0;

    if (!cartLista) return;
    cartLista.innerHTML = "";
    if (cartVacio) cartVacio.style.display = carrito.length ? "none" : "";
    cartLista.style.display = carrito.length ? "" : "none";

    carrito.forEach(function (it, idx) {
      var li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML =
        '<div class="ci-info"><strong>' + it.nombre + '</strong><small>' + (it.rango ? it.rango + ' aprox.' : 'precio aproximado') + '</small></div>' +
        '<div class="ci-ctrl">' +
          '<div class="qty qty-sm">' +
            '<button type="button" class="qty-btn" data-accion="menos" data-idx="' + idx + '" aria-label="Quitar una unidad">-</button>' +
            '<input class="qty-input" type="number" min="1" max="99" value="' + it.cantidad + '" data-idx="' + idx + '" aria-label="Cantidad de ' + it.nombre + '">' +
            '<button type="button" class="qty-btn" data-accion="mas" data-idx="' + idx + '" aria-label="Agregar una unidad">+</button>' +
          '</div>' +
          '<button type="button" class="ci-del" data-accion="borrar" data-idx="' + idx + '" aria-label="Quitar del carrito">&times;</button>' +
        '</div>';
      cartLista.appendChild(li);
    });

    guardarCarrito();
  }

  function agregarAlCarrito(id, nombre, precio, rango, cantidad) {
    var encontrado = null;
    for (var i = 0; i < carrito.length; i++) {
      if (carrito[i].id === id) { encontrado = carrito[i]; break; }
    }
    if (encontrado) {
      encontrado.cantidad = Math.min(99, encontrado.cantidad + cantidad);
      if (rango) encontrado.rango = rango;
    } else {
      carrito.push({ id: id, nombre: nombre, precio: precio, rango: rango, cantidad: cantidad });
    }
    renderCarrito();
    mostrarToast(nombre + " agregado al carrito");
  }

  /* Cantidad y "Agregar" en cada tarjeta de producto */
  $$(".product").forEach(function (card) {
    var input = $(".qty-input", card);
    $$(".qty-btn", card).forEach(function (boton) {
      boton.addEventListener("click", function () {
        if (!input) return;
        var valor = parseInt(input.value, 10) || 1;
        valor += parseInt(boton.getAttribute("data-step"), 10);
        if (valor < 1) valor = 1;
        if (valor > 99) valor = 99;
        input.value = valor;
      });
    });
    var botonAgregar = $(".add-cart", card);
    if (botonAgregar) {
      botonAgregar.addEventListener("click", function () {
        var id = card.getAttribute("data-id");
        var nombre = card.getAttribute("data-name");
        var precio = parseFloat(card.getAttribute("data-price"));
        var rango = card.getAttribute("data-range") || "";
        var cantidad = input ? parseInt(input.value, 10) : 1;
        if (isNaN(cantidad) || cantidad < 1) cantidad = 1;
        if (cantidad > 99) cantidad = 99;
        agregarAlCarrito(id, nombre, precio, rango, cantidad);
        if (input) input.value = 1;
      });
    }
  });

  /* Abrir / cerrar el panel del carrito */
  function abrirCarrito() {
    if (!cartDrawer) return;
    renderCarrito();
    cartDrawer.classList.add("is-open");
    if (cartOverlay) cartOverlay.classList.add("is-on");
    document.body.classList.add("carrito-abierto");
  }
  function cerrarCarrito() {
    if (cartDrawer) cartDrawer.classList.remove("is-open");
    if (cartOverlay) cartOverlay.classList.remove("is-on");
    document.body.classList.remove("carrito-abierto");
  }
  if (cartBtn) cartBtn.addEventListener("click", abrirCarrito);
  if (cartCerrar) cartCerrar.addEventListener("click", cerrarCarrito);
  if (cartOverlay) cartOverlay.addEventListener("click", cerrarCarrito);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") cerrarCarrito();
  });

  /* Cambiar cantidad o quitar productos dentro del carrito */
  if (cartLista) {
    cartLista.addEventListener("click", function (e) {
      var boton = e.target && e.target.closest ? e.target.closest("button") : null;
      if (!boton) return;
      var accion = boton.getAttribute("data-accion");
      var idx = parseInt(boton.getAttribute("data-idx"), 10);
      if (isNaN(idx) || !carrito[idx]) return;
      if (accion === "mas") {
        carrito[idx].cantidad = Math.min(99, carrito[idx].cantidad + 1);
      } else if (accion === "menos") {
        carrito[idx].cantidad -= 1;
        if (carrito[idx].cantidad < 1) carrito.splice(idx, 1);
      } else if (accion === "borrar") {
        carrito.splice(idx, 1);
      }
      renderCarrito();
    });
    cartLista.addEventListener("change", function (e) {
      if (!e.target.classList || !e.target.classList.contains("qty-input")) return;
      var idx = parseInt(e.target.getAttribute("data-idx"), 10);
      var valor = parseInt(e.target.value, 10);
      if (isNaN(valor) || valor < 1) valor = 1;
      if (valor > 99) valor = 99;
      if (carrito[idx]) { carrito[idx].cantidad = valor; renderCarrito(); }
    });
  }

  if (cartVaciar) {
    cartVaciar.addEventListener("click", function () {
      if (!carrito.length) return;
      carrito = [];
      renderCarrito();
      mostrarToast("Carrito vaciado");
    });
  }

  /* Construye la factura en texto plano */
  function textoFactura() {
    var ahora = new Date();
    var folio = ahora.getFullYear() + dosDig(ahora.getMonth() + 1) + dosDig(ahora.getDate()) + "-" + String(ahora.getTime()).slice(-5);
    var l = [];
    l.push("============================================");
    l.push("               DIAMOND SHOP");
    l.push("            FACTURA DE COMPRA");
    l.push("============================================");
    l.push("Fecha: " + ahora.toLocaleString("es-ES"));
    l.push("Pedido #: " + folio);
    l.push("");
    l.push("DETALLE DEL PEDIDO");
    l.push("--------------------------------------------");
    l.push("Cant  Producto                  Precio");
    l.push("--------------------------------------------");
    carrito.forEach(function (it) {
      var cant = String(it.cantidad);
      var nombre = it.nombre.length > 22 ? it.nombre.slice(0, 21) + "." : it.nombre;
      var relleno = "";
      for (var i = nombre.length; i < 24; i++) relleno += " ";
      var precioTxt = it.precio === 15 && it.nombre.toLowerCase().indexOf('bot') >= 0 ? "$15" : (it.precio === 30 && it.nombre.toLowerCase().indexOf('pagina') >= 0 ? "$30" : "Ajustado a presupuesto");
      l.push(cant + "     " + nombre + relleno + precioTxt);
    });
    l.push("--------------------------------------------");
    l.push("Productos permanentes. El precio se ajusta a tu presupuesto.");
    l.push("El precio final se confirma en tu ticket de Discord.");
    l.push("============================================");
    l.push("");
    l.push("COMO COMPLETAR TU COMPRA");
    l.push("1) Entra a nuestro Discord: " + DISCORD_URL);
    l.push("2) Abre un ticket.");
    l.push("3) Envia ESTE archivo .txt para ver tu compra.");
    l.push("4) Coordina el pago y recibe tu entrega.");
    l.push("");
    l.push("Gracias por comprar en DIAMOND SHOP.");
    return l.join("\r\n");
  }

  function abrirModalFactura() {
    if (!facturaModal) return;
    facturaModal.classList.add("is-open");
    facturaModal.setAttribute("aria-hidden", "false");
  }
  function cerrarModalFactura() {
    if (!facturaModal) return;
    facturaModal.classList.remove("is-open");
    facturaModal.setAttribute("aria-hidden", "true");
  }

  function descargarFactura() {
    if (!carrito.length) return;
    var ahora = new Date();
    var fecha = ahora.getFullYear() + "-" + dosDig(ahora.getMonth() + 1) + "-" + dosDig(ahora.getDate());
    var blob = new Blob(["\ufeff" + textoFactura()], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "DIAMOND-SHOP-Factura-" + fecha + ".txt";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    abrirModalFactura();
  }

  if (cartVer) cartVer.addEventListener("click", descargarFactura);
  if (facturaModal) {
    $$("[data-cerrar-modal]", facturaModal).forEach(function (el) {
      el.addEventListener("click", cerrarModalFactura);
    });
  }

  renderCarrito();
})();