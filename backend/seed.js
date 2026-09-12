// Script para poblar la base de datos con los 3 roles y un usuario
// de prueba por cada rol. Ejecutar UNA vez con: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Role = require('./models/Role');
const Usuario = require('./models/Usuario');

const rolesData = [
  { nombre: 'administrador', descripcion: 'Control total del sistema' },
  { nombre: 'coordinador', descripcion: 'Supervisión de operaciones' },
  { nombre: 'operador', descripcion: 'Ejecución de tareas operativas' },
];

const usuariosData = [
  { nombres: 'Ana', apellidosCompleto: 'Martínez López', email: 'admin@test.com', passwordPlano: 'Admin123', rol: 'administrador' },
  { nombres: 'Carlos', apellidosCompleto: 'Pérez Gómez', email: 'coordinador@test.com', passwordPlano: 'Coord123', rol: 'coordinador' },
  { nombres: 'Luis', apellidosCompleto: 'Ramírez Cruz', email: 'operador@test.com', passwordPlano: 'Oper123', rol: 'operador' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB para seed');

  await Role.deleteMany({});
  const rolesCreados = await Role.insertMany(rolesData);
  console.log('Roles creados:', rolesCreados.map((r) => r.nombre).join(', '));

  await Usuario.deleteMany({});

  for (const u of usuariosData) {
    const rolDoc = rolesCreados.find((r) => r.nombre === u.rol);
    const passwordHash = await bcrypt.hash(u.passwordPlano, 10);
    await Usuario.create({
      nombres: u.nombres,
      apellidosCompleto: u.apellidosCompleto,
      email: u.email,
      password: passwordHash,
      roles: [rolDoc._id],
      estado: 'activo',
    });
    console.log(`Usuario creado -> email: ${u.email} | password: ${u.passwordPlano}`);
  }

  console.log('Seed completado');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
