import { X } from "lucide-react";

function Modal({ titulo, children, onClose }) {
  return (
    <div className="modal-fondo" onMouseDown={onClose}>
      <section
        className="modal-contenido"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{titulo}</h2>

          <button
            type="button"
            className="modal-cerrar"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

export default Modal;