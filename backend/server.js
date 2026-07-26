const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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
      `SELECT u.id, u.nombre, u.correo, u.password, u.restaurante_id, u.estado,
              r.nombre AS rol, res.nombre AS restaurante_nombre
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      JOIN restaurantes res ON u.restaurante_id = res.id
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
        // MG-61: nombre real del restaurante (tabla restaurantes),
        // para que el frontend lo muestre sin tener que pedirlo aparte.
        restaurante_nombre: usuario.restaurante_nombre,
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
        // MG-61: ya lo tenemos en memoria de este mismo request,
        // no hace falta otra consulta a la BD.
        restaurante_nombre: nombreRestaurante,
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
// ZONAS (MG-66)
// Cada restaurante administra sus propias zonas donde se ubican las
// mesas. El nombre es único por restaurante (constraint
// zonas_nombre_restaurante_id_key), y no se puede eliminar una zona
// que tenga mesas asociadas (se valida por zona_id, la FK real en
// mesas, no por texto).
// ==========================
app.get("/api/zonas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT z.id, z.nombre, z.descripcion, z.estado,
              COUNT(m.id)::int AS mesas
       FROM zonas z
       LEFT JOIN mesas m ON m.zona_id = z.id
       WHERE z.restaurante_id = $1
       GROUP BY z.id
       ORDER BY z.nombre`,
      [req.usuario.restaurante_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener zonas." });
  }
});

app.post("/api/zonas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { nombre, descripcion, estado } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre de la zona es requerido." });
  }
  if (estado && !["activa", "inactiva"].includes(estado)) {
    return res.status(400).json({ error: "Estado no válido." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO zonas (nombre, descripcion, estado, restaurante_id)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, descripcion, estado`,
      [nombre.trim(), descripcion || null, estado || "activa", req.usuario.restaurante_id]
    );
    res.status(201).json({ ...result.rows[0], mesas: 0 });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ya existe una zona con ese nombre en tu restaurante." });
    }
    console.error(err);
    res.status(500).json({ error: "Error al crear zona." });
  }
});

app.put("/api/zonas/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, estado } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre de la zona es requerido." });
  }
  if (estado && !["activa", "inactiva"].includes(estado)) {
    return res.status(400).json({ error: "Estado no válido." });
  }
  try {
    const result = await pool.query(
      `UPDATE zonas SET nombre=$1, descripcion=$2, estado=COALESCE($3, estado)
       WHERE id=$4 AND restaurante_id=$5
       RETURNING id, nombre, descripcion, estado`,
      [nombre.trim(), descripcion || null, estado || null, id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Zona no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ya existe una zona con ese nombre en tu restaurante." });
    }
    console.error(err);
    res.status(500).json({ error: "Error al actualizar zona." });
  }
});

// Alterna activa/inactiva. Una zona inactiva sigue existiendo (y sus
// mesas también), simplemente deja de ofrecerse como opción al
// crear/editar mesas nuevas desde el frontend.
app.patch("/api/zonas/:id/estado", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE zonas
       SET estado = CASE WHEN estado = 'activa' THEN 'inactiva' ELSE 'activa' END
       WHERE id=$1 AND restaurante_id=$2
       RETURNING id, nombre, estado`,
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Zona no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cambiar el estado de la zona." });
  }
});

app.delete("/api/zonas/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const enUso = await pool.query(
      "SELECT COUNT(*)::int AS total FROM mesas WHERE zona_id=$1 AND restaurante_id=$2",
      [id, req.usuario.restaurante_id]
    );
    if (enUso.rows[0].total > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: ${enUso.rows[0].total} mesa(s) usan esta zona.`,
      });
    }
    const result = await pool.query(
      "DELETE FROM zonas WHERE id=$1 AND restaurante_id=$2 RETURNING id",
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Zona no encontrada." });
    }
    res.json({ mensaje: "Zona eliminada correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar zona." });
  }
});

// ==========================
// MESAS (MG-32, MG-47, MG-66)
// A partir de MG-66, la zona se referencia por zona_id (FK real
// hacia la tabla zonas) en vez del texto libre que se usaba antes.
// ==========================
app.get("/api/mesas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, z.nombre AS zona_nombre
       FROM mesas m
       LEFT JOIN zonas z ON z.id = m.zona_id
       WHERE m.restaurante_id = $1
       ORDER BY m.numero`,
      [req.usuario.restaurante_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mesas." });
  }
});

