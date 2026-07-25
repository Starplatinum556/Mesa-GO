import { useEffect, useState } from "react";
import {
  Folder,
  CheckCircle2,
  Box,
  Plus,
  Pencil,
  Trash2,
  Soup,
  ChefHat,
  CupSoda,
  CakeSlice,
  Tag,
  BadgePercent,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import CategoriaForm from "../../components/CategoriaForm";
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  eliminarCategoria,
} from "../../services/categoriasService";

// MG-65: cada categoría se pinta con un ícono y color propios según
// palabras clave en el nombre, para que el módulo se sienta vivo en
// vez de una lista genérica. Si el nombre no matchea ninguna palabra
// clave (categorías nuevas y libres que cree el admin), cae en el
// estilo neutro por defecto.
const ESTILOS_CATEGORIA = [
  { match: /entrada/i, icon: Soup, bg: "#FFE8D4", color: "#C2620A" },
  { match: /plato|fuerte/i, icon: ChefHat, bg: "#EDE7FB", color: "#7C4FE0" },
  { match: /bebida/i, icon: CupSoda, bg: "#E0EAFE", color: "#3B6FE0" },
  { match: /postre/i, icon: CakeSlice, bg: "#FCE4EE", color: "#D6437E" },
  { match: /combo/i, icon: Tag, bg: "#FFEAD1", color: "#D97706" },
  { match: /promoc|oferta/i, icon: BadgePercent, bg: "#DFF5E3", color: "#26A65B" },
];
const ESTILO_DEFAULT = { icon: Folder, bg: "#F3F4F6", color: "#6B7280" };

function estiloDeCategoria(nombre = "") {
  return ESTILOS_CATEGORIA.find((e) => e.match.test(nombre)) || ESTILO_DEFAULT;
}

function StatCard({ icon: Icono, numero, texto, variante }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icono stat-card-icono--${variante}`}>
        <Icono size={22} />
      </div>
      <div>
        <p className={`stat-card-numero stat-card-numero--${variante}`}>{numero}</p>
        <p className="stat-card-texto">{texto}</p>
      </div>
    </div>
  );
}

function CategoriaCard({ categoria, onEditar, onEliminar }) {
  const { icon: Icono, bg, color } = estiloDeCategoria(categoria.nombre);

  return (
    <div className="categoria-card">
      <div className="categoria-card-top">
        <div className="categoria-card-icono" style={{ backgroundColor: bg, color }}>
          <Icono size={24} />
        </div>
        <h3>{categoria.nombre}</h3>
        <p className="categoria-card-descripcion">
          {categoria.descripcion || "Sin descripción."}
        </p>
      </div>

      <div className="categoria-card-meta">
        <p className="categoria-card-productos">Productos asociados: {categoria.productos}</p>
        <p className="categoria-card-estado">
          Estado:{" "}
          <span className={`badge-estado ${categoria.estado}`}>
            {categoria.estado === "activa" ? "Activa" : "Inactiva"}
          </span>
        </p>
      </div>

      <div className="categoria-card-acciones">
        <button type="button" className="btn-outline" onClick={() => onEditar(categoria)}>
          <Pencil size={16} />
          Editar
        </button>
        <button
          type="button"
          className="btn-outline btn-outline-danger"
          onClick={() => onEliminar(categoria)}
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </div>
  );
}

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Formulario de crear/editar: mismo patrón que Productos, con
  // Modal + <Entidad>Form. `categoriaEditar` en null significa que
  // el formulario está en modo "crear".
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState(null);

  const cargarCategorias = async () => {
    setCargando(true);
    setError("");
    try {
      const data = await obtenerCategorias();
      setCategorias(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleNueva = () => {
    setCategoriaEditar(null);
    setMostrarFormulario(true);
  };

  const handleEditar = (categoria) => {
    setCategoriaEditar(categoria);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setCategoriaEditar(null);
  };

  const handleGuardar = async (datos) => {
    const { activa, ...datosBasicos } = datos;

    // El backend solo acepta nombre/descripcion en crear y editar; el
    // estado (activa/inactiva) se cambia con su propio endpoint, que
    // simplemente alterna el valor actual. Por eso solo lo llamamos
    // si el checkbox del formulario realmente difiere del estado
    // con el que llegó la categoría (o, si es nueva, del "activa"
    // por defecto que le pone la base de datos).
    const estadoActualEsActiva = categoriaEditar ? categoriaEditar.estado === "activa" : true;
    const debeCambiarEstado = activa !== estadoActualEsActiva;

    try {
      let categoriaGuardada;

      if (categoriaEditar) {
        categoriaGuardada = await actualizarCategoria(categoriaEditar.id, datosBasicos);
      } else {
        categoriaGuardada = await crearCategoria(datosBasicos);
      }

      if (debeCambiarEstado) {
        const { estado } = await cambiarEstadoCategoria(categoriaGuardada.id);
        categoriaGuardada = { ...categoriaGuardada, estado };
      }

      if (categoriaEditar) {
        setCategorias((prev) =>
          prev.map((c) => (c.id === categoriaGuardada.id ? { ...c, ...categoriaGuardada } : c))
        );
        toast.success("Categoría actualizada correctamente");
      } else {
        setCategorias((prev) => [...prev, { ...categoriaGuardada, productos: categoriaGuardada.productos ?? 0 }]);
        toast.success("Categoría creada correctamente");
      }

      cerrarFormulario();
    } catch (err) {
      toast.error(err.message || "No se pudo guardar la categoría");
    }
  };

  const handleEliminar = async (categoria) => {
    const confirmado = window.confirm(
      `¿Eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await eliminarCategoria(categoria.id);
      setCategorias((prev) => prev.filter((c) => c.id !== categoria.id));
    } catch (err) {
      // Este es el caso del criterio de aceptación: el backend
      // rechaza el borrado si la categoría tiene productos asociados.
      alert(err.message);
    }
  };

  const totalCategorias = categorias.length;
  const categoriasActivas = categorias.filter((c) => c.estado === "activa").length;
  const productosClasificados = categorias.reduce((acc, c) => acc + c.productos, 0);

  return (
    <div className="categorias-page">
      <div className="categorias-header">
        <div>
          <h1>Gestión de Categorías</h1>
          <p>Administra las categorías utilizadas para organizar los productos del menú de tu restaurante.</p>
        </div>
        <button type="button" className="btn-nueva-categoria" onClick={handleNueva}>
          <Plus size={18} />
          Nueva categoría
        </button>
      </div>

      {error && <div className="categorias-error">{error}</div>}

      <div className="categorias-stats">
        <StatCard
          icon={Folder}
          numero={totalCategorias}
          texto="Todas las categorías registradas"
          variante="azul"
        />
        <StatCard
          icon={CheckCircle2}
          numero={categoriasActivas}
          texto="Categorías disponibles"
          variante="verde"
        />
        <StatCard
          icon={Box}
          numero={productosClasificados}
          texto="Productos organizados"
          variante="naranja"
        />
      </div>

      {cargando ? (
        <p className="categorias-mensaje">Cargando categorías…</p>
      ) : categorias.length === 0 ? (
        <p className="categorias-mensaje">
          Aún no tienes categorías. Crea la primera con el botón "Nueva categoría".
        </p>
      ) : (
        <div className="categorias-grid">
          {categorias.map((categoria) => (
            <CategoriaCard
              key={categoria.id}
              categoria={categoria}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}

      {mostrarFormulario && (
        <Modal
          titulo={categoriaEditar ? "Editar categoría" : "Nueva categoría"}
          onClose={cerrarFormulario}
        >
          <CategoriaForm
            categoriaEditar={categoriaEditar}
            onGuardar={handleGuardar}
            onCancelar={cerrarFormulario}
          />
        </Modal>
      )}
    </div>
  );
}

export default Categorias;