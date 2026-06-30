import { Building2, Clock, Mail, Phone, Save } from "lucide-react";

function Configuracion() {
  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Configuración del Restaurante</h1>
          <p>Datos generales del local, horarios y preferencias básicas del sistema.</p>
        </div>

        <button className="btn-accion-principal btn-header">
          <Save size={18} />
          Guardar cambios
        </button>
      </div>

      <section className="config-grid">
        <article className="config-card">
          <div className="config-card-header">
            <Building2 size={24} />
            <div>
              <h3>Datos del restaurante</h3>
              <p>Información principal visible para el administrador.</p>
            </div>
          </div>

          <form className="config-form">
            <label>
              Nombre del restaurante
              <input type="text" defaultValue="Local MesaGo" />
            </label>

            <label>
              Sucursal
              <input type="text" defaultValue="Sucursal Centro" />
            </label>

            <label>
              Dirección
              <input type="text" defaultValue="Latacunga, Cotopaxi" />
            </label>
          </form>
        </article>

        <article className="config-card">
          <div className="config-card-header">
            <Clock size={24} />
            <div>
              <h3>Horario de atención</h3>
              <p>Horario operativo del restaurante.</p>
            </div>
          </div>

          <form className="config-form">
            <label>
              Hora de apertura
              <input type="time" defaultValue="08:00" />
            </label>

            <label>
              Hora de cierre
              <input type="time" defaultValue="22:00" />
            </label>

            <label>
              Estado del local
              <select defaultValue="Abierto">
                <option>Abierto</option>
                <option>Cerrado</option>
                <option>En mantenimiento</option>
              </select>
            </label>
          </form>
        </article>

        <article className="config-card">
          <div className="config-card-header">
            <Mail size={24} />
            <div>
              <h3>Contacto</h3>
              <p>Datos de comunicación del restaurante.</p>
            </div>
          </div>

          <form className="config-form">
            <label>
              Correo electrónico
              <input type="email" defaultValue="admin@mesago.com" />
            </label>

            <label>
              Teléfono
              <input type="text" defaultValue="0999999999" />
            </label>

            <label>
              Responsable
              <input type="text" defaultValue="Administrador" />
            </label>
          </form>
        </article>

        <article className="config-card estado-sistema-card">
          <div className="config-card-header">
            <Phone size={24} />
            <div>
              <h3>Estado del sistema</h3>
              <p>Configuración general para operación interna.</p>
            </div>
          </div>

          <div className="estado-sistema">
            <span className="estado-pill nuevo">Conectado</span>
            <p>El panel se encuentra preparado para futura conexión con backend y base de datos.</p>
          </div>
        </article>
      </section>
    </section>
  );
}

export default Configuracion;