app.post("/api/mesas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { numero, capacidad, zona_id } = req.body;
  if (!numero || !capacidad) {
    return res.status(400).json({ error: "Número y capacidad son requeridos." });
  }
  if (isNaN(numero) || isNaN(capacidad)) {
    return res.status(400).json({ error: "Número y capacidad deben ser números." });
  }
  try {
    if (zona_id) {
      const zona = await pool.query(
        "SELECT id FROM zonas WHERE id=$1 AND restaurante_id=$2",
        [zona_id, req.usuario.restaurante_id]
      );
      if (zona.rows.length === 0) {
        return res.status(400).json({ error: "La zona seleccionada no es válida." });
      }
    }
    const result = await pool.query(
      "INSERT INTO mesas (numero, capacidad, zona_id, restaurante_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [numero, capacidad, zona_id || null, req.usuario.restaurante_id]
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
  const { numero, capacidad, disponible, zona_id, qr_codigo } = req.body;
  if (!numero || !capacidad) {
    return res.status(400).json({ error: "Número y capacidad son requeridos." });
  }
  try {
    if (zona_id) {
      const zona = await pool.query(
        "SELECT id FROM zonas WHERE id=$1 AND restaurante_id=$2",
        [zona_id, req.usuario.restaurante_id]
      );
      if (zona.rows.length === 0) {
        return res.status(400).json({ error: "La zona seleccionada no es válida." });
      }
    }
    const result = await pool.query(
      `UPDATE mesas SET numero=$1, capacidad=$2, disponible=$3, zona_id=$4, qr_codigo=$5
       WHERE id=$6 AND restaurante_id=$7 RETURNING *`,
      [numero, capacidad, disponible ?? true, zona_id || null, qr_codigo || null, id, req.usuario.restaurante_id]
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
// CATEGORÍAS (MG-65)
// Cada restaurante administra sus propias categorías. El nombre es
// único por restaurante (constraint categorias_nombre_restaurante_key
// en la migración), y no se puede eliminar una categoría que tenga
// productos asociados (se valida por categoria_id, la FK real en
// productos, no por texto).
// ==========================
app.get("/api/categorias", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.estado, c.created_at,
              COUNT(p.id)::int AS productos
       FROM categorias c
       LEFT JOIN productos p ON p.categoria_id = c.id
       WHERE c.restaurante_id = $1
       GROUP BY c.id
       ORDER BY c.nombre`,
      [req.usuario.restaurante_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener categorías." });
  }
});

app.post("/api/categorias", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre de la categoría es requerido." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO categorias (nombre, descripcion, restaurante_id)
       VALUES ($1, $2, $3) RETURNING id, nombre, descripcion, estado, created_at`,
      [nombre.trim(), descripcion || null, req.usuario.restaurante_id]
    );
    res.status(201).json({ ...result.rows[0], productos: 0 });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ya existe una categoría con ese nombre en tu restaurante." });
    }
    console.error(err);
    res.status(500).json({ error: "Error al crear categoría." });
  }
});

app.put("/api/categorias/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre de la categoría es requerido." });
  }
  try {
    const result = await pool.query(
      `UPDATE categorias SET nombre=$1, descripcion=$2
       WHERE id=$3 AND restaurante_id=$4
       RETURNING id, nombre, descripcion, estado, created_at`,
      [nombre.trim(), descripcion || null, id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ya existe una categoría con ese nombre en tu restaurante." });
    }
    console.error(err);
    res.status(500).json({ error: "Error al actualizar categoría." });
  }
});

