import "./index.css";

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

function App() {
  return (
    <main className="pagina">
      <section className="contenedor-app">
        <header className="navbar">
          <LogoMesaGo />

          <nav className="menu-nav">
            <a href="#inicio">Inicio</a>
            <a href="#funciones">Funciones</a>
            <a href="#beneficios">Beneficios</a>
          </nav>

          <div className="acciones-navbar">
            <button className="btn-login">Iniciar sesión</button>
            <button className="btn-registro">Registrarse</button>
          </div>
        </header>

        <section className="banner" id="inicio">
          <div className="banner-icono">
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="32" />
              <path d="M24 49h32" />
              <path d="M28 49c0-12 5-20 12-20s12 8 12 20" />
              <path d="M40 25v-6" />
              <circle cx="40" cy="17" r="3" />
            </svg>
          </div>

          <div>
            <p>Aplicación web para restaurantes</p>
            <h2>Bienvenido a MesaGo</h2>
          </div>

          <div className="banner-frase">
            <p>Escanea, ordena, paga y disfruta desde tu mesa.</p>
          </div>
        </section>

        <section className="inicio-contenido">
          <div className="texto-principal">
            <span className="etiqueta">Sistema digital para pedidos por QR</span>

            <h3>Gestiona pedidos de restaurante de forma rápida y moderna.</h3>

            <p>
              MesaGo permite que los clientes accedan al menú digital mediante
              un código QR, seleccionen productos, confirmen el pedido y ayuden
              al restaurante a organizar mejor la atención, cocina y despacho.
            </p>

            <div className="botones-principales">
              <button className="btn-principal">Iniciar sesión</button>
              <button className="btn-secundario">Crear cuenta</button>
            </div>
          </div>

          <div className="vista-previa" id="funciones">
            <div className="vista-header">
              <div>
                <strong>Vista previa del sistema</strong>
                <p>Flujo principal de MesaGo</p>
              </div>
              <span>QR</span>
            </div>

            <div className="pasos">
              <article>
                <div className="paso-icono azul">1</div>
                <h4>Escanear QR</h4>
                <p>El cliente accede al menú desde su mesa.</p>
              </article>

              <article>
                <div className="paso-icono verde">2</div>
                <h4>Elegir productos</h4>
                <p>Revisa categorías, precios y disponibilidad.</p>
              </article>

              <article>
                <div className="paso-icono morado">3</div>
                <h4>Confirmar pedido</h4>
                <p>El pedido se valida antes de pasar a cocina.</p>
              </article>
            </div>

            <div className="resumen-sistema">
              <div>
                <strong>Pedido organizado</strong>
                <p>Menú digital · Pago · Cocina · Despacho</p>
              </div>
              <button>Ver flujo</button>
            </div>
          </div>
        </section>

        <section className="beneficios" id="beneficios">
          <article>
            <span>▦</span>
            <h4>QR por mesa</h4>
            <p>Cada mesa cuenta con un código único para acceder al menú.</p>
          </article>

          <article>
            <span>☰</span>
            <h4>Menú digital</h4>
            <p>Los clientes revisan productos, precios y disponibilidad.</p>
          </article>

          <article>
            <span>✓</span>
            <h4>Pago anticipado</h4>
            <p>La orden se confirma antes de enviarse a cocina.</p>
          </article>

          <article>
            <span>→</span>
            <h4>Gestión interna</h4>
            <p>El restaurante puede organizar pedidos, cocina y despacho.</p>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;