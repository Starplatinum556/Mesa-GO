const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verificarToken, verificarRol } = require("./middleware/auth");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "mesago",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

pool
  .connect()
  .then(() => console.log("Conectado a PostgreSQL (base: mesago)"))
  .catch((err) =>
    console.error("Error al conectar a PostgreSQL:", err.message)
  );

// ==========================
// LOGIN (MG-54)
// ==========================
app.post("/api/login", async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ error: "El formato del correo no es válido." });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.password, u.restaurante_id, u.estado, r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.correo = $1`,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const usuario = result.rows[0];

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    // Verificar que el usuario esté activo
    if (usuario.estado === "INACTIVO") {
      return res.status(401).json({ error: "Tu cuenta está desactivada. Contacta al administrador." });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        restaurante_id: usuario.restaurante_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        restaurante_id: usuario.restaurante_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// ==========================
// REGISTRO ADMIN + RESTAURANTE (MG-21)
// ==========================
app.post("/api/registro", async (req, res) => {
  const {
    nombre, correo, password,
    nombreRestaurante, direccion, telefono, ruc,
  } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: "Nombre, correo y contraseña son requeridos." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ error: "El formato del correo no es válido." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }
  if (!nombreRestaurante || !direccion || !telefono) {
    return res.status(400).json({ error: "Nombre, dirección y teléfono del restaurante son requeridos." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existe = await client.query(
      "SELECT id FROM usuarios WHERE correo = $1", [correo]
    );
    if (existe.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ya existe una cuenta con ese correo." });
    }

    // 1. Crear restaurante
    const resRestaurante = await client.query(
      `INSERT INTO restaurantes (nombre, direccion, telefono, ruc)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nombreRestaurante, direccion, telefono, ruc || null]
    );
    const restaurante_id = resRestaurante.rows[0].id;

    // 2. Crear usuario ADMIN
    const hash = await bcrypt.hash(password, 10);
    const resUsuario = await client.query(
      `INSERT INTO usuarios (nombre, correo, password, rol_id, restaurante_id)
       VALUES ($1, $2, $3, 1, $4) RETURNING id, nombre, correo`,
      [nombre, correo, hash, restaurante_id]
    );
    const usuario = resUsuario.rows[0];

    await client.query("COMMIT");

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: "ADMIN",
        restaurante_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: "ADMIN",
        restaurante_id,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error al crear la cuenta. Intenta de nuevo." });
  } finally {
    client.release();
  }
});

// ==========================
// SEED PASSWORDS (ejecutar una sola vez si es necesario)
// GET http://localhost:4000/api/seed-passwords
// ==========================
app.get("/api/seed-passwords", async (req, res) => {
  try {
    const hash = await bcrypt.hash("123456", 10);
    await pool.query("UPDATE usuarios SET password = $1", [hash]);
    res.json({ mensaje: "Contraseñas actualizadas con bcrypt correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar contraseñas." });
  }
});

// ==========================
// MESAS (MG-32, MG-47)
// ==========================
app.get("/api/mesas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM mesas WHERE restaurante_id = $1 ORDER BY numero",
      [req.usuario.restaurante_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mesas." });
  }
});

app.post("/api/mesas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { numero, capacidad, zona } = req.body;
  if (!numero || !capacidad) {
    return res.status(400).json({ error: "Número y capacidad son requeridos." });
  }
  if (isNaN(numero) || isNaN(capacidad)) {
    return res.status(400).json({ error: "Número y capacidad deben ser números." });
  }
  try {
    const result = await pool.query(
      "INSERT INTO mesas (numero, capacidad, zona, restaurante_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [numero, capacidad, zona || "Salón principal", req.usuario.restaurante_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ya existe una mesa con ese número en tu restaurante." });
    }
    res.status(500).json({ error: "Error al crear mesa." });
  }
});

app.put("/api/mesas/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { numero, capacidad, disponible, zona, qr_codigo } = req.body;
  if (!numero || !capacidad) {
    return res.status(400).json({ error: "Número y capacidad son requeridos." });
  }
  try {
    const result = await pool.query(
      `UPDATE mesas SET numero=$1, capacidad=$2, disponible=$3, zona=$4, qr_codigo=$5
       WHERE id=$6 AND restaurante_id=$7 RETURNING *`,
      [numero, capacidad, disponible ?? true, zona || "Salón principal", qr_codigo || null, id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mesa no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar mesa." });
  }
});

app.delete("/api/mesas/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM mesas WHERE id=$1 AND restaurante_id=$2 RETURNING *",
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mesa no encontrada." });
    }
    res.json({ mensaje: "Mesa eliminada correctamente." });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar mesa." });
  }
});

