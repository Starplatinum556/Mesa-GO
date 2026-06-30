const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
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

// Probar conexión al iniciar
pool.connect()
  .then(() => console.log("Conectado a PostgreSQL (base: mesago)"))
  .catch((err) => console.error("Error al conectar a PostgreSQL:", err.message));

// ==========================
// LOGIN
// ==========================
app.post("/api/login", async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.correo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.correo = $1 AND u.password = $2`,
      [correo, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ==========================
// MESAS
// ==========================
app.get("/api/mesas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM mesas ORDER BY numero");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener mesas" });
  }
});

// ==========================
// PRODUCTOS
// ==========================
app.get("/api/productos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend MesaGo corriendo en http://localhost:${PORT}`);
});