// Alterna activa/inactiva. Una categoría inactiva sigue existiendo
// (y sus productos también), simplemente deja de ofrecerse como
// opción al crear/editar productos nuevos desde el frontend.
app.patch("/api/categorias/:id/estado", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE categorias
       SET estado = CASE WHEN estado = 'activa' THEN 'inactiva' ELSE 'activa' END
       WHERE id=$1 AND restaurante_id=$2
       RETURNING id, nombre, estado`,
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cambiar el estado de la categoría." });
  }
});

app.delete("/api/categorias/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const enUso = await pool.query(
      "SELECT COUNT(*)::int AS total FROM productos WHERE categoria_id=$1 AND restaurante_id=$2",
      [id, req.usuario.restaurante_id]
    );
    if (enUso.rows[0].total > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: ${enUso.rows[0].total} producto(s) usan esta categoría.`,
      });
    }
    const result = await pool.query(
      "DELETE FROM categorias WHERE id=$1 AND restaurante_id=$2 RETURNING id",
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }
    res.json({ mensaje: "Categoría eliminada correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar categoría." });
  }
});

// ==========================
// PRODUCTOS (MG-45, MG-55, MG-47, MG-65)
// A partir de MG-65, la categoría se referencia por categoria_id
// (FK real hacia la tabla categorias) en vez del texto libre que se
// usaba antes.
// ==========================
app.get("/api/productos", verificarToken, verificarRol("ADMIN", "COCINERO"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.restaurante_id = $1
       ORDER BY p.id`,
      [req.usuario.restaurante_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos." });
  }
});

app.post("/api/productos", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { nombre, precio, categoria_id, descripcion, disponible } = req.body;
  if (!nombre || !precio) {
    return res.status(400).json({ error: "Nombre y precio son requeridos." });
  }
  if (isNaN(precio) || Number(precio) <= 0) {
    return res.status(400).json({ error: "El precio debe ser un número mayor a 0." });
  }
  try {
    if (categoria_id) {
      const cat = await pool.query(
        "SELECT id FROM categorias WHERE id=$1 AND restaurante_id=$2",
        [categoria_id, req.usuario.restaurante_id]
      );
      if (cat.rows.length === 0) {
        return res.status(400).json({ error: "La categoría seleccionada no es válida." });
      }
    }
    const result = await pool.query(
      `INSERT INTO productos (nombre, precio, categoria_id, descripcion, disponible, restaurante_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, precio, categoria_id || null, descripcion || "", disponible ?? true, req.usuario.restaurante_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al crear producto." });
  }
});

app.put("/api/productos/:id", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria_id, descripcion, disponible } = req.body;
  if (!nombre || !precio) {
    return res.status(400).json({ error: "Nombre y precio son requeridos." });
  }
  try {
    if (categoria_id) {
      const cat = await pool.query(
        "SELECT id FROM categorias WHERE id=$1 AND restaurante_id=$2",
        [categoria_id, req.usuario.restaurante_id]
      );
      if (cat.rows.length === 0) {
        return res.status(400).json({ error: "La categoría seleccionada no es válida." });
      }
    }
    const result = await pool.query(
      `UPDATE productos SET nombre=$1, precio=$2, categoria_id=$3, descripcion=$4, disponible=$5
       WHERE id=$6 AND restaurante_id=$7 RETURNING *`,
      [nombre, precio, categoria_id || null, descripcion || "", disponible ?? true, id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar producto." });
  }
});