// ==========================
// QR: OBTENER QR ACTUAL (MG-33)
// ==========================
app.get("/api/mesas/:id/qr", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT qr_codigo FROM mesas WHERE id = $1 AND restaurante_id = $2",
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mesa no encontrada." });
    }
    const token = result.rows[0].qr_codigo;
    if (!token) {
      return res.status(404).json({ error: "Esta mesa no tiene QR generado." });
    }
    const url = `http://localhost:5173/menu/${token}`;
    const QRCode = require("qrcode");
    const qrBase64 = await QRCode.toDataURL(url);
    res.json({ token, url, qr: qrBase64 });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el QR." });
  }
});

// ==========================
// QR: GENERAR / REGENERAR (MG-33)
// ==========================
app.post("/api/mesas/:id/qr", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const token = `MESA-${id}-${Date.now()}`;
    const url = `http://localhost:5173/menu/${token}`;

    await pool.query(
      "UPDATE mesas SET qr_codigo = $1 WHERE id = $2 AND restaurante_id = $3",
      [token, id, req.usuario.restaurante_id]
    );

    const QRCode = require("qrcode");
    const qrBase64 = await QRCode.toDataURL(url);

    res.json({ token, url, qr: qrBase64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar el QR." });
  }
});

// ==========================
// PRODUCTOS (MG-45, MG-55, MG-47)
// ==========================
app.get("/api/productos", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM productos WHERE restaurante_id = $1 ORDER BY id",
      [req.usuario.restaurante_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos." });
  }
});

