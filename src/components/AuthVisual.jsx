import { ChefHat, QrCode, ShieldCheck } from "lucide-react";
import "../styles/auth-visual.css";

const BULLETS = [
  { Icon: QrCode, texto: "Menú por QR en cada mesa" },
  { Icon: ChefHat, texto: "Cocina y despacho en tiempo real" },
  { Icon: ShieldCheck, texto: "Un acceso distinto por cada rol" },
];

// Panel de marca que acompaña al formulario en Login/Registro.
// Es puramente decorativo (el foco real es el formulario), por eso
// va con aria-hidden y se oculta en pantallas angostas.
function AuthVisual() {
  return (
    <aside className="auth-visual" aria-hidden="true">
      <div className="auth-visual-fondo">
        <span className="auth-blob auth-blob-azul" />
        <span className="auth-blob auth-blob-verde" />
        <span className="auth-blob auth-blob-morado" />
      </div>

      <div className="auth-visual-contenido">
        <div className="auth-visual-logo">
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

        <p className="auth-visual-tagline">Todo tu restaurante, en un solo panel.</p>
        <p className="auth-visual-sub">
          Mesas, cocina, despacho y tu equipo — organizados desde el primer pedido.
        </p>

        <ul className="auth-visual-bullets">
          {BULLETS.map(({ Icon, texto }) => (
            <li key={texto}>
              <span className="auth-visual-icono">
                <Icon size={16} />
              </span>
              {texto}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default AuthVisual;