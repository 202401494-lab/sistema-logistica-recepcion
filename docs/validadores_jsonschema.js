// =====================================================================
// SumaControl - Validadores $jsonSchema (sustituyen a schema.sql)
// Derivados de los esquemas Mongoose en backend/models
// Ejecución: mongosh "<MONGO_URI>" validadores_jsonschema.js
// =====================================================================

const ESTADOS_REGISTRO = ["activo", "inactivo"];
const TIPOS_CARGA = ["construcción", "general"];

// Campos que agrega el plugin de auditoría (auditoriaSoftDelete.js)
// a proveedores, pedidos, gateways, descargas y parametros.
const AUDITORIA = {
  activo: { bsonType: "bool", description: "Borrado lógico (default true)" },
  usuarioCreacion: { bsonType: "string", description: "Usuario que creó el registro" },
  usuarioActualizacion: { bsonType: "string", description: "Último usuario que lo modificó" },
  fechaCreacion: { bsonType: "date" },
  fechaActualizacion: { bsonType: "date" },
  createdAt: { bsonType: "date" },
  updatedAt: { bsonType: "date" }
};

const esquemas = {

  // ---------------------------------------------------------------- roles
  roles: {
    bsonType: "object",
    required: ["nombre"],
    properties: {
      nombre: { enum: ["administrador", "coordinador", "operador"] },
      descripcion: { bsonType: "string" }
    }
  },

  // ------------------------------------------------------------- usuarios
  usuarios: {
    bsonType: "object",
    required: ["nombres", "apellidosCompleto", "email", "password"],
    properties: {
      nombres: { bsonType: "string" },
      apellidosCompleto: { bsonType: "string" },
      email: { bsonType: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
      password: { bsonType: "string", description: "Contraseña almacenada cifrada" },
      roles: { bsonType: "array", items: { bsonType: "objectId" }, description: "Referencias a roles._id" },
      mfaObligatorio: { bsonType: "bool" },
      twoFactorSecret: { bsonType: "string" },
      twoFactorEnabled: { bsonType: "bool" },
      twoFactorRecoveryCodes: { bsonType: "array", items: { bsonType: "string" } },
      estado: { enum: ESTADOS_REGISTRO },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  },

  // ---------------------------------------------------------- proveedores
  proveedores: {
    bsonType: "object",
    required: ["razonSocial", "identificacionTributaria", "categoria",
               "contactoNombre", "telefono", "emailContacto"],
    properties: Object.assign({
      razonSocial: { bsonType: "string" },
      // Alinear el patrón con la regex exacta del modelo Proveedor
      identificacionTributaria: { bsonType: "string", pattern: "^[A-Za-z0-9-]+$" },
      categoria: { enum: TIPOS_CARGA },
      contactoNombre: { bsonType: "string" },
      telefono: { bsonType: "string" },
      emailContacto: { bsonType: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
      estado: { enum: ESTADOS_REGISTRO }
    }, AUDITORIA)
  },

  // -------------------------------------------------------------- pedidos
  pedidos: {
    bsonType: "object",
    required: ["numeroPedido", "proveedorId", "tipoProducto", "fechaHoraProgramada",
               "inicioVentana", "finVentana", "duracionEstimadaMinutos"],
    properties: Object.assign({
      numeroPedido: { bsonType: "string", description: "Autogenerado con contadores" },
      proveedorId: { bsonType: "objectId", description: "Referencia a proveedores._id" },
      tipoProducto: { enum: TIPOS_CARGA },
      fechaHoraProgramada: { bsonType: "date" },
      inicioVentana: { bsonType: "date" },
      finVentana: { bsonType: "date" },
      fechaHoraLlegadaReal: { bsonType: "date" },
      fechaHoraIngresoCola: { bsonType: "date" },
      minutosEnEspera: { bsonType: ["int", "long", "double"], minimum: 0 },
      prioridadCalculada: { bsonType: ["int", "long", "double"] },
      estadoPuntualidad: { enum: ["A tiempo", "Anticipado", "Tardío", "Ausente"] },
      enEspera: { bsonType: "bool" },
      duracionEstimadaMinutos: { bsonType: ["int", "long", "double"], minimum: 1 },
      estado: {
        enum: ["PROGRAMADO", "A TIEMPO", "ANTICIPADO", "TARDÍO", "AUSENTE",
               "EN COLA", "DESCARGANDO", "FINALIZADO", "CANCELADO"]
      }
    }, AUDITORIA)
  },

  // ------------------------------------------------------------- gateways
  gateways: {
    bsonType: "object",
    required: ["numeroGateway", "tipoCargaPermitida", "estado"],
    properties: Object.assign({
      numeroGateway: { bsonType: ["int", "long", "double"], minimum: 1, maximum: 5 },
      tipoCargaPermitida: { enum: TIPOS_CARGA },
      estado: { enum: ["LIBRE", "OCUPADO", "FUERA DE SERVICIO"] }
    }, AUDITORIA),
    // RN-07 / RN-08: gateways 1-4 carga general; el 5 exclusivo de construcción
    oneOf: [
      { properties: { numeroGateway: { minimum: 1, maximum: 4 }, tipoCargaPermitida: { enum: ["general"] } } },
      { properties: { numeroGateway: { minimum: 5, maximum: 5 }, tipoCargaPermitida: { enum: ["construcción"] } } }
    ]
  },

  // ------------------------------------------------------------ descargas
  descargas: {
    bsonType: "object",
    required: ["gatewayId", "pedidoId", "operadorId", "fechaHoraInicio"],
    properties: Object.assign({
      gatewayId: { bsonType: "objectId", description: "Referencia a gateways._id" },
      pedidoId: { bsonType: "objectId", description: "Referencia a pedidos._id" },
      operadorId: { bsonType: "objectId", description: "Referencia a usuarios._id" },
      fechaHoraInicio: { bsonType: "date" },
      fechaHoraFin: { bsonType: "date" },
      duracionMinutos: { bsonType: ["int", "long", "double"], minimum: 0 }
    }, AUDITORIA)
  },

  // --------------------------------------------------------------- eventos
  // Bitácora inmutable (RN-14). Copiar la lista cerrada de acciones del campo
  // "accion" del modelo Evento antes de aplicar el validador en producción.
  eventos: {
    bsonType: "object",
    required: ["usuarioId", "accion", "fechaHora", "usuarioCreacion"],
    properties: {
      usuarioId: { bsonType: "objectId", description: "Referencia a usuarios._id" },
      pedidoId: { bsonType: "objectId", description: "Referencia opcional a pedidos._id" },
      accion: { bsonType: "string", description: "Acción registrada (p. ej. LLEGADA_REGISTRADA)" },
      detalles: { description: "Objeto libre (Mixed)" },
      fechaHora: { bsonType: "date" },
      activo: { bsonType: "bool" },
      usuarioCreacion: { bsonType: "string" },
      fechaCreacion: { bsonType: "date" }
    }
  },

  // ------------------------------------------------------------ parametros
  parametros: {
    bsonType: "object",
    required: ["clave", "valor"],
    properties: Object.assign({
      clave: { bsonType: "string", description: "Ej.: TOLERANCIA_LLEGADA_MINUTOS" },
      valor: { description: "Cualquier tipo (Mixed)" },
      descripcion: { bsonType: "string" }
    }, AUDITORIA)
  },

  // ------------------------------------------------------------ contadores
  contadores: {
    bsonType: "object",
    required: ["clave", "secuencia"],
    properties: {
      clave: { bsonType: "string" },
      secuencia: { bsonType: ["int", "long", "double"], minimum: 0 }
    }
  }
};

// Índices únicos (equivalen a las restricciones UNIQUE de un DDL relacional)
const indices = {
  roles: [{ nombre: 1 }],
  usuarios: [{ email: 1 }],
  proveedores: [{ identificacionTributaria: 1 }],
  pedidos: [{ numeroPedido: 1 }],
  gateways: [{ numeroGateway: 1 }],
  parametros: [{ clave: 1 }],
  contadores: [{ clave: 1 }]
};

function aplicarValidador(nombre, esquema) {
  const opciones = {
    validator: { $jsonSchema: esquema },
    validationLevel: "moderate",   // no bloquea documentos previos
    validationAction: "error"
  };
  const existe = db.getCollectionNames().includes(nombre);
  if (existe) {
    db.runCommand(Object.assign({ collMod: nombre }, opciones));
  } else {
    db.createCollection(nombre, opciones);
  }
  print("Validador aplicado: " + nombre);
}

Object.keys(esquemas).forEach(function (nombre) {
  aplicarValidador(nombre, esquemas[nombre]);
});

Object.keys(indices).forEach(function (nombre) {
  indices[nombre].forEach(function (clave) {
    db.getCollection(nombre).createIndex(clave, { unique: true });
  });
});

// Índice compuesto del modelo Pedido (cola de espera)
db.pedidos.createIndex({ activo: 1, estado: 1, fechaHoraIngresoCola: 1 });
