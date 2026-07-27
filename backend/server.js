const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { verificarToken, verificarRol } = require("./middleware/auth");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// MG-56: subida de imágenes (logo / banner del restaurante)
// Se guardan en disco, en backend/uploads/restaurantes/<restaurante_id>/,
// y se sirven como estáticos desde /uploads. En la BD solo se guarda
// la ruta pública (ej: "/uploads/restaurantes/1/logo-169...png").
// ==========================
const CARPETA_UPLOADS = path.join(__dirname, "uploads");
app.use("/uploads", express.static(CARPETA_UPLOADS));

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

function crearStorageImagenRestaurante(subcarpeta) {
  return multer.diskStorage({
    destination: (req, _archivo, cb) => {
      const carpetaRestaurante = path.join(
        CARPETA_UPLOADS,
        "restaurantes",
        String(req.usuario.restaurante_id)
      );
      fs.mkdirSync(carpetaRestaurante, { recursive: true });
      cb(null, carpetaRestaurante);
    },
    filename: (_req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase() || ".png";
      cb(null, `${subcarpeta}-${Date.now()}${extension}`);
    },
  });
}

function crearUploaderImagen(subcarpeta) {
  return multer({
    storage: crearStorageImagenRestaurante(subcarpeta),
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    fileFilter: (_req, archivo, cb) => {
      if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
        return cb(new Error("Formato de imagen no permitido. Usa JPG, PNG, WEBP o SVG."));
      }
      cb(null, true);
    },
  });
}

const uploadLogo = crearUploaderImagen("logo");
const uploadBanner = crearUploaderImagen("banner");

function crearUploaderImagenMesa() {
  const storage = multer.diskStorage({
    destination: (req, _archivo, cb) => {
      const carpetaMesas = path.join(
        CARPETA_UPLOADS,
        "restaurantes",
        String(req.usuario.restaurante_id),
        "mesas"
      );
      fs.mkdirSync(carpetaMesas, { recursive: true });
      cb(null, carpetaMesas);
    },
    filename: (req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase() || ".png";
      cb(null, `mesa-${req.params.id}-${Date.now()}${extension}`);
    },
  });
 
  return multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_req, archivo, cb) => {
      if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
        return cb(new Error("Formato de imagen no permitido. Usa JPG, PNG, WEBP o SVG."));
      }
      cb(null, true);
    },
  });
}
 
const uploadImagenMesa = crearUploaderImagenMesa();

function crearUploaderImagenProducto() {
  const storage = multer.diskStorage({
    destination: (req, _archivo, cb) => {
      const carpetaProductos = path.join(
        CARPETA_UPLOADS,
        "restaurantes",
        String(req.usuario.restaurante_id),
        "productos"
      );
      fs.mkdirSync(carpetaProductos, { recursive: true });
      cb(null, carpetaProductos);
    },
    filename: (req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase() || ".png";
      cb(null, `producto-${req.params.id}-${Date.now()}${extension}`);
    },
  });
 
  return multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB, igual que logo/banner
    fileFilter: (_req, archivo, cb) => {
      if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
        return cb(new Error("Formato de imagen no permitido. Usa JPG, PNG, WEBP o SVG."));
      }
      cb(null, true);
    },
  });
}
 
const uploadImagenProducto = crearUploaderImagenProducto();

// Elimina el archivo físico anterior (si existía) al reemplazar logo/banner.
function borrarArchivoAnterior(rutaPublicaAnterior) {
  if (!rutaPublicaAnterior) return;
  const rutaAbsoluta = path.join(__dirname, rutaPublicaAnterior.replace(/^\//, ""));
  fs.unlink(rutaAbsoluta, () => {}); // si no existe o falla, lo ignoramos
}

function crearUploaderFotoEmpleado() {
  const storage = multer.diskStorage({
    destination: (req, _archivo, cb) => {
      const carpetaEmpleado = path.join(
        CARPETA_UPLOADS,
        "restaurantes",
        String(req.usuario.restaurante_id),
        "personal"
      );
      fs.mkdirSync(carpetaEmpleado, { recursive: true });
      cb(null, carpetaEmpleado);
    },
    filename: (req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase() || ".png";
      cb(null, `empleado-${req.params.id}-${Date.now()}${extension}`);
    },
  });
 
  return multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_req, archivo, cb) => {
      if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
        return cb(new Error("Formato de imagen no permitido. Usa JPG, PNG, WEBP o SVG."));
      }
      cb(null, true);
    },
  });
}
 
