const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  database: process.env.DB_NAME || "mesago",
  password: process.env.DB_PASSWORD || "postgres",
  port: Number(process.env.DB_PORT) || 5433,
});

// ==========================
// VERIFICAR CONEXIÓN
// ==========================

pool
  .connect()
  .then((client) => {
    console.log(
      `Conectado a PostgreSQL (base: ${process.env.DB_NAME || "mesago"})`
    );

    client.release();
  })
  .catch((err) => {
    console.error("Error al conectar a PostgreSQL:", err.message);
  });

// ==========================
// RUTA DE PRUEBA
// ==========================

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend MesaGo funcionando correctamente",
  });
});

// ==========================
// LOGIN
// ==========================

app.post("/api/login", async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      error: "Correo y contraseña son requeridos",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.correo,
        r.nombre AS rol
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.correo = $1
        AND u.password = $2
      `,
      [correo, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Correo o contraseña incorrectos",
      });
    }

    return res.json({
      mensaje: "Inicio de sesión correcto",
      usuario: result.rows[0],
    });
  } catch (err) {
    console.error("Error en login:", err.message);

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

// ==========================
// MESAS
// ==========================

app.get("/api/mesas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        numero,
        zona,
        capacidad,
        disponible,
        estado,
        qr_codigo
      FROM mesas
      ORDER BY numero
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener mesas:", err.message);

    return res.status(500).json({
      error: "Error al obtener mesas",
    });
  }
});

// ==========================
// PRODUCTOS
// ==========================

app.get("/api/productos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nombre,
        descripcion,
        categoria,
        precio,
        disponible,
        created_at
      FROM productos
      ORDER BY id
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener productos:", err.message);

    return res.status(500).json({
      error: "Error al obtener productos",
    });
  }
});

// ==========================
// PEDIDOS
// ==========================

app.get("/api/pedidos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.codigo,
        m.numero AS mesa,
        m.zona,
        p.estado,
        p.metodo_pago,
        p.total,
        p.fecha_creacion,
        STRING_AGG(
          pr.nombre || ' x' || dp.cantidad::text,
          ', '
          ORDER BY dp.id
        ) AS productos,
        COALESCE(SUM(dp.cantidad), 0)::INTEGER AS cantidad_productos
      FROM pedidos p
      INNER JOIN mesas m
        ON p.mesa_id = m.id
      LEFT JOIN detalles_pedido dp
        ON dp.pedido_id = p.id
      LEFT JOIN productos pr
        ON pr.id = dp.producto_id
      GROUP BY
        p.id,
        p.codigo,
        m.numero,
        m.zona,
        p.estado,
        p.metodo_pago,
        p.total,
        p.fecha_creacion
      ORDER BY p.fecha_creacion DESC
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener pedidos:", err.message);

    return res.status(500).json({
      error: "Error al obtener pedidos",
    });
  }
});

// ==========================
// MANEJO DE RUTAS INEXISTENTES
// ==========================

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

// ==========================
// INICIAR SERVIDOR
// ==========================

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Backend MesaGo corriendo en http://localhost:${PORT}`);
});