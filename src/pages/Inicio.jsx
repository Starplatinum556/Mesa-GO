import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ChefHat,
  LayoutGrid,
  QrCode,
  ScanLine,
  ShieldCheck,
  Truck,
} from "lucide-react";

/* ──────────────────────────────
   Hooks propios (sin librerías nuevas: el proyecto no trae
   framer-motion ni gsap, así que esto va con IntersectionObserver
   y requestAnimationFrame nativos)
────────────────────────────── */

// Marca un elemento como "visible" la primera vez que entra en pantalla,
// para poder animarlo con CSS al hacer scroll.
function useRevelado(opciones) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return undefined;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.unobserve(nodo);
        }
      },
      { threshold: 0.2, ...opciones }
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [opciones]);

  return [ref, visible];
}

// Anima un número de 0 al valor final cuando "activar" pasa a true.
function useContador(valorFinal, activar, duracionMs = 900) {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (!activar) return undefined;

    let inicio = null;
    let cuadro;

    const avanzar = (marca) => {
      if (inicio === null) inicio = marca;
      const progreso = Math.min((marca - inicio) / duracionMs, 1);
      setValor(Math.round(progreso * valorFinal));
      if (progreso < 1) cuadro = requestAnimationFrame(avanzar);
    };

    cuadro = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(cuadro);
  }, [activar, valorFinal, duracionMs]);

  return valor;
}

function LogoMesaGo() {
  return (
    <div className="logo-mesago">
      <div className="logo-cuadro">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="44" height="44" rx="14" />
          <path d="M22 38h20" />
          <path d="M24 38c0-8 4-14 8-14s8 6 8 14" />
          <path d="M32 20v-4" />
          <circle cx="32" cy="16" r="2" />
          <path d="M22 44h20" />
        </svg>
      </div>

      <h1>
        Mesa<span>Go</span>
      </h1>
    </div>
  );
}

/* ──────────────────────────────
   Contenido (todo describe funciones reales del sistema —
   nada de datos de clientes inventados)
────────────────────────────── */
const FUNCIONES = [
  {
    Icon: QrCode,
    color: "azul",
    titulo: "Menú por QR",
    texto: "Cada mesa tiene su propio código. El cliente ve el menú actualizado desde su celular, sin apps ni contacto.",
  },
  {
    Icon: LayoutGrid,
    color: "verde",
    titulo: "Mesas y zonas",
    texto: "Organiza tu salón por zonas, controla disponibilidad y genera el QR de cada mesa en segundos.",
  },
  {
    Icon: ChefHat,
    color: "morado",
    titulo: "Panel de cocina",
    texto: "Cada pedido entra con su estado — nuevo, en preparación, listo — y la cocina lo actualiza en tiempo real.",
  },
  {
    Icon: Truck,
    color: "verde",
    titulo: "Seguimiento de entregas",
    texto: "El equipo de despacho ve qué está listo para salir y deja un historial de cada servicio completado.",
  },
  {
    Icon: Building2,
    color: "azul",
    titulo: "Multi-restaurante",
    texto: "Cada cuenta administra su propio menú, mesas y personal — sin mezclarse con ningún otro restaurante.",
  },
  {
    Icon: ShieldCheck,
    color: "morado",
    titulo: "Roles y permisos",
    texto: "Administrador, cocinero y despachador: cada quien entra a lo que le corresponde, nada más.",
  },
];

const PASOS = [
  {
    numero: "01",
    titulo: "El cliente escanea",
    texto: "Cada mesa tiene un QR que abre el menú digital del restaurante, sin descargar nada.",
  },
  {
    numero: "02",
    titulo: "Cocina recibe el pedido",
    texto: "El pedido aparece en el panel de cocina con su estado, listo para prepararse.",
  },
  {
    numero: "03",
    titulo: "El estado se actualiza",
    texto: "Nuevo → en preparación → listo: cada rol ve exactamente en qué va cada pedido.",
  },
  {
    numero: "04",
    titulo: "Despacho lo entrega",
    texto: "El equipo de despacho marca el servicio como completado y queda en el historial.",
  },
];

const ESTADOS_TICKET = [
  { label: "Nuevo", estado: "hecho" },
  { label: "En preparación", estado: "activo" },
  { label: "Listo", estado: "pendiente" },
  { label: "Entregado", estado: "pendiente" },
];