const uploadFotoEmpleado = crearUploaderFotoEmpleado();

// MP: mismo patrón que crearUploaderImagen, pero la carpeta se arma
// con el id del USUARIO en sesión (req.usuario.id) en vez del
// restaurante — cada quien guarda su propia foto de perfil.
function crearUploaderImagenUsuario() {
  const storage = multer.diskStorage({
    destination: (req, _archivo, cb) => {
      const carpetaUsuario = path.join(CARPETA_UPLOADS, "usuarios", String(req.usuario.id));
      fs.mkdirSync(carpetaUsuario, { recursive: true });
      cb(null, carpetaUsuario);
    },
    filename: (_req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase() || ".png";
      cb(null, `foto-${Date.now()}${extension}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    fileFilter: (_req, archivo, cb) => {
      if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
        return cb(new Error("Formato de imagen no permitido. Usa JPG, PNG, WEBP o SVG."));
      }
      cb(null, true);
    },
  });
}

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
// MI PERFIL (MP)
// Disponible para los 3 roles — cada usuario ve solo su propia
// información (se filtra por req.usuario.id, no por parámetro).
// ==========================
app.get("/api/mi-perfil", verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.nombre, u.correo, u.estado, u.cedula, u.fecha_nacimiento,
              u.genero, u.nacionalidad, u.telefono, u.created_at, u.foto,
              r.nombre AS rol, res.nombre AS restaurante_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        JOIN restaurantes res ON u.restaurante_id = res.id
        WHERE u.id = $1`,
      [req.usuario.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el perfil." });
  }
});

// MP: edición de datos personales — cada usuario solo puede editar
// su propia fila (req.usuario.id), sin importar su rol. No permite
// tocar contraseña ni foto todavía (eso es aparte, más adelante).
app.patch("/api/mi-perfil", verificarToken, async (req, res) => {
  const { nombre, correo, telefono, cedula, fecha_nacimiento, genero, nacionalidad } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre es requerido." });
  }
  if (!correo || !correo.trim()) {
    return res.status(400).json({ error: "El correo es requerido." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ error: "El formato del correo no es válido." });
  }

  try {
    const existeCorreo = await pool.query(
      "SELECT id FROM usuarios WHERE correo = $1 AND id != $2",
      [correo, req.usuario.id]
    );
    if (existeCorreo.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe otra cuenta con ese correo." });
    }

    const result = await pool.query(
      `UPDATE usuarios
       SET nombre = $1, correo = $2, telefono = $3, cedula = $4,
           fecha_nacimiento = $5, genero = $6, nacionalidad = $7
       WHERE id = $8
       RETURNING nombre, correo, telefono, cedula, fecha_nacimiento, genero, nacionalidad`,
      [
        nombre.trim(), correo.trim(), telefono || null, cedula || null,
        fecha_nacimiento || null, genero || null, nacionalidad || null,
        req.usuario.id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el perfil." });
  }
});


// MP: subir/reemplazar la foto de perfil del usuario en sesión.
// Reutiliza el mismo patrón (multer + carpeta propia + borrar la
// anterior) que ya usamos para el logo/banner del restaurante (MG-56),
// pero organizado por usuario en vez de por restaurante.
app.post("/api/mi-perfil/foto", verificarToken, (req, res) => {
  const uploadFotoPerfil = crearUploaderImagenUsuario();
  uploadFotoPerfil.single("foto")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "No se pudo subir la foto." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo." });
    }
    try {
      const rutaPublica = `/uploads/usuarios/${req.usuario.id}/${req.file.filename}`;

      const anterior = await pool.query(
        "SELECT foto FROM usuarios WHERE id = $1",
        [req.usuario.id]
      );

      const result = await pool.query(
        "UPDATE usuarios SET foto = $1 WHERE id = $2 RETURNING foto",
        [rutaPublica, req.usuario.id]
      );

      borrarArchivoAnterior(anterior.rows[0]?.foto);

      res.json({ mensaje: "Foto de perfil actualizada correctamente.", foto: result.rows[0].foto });
    } catch (dbErr) {
      console.error(dbErr);
      res.status(500).json({ error: "Error al guardar la foto en la base de datos." });
    }
  });
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
// MESAS: subir/reemplazar imagen
// ==========================
app.post(
  "/api/mesas/:id/imagen",
  verificarToken,
  verificarRol("ADMIN"),
  (req, res) => {
    uploadImagenMesa.single("imagen")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo subir la imagen." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo." });
      }
 
      const { id } = req.params;
      const rutaPublica = `/uploads/restaurantes/${req.usuario.restaurante_id}/mesas/${req.file.filename}`;
 
      try {
        const anterior = await pool.query(
          "SELECT imagen FROM mesas WHERE id = $1 AND restaurante_id = $2",
          [id, req.usuario.restaurante_id]
        );
 
        if (anterior.rows.length === 0) {
          return res.status(404).json({ error: "Mesa no encontrada." });
        }
 
        const result = await pool.query(
          "UPDATE mesas SET imagen = $1 WHERE id = $2 AND restaurante_id = $3 RETURNING *",
          [rutaPublica, id, req.usuario.restaurante_id]
        );
 
        borrarArchivoAnterior(anterior.rows[0]?.imagen);
 
        res.json({ mensaje: "Imagen actualizada correctamente.", mesa: result.rows[0] });
      } catch (dbErr) {
        console.error(dbErr);
        res.status(500).json({ error: "Error al guardar la imagen en la base de datos." });
      }
    });
  }
);

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
// PRODUCTOS: subir/reemplazar imagen
// Igual patrón que logo/banner: se guarda en disco y solo la ruta
// pública se guarda en la BD (columna productos.imagen).
// ==========================
app.post(
  "/api/productos/:id/imagen",
  verificarToken,
  verificarRol("ADMIN"),
  (req, res) => {
    uploadImagenProducto.single("imagen")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo subir la imagen." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo." });
      }
 
      const { id } = req.params;
      const rutaPublica = `/uploads/restaurantes/${req.usuario.restaurante_id}/productos/${req.file.filename}`;
 
      try {
        const anterior = await pool.query(
          "SELECT imagen FROM productos WHERE id = $1 AND restaurante_id = $2",
          [id, req.usuario.restaurante_id]
        );
 
        if (anterior.rows.length === 0) {
          return res.status(404).json({ error: "Producto no encontrado." });
        }
 
        const result = await pool.query(
          "UPDATE productos SET imagen = $1 WHERE id = $2 AND restaurante_id = $3 RETURNING *",
          [rutaPublica, id, req.usuario.restaurante_id]
        );
 
        borrarArchivoAnterior(anterior.rows[0]?.imagen);
 
        res.json({ mensaje: "Imagen actualizada correctamente.", producto: result.rows[0] });
      } catch (dbErr) {
        console.error(dbErr);
        res.status(500).json({ error: "Error al guardar la imagen en la base de datos." });
      }
    });
  }
);

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
// MG-57: crear o actualizar el pedido temporal de una sesión cliente.
app.post("/api/pedidos-temporales", async (req, res) => {
  const {
    tokenSesion,
    productos,
    observaciones = "",
  } = req.body;

  if (!tokenSesion || typeof tokenSesion !== "string") {
    return res.status(400).json({
      error: "La sesión temporal es requerida.",
    });
  }

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      error: "El carrito no puede estar vacío.",
    });
  }

  if (
    typeof observaciones !== "string" ||
    observaciones.length > 500
  ) {
    return res.status(400).json({
      error: "Las observaciones no pueden superar 500 caracteres.",
    });
  }

  // Unir productos repetidos y validar sus cantidades.
  const cantidadesPorProducto = new Map();

  for (const item of productos) {
    const productoId = Number(
      item.producto_id ?? item.id
    );

    const cantidad = Number(item.cantidad);

    if (
      !Number.isInteger(productoId) ||
      productoId <= 0 ||
      !Number.isInteger(cantidad) ||
      cantidad <= 0 ||
      cantidad > 99
    ) {
      return res.status(400).json({
        error: "Existe un producto o cantidad inválida.",
      });
    }

    const cantidadAnterior =
      cantidadesPorProducto.get(productoId) || 0;

    const nuevaCantidad =
      cantidadAnterior + cantidad;

    if (nuevaCantidad > 99) {
      return res.status(400).json({
        error:
          "No se permiten más de 99 unidades del mismo producto.",
      });
    }

    cantidadesPorProducto.set(
      productoId,
      nuevaCantidad
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Marcar la sesión como expirada cuando corresponda.
    await client.query(
      `UPDATE sesiones_cliente
       SET estado = 'EXPIRADA'
       WHERE token = $1
         AND estado = 'ACTIVA'
         AND expira_en IS NOT NULL
         AND expira_en <= CURRENT_TIMESTAMP`,
      [tokenSesion]
    );

    // La mesa y el restaurante salen exclusivamente de la sesión.
    const resultadoSesion = await client.query(
      `SELECT
         sc.id,
         sc.mesa_id,
         sc.restaurante_id,
         sc.estado,
         sc.expira_en
       FROM sesiones_cliente sc
       JOIN mesas m
         ON m.id = sc.mesa_id
        AND m.restaurante_id = sc.restaurante_id
       WHERE sc.token = $1
         AND sc.estado = 'ACTIVA'
         AND (
           sc.expira_en IS NULL
           OR sc.expira_en > CURRENT_TIMESTAMP
         )
       FOR UPDATE`,
      [tokenSesion]
    );

    if (resultadoSesion.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(401).json({
        error:
          "La sesión temporal no existe o ya expiró.",
      });
    }

    const sesion = resultadoSesion.rows[0];
    const idsProductos = [
      ...cantidadesPorProducto.keys(),
    ];

    // Solo aceptar productos disponibles del mismo restaurante.
    const resultadoProductos = await client.query(
      `SELECT
         id,
         nombre,
         precio,
         disponible
       FROM productos
       WHERE id = ANY($1::int[])
         AND restaurante_id = $2
         AND disponible = true
       ORDER BY id`,
      [
        idsProductos,
        sesion.restaurante_id,
      ]
    );

    if (
      resultadoProductos.rows.length !==
      idsProductos.length
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error:
          "Uno o más productos no existen, están agotados o pertenecen a otro restaurante.",
      });
    }

    let total = 0;

    const detalleValidado =
      resultadoProductos.rows.map((producto) => {
        const cantidad =
          cantidadesPorProducto.get(
            Number(producto.id)
          );

        const precioUnitario =
          Number(producto.precio);

        const subtotal =
          precioUnitario * cantidad;

        total += subtotal;

        return {
          producto_id: Number(producto.id),
          nombre: producto.nombre,
          cantidad,
          precio_unitario: precioUnitario,
          subtotal: Number(subtotal.toFixed(2)),
        };
      });

    total = Number(total.toFixed(2));

    // Una sesión mantiene un solo pedido temporal.
    const resultadoPedidoExistente =
      await client.query(
        `SELECT id, codigo
         FROM pedidos
         WHERE sesion_cliente_id = $1
           AND estado = 'TEMPORAL'
         ORDER BY id DESC
         LIMIT 1
         FOR UPDATE`,
        [sesion.id]
      );

    let pedido;
    let pedidoCreado = false;

    if (resultadoPedidoExistente.rows.length > 0) {
      const pedidoExistente =
        resultadoPedidoExistente.rows[0];

      const resultadoActualizacion =
        await client.query(
          `UPDATE pedidos
           SET total = $1,
               observaciones = $2,
               actualizado_en = CURRENT_TIMESTAMP
           WHERE id = $3
           RETURNING
             id,
             codigo,
             mesa_id,
             restaurante_id,
             sesion_cliente_id,
             estado,
             total,
             observaciones,
             creado_en,
             actualizado_en`,
          [
            total,
            observaciones.trim() || null,
            pedidoExistente.id,
          ]
        );

      pedido = resultadoActualizacion.rows[0];

      // Reemplazar el detalle anterior por el carrito actual.
      await client.query(
        `DELETE FROM detalle_pedido
         WHERE pedido_id = $1`,
        [pedido.id]
      );
    } else {
      const codigo =
        `MG-${Date.now()
          .toString(36)
          .toUpperCase()}-${crypto
          .randomBytes(2)
          .toString("hex")
          .toUpperCase()}`;

      const resultadoNuevoPedido =
        await client.query(
          `INSERT INTO pedidos (
             codigo,
             mesa_id,
             estado,
             total,
             restaurante_id,
             sesion_cliente_id,
             estado_pago,
             pago_validado,
             observaciones,
             actualizado_en
           )
           VALUES (
             $1,
             $2,
             'TEMPORAL',
             $3,
             $4,
             $5,
             'PENDIENTE',
             false,
             $6,
             CURRENT_TIMESTAMP
           )
           RETURNING
             id,
             codigo,
             mesa_id,
             restaurante_id,
             sesion_cliente_id,
             estado,
             total,
             observaciones,
             creado_en,
             actualizado_en`,
          [
            codigo,
            sesion.mesa_id,
            total,
            sesion.restaurante_id,
            sesion.id,
            observaciones.trim() || null,
          ]
        );

      pedido = resultadoNuevoPedido.rows[0];
      pedidoCreado = true;
    }

    for (const item of detalleValidado) {
      await client.query(
        `INSERT INTO detalle_pedido (
           pedido_id,
           producto_id,
           cantidad,
           precio_unitario
         )
         VALUES ($1, $2, $3, $4)`,
        [
          pedido.id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(pedidoCreado ? 201 : 200).json({
      mensaje: pedidoCreado
        ? "Pedido temporal creado correctamente."
        : "Pedido temporal actualizado correctamente.",
      pedido: {
        ...pedido,
        total,
        productos: detalleValidado,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Error al guardar pedido temporal:",
      error
    );

    return res.status(500).json({
      error:
        "No se pudo guardar el pedido temporal.",
    });
  } finally {
    client.release();
  }
});
// ==========================
// VALIDACIÓN DE PAGOS (MG-60)
// ==========================
app.patch("/api/pedidos/:id/confirmar-pago", async (req, res) => {
  const pedidoId = Number(req.params.id);

  const {
    tokenSesion,
    metodoPago,
    comprobante = null,
  } = req.body || {};

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return res.status(400).json({
      error: "El identificador del pedido no es válido.",
    });
  }

  if (
    !tokenSesion ||
    typeof tokenSesion !== "string" ||
    tokenSesion.trim() === ""
  ) {
    return res.status(400).json({
      error: "La sesión temporal es requerida.",
    });
  }

  const metodosPermitidos = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
  };

  const metodoNormalizado = String(metodoPago || "")
    .trim()
    .toUpperCase();

  const metodoGuardado =
    metodosPermitidos[metodoNormalizado];

  if (!metodoGuardado) {
    return res.status(400).json({
      error:
        "Método de pago no válido. Use Efectivo o Tarjeta.",
    });
  }

  if (
    comprobante !== null &&
    (
      typeof comprobante !== "string" ||
      comprobante.trim().length > 255
    )
  ) {
    return res.status(400).json({
      error:
        "El comprobante no puede superar 255 caracteres.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Expirar la sesión cuando ya terminó su vigencia.
    await client.query(
      `UPDATE sesiones_cliente
       SET estado = 'EXPIRADA'
       WHERE token = $1
         AND estado = 'ACTIVA'
         AND expira_en IS NOT NULL
         AND expira_en <= CURRENT_TIMESTAMP`,
      [tokenSesion.trim()]
    );

    // Buscar el pedido y comprobar que pertenece a la sesión.
    const resultadoPedido = await client.query(
      `SELECT
         p.id,
         p.codigo,
         p.estado,
         p.estado_pago,
         p.pago_validado,
         p.total,
         p.mesa_id,
         p.restaurante_id,
         p.sesion_cliente_id
       FROM pedidos p
       JOIN sesiones_cliente sc
         ON sc.id = p.sesion_cliente_id
       WHERE p.id = $1
         AND sc.token = $2
         AND sc.estado = 'ACTIVA'
         AND (
           sc.expira_en IS NULL
           OR sc.expira_en > CURRENT_TIMESTAMP
         )
       FOR UPDATE OF p, sc`,
      [
        pedidoId,
        tokenSesion.trim(),
      ]
    );

    if (resultadoPedido.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error:
          "El pedido no existe, no pertenece a la sesión o la sesión expiró.",
      });
    }

    const pedido = resultadoPedido.rows[0];

    // Evitar que un pedido sea pagado dos veces.
    if (
      pedido.pago_validado === true ||
      String(pedido.estado_pago).toUpperCase() === "PAGADO"
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "El pago de este pedido ya fue confirmado.",
      });
    }

    // Solo se pueden confirmar pedidos temporales.
    if (pedido.estado !== "TEMPORAL") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error:
          `No se puede pagar un pedido en estado "${pedido.estado}".`,
      });
    }

    if (Number(pedido.total) <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "El pedido no tiene un total válido.",
      });
    }

    // Confirmar pago y enviar el pedido a cocina.
    const resultadoActualizacion = await client.query(
      `UPDATE pedidos
       SET metodo_pago = $1,
           estado_pago = 'PAGADO',
           pago_validado = true,
           estado = 'Nuevo',
           comprobante = $2,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING
         id,
         codigo,
         mesa_id,
         estado,
         estado_pago,
         metodo_pago,
         pago_validado,
         total,
         comprobante,
         actualizado_en`,
      [
        metodoGuardado,
        comprobante?.trim() || null,
        pedidoId,
      ]
    );

    // La mesa queda ocupada al confirmar el pedido.
    await client.query(
      `UPDATE mesas
       SET disponible = false
       WHERE id = $1
         AND restaurante_id = $2`,
      [
        pedido.mesa_id,
        pedido.restaurante_id,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      mensaje:
        "Pago confirmado. El pedido fue enviado a cocina.",
      pedido: resultadoActualizacion.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al confirmar el pago:", error);

    return res.status(500).json({
      error: "No se pudo confirmar el pago del pedido.",
    });
  } finally {
    client.release();
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
      `SELECT
          dp.id,
          pr.id AS producto_id,
          pr.nombre,
          pr.categoria,
          dp.cantidad,
          dp.precio_unitario,
          (dp.cantidad * dp.precio_unitario) AS subtotal
      FROM detalle_pedido dp
      JOIN productos pr
        ON pr.id = dp.producto_id
      WHERE dp.pedido_id = $1
      ORDER BY
        COALESCE(pr.categoria, ''),
        pr.nombre`,
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
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen AS foto, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.restaurante_id = $1 AND p.disponible = true
       ORDER BY c.nombre, p.nombre`,
      [mesa.restaurante_id]
    );

    const resRestaurante = await pool.query(
      "SELECT nombre, logo, banner, color_primario FROM restaurantes WHERE id = $1",
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
      `SELECT u.id, u.nombre, u.correo, u.estado, u.foto, u.telefono,
              u.created_at AS fecha_ingreso, r.nombre AS rol
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
// PERSONAL: subir/reemplazar la foto de un empleado (la sube el ADMIN,
// a diferencia de /api/mi-perfil/foto que cada quien usa para sí mismo).
// ==========================
app.post(
  "/api/personal/:id/foto",
  verificarToken,
  verificarRol("ADMIN"),
  (req, res) => {
    uploadFotoEmpleado.single("foto")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo subir la foto." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo." });
      }
 
      const { id } = req.params;
      const rutaPublica = `/uploads/restaurantes/${req.usuario.restaurante_id}/personal/${req.file.filename}`;
 
      try {
        const anterior = await pool.query(
          "SELECT foto FROM usuarios WHERE id = $1 AND restaurante_id = $2",
          [id, req.usuario.restaurante_id]
        );
 
        if (anterior.rows.length === 0) {
          return res.status(404).json({ error: "Empleado no encontrado." });
        }
 
        const result = await pool.query(
          "UPDATE usuarios SET foto = $1 WHERE id = $2 AND restaurante_id = $3 RETURNING id, nombre, foto",
          [rutaPublica, id, req.usuario.restaurante_id]
        );
 
        borrarArchivoAnterior(anterior.rows[0]?.foto);
 
        res.json({ mensaje: "Foto actualizada correctamente.", empleado: result.rows[0] });
      } catch (dbErr) {
        console.error(dbErr);
        res.status(500).json({ error: "Error al guardar la foto en la base de datos." });
      }
    });
  }
);

