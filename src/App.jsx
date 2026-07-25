import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";

import RestauranteLayout from "./pages/restaurante/RestauranteLayout";
import Cocina from "./pages/restaurante/Cocina";
import DisponibilidadProductos from "./pages/restaurante/DisponibilidadProductos";
import MiPerfil from "./pages/restaurante/MiPerfil";
import Entregas from "./pages/restaurante/Entregas";
import Mesas from "./pages/restaurante/Mesas";
import Zonas from "./pages/restaurante/Zonas";
import Productos from "./pages/restaurante/Productos";
import Categorias from "./pages/restaurante/Categorias";
import Personal from "./pages/restaurante/Personal";
import Reportes from "./pages/restaurante/Reportes";
import Configuracion from "./pages/restaurante/Configuracion";
import { Toaster } from "react-hot-toast";
import MenuDigital from "./pages/MenuDigital";
import RutaProtegida, {
  obtenerUsuarioSesion,
  rutaInicioPorRol,
} from "./components/RutaProtegida";
import "./index.css";

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

        {/* Panel interno del restaurante */}
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
            path="disponibilidad"
            element={
              <RutaProtegida roles={["COCINERO"]}>
                <DisponibilidadProductos />
              </RutaProtegida>
            }
          />

          <Route
            path="mi-perfil"
            element={
              <RutaProtegida roles={["COCINERO"]}>
                <MiPerfil />
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
            path="zonas"
            element={
              <RutaProtegida roles={["ADMIN"]}>
                <Zonas />
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
            path="categorias"
            element={
              <RutaProtegida roles={["ADMIN"]}>
                <Categorias />
              </RutaProtegida>
            }
          />

          <Route
            path="personal"
            element={
              <RutaProtegida roles={["ADMIN"]}>
                <Personal />
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