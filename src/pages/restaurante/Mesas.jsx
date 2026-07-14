import { useEffect, useState } from "react";
import { Plus, QrCode, Table2, Users } from "lucide-react";
import { apiFetch } from "../../api";

function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/mesas")
      .then((res) => res.json())
      .then((datos) => {
        setMesas(datos);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudo conectar con el servidor (localhost:4000).");
        setCargando(false);
      });
  }, []);

  const totalMesas = mesas.length;
  const disponibles = mesas.filter((m) => m.disponible).length;

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

      {error && <p style={{ color: "red" }}>{error}</p>}
      {cargando && <p>Cargando mesas...</p>}

      {!cargando && !error && (
        <>
          <section className="metricas-grid tres-columnas">
            <article className="metrica-card">
              <div className="metrica-icon azul">
                <Table2 size={28} />
              </div>
              <div>
                <p>Total de mesas</p>
                <h2>{totalMesas}</h2>
                <span>Registradas en el local</span>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon verde">
                <Users size={28} />
              </div>
              <div>
                <p>Disponibles</p>
                <h2>{disponibles}</h2>
                <span>Listas para uso</span>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon naranja">
                <QrCode size={28} />
              </div>
              <div>
                <p>QR activos</p>
                <h2>{totalMesas}</h2>
                <span>Códigos generados</span>
              </div>
            </article>
          </section>

          <section className="grid-mesas">
            {mesas.map((mesa) => {
              const color = mesa.disponible ? "disponible" : "ocupada";
              const estado = mesa.disponible ? "Disponible" : "Ocupada";

              return (
                <article className="mesa-card" key={mesa.id}>
                  <div className="mesa-card-header">
                    <div className={`mesa-card-icon ${color}`}>
                      <Table2 size={24} />
                    </div>

                    <span className={`badge ${color}`}>{estado}</span>
                  </div>

                  <h3>Mesa {mesa.numero}</h3>
                  <p>Código QR: {mesa.qr_codigo}</p>

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
              );
            })}
          </section>
        </>
      )}
    </section>
  );
}

export default Mesas;