// ==========================
// CONFIGURACIÓN DEL RESTAURANTE (MG-47, MG-56)
// Ficha del restaurante del admin autenticado: nombre, sucursal,
// dirección, contacto, horario, identidad visual (logo/banner/color)
// y estado del local. Nada de esto se comparte entre restaurantes —
// siempre se filtra por restaurante_id.
// ==========================
app.get(
  "/api/restaurante",
  verificarToken,
  // MG-56: cualquier rol necesita poder leer el logo/color para pintar
  // el sidebar; solo ADMIN puede editar (ver PUT/POST más abajo).
  verificarRol("ADMIN", "COCINERO", "DESPACHADOR"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, nombre, sucursal, direccion, ruc, correo, telefono,
                responsable, hora_apertura, hora_cierre, estado,
                logo, banner, color_primario
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
  }
);

app.put("/api/restaurante", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  const {
    nombre, sucursal, direccion, correo, telefono,
    responsable, hora_apertura, hora_cierre, estado, color_primario,
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
  // MG-56: color principal de la identidad visual, en formato hex (#RRGGBB).
  if (color_primario && !/^#[0-9A-Fa-f]{6}$/.test(color_primario)) {
    return res.status(400).json({ error: "El color principal debe ser un hex válido, ej: #ff7a1a." });
  }

  try {
    const result = await pool.query(
      `UPDATE restaurantes
       SET nombre=$1, sucursal=$2, direccion=$3, correo=$4, telefono=$5,
           responsable=$6, hora_apertura=$7, hora_cierre=$8, estado=$9,
           color_primario=$10
       WHERE id=$11
       RETURNING id, nombre, sucursal, direccion, ruc, correo, telefono,
                 responsable, hora_apertura, hora_cierre, estado,
                 logo, banner, color_primario`,
      [
        nombre, sucursal || null, direccion, correo || null, telefono || null,
        responsable || null, hora_apertura || null, hora_cierre || null,
        estado || "Abierto", color_primario || "#ff7a1a", req.usuario.restaurante_id,
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

// MG-56: subir/reemplazar el logo del restaurante.
app.post(
  "/api/restaurante/logo",
  verificarToken,
  verificarRol("ADMIN"),
  (req, res) => {
    uploadLogo.single("logo")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo subir el logo." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo." });
      }
      try {
        const rutaPublica = `/uploads/restaurantes/${req.usuario.restaurante_id}/${req.file.filename}`;

        const anterior = await pool.query(
          "SELECT logo FROM restaurantes WHERE id = $1",
          [req.usuario.restaurante_id]
        );

        const result = await pool.query(
          "UPDATE restaurantes SET logo = $1 WHERE id = $2 RETURNING logo",
          [rutaPublica, req.usuario.restaurante_id]
        );

        borrarArchivoAnterior(anterior.rows[0]?.logo);

        res.json({ mensaje: "Logo actualizado correctamente.", logo: result.rows[0].logo });
      } catch (dbErr) {
        console.error(dbErr);
        res.status(500).json({ error: "Error al guardar el logo en la base de datos." });
      }
    });
  }
);

