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
      `SELECT u.id, u.nombre, u.correo, u.password, r.nombre AS rol
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
      { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
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
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// ==========================
// RUTA PUBLICA: REGISTRO (MG-54)
// ==========================
app.post("/api/registro", async (req, res) => {
  const { nombre, correo, password, rol } = req.body;

  // MG-38: Validaciones
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

  try {
    // Verificar si el correo ya existe
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE correo = $1", [correo]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe una cuenta con ese correo." });
    }

    // Obtener el rol_id según el nombre del rol
    const rolMap = {
      CLIENTE: 2,
      ADMIN: 1,
      COCINERO: 3,
      DESPACHADOR: 4,
    };
    const rol_id = rolMap[rol.toUpperCase()];
    if (!rol_id) {
      return res.status(400).json({ error: "Rol no válido." });
    }

    // Encriptar contraseña
    const hash = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, rol_id)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, correo`,
      [nombre, correo, hash, rol_id]
    );

    const usuario = result.rows[0];

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: rol.toUpperCase() },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: rol.toUpperCase(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor." });
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
app.get("/api/mesas", verificarToken, async (req, res) => {
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
app.get("/api/productos", verificarToken, async (req, res) => {
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
// MENU DIGITAL — pública, se accede vía QR (sin login)
// ==========================
app.get("/api/menu/:codigoQr", async (req, res) => {
  const { codigoQr } = req.params;

  try {
    const mesaResult = await pool.query(
      "SELECT * FROM mesas WHERE qr_codigo = $1",
      [codigoQr]
    );

    if (mesaResult.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró la mesa asociada al código QR." });
    }

    const mesa = mesaResult.rows[0];

    const productosResult = await pool.query(
      "SELECT * FROM productos WHERE disponible = true ORDER BY id"
    );

    res.json({
      mesa,
      productos: productosResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el menú." });
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