/* ──────────────────────────────
   Comanda — elemento visual central del hero
────────────────────────────── */
function ComandaTicket() {
  return (
    <div className="mgi-ticket-wrap">
      <span className="mgi-chip-flotante">
        <ScanLine size={14} />
        Acceso por QR
      </span>

      <div className="mgi-ticket" aria-hidden="true">
        <div className="mgi-ticket-header">
          <span>COMANDA</span>
          <span>#045</span>
        </div>
        <p className="mgi-ticket-mesa">MESA 12 · TERRAZA</p>

        <div className="mgi-ticket-linea" />

        <ul className="mgi-ticket-items">
          <li>
            <span>2x Ceviche mixto</span>
            <span>$9.00</span>
          </li>
          <li>
            <span>1x Jugo de mora</span>
            <span>$2.50</span>
          </li>
        </ul>

        <div className="mgi-ticket-linea" />

        <div className="mgi-ticket-total">
          <span>TOTAL</span>
          <span>$11.50</span>
        </div>

        <div className="mgi-ticket-linea" />

        <ul className="mgi-ticket-estados">
          {ESTADOS_TICKET.map((item) => (
            <li key={item.label} className={`mgi-estado mgi-estado-${item.estado}`}>
              <span className="mgi-estado-punto" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────
   Fila de estadísticas con contador animado
────────────────────────────── */
function FilaDatos() {
  const [ref, visible] = useRevelado({ threshold: 0.6 });
  const roles = useContador(3, visible);
  const qr = useContador(1, visible);

  return (
    <dl className="mgi-datos" ref={ref}>
      <div>
        <dt>{roles}</dt>
        <dd>roles con panel propio</dd>
      </div>
      <div>
        <dt>{qr}</dt>
        <dd>QR por cada mesa</dd>
      </div>
      <div>
        <dt>∞</dt>
        <dd>restaurantes, cada uno aislado</dd>
      </div>
    </dl>
  );
}

/* ──────────────────────────────
   Tarjeta de función con reveal al hacer scroll
────────────────────────────── */
function TarjetaFuncion({ Icon, titulo, texto, color, indice }) {
  const [ref, visible] = useRevelado();

  return (
    <article
      ref={ref}
      className={`mgi-tarjeta-funcion mgi-revelar ${visible ? "mgi-visible" : ""}`}
      style={{ transitionDelay: `${(indice % 3) * 90}ms` }}
    >
      <span className={`mgi-icono-funcion mgi-icono-${color}`}>
        <Icon size={21} />
      </span>
      <h4>{titulo}</h4>
      <p>{texto}</p>
    </article>
  );
}

function PasoItem({ paso, indice }) {
  const [ref, visible] = useRevelado();

  return (
    <li
      ref={ref}
      className={`mgi-paso mgi-revelar ${visible ? "mgi-visible" : ""}`}
      style={{ transitionDelay: `${indice * 90}ms` }}
    >
      <span className="mgi-paso-numero">{paso.numero}</span>
      <div>
        <h4>{paso.titulo}</h4>
        <p>{paso.texto}</p>
      </div>
    </li>
  );
}

function Inicio() {
  const [refCta, ctaVisible] = useRevelado({ threshold: 0.4 });

  return (
    <main className="pagina">
      <div className="contenedor-app">
        <header className="mgi-nav">
          <div className="mgi-inner mgi-nav-inner">
            <LogoMesaGo />

            <nav className="mgi-nav-links">
              <a href="#funciones">Funciones</a>
              <a href="#como-funciona">Cómo funciona</a>
            </nav>

            <div className="mgi-nav-acciones">
              <Link to="/login" className="mgi-btn-fantasma">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="mgi-btn-solido">
                Registrarse
              </Link>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="mgi-hero">
          <div className="mgi-hero-fondo" aria-hidden="true">
            <span className="mgi-blob mgi-blob-azul" />
            <span className="mgi-blob mgi-blob-verde" />
            <span className="mgi-blob mgi-blob-morado" />
          </div>

          <div className="mgi-inner mgi-hero-grid">
            <div className="mgi-hero-texto">
              <span className="mgi-eyebrow mgi-entrada" style={{ animationDelay: "0ms" }}>
                Gestión de restaurantes · Multi-sucursal
              </span>

              <h2 className="mgi-hero-titulo mgi-entrada" style={{ animationDelay: "90ms" }}>
                De la mesa a la cocina,
                <br />
                sin una comanda perdida.
              </h2>

              <p className="mgi-hero-sub mgi-entrada" style={{ animationDelay: "180ms" }}>
                MesaGo organiza el menú, las mesas, la cocina y el despacho de tu
                restaurante en un solo lugar — con acceso por roles y un panel
                propio para cada sucursal.
              </p>

              <div className="mgi-hero-cta mgi-entrada" style={{ animationDelay: "270ms" }}>
                <Link to="/registro" className="mgi-btn-solido mgi-btn-grande">
                  Registra tu restaurante
                  <ArrowRight size={17} />
                </Link>
                <a href="#como-funciona" className="mgi-btn-fantasma mgi-btn-grande">
                  Ver cómo funciona
                </a>
              </div>

              <div className="mgi-entrada" style={{ animationDelay: "360ms" }}>
                <FilaDatos />
              </div>
            </div>

            <div className="mgi-hero-visual mgi-entrada" style={{ animationDelay: "220ms" }}>
              <ComandaTicket />
            </div>
          </div>
        </section>

        {/* FUNCIONES */}
        <section className="mgi-seccion" id="funciones">
          <div className="mgi-inner">
            <div className="mgi-seccion-titulo">
              <span className="mgi-eyebrow">Funciones</span>
              <h3>Todo lo que hoy se organiza a mano, en un solo sistema.</h3>
            </div>

            <div className="mgi-grid-funciones">
              {FUNCIONES.map((funcion, indice) => (
                <TarjetaFuncion key={funcion.titulo} indice={indice} {...funcion} />
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="mgi-seccion mgi-seccion-pasos" id="como-funciona">
          <div className="mgi-inner">
            <div className="mgi-seccion-titulo">
              <span className="mgi-eyebrow">Cómo funciona</span>
              <h3>El mismo recorrido que ya sigue cada pedido, ahora sin perderse.</h3>
            </div>

            <ol className="mgi-lista-pasos">
              {PASOS.map((paso, indice) => (
                <PasoItem key={paso.numero} paso={paso} indice={indice} />
              ))}
            </ol>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mgi-seccion">
          <div className="mgi-inner">
            <div
              ref={refCta}
              className={`mgi-cta-final mgi-revelar ${ctaVisible ? "mgi-visible" : ""}`}
            >
              <div>
                <h3>¿Listo para ordenar tu restaurante?</h3>
                <p>Crea tu cuenta y arma tu menú, tus mesas y tu equipo en minutos.</p>
              </div>
              <Link to="/registro" className="mgi-btn-solido mgi-btn-grande">
                Crear cuenta
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="mgi-footer">
          <div className="mgi-inner mgi-footer-inner">
            <LogoMesaGo />
            <p>© {new Date().getFullYear()} MesaGo. Hecho en Ecuador.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default Inicio;