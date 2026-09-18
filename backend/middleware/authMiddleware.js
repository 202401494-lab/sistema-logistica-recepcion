// ============================================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ============================================================
// Este archivo valida que el cliente envíe un token válido en el
// header Authorization: Bearer <token> antes de permitir el acceso
// a rutas protegidas del backend.

const jwt = require('jsonwebtoken');

// Verifica y decodifica el token JWT enviado por el cliente
const verificarToken = (req, res, next) => {
  try {
    // El cliente debe enviar: Authorization: Bearer <token>.
    const headerAuth = req.headers.authorization || '';
    const token = headerAuth.startsWith('Bearer ') ? headerAuth.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        mensaje: 'No se envió un token de acceso. Usa el formato: Bearer <token>',
      });
    }

    // verify comprueba la firma y también la fecha de expiración del JWT.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos la información del usuario decodificada para usarla
    // en cualquier ruta protegida posterior.
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token inválido o expirado',
      detalle: error.message,
    });
  }
};

// Permite bloquear rutas por uno o varios roles específicos
const autorizarRoles = (...rolesPermitidos) => {
  // Se devuelve un middleware configurado con los roles que pueden usar la ruta.
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.rol) {
      return res.status(401).json({ mensaje: 'No se pudo identificar el usuario en el token' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para acceder a este recurso',
      });
    }

    next();
  };
};

module.exports = {
  verificarToken,
  autorizarRoles,
};
