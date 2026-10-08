const mongoose = require('mongoose');

const ejecutarTransaccion = async (operacion) => {
  const session = await mongoose.startSession();
  try {
    let resultado;
    await session.withTransaction(async () => {
      resultado = await operacion(session);
    });
    return resultado;
  } finally {
    await session.endSession();
  }
};

module.exports = ejecutarTransaccion;