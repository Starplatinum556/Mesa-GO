import { ChevronLeft, ChevronRight } from "lucide-react";

// Genera los números de página a mostrar, con "..." cuando hay muchas.
function generarPaginas(paginaActual, totalPaginas) {
  const paginas = [];
  const rango = 1;

  for (let i = 1; i <= totalPaginas; i++) {
    const esBorde = i === 1 || i === totalPaginas;
    const esCercana = Math.abs(i - paginaActual) <= rango;

    if (esBorde || esCercana) {
      paginas.push(i);
    } else if (paginas[paginas.length - 1] !== "...") {
      paginas.push("...");
    }
  }

  return paginas;
}

// Paginación estilo "< 1 2 3 ... 8 >". Si solo hay 1 página, no se
// muestra nada (no tiene sentido paginar una sola página de datos).
function Paginacion({ paginaActual, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null;

  const paginas = generarPaginas(paginaActual, totalPaginas);

  return (
    <nav className="paginacion" aria-label="Paginación">
      <button
        type="button"
        className="paginacion-flecha"
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {paginas.map((pagina, indice) =>
        pagina === "..." ? (
          <span className="paginacion-puntos" key={`puntos-${indice}`}>
            ...
          </span>
        ) : (
          <button
            type="button"
            key={pagina}
            className={pagina === paginaActual ? "paginacion-numero activo" : "paginacion-numero"}
            onClick={() => onCambiarPagina(pagina)}
          >
            {pagina}
          </button>
        )
      )}

      <button
        type="button"
        className="paginacion-flecha"
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        aria-label="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export default Paginacion;