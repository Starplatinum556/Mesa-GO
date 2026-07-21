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
// RUTA PUBLICA: LOGIN (MG-54)
// ==========================
app.post("/api/login", async (req, res) => {
  const { correo, password } = req.body;

  // MG-38: Validaciones
  if (!correo || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ error: "El formato del correo no es válido." });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.password, u.restaurante_id, r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.correo = $1`,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const usuario = result.rows[0];

    // MG-54: Verificar contraseña con bcrypt
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    // MG-54: Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        restaurante_id: usuario.restaurante_id
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
        restaurante_id: usuario.restaurante_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// ==========================
// RUTA PUBLICA: REGISTRO (MG-54) // REGISTRO ADMIN + RESTAURANTE (MG-21)
// ==========================
app.post("/api/registro", async (req, res) => {
  const {
    nombre, correo, password,
    nombreRestaurante, direccion, telefono, ruc, numeroMesas
  } = req.body;

  // Validaciones
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

    // Verificar correo duplicado
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

    // 3. Crear mesas iniciales si se especificó un número
    await client.query("COMMIT");
    for (let i = 1; i <= cantMesas; i++) {
      await client.query(
        `INSERT INTO mesas (numero, capacidad, restaurante_id, zona)
         VALUES ($1, 4, $2, 'Salón principal')`,
        [i, restaurante_id]
      );
    }

    await client.query("COMMIT");

    // 4. Generar JWT con restaurante_id
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: "ADMIN",
        restaurante_id
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
        restaurante_id
      }
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
// RUTA PUBLICA: ACTUALIZAR PASSWORDS A BCRYPT
// Acceder UNA SOLA VEZ: GET http://localhost:4000/api/seed-passwords
// Luego borrar esta ruta
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
// MESAS — solo ADMIN (MG-59)
// ==========================
app.get("/api/mesas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM mesas ORDER BY numero");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mesas." });
  }
});

app.post("/api/mesas", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { numero, capacidad, zona, qr_codigo } = req.body;
  if (!numero || !capacidad) {
    return res.status(400).json({ error: "Número y capacidad son requeridos." });
  }
  if (isNaN(numero) || isNaN(capacidad)) {
    return res.status(400).json({ error: "Número y capacidad deben ser números." });
  }
  try {
    const result = await pool.query(
      "INSERT INTO mesas (numero, capacidad, zona, qr_codigo) VALUES ($1, $2, $3, $4) RETURNING *",
      [numero, capacidad, zona || "Salón principal", qr_codigo || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ya existe una mesa con ese número." });
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
      "UPDATE mesas SET numero=$1, capacidad=$2, disponible=$3, zona=$4, qr_codigo=$5 WHERE id=$6 RETURNING *",
      [numero, capacidad, disponible ?? true, zona || "Salón principal", qr_codigo || null, id]
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
    const result = await pool.query("DELETE FROM mesas WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mesa no encontrada." });
    }
    res.json({ mensaje: "Mesa eliminada correctamente." });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar mesa." });
  }
});

// ==========================
// PRODUCTOS (MG-59 + MG-55)
// ==========================
app.get("/api/productos", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos ORDER BY id");
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
      "INSERT INTO productos (nombre, precio, categoria, descripcion, disponible) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre, precio, categoria || "General", descripcion || "", disponible ?? true]
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
      "UPDATE productos SET nombre=$1, precio=$2, categoria=$3, descripcion=$4, disponible=$5 WHERE id=$6 RETURNING *",
      [nombre, precio, categoria || "General", descripcion || "", disponible ?? true, id]
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
      "UPDATE productos SET disponible = NOT disponible WHERE id=$1 RETURNING *",
      [id]
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
    const result = await pool.query("DELETE FROM productos WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json({ mensaje: "Producto eliminado correctamente." });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto." });
  }
});

// ==========================
// MG-64: MENU DIGITAL — acceso público vía código QR (sin login)
// Flujo: token en la URL -> validar que el QR exista y esté activo
// -> identificar la mesa -> devolver el menú disponible por categorías.
//
// Nota de diseño: no existe una columna "activo" separada para el QR.
// Un QR se considera "activo" si su token coincide con el qr_codigo
// vigente de alguna mesa. Al regenerar el QR de una mesa (endpoint
// POST /api/mesas/:id/qr) el token anterior se sobrescribe en la BD,
// por lo que deja de existir y automáticamente queda invalidado: una
// consulta con el token viejo caerá en el mismo caso "QR no válido".
// ==========================
app.get("/api/menu/:codigoQr", async (req, res) => {
  const { codigoQr } = req.params;

  if (!codigoQr || !codigoQr.trim()) {
    return res.status(400).json({ error: "Código QR no proporcionado." });
  }

  try {
    // 1 y 2: obtener el token y verificar que exista/esté activo,
    // identificando a la vez la mesa asociada (3).
    const mesaResult = await pool.query(
      "SELECT * FROM mesas WHERE qr_codigo = $1",
      [codigoQr.trim()]
    );

    if (mesaResult.rows.length === 0) {
      // Cubre tanto "el QR nunca existió" como "el QR fue invalidado"
      // (regenerado) o "la mesa ya no existe": en los tres casos ya
      // no hay ninguna mesa con ese qr_codigo.
      return res.status(404).json({
        error: "Este código QR no es válido o ya no está activo. Solicita uno nuevo al personal del restaurante.",
      });
    }

    const mesa = mesaResult.rows[0];

    // 5 y 6: obtener solo productos disponibles, organizados por categoría.
    const productosResult = await pool.query(
      "SELECT * FROM productos WHERE disponible = true ORDER BY categoria, nombre"
    );

    res.json({
      mesa,
      productos: productosResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ocurrió un error al cargar el menú. Intenta nuevamente en unos segundos." });
  }
});

// ==========================
// PEDIDOS (MG-59: ADMIN, COCINERO, DESPACHADOR)
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
      GROUP BY p.id, m.numero
      ORDER BY p.creado_en DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pedidos." });
  }
});

// ==========================
// QR: VER (MG-33)
// ==========================
app.get("/api/mesas/:id/qr", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT qr_codigo FROM mesas WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mesa no encontrada." });
    }

    const token = result.rows[0].qr_codigo;
    if (!token) {
      return res.status(404).json({ error: "Esta mesa aún no tiene un código QR generado." });
    }

    const url = `http://localhost:5173/menu/${token}`;

    const QRCode = require("qrcode");
    const qrBase64 = await QRCode.toDataURL(url);

    res.json({ token, url, qr: qrBase64 });
  } catch (err) {
    console.error(err);
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
      "UPDATE mesas SET qr_codigo = $1 WHERE id = $2",
      [token, id]
    );

    const QRCode = require("qrcode");
    const qrBase64 = await QRCode.toDataURL(url);

    res.json({ token, url, qr: qrBase64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar el QR." });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend MesaGo corriendo en http://localhost:${PORT}`);
});