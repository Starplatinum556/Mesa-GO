import { useEffect, useState } from "react";
import { Building2, Clock, Mail, Phone, Save } from "lucide-react";
import toast from "react-hot-toast";
import { actualizarRestaurante, obtenerRestaurante } from "../../services/restauranteService";

const VALORES_INICIALES = {
  nombre: "",
  sucursal: "",
  direccion: "",
  correo: "",
  telefono: "",
  responsable: "",
  hora_apertura: "",
  hora_cierre: "",
  estado: "Abierto",
};

// El input type="time" necesita "HH:MM"; Postgres puede devolver "HH:MM:SS".
function aFormatoHora(valor) {
  return valor ? valor.slice(0, 5) : "";
}

// MG-47: ficha real del restaurante del admin autenticado (tabla
// restaurantes), reemplaza el formulario que antes tenía todo
// hardcodeado con defaultValue y no guardaba nada.
function Configuracion() {
  const [datos, setDatos] = useState(VALORES_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const restaurante = await obtenerRestaurante();
        setDatos({
          nombre: restaurante.nombre || "",
          sucursal: restaurante.sucursal || "",
          direccion: restaurante.direccion || "",
          correo: restaurante.correo || "",
          telefono: restaurante.telefono || "",
          responsable: restaurante.responsable || "",
          hora_apertura: aFormatoHora(restaurante.hora_apertura),
          hora_cierre: aFormatoHora(restaurante.hora_cierre),
          estado: restaurante.estado || "Abierto",
        });
      } catch (err) {
        setError(err.message || "No se pudo cargar la información del restaurante.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const actualizarCampo = (campo) => (evento) => {
    setDatos((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await actualizarRestaurante(datos);
      toast.success("Los datos del restaurante se guardaron correctamente");
    } catch (err) {
      toast.error(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <p className="estado-carga">Cargando configuración...</p>;
  }

  if (error) {
    return <p className="estado-error">{error}</p>;
  }

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Configuración del Restaurante</h1>
          <p>Datos generales del local, horarios y preferencias básicas del sistema.</p>
        </div>

        <button
          className="btn-accion-principal btn-header"
          onClick={guardarCambios}
          disabled={guardando}
        >
          <Save size={18} />
          {guardando ? "Guardando..." : "Guardar cambios"}
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

          <form className="config-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              Nombre del restaurante
              <input
                type="text"
                value={datos.nombre}
                onChange={actualizarCampo("nombre")}
              />
            </label>

            <label>
              Sucursal
              <input
                type="text"
                value={datos.sucursal}
                onChange={actualizarCampo("sucursal")}
              />
            </label>

            <label>
              Dirección
              <input
                type="text"
                value={datos.direccion}
                onChange={actualizarCampo("direccion")}
              />
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

          <form className="config-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              Hora de apertura
              <input
                type="time"
                value={datos.hora_apertura}
                onChange={actualizarCampo("hora_apertura")}
              />
            </label>

            <label>
              Hora de cierre
              <input
                type="time"
                value={datos.hora_cierre}
                onChange={actualizarCampo("hora_cierre")}
              />
            </label>

            <label>
              Estado del local
              <select value={datos.estado} onChange={actualizarCampo("estado")}>
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

          <form className="config-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              Correo electrónico
              <input
                type="email"
                value={datos.correo}
                onChange={actualizarCampo("correo")}
              />
            </label>

            <label>
              Teléfono
              <input
                type="text"
                value={datos.telefono}
                onChange={actualizarCampo("telefono")}
              />
            </label>

            <label>
              Responsable
              <input
                type="text"
                value={datos.responsable}
                onChange={actualizarCampo("responsable")}
              />
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
            <p>Los datos de esta página ya se leen y se guardan en la base de datos.</p>
          </div>
        </article>
      </section>
    </section>
  );
}

export default Configuracion;