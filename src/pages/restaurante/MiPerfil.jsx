import { UserCircle2 } from "lucide-react";

// Placeholder: esta sección se implementará en otra historia de
// usuario. Por ahora solo confirma que el enlace del sidebar funciona.
function MiPerfil() {
  return (
    <section className="modulo-admin">
      <div className="recepcion-header">
        <h1>Mi Perfil</h1>
        <p>Esta sección estará disponible próximamente.</p>
      </div>

      <div className="placeholder-seccion">
        <UserCircle2 size={40} />
        <p>La gestión de perfil se implementará en una historia de usuario futura.</p>
      </div>
    </section>
  );
}

export default MiPerfil;