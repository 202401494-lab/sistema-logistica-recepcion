const jwt = require('jsonwebtoken');

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
      nombreCompleto: `${usuario.nombres} ${usuario.apellidosCompleto}`.trim(),
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );

module.exports = { crearTokenTemporalMfa, crearTokenAcceso };
