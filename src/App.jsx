import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";

import RestauranteLayout from "./pages/restaurante/RestauranteLayout";
import Cocina from "./pages/restaurante/Cocina";
import Entregas from "./pages/restaurante/Entregas";
import Mesas from "./pages/restaurante/Mesas";
import Productos from "./pages/restaurante/Productos";
import Reportes from "./pages/restaurante/Reportes";
import Configuracion from "./pages/restaurante/Configuracion";
import { Toaster } from "react-hot-toast";
import MenuDigital from "./pages/MenuDigital";
import RutaProtegida, { obtenerUsuarioSesion, rutaInicioPorRol } from "./components/RutaProtegida";
import "./index.css";

// MG-59: la raíz de /restaurante ya no tiene una pantalla propia
// (Recepción salió del menú de todos los roles); redirige a cada
// usuario a la sección que sí le corresponde.
function InicioRestaurante() {
  const usuario = obtenerUsuarioSesion();
  return <Navigate to={rutaInicioPorRol(usuario?.rol)} replace />;
}

function App() {
  return (
    <BrowserRouter>
    <Toaster
  position="top-right"
  toastOptions={{
    duration: 3000,
    style: {
      borderRadius: "14px",
      fontWeight: "700",
    },
  }}
/>
      <Routes>
        {/* Pantallas públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/menu/:codigoQr" element={<MenuDigital />} />

        {/* Panel interno del restaurante — MG-59: cada ruta valida el rol */}
        <Route path="/restaurante" element={<RestauranteLayout />}>
          <Route index element={<InicioRestaurante />} />

          <Route
            path="cocina"
            element={
              <RutaProtegida roles={["COCINERO"]}>
                <Cocina />
              </RutaProtegida>
            }
          />

          <Route
            path="entregas"
            element={
              <RutaProtegida roles={["DESPACHADOR"]}>
                <Entregas />
              </RutaProtegida>
            }
          />

          <Route
            path="mesas"
            element={
              <RutaProtegida roles={["ADMIN"]}>
                <Mesas />
              </RutaProtegida>
            }
          />

          <Route
            path="productos"
            element={
              <RutaProtegida roles={["ADMIN"]}>
                <Productos />
              </RutaProtegida>
            }
          />

          <Route
            path="reportes"
            element={
              <RutaProtegida roles={["ADMIN"]}>
                <Reportes />
              </RutaProtegida>
            }
          />

          <Route
            path="configuracion"
            element={
              <RutaProtegida roles={["ADMIN"]}>
                <Configuracion />
              </RutaProtegida>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;