// MG-56: subir/reemplazar el banner del restaurante.
app.post(
  "/api/restaurante/banner",
  verificarToken,
  verificarRol("ADMIN"),
  (req, res) => {
    uploadBanner.single("banner")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo subir el banner." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo." });
      }
      try {
        const rutaPublica = `/uploads/restaurantes/${req.usuario.restaurante_id}/${req.file.filename}`;

        const anterior = await pool.query(
          "SELECT banner FROM restaurantes WHERE id = $1",
          [req.usuario.restaurante_id]
        );

        const result = await pool.query(
          "UPDATE restaurantes SET banner = $1 WHERE id = $2 RETURNING banner",
          [rutaPublica, req.usuario.restaurante_id]
        );

        borrarArchivoAnterior(anterior.rows[0]?.banner);

        res.json({ mensaje: "Banner actualizado correctamente.", banner: result.rows[0].banner });
      } catch (dbErr) {
        console.error(dbErr);
        res.status(500).json({ error: "Error al guardar el banner en la base de datos." });
      }
    });
  }
);

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

// MG-68: completa un pedido y libera la mesa únicamente
// cuando ya no existen otros pedidos activos asociados a ella.
app.patch(
  "/api/entregas/:id/completar",
  verificarToken,
  verificarRol("ADMIN", "DESPACHADOR"),
  async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resPedido = await client.query(
        `SELECT id, mesa_id
         FROM pedidos
         WHERE id = $1
           AND restaurante_id = $2
           AND estado = 'Entregado'
         FOR UPDATE`,
        [id, req.usuario.restaurante_id]
      );

      if (resPedido.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          error: "El pedido no está en estado Entregado.",
        });
      }

      const mesaId = resPedido.rows[0].mesa_id;

      // Bloquear temporalmente la mesa para mantener
      // consistente su estado durante la transacción.
      await client.query(
        `SELECT id
         FROM mesas
         WHERE id = $1
           AND restaurante_id = $2
         FOR UPDATE`,
        [mesaId, req.usuario.restaurante_id]
      );

      await client.query(
        `UPDATE pedidos
         SET estado = 'Completado',
             actualizado_en = NOW()
         WHERE id = $1
           AND restaurante_id = $2`,
        [id, req.usuario.restaurante_id]
      );

      // Verificar si la mesa todavía tiene otros pedidos activos.
      const resPedidosActivos = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM pedidos
         WHERE mesa_id = $1
           AND restaurante_id = $2
           AND id <> $3
           AND pago_validado = true
           AND estado NOT IN (
             'Completado',
             'Cancelado',
             'No entregado'
           )`,
        [mesaId, req.usuario.restaurante_id, id]
      );

      const pedidosActivos = Number(
        resPedidosActivos.rows[0].total
      );

      const mesaLiberada = pedidosActivos === 0;

      if (mesaLiberada) {
        await client.query(
          `UPDATE mesas
           SET disponible = true
           WHERE id = $1
             AND restaurante_id = $2`,
          [mesaId, req.usuario.restaurante_id]
        );

        await client.query(
          `UPDATE sesiones_cliente
           SET estado = 'FINALIZADA'
           WHERE mesa_id = $1
             AND restaurante_id = $2
             AND estado = 'ACTIVA'`,
          [mesaId, req.usuario.restaurante_id]
        );
      } else {
        // Mantener la mesa ocupada mientras tenga pedidos activos.
        await client.query(
          `UPDATE mesas
           SET disponible = false
           WHERE id = $1
             AND restaurante_id = $2`,
          [mesaId, req.usuario.restaurante_id]
        );
      }

      await client.query("COMMIT");

      return res.json({
        mensaje: mesaLiberada
          ? "Servicio completado. Mesa liberada."
          : `Pedido completado. La mesa continúa ocupada porque tiene ${pedidosActivos} pedido${
              pedidosActivos === 1 ? "" : "s"
            } activo${pedidosActivos === 1 ? "" : "s"}.`,
        mesa_liberada: mesaLiberada,
        pedidos_activos: pedidosActivos,
      });
    } catch (err) {
      await client.query("ROLLBACK");

      console.error(
        "Error al completar el servicio:",
        err
      );

      return res.status(500).json({
        error: "Error al completar el servicio.",
      });
    } finally {
      client.release();
    }
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend MesaGo corriendo en http://localhost:${PORT}`);
});