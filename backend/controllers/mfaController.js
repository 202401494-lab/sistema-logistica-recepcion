const speakeasy = require('speakeasy');
const Usuario = require('../models/Usuario');
const { crearTokenAcceso } = require('../services/authTokens');

const obtenerUsuarioPendiente = (id) =>
  Usuario.findById(id).select('+twoFactorSecret');

const configurarMfa = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioPendiente(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'La cuenta se encuentra inactiva' });
    }

    if (!usuario.mfaObligatorio || usuario.twoFactorEnabled) {
      return res.status(409).json({ mensaje: 'La cuenta no requiere enrolamiento MFA' });
    }

    const issuer = process.env.MFA_ISSUER || 'Sistema Logística';
    const secreto = speakeasy.generateSecret({
      length: 20,
      name: `${issuer}:${usuario.email}`,
      issuer,
    });

    await Usuario.findByIdAndUpdate(usuario._id, {
      $set: { twoFactorSecret: secreto.base32 },
    });

    return res.status(200).json({
      mensaje: 'Escanea el código QR con tu aplicación de autenticación',
      otpauthUrl: secreto.otpauth_url,
    });
  } catch (error) {
    console.error('Error al generar configuración MFA:', error);
    return res.status(500).json({ mensaje: 'Error interno al configurar MFA' });
  }
};

const activarMfa = async (req, res) => {
  const { code } = req.body;

  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ mensaje: 'El código MFA debe contener 6 dígitos' });
  }

  try {
    const usuario = await obtenerUsuarioPendiente(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'La cuenta se encuentra inactiva' });
    }

    if (!usuario.mfaObligatorio || usuario.twoFactorEnabled || !usuario.twoFactorSecret) {
      return res.status(409).json({ mensaje: 'No existe un enrolamiento MFA pendiente' });
    }

    const codigoValido = speakeasy.totp.verify({
      secret: usuario.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!codigoValido) {
      return res.status(401).json({ mensaje: 'El código MFA es inválido o expiró' });
    }

    const resultado = await Usuario.updateOne(
      {
        _id: usuario._id,
        mfaObligatorio: true,
        twoFactorEnabled: false,
        twoFactorSecret: usuario.twoFactorSecret,
      },
      { $set: { twoFactorEnabled: true } },
    );

    if (resultado.modifiedCount !== 1) {
      return res.status(409).json({ mensaje: 'El enrolamiento MFA cambió; inicia sesión de nuevo' });
    }

    return res.status(200).json({
      mensaje: 'Autenticación multifactor activada correctamente',
      twoFactorEnabled: true,
    });
  } catch (error) {
    console.error('Error al activar MFA:', error);
    return res.status(500).json({ mensaje: 'Error interno al activar MFA' });
  }
};

const verificarCodigoLogin = async (req, res) => {
  const { code } = req.body;

  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ mensaje: 'El código MFA debe contener 6 dígitos' });
  }

  try {
    const usuario = await obtenerUsuarioPendiente(req.usuario.id).populate('roles');

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'La cuenta se encuentra inactiva' });
    }

    if (!usuario.twoFactorEnabled || !usuario.twoFactorSecret) {
      return res.status(409).json({
        mensaje: 'La autenticación multifactor todavía no está configurada',
        mfaSetupRequired: true,
      });
    }

    const codigoValido = speakeasy.totp.verify({
      secret: usuario.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!codigoValido) {
      return res.status(401).json({ mensaje: 'El código MFA es inválido o expiró' });
    }

    const rolPrincipal = usuario.roles.length > 0 ? usuario.roles[0].nombre : null;
    const token = crearTokenAcceso(usuario, rolPrincipal);

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
    console.error('Error al verificar código MFA:', error);
    return res.status(500).json({ mensaje: 'Error interno al verificar MFA' });
  }
};

module.exports = { configurarMfa, activarMfa, verificarCodigoLogin };