app.post("/api/productos", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { nombre, precio, categoria, descripcion, disponible } = req.body;
  if (!nombre || !precio) {
    return res.status(400).json({ error: "Nombre y precio son requeridos." });
  }
  if (isNaN(precio) || Number(precio) <= 0) {
    return res.status(400).json({ error: "El precio debe ser un número mayor a 0." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, precio, categoria, descripcion, disponible, restaurante_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, precio, categoria || "General", descripcion || "", disponible ?? true, req.usuario.restaurante_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al crear producto." });
  }
});

app.put("/api/productos/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria, descripcion, disponible } = req.body;
  if (!nombre || !precio) {
    return res.status(400).json({ error: "Nombre y precio son requeridos." });
  }
  try {
    const result = await pool.query(
      `UPDATE productos SET nombre=$1, precio=$2, categoria=$3, descripcion=$4, disponible=$5
       WHERE id=$6 AND restaurante_id=$7 RETURNING *`,
      [nombre, precio, categoria || "General", descripcion || "", disponible ?? true, id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar producto." });
  }
});

// MG-55: Toggle disponibilidad
app.patch("/api/productos/:id/disponibilidad", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE productos SET disponible = NOT disponible
       WHERE id=$1 AND restaurante_id=$2 RETURNING *`,
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar disponibilidad." });
  }
});

app.delete("/api/productos/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM productos WHERE id=$1 AND restaurante_id=$2 RETURNING *",
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json({ mensaje: "Producto eliminado correctamente." });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto." });
  }
});

// ==========================
// PEDIDOS (MG-47, MG-61)
// ==========================
app.get("/api/pedidos", verificarToken, verificarRol("ADMIN", "COCINERO", "DESPACHADOR"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.codigo, m.numero AS mesa, p.estado,
        p.metodo_pago, p.total, p.creado_en,
        STRING_AGG(pr.nombre || ' x' || dp.cantidad, ', ') AS productos,
        COUNT(dp.id) AS cantidad_productos
      FROM pedidos p
      JOIN mesas m ON p.mesa_id = m.id
      JOIN detalle_pedido dp ON dp.pedido_id = p.id
      JOIN productos pr ON pr.id = dp.producto_id
      WHERE p.restaurante_id = $1
      GROUP BY p.id, m.numero
      ORDER BY p.creado_en DESC
    `, [req.usuario.restaurante_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pedidos." });
  }
});

// ==========================
// MENÚ DIGITAL PÚBLICO (MG-64)
// ==========================
app.get("/api/menu/:codigoQr", async (req, res) => {
  const { codigoQr } = req.params;

  if (!codigoQr || codigoQr.trim() === "") {
    return res.status(400).json({ error: "Código QR inválido." });
  }

  try {
    const resMesa = await pool.query(
      "SELECT id, numero, zona, capacidad, restaurante_id FROM mesas WHERE qr_codigo = $1",
      [codigoQr]
    );

    if (resMesa.rows.length === 0) {
      return res.status(404).json({ error: "QR inválido o mesa no encontrada." });
    }

    const mesa = resMesa.rows[0];

    const resProductos = await pool.query(
      `SELECT id, nombre, descripcion, precio, categoria
       FROM productos
       WHERE restaurante_id = $1 AND disponible = true
       ORDER BY categoria, nombre`,
      [mesa.restaurante_id]
    );

    const resRestaurante = await pool.query(
      "SELECT nombre FROM restaurantes WHERE id = $1",
      [mesa.restaurante_id]
    );

    res.json({
      mesa: {
        id: mesa.id,
        numero: mesa.numero,
        zona: mesa.zona,
        capacidad: mesa.capacidad,
      },
      restaurante: resRestaurante.rows[0] || { nombre: "MesaGo" },
      productos: resProductos.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno al cargar el menú." });
  }
});

// ==========================
// PERSONAL (MG-36)
// ==========================
app.get("/api/personal", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.estado, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.restaurante_id = $1
       AND r.nombre IN ('COCINERO', 'DESPACHADOR')
       ORDER BY r.nombre, u.nombre`,
      [req.usuario.restaurante_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener personal." });
  }
});

app.post("/api/personal", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  if (!nombre || !correo || !password || !rol) {
    return res.status(400).json({ error: "Todos los campos son requeridos." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ error: "El formato del correo no es válido." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }
  if (!["COCINERO", "DESPACHADOR"].includes(rol)) {
    return res.status(400).json({ error: "Rol no válido. Solo se permite COCINERO o DESPACHADOR." });
  }
  try {
    const existe = await pool.query("SELECT id FROM usuarios WHERE correo = $1", [correo]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe un usuario con ese correo." });
    }
    const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = $1", [rol]);
    const rol_id = rolResult.rows[0].id;
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, rol_id, restaurante_id, estado)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVO') RETURNING id, nombre, correo, estado`,
      [nombre, correo, hash, rol_id, req.usuario.restaurante_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear empleado." });
  }
});

app.put("/api/personal/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, rol } = req.body;
  if (!nombre || !correo || !rol) {
    return res.status(400).json({ error: "Nombre, correo y rol son requeridos." });
  }
  if (!["COCINERO", "DESPACHADOR"].includes(rol)) {
    return res.status(400).json({ error: "Rol no válido." });
  }
  try {
    const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = $1", [rol]);
    const rol_id = rolResult.rows[0].id;
    const result = await pool.query(
      `UPDATE usuarios SET nombre=$1, correo=$2, rol_id=$3
       WHERE id=$4 AND restaurante_id=$5 RETURNING id, nombre, correo, estado`,
      [nombre, correo, rol_id, id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar empleado." });
  }
});

app.patch("/api/personal/:id/estado", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET estado = CASE WHEN estado = 'ACTIVO' THEN 'INACTIVO' ELSE 'ACTIVO' END
       WHERE id=$1 AND restaurante_id=$2 RETURNING id, nombre, estado`,
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar estado." });
  }
});

app.delete("/api/personal/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id=$1 AND restaurante_id=$2 RETURNING id",
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado." });
    }
    res.json({ mensaje: "Empleado eliminado correctamente." });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar empleado." });
  }
});

// ==========================
// CONFIGURACIÓN DEL RESTAURANTE (MG-47)
// Ficha del restaurante del admin autenticado: nombre, sucursal,
// dirección, contacto, horario y estado del local. Nada de esto se
// comparte entre restaurantes — siempre se filtra por restaurante_id.
// ==========================
app.get("/api/restaurante", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, sucursal, direccion, ruc, correo, telefono,
              responsable, hora_apertura, hora_cierre, estado
       FROM restaurantes WHERE id = $1`,
      [req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Restaurante no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la información del restaurante." });
  }
});

app.put("/api/restaurante", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const {
    nombre, sucursal, direccion, correo, telefono,
    responsable, hora_apertura, hora_cierre, estado,
  } = req.body;

  if (!nombre || !direccion) {
    return res.status(400).json({ error: "El nombre y la dirección son requeridos." });
  }
  if (correo) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: "El formato del correo no es válido." });
    }
  }
  if (estado && !["Abierto", "Cerrado", "En mantenimiento"].includes(estado)) {
    return res.status(400).json({ error: "Estado del local no válido." });
  }

  try {
    const result = await pool.query(
      `UPDATE restaurantes
       SET nombre=$1, sucursal=$2, direccion=$3, correo=$4, telefono=$5,
           responsable=$6, hora_apertura=$7, hora_cierre=$8, estado=$9
       WHERE id=$10
       RETURNING id, nombre, sucursal, direccion, ruc, correo, telefono,
                 responsable, hora_apertura, hora_cierre, estado`,
      [
        nombre, sucursal || null, direccion, correo || null, telefono || null,
        responsable || null, hora_apertura || null, hora_cierre || null,
        estado || "Abierto", req.usuario.restaurante_id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Restaurante no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la información del restaurante." });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend MesaGo corriendo en http://localhost:${PORT}`);
});