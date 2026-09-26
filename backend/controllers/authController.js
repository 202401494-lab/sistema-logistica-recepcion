const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
require('../models/Role');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    // El frontend envía las credenciales dentro del cuerpo JSON de la solicitud.
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
    }

    // Se normaliza el correo porque el esquema lo almacena en minúsculas.
    // populate('roles') reemplaza los ObjectId por documentos completos de Role.
    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).populate('roles');

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'La cuenta se encuentra inactiva' });
    }

    // Comparación asíncrona (no bloqueante) del password contra el hash guardado
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    // Para esta actividad cada usuario de prueba tiene un solo rol asignado,
    // aunque el esquema soporta muchos a muchos (arreglo de roles).
    const rolPrincipal = usuario.roles.length > 0 ? usuario.roles[0].nombre : null;

    // Payload SIN información sensible (nunca incluir el password)
    const payload = {
      id: usuario._id,
      email: usuario.email,
      rol: rolPrincipal,
      // Permite registrar el nombre completo sin consultar al usuario en cada operación.
      nombreCompleto: `${usuario.nombres} ${usuario.apellidosCompleto}`.trim(),
    };

    // El token dura 24 horas y será enviado al navegador para las siguientes solicitudes.
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombres: usuario.nombres,
        email: usuario.email,
        rol: rolPrincipal,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { login };
