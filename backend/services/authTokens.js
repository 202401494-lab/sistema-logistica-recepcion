const jwt = require('jsonwebtoken');
const { obtenerNombreRol, obtenerPermisosUsuario } = require('./permisosRoles');

const crearTokenTemporalMfa = (usuario) =>
  jwt.sign(
    { id: String(usuario._id), type: 'MFA_TEMP' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' },
  );

const crearTokenAcceso = (usuario, rol) =>
  jwt.sign(
    {
      id: String(usuario._id),
      email: usuario.email,
      rol,
      roles: (usuario.roles || []).map(obtenerNombreRol).filter(Boolean),
      permisos: obtenerPermisosUsuario(usuario),
      nombreCompleto: `${usuario.nombres} ${usuario.apellidosCompleto}`.trim(),
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );

module.exports = { crearTokenTemporalMfa, crearTokenAcceso };
