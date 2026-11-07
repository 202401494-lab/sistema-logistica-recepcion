// Script para poblar la base de datos con los 3 roles y un usuario
// de prueba por cada rol. Ejecutar UNA vez con: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Role = require('./models/Role');
const Usuario = require('./models/Usuario');
const Gateway = require('./models/Gateway');
const { PERMISOS_PREDETERMINADOS } = require('./services/permisosRoles');

const rolesData = [
  { nombreRol: 'administrador', nombre: 'administrador', descripcion: 'Control total del sistema', permisos: PERMISOS_PREDETERMINADOS.administrador },
  { nombreRol: 'coordinador', nombre: 'coordinador', descripcion: 'Supervisión de operaciones', permisos: PERMISOS_PREDETERMINADOS.coordinador },
  { nombreRol: 'operador', nombre: 'operador', descripcion: 'Ejecución de tareas operativas', permisos: PERMISOS_PREDETERMINADOS.operador },
];

const usuariosData = [
  { nombres: 'Ana', apellidosCompleto: 'Martínez López', email: 'admin@test.com', passwordPlano: 'Admin123', rol: 'administrador' },
  { nombres: 'Carlos', apellidosCompleto: 'Pérez Gómez', email: 'coordinador@test.com', passwordPlano: 'Coord123', rol: 'coordinador' },
  { nombres: 'Luis', apellidosCompleto: 'Ramírez Cruz', email: 'operador@test.com', passwordPlano: 'Oper123', rol: 'operador' },
];

const seed = async () => {
  // El seed usa la conexión configurada en MONGO_URI para crear datos de prueba.
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB para seed');

  const rolesCreados = [];
  for (const datosRol of rolesData) {
    let rol = await Role.findOne({
      $or: [{ nombreRol: datosRol.nombreRol }, { nombre: datosRol.nombreRol }],
    }).collation({ locale: 'es', strength: 2 });
    if (!rol) {
      rol = await Role.create({
        ...datosRol,
        activo: true,
        usuarioCreacion: 'sistema',
        usuarioActualizacion: 'sistema',
      });
    } else {
      const datosGuardados = await Role.collection.findOne(
        { _id: rol._id },
        { projection: { permisos: 1, activo: 1 } },
      );
      rol.nombreRol = rol.nombreRol || datosRol.nombreRol;
      rol.nombre = rol.nombre || datosRol.nombre;
      rol.descripcion = rol.descripcion || datosRol.descripcion;
      if (!Object.hasOwn(datosGuardados || {}, 'permisos')) rol.permisos = datosRol.permisos;
      if (!Object.hasOwn(datosGuardados || {}, 'activo')) rol.activo = true;
      await rol.save();
    }
    rolesCreados.push(rol);
  }
  console.log('Roles iniciales creados o actualizados:', rolesCreados.map((r) => r.nombreRol).join(', '));

  for (const u of usuariosData) {
    const rolDoc = rolesCreados.find((r) => r.nombreRol === u.rol);
    const passwordHash = await bcrypt.hash(u.passwordPlano, 10);
    await Usuario.updateOne(
      { email: u.email },
      {
        $setOnInsert: {
          nombres: u.nombres,
          apellidosCompleto: u.apellidosCompleto,
          email: u.email,
          password: passwordHash,
          roles: [rolDoc._id],
          estado: 'activo',
        },
      },
      { upsert: true },
    );
    console.log(`Usuario creado o conservado -> email: ${u.email}`);
  }

  for (const numeroGateway of [1, 2, 3, 4, 5]) {
    await Gateway.updateOne(
      { numeroGateway },
      {
        $setOnInsert: {
          numeroGateway,
          tipoCargaPermitida: numeroGateway === 5 ? 'construcción' : 'general',
          estado: 'LIBRE',
          usuarioCreacion: 'sistema',
        },
      },
      { upsert: true },
    );
  }

  console.log('Seed completado');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
