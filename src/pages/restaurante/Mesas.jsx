import { Plus, QrCode, Table2, Users } from "lucide-react";

const mesas = [
  { numero: "Mesa 01", zona: "Salón VIP", capacidad: 4, estado: "Disponible", color: "disponible" },
  { numero: "Mesa 02", zona: "Salón Principal", capacidad: 2, estado: "Ocupada", color: "ocupada" },
  { numero: "Mesa 03", zona: "Salón Principal", capacidad: 4, estado: "Reservada", color: "reservada" },
  { numero: "Mesa 04", zona: "Terraza", capacidad: 6, estado: "Disponible", color: "disponible" },
  { numero: "Mesa 05", zona: "Terraza", capacidad: 4, estado: "Ocupada", color: "ocupada" },
  { numero: "Mesa 06", zona: "Salón Familiar", capacidad: 8, estado: "Disponible", color: "disponible" },
];

function Mesas() {
  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Gestión de Mesas</h1>
          <p>Administra mesas, códigos QR, capacidad y disponibilidad del local.</p>
        </div>

        <button className="btn-accion-principal btn-header">
          <Plus size={18} />
          Agregar mesa
        </button>
      </div>

      <section className="metricas-grid tres-columnas">
        <article className="metrica-card">
          <div className="metrica-icon azul">
            <Table2 size={28} />
          </div>
          <div>
            <p>Total de mesas</p>
            <h2>6</h2>
            <span>Registradas en el local</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon verde">
            <Users size={28} />
          </div>
          <div>
            <p>Disponibles</p>
            <h2>3</h2>
            <span>Listas para uso</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon naranja">
            <QrCode size={28} />
          </div>
          <div>
            <p>QR activos</p>
            <h2>6</h2>
            <span>Códigos generados</span>
          </div>
        </article>
      </section>

      <section className="grid-mesas">
        {mesas.map((mesa) => (
          <article className="mesa-card" key={mesa.numero}>
            <div className="mesa-card-header">
              <div className={`mesa-card-icon ${mesa.color}`}>
                <Table2 size={24} />
              </div>

              <span className={`badge ${mesa.color}`}>{mesa.estado}</span>
            </div>

            <h3>{mesa.numero}</h3>
            <p>{mesa.zona}</p>

            <div className="mesa-detalles">
              <span>
                <Users size={16} />
                Capacidad: {mesa.capacidad}
              </span>

              <span>
                <QrCode size={16} />
                QR asignado
              </span>
            </div>

            <div className="acciones-mesa">
              <button className="btn-ver">Ver QR</button>
              <button className="btn-ok">Editar</button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

export default Mesas;