// MG-55/MG-40: Toggle disponibilidad — el admin lo gestiona desde
// Productos, y el cocinero lo hace en caliente desde su panel cuando
// se le acaba un insumo durante el servicio.
app.patch("/api/productos/:id/disponibilidad", verificarToken, verificarRol("ADMIN", "COCINERO"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE productos SET disponible = NOT disponible, actualizado_en = NOW()
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
// PEDIDOS (MG-47, MG-61, MG-40)
// ==========================
app.get("/api/pedidos", verificarToken, verificarRol("ADMIN", "COCINERO", "DESPACHADOR"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.codigo, m.numero AS mesa, z.nombre AS zona, p.estado,
        p.metodo_pago, p.total, p.creado_en, p.actualizado_en,
        STRING_AGG(pr.nombre || ' x' || dp.cantidad, ', ') AS productos,
        COUNT(dp.id) AS cantidad_productos
      FROM pedidos p
      JOIN mesas m ON p.mesa_id = m.id
      LEFT JOIN zonas z ON z.id = m.zona_id
      JOIN detalle_pedido dp ON dp.pedido_id = p.id
      JOIN productos pr ON pr.id = dp.producto_id
      WHERE p.restaurante_id = $1
        AND p.pago_validado = true
      GROUP BY p.id, m.numero, z.nombre
      ORDER BY p.creado_en DESC
    `, [req.usuario.restaurante_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pedidos." });
  }
});

// MG-40: detalle de un pedido — cada producto con su cantidad, precio
// unitario y subtotal, para el modal "Ver detalle" del panel de cocina.
// Mismo filtro de pago validado que la lista, por consistencia.
app.get("/api/pedidos/:id", verificarToken, verificarRol("ADMIN", "COCINERO", "DESPACHADOR"), async (req, res) => {
  const { id } = req.params;
  try {
    const pedidoResult = await pool.query(
      `SELECT p.id, p.codigo, m.numero AS mesa, z.nombre AS zona, p.estado, p.metodo_pago,
              p.total, p.creado_en, p.observaciones
       FROM pedidos p
       JOIN mesas m ON p.mesa_id = m.id
       LEFT JOIN zonas z ON z.id = m.zona_id
       WHERE p.id = $1 AND p.restaurante_id = $2 AND p.pago_validado = true`,
      [id, req.usuario.restaurante_id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    const itemsResult = await pool.query(
      `SELECT pr.nombre, dp.cantidad, dp.precio_unitario,
              (dp.cantidad * dp.precio_unitario) AS subtotal
       FROM detalle_pedido dp
       JOIN productos pr ON pr.id = dp.producto_id
       WHERE dp.pedido_id = $1
       ORDER BY pr.nombre`,
      [id]
    );

    res.json({ ...pedidoResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el detalle del pedido." });
  }
});

// MG-40/MG-47: avance de estado de un pedido, un paso a la vez, según
// el flujo real del negocio:
//   Nuevo -> En preparación -> Listo para entregar   (COCINERO)
//   Listo para entregar -> Entregado                 (DESPACHADOR)
// El backend siempre calcula el siguiente estado válido — el cliente
// nunca puede "saltarse" pasos ni mandar un estado arbitrario.
const SIGUIENTE_ESTADO_POR_ROL = {
  COCINERO: {
    Nuevo: "En preparación",
    "En preparación": "Listo para entregar",
  },
  DESPACHADOR: {
    "Listo para entregar": "Entregado",
  },
};

app.patch(
  "/api/pedidos/:id/estado",
  verificarToken,
  verificarRol("COCINERO", "DESPACHADOR"),
  async (req, res) => {
    const { id } = req.params;
    const mapaTransiciones = SIGUIENTE_ESTADO_POR_ROL[req.usuario.rol];

    try {
      const pedidoActual = await pool.query(
        "SELECT id, estado FROM pedidos WHERE id = $1 AND restaurante_id = $2 AND pago_validado = true",
        [id, req.usuario.restaurante_id]
      );

      if (pedidoActual.rows.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado." });
      }

      const estadoActual = pedidoActual.rows[0].estado;
      const estadoSiguiente = mapaTransiciones[estadoActual];

      if (!estadoSiguiente) {
        return res.status(400).json({
          error: `No puedes avanzar un pedido que está en estado "${estadoActual}".`,
        });
      }

      // Si el frontend mandó un estado esperado, lo validamos como
      // capa extra de seguridad (evita condiciones de carrera raras
      // donde el pedido cambió de estado entre que se pintó el botón
      // y que se hizo clic).
      if (req.body?.estado && req.body.estado !== estadoSiguiente) {
        return res.status(409).json({
          error: `Este pedido ya cambió de estado. Estado actual: "${estadoActual}".`,
        });
      }

      const resultado = await pool.query(
        "UPDATE pedidos SET estado = $1, actualizado_en = NOW() WHERE id = $2 AND restaurante_id = $3 RETURNING id, codigo, estado, actualizado_en",
        [estadoSiguiente, id, req.usuario.restaurante_id]
      );

      res.json(resultado.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al actualizar el estado del pedido." });
    }
  }
);

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
      `SELECT m.id, m.numero, z.nombre AS zona, m.capacidad, m.restaurante_id
       FROM mesas m
       LEFT JOIN zonas z ON z.id = m.zona_id
       WHERE m.qr_codigo = $1`,
      [codigoQr]
    );

    if (resMesa.rows.length === 0) {
      return res.status(404).json({ error: "QR inválido o mesa no encontrada." });
    }

    const mesa = resMesa.rows[0];

    // MG-65: la categoría ahora sale del JOIN con categorias (vía
    // categoria_id), ya no del texto libre que tenía productos.
    const resProductos = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.restaurante_id = $1 AND p.disponible = true
       ORDER BY c.nombre, p.nombre`,
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
// SESIONES TEMPORALES DEL CLIENTE (MG-52)
// ==========================
app.post("/api/sesiones-cliente", async (req, res) => {
  const { codigoQr, tokenExistente } = req.body;

  if (!codigoQr || codigoQr.trim() === "") {
    return res.status(400).json({
      error: "El código QR es requerido.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar que el código QR pertenezca a una mesa existente.
    const resultadoMesa = await client.query(
      `SELECT id, numero, restaurante_id
       FROM mesas
       WHERE qr_codigo = $1`,
      [codigoQr.trim()]
    );

    if (resultadoMesa.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Código QR inválido o mesa no encontrada.",
      });
    }

    const mesa = resultadoMesa.rows[0];

    // Marcar como expiradas las sesiones que ya terminaron.
    await client.query(
      `UPDATE sesiones_cliente
       SET estado = 'EXPIRADA'
       WHERE estado = 'ACTIVA'
         AND expira_en IS NOT NULL
         AND expira_en <= CURRENT_TIMESTAMP`
    );

    // Recuperar la sesión anterior del navegador si todavía es válida.
    if (tokenExistente) {
      const resultadoSesion = await client.query(
        `SELECT id, token, restaurante_id, mesa_id,
                estado, creada_en, expira_en
         FROM sesiones_cliente
         WHERE token = $1
           AND mesa_id = $2
           AND restaurante_id = $3
           AND estado = 'ACTIVA'
           AND (
             expira_en IS NULL
             OR expira_en > CURRENT_TIMESTAMP
           )`,
        [
          tokenExistente,
          mesa.id,
          mesa.restaurante_id,
        ]
      );

      if (resultadoSesion.rows.length > 0) {
        await client.query("COMMIT");

        return res.json({
          mensaje: "Sesión temporal recuperada.",
          sesion: resultadoSesion.rows[0],
          mesa: {
            id: mesa.id,
            numero: mesa.numero,
          },
        });
      }
    }

    // Crear un token difícil de adivinar.
    const nuevoToken = crypto.randomBytes(32).toString("hex");

    // La sesión tendrá una duración de dos horas.
    const resultadoNuevaSesion = await client.query(
      `INSERT INTO sesiones_cliente
        (
          token,
          restaurante_id,
          mesa_id,
          estado,
          expira_en
        )
       VALUES (
          $1,
          $2,
          $3,
          'ACTIVA',
          CURRENT_TIMESTAMP + INTERVAL '2 hours'
       )
       RETURNING
          id,
          token,
          restaurante_id,
          mesa_id,
          estado,
          creada_en,
          expira_en`,
      [
        nuevoToken,
        mesa.restaurante_id,
        mesa.id,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Sesión temporal creada correctamente.",
      sesion: resultadoNuevaSesion.rows[0],
      mesa: {
        id: mesa.id,
        numero: mesa.numero,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear sesión temporal:", error);

    return res.status(500).json({
      error: "No se pudo crear la sesión temporal.",
    });
  } finally {
    client.release();
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

// ==========================
// ENTREGAS (MG-48)
// ==========================
app.get("/api/entregas", verificarToken, verificarRol("ADMIN", "DESPACHADOR"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.codigo, m.numero AS mesa, m.zona, p.estado,
        p.metodo_pago, p.total, p.creado_en,
        COUNT(dp.id) AS cantidad_productos
      FROM pedidos p
      JOIN mesas m ON p.mesa_id = m.id
      LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
      WHERE p.restaurante_id = $1
        AND p.estado IN ('Listo', 'Listo para entregar', 'Entregado')
      GROUP BY p.id, m.numero, m.zona
      ORDER BY p.creado_en ASC
    `, [req.usuario.restaurante_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener entregas." });
  }
});

app.get("/api/entregas/historial", verificarToken, verificarRol("ADMIN", "DESPACHADOR"), async (req, res) => {
  const { busqueda, desde, hasta, estado } = req.query;
  const params = [req.usuario.restaurante_id];
  let condiciones = `p.restaurante_id = $1 AND p.estado IN ('Completado','Cancelado','No entregado')`;
  let idx = 2;
 
  if (busqueda) { condiciones += ` AND p.codigo ILIKE $${idx}`; params.push(`%${busqueda}%`); idx++; }
  if (desde)    { condiciones += ` AND p.creado_en >= $${idx}::date`; params.push(desde); idx++; }
  if (hasta)    { condiciones += ` AND p.creado_en < ($${idx}::date + INTERVAL '1 day')`; params.push(hasta); idx++; }
  if (estado && estado !== "todos") { condiciones += ` AND p.estado = $${idx}`; params.push(estado); idx++; }
 
  try {
    const result = await pool.query(`
      SELECT p.id, p.codigo, m.numero AS mesa, m.zona,
        p.estado, p.total, p.metodo_pago, p.creado_en,
        p.observaciones, p.completado_por,
        COUNT(dp.id) AS cantidad_productos
      FROM pedidos p
      JOIN mesas m ON p.mesa_id = m.id
      LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
      WHERE ${condiciones}
      GROUP BY p.id, m.numero, m.zona
      ORDER BY p.creado_en DESC
    `, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener historial." });
  }
});

app.get("/api/entregas/:id", verificarToken, verificarRol("ADMIN", "DESPACHADOR"), async (req, res) => {
  const { id } = req.params;
  try {
    const resPedido = await pool.query(`
      SELECT p.id, p.codigo, p.estado, p.metodo_pago, p.total,
        p.creado_en, p.observaciones, m.numero AS mesa, m.zona
      FROM pedidos p JOIN mesas m ON p.mesa_id = m.id
      WHERE p.id = $1 AND p.restaurante_id = $2
    `, [id, req.usuario.restaurante_id]);
    if (resPedido.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }
    const resItems = await pool.query(`
      SELECT pr.nombre, dp.cantidad, pr.categoria, dp.precio_unitario,
        (dp.cantidad * dp.precio_unitario) AS subtotal
      FROM detalle_pedido dp
      JOIN productos pr ON pr.id = dp.producto_id
      WHERE dp.pedido_id = $1
      ORDER BY pr.nombre
    `, [id]);
    res.json({ ...resPedido.rows[0], items: resItems.rows });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener detalle." });
  }
});

app.patch("/api/entregas/:id/entregar", verificarToken, verificarRol("ADMIN", "DESPACHADOR"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE pedidos SET estado = 'Entregado', actualizado_en = NOW()
       WHERE id = $1 AND restaurante_id = $2
       AND estado IN ('Listo', 'Listo para entregar') RETURNING *`,
      [id, req.usuario.restaurante_id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "El pedido no está en estado Listo." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al marcar como entregado." });
  }
});

app.patch("/api/entregas/:id/completar", verificarToken, verificarRol("ADMIN", "DESPACHADOR"), async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resPedido = await client.query(
      `SELECT mesa_id FROM pedidos
       WHERE id = $1 AND restaurante_id = $2 AND estado = 'Entregado'`,
      [id, req.usuario.restaurante_id]
    );
    if (resPedido.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El pedido no está en estado Entregado." });
    }
    const mesa_id = resPedido.rows[0].mesa_id;
    await client.query(
      `UPDATE pedidos SET estado = 'Completado', actualizado_en = NOW() WHERE id = $1`, [id]
    );
    await client.query(
      `UPDATE mesas SET disponible = true WHERE id = $1`, [mesa_id]
    );
    await client.query(
      `UPDATE sesiones_cliente SET estado = 'FINALIZADA'
       WHERE mesa_id = $1 AND estado = 'ACTIVA'`, [mesa_id]
    );
    await client.query("COMMIT");
    res.json({ mensaje: "Servicio completado. Mesa liberada." });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error al completar el servicio." });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend MesaGo corriendo en http://localhost:${PORT}`);
});