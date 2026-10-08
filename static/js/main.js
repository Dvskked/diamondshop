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
})();
