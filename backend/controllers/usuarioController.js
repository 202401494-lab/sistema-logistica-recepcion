const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

const listarUsuarios = async (req, res) => {
  const pagina = req.query?.pagina === undefined ? 1 : Number(req.query.pagina);
  const limiteSolicitado = req.query?.limite === undefined ? 10 : Number(req.query.limite);

  if (!Number.isInteger(pagina) || !Number.isInteger(limiteSolicitado)
    || pagina < 1 || limiteSolicitado < 1) {
    return res.status(400).json({ mensaje: 'pagina y limite deben ser enteros positivos' });
  }

  const limite = Math.min(limiteSolicitado, 50);
  const salto = (pagina - 1) * limite;

  try {
    const [usuarios, total] = await Promise.all([
      Usuario.find({})
        .select('_id nombres apellidosCompleto email roles estado mfaObligatorio twoFactorEnabled createdAt')
        .populate('roles', 'nombre')
        .sort({ createdAt: -1, _id: -1 })
        .skip(salto)
        .limit(limite)
        .lean(),
      Usuario.countDocuments({}),
    ]);

    return res.status(200).json({
      usuarios,
      paginacion: {
        pagina,
        limite,
        total,
        paginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ mensaje: 'Error interno al listar usuarios' });
  }
};

const actualizarMfaObligatorio = async (req, res) => {
  const { id } = req.params;
  const { mfaObligatorio } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido' });
  }

  if (typeof mfaObligatorio !== 'boolean') {
    return res.status(400).json({ mensaje: 'mfaObligatorio debe ser un valor booleano' });
  }

  try {
    const cambios = mfaObligatorio
      ? { $set: { mfaObligatorio: true } }
      : {
        $set: {
          mfaObligatorio: false,
          twoFactorEnabled: false,
          twoFactorRecoveryCodes: [],
        },
        $unset: { twoFactorSecret: 1 },
      };
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      cambios,
      { new: true, runValidators: true },
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      mensaje: mfaObligatorio ? 'MFA activado para el usuario' : 'MFA desactivado para el usuario',
      usuario: {
        id: usuario._id,
        email: usuario.email,
        mfaObligatorio: usuario.mfaObligatorio,
        twoFactorEnabled: usuario.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Error al actualizar el requisito MFA del usuario:', error);
    return res.status(500).json({ mensaje: 'Error interno al actualizar MFA del usuario' });
  }
};

module.exports = { listarUsuarios, actualizarMfaObligatorio };
