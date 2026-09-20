// ============================================================
// SERVIDOR PRINCIPAL DEL BACKEND
// ============================================================
// Este archivo levanta la API de Express y registra todas las rutas
// del sistema. Aquí también se inicializa la conexión a MongoDB.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const logisticaRoutes = require('./routes/logisticaRoutes');

const app = express();

// ------------------------------------------------------------
// CONFIGURACIÓN GLOBAL
// ------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------
// BASE DE DATOS
// ------------------------------------------------------------
conectarDB();

// ------------------------------------------------------------
// RUTAS PÚBLICAS
// ------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api', logisticaRoutes);

// ------------------------------------------------------------
// RUTAS PROTEGIDAS
// ------------------------------------------------------------
// Aquí van los endpoints que requieren JWT válido.
app.use('/api', protectedRoutes);

// ------------------------------------------------------------
// ARRANQUE DEL SERVIDOR
// ------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
