import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const valoresIniciales = {
  nombre: "",
  correo: "",
  password: "",
  rol: "COCINERO",
};

function PersonalForm({ empleadoEditar, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (empleadoEditar) {
      setFormulario({
        nombre: empleadoEditar.nombre || "",
        correo: empleadoEditar.correo || "",
        password: "",
        rol: empleadoEditar.rol || "COCINERO",
      });
    } else {
      setFormulario(valoresIniciales);
    }
  }, [empleadoEditar]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!formulario.nombre.trim() || !formulario.correo.trim()) {
      toast.error("Nombre y correo son requeridos.");
      return;
    }

    if (!empleadoEditar && !formulario.password) {
      toast.error("La contraseña es requerida para nuevos empleados.");
      return;
    }

    if (!empleadoEditar && formulario.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      correo: formulario.correo.trim(),
      rol: formulario.rol,
    };

    // Solo enviar password si es nuevo o si se ingresó una nueva
    if (!empleadoEditar || formulario.password) {
      datos.password = formulario.password;
    }

    try {
      setGuardando(true);
      await onGuardar(datos);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="formulario-modal" onSubmit={manejarEnvio}>
      <label>
        Nombre completo
        <input
          type="text"
          name="nombre"
          placeholder="Nombre del empleado"
          value={formulario.nombre}
          onChange={manejarCambio}
        />
      </label>

      <label>
        Correo electrónico
        <input
          type="email"
          name="correo"
          placeholder="correo@ejemplo.com"
          value={formulario.correo}
          onChange={manejarCambio}
        />
      </label>

      <label>
        Rol
        <select name="rol" value={formulario.rol} onChange={manejarCambio}>
          <option value="COCINERO">Cocinero</option>
          <option value="DESPACHADOR">Despachador</option>
        </select>
      </label>

      <label>
        {empleadoEditar ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
        <input
          type="password"
          name="password"
          placeholder={empleadoEditar ? "Nueva contraseña (opcional)" : "Mínimo 6 caracteres"}
          value={formulario.password}
          onChange={manejarCambio}
        />
      </label>

      <div className="acciones-formulario">
        <button type="button" className="btn-cancelar" onClick={onCancelar}>
          Cancelar
        </button>

        <button
          type="submit"
          className="btn-accion-principal"
          disabled={guardando}
        >
          {guardando
            ? "Guardando..."
            : empleadoEditar
            ? "Guardar cambios"
            : "Agregar empleado"}
        </button>
      </div>
    </form>
  );
}

export default PersonalForm;