import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";

import RestauranteLayout from "./pages/restaurante/RestauranteLayout";
import RecepcionPedidos from "./pages/restaurante/RecepcionPedidos";
import Cocina from "./pages/restaurante/Cocina";
import Entregas from "./pages/restaurante/Entregas";
import Mesas from "./pages/restaurante/Mesas";
import Productos from "./pages/restaurante/Productos";
import Reportes from "./pages/restaurante/Reportes";
import Configuracion from "./pages/restaurante/Configuracion";
import { Toaster } from "react-hot-toast";
import MenuDigital from "./pages/MenuDigital";
import "./index.css";

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
          <Route index element={<RecepcionPedidos />} />
          <Route path="cocina" element={<Cocina />} />
          <Route path="entregas" element={<Entregas />} />
          <Route path="mesas" element={<Mesas />} />
          <Route path="productos" element={<Productos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;