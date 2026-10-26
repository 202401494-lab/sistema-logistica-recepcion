# sistema-logistica-recepcion
Equipo 5 de proyecto integrador: sistema web completo para controlar el proceso logístico de recepción de proveedores en un centro de distribución. La solución debe gestionar el registro de pedidos, la programación de citas, la recepción física del proveedor, la clasificación automática de puntualidad.

El contexto funcional común para el equipo está en [Fase 0 - Contexto funcional](docs/contexto-fase-0.md).

# Proyecto base: autenticación JWT + RBAC

Este repositorio ya tiene la base funcional de autenticación con Express + MongoDB + Next.js. La idea es que te sirva como punto de partida para la parte de login y control de acceso del sistema logístico.

## 1. Requisitos previos
- Node.js 18 o superior
- MongoDB local en el puerto 27017 configurado como replica set (o MongoDB Atlas); las transacciones del ciclo de descarga requieren soporte de transacciones
- Tener creada la base de datos que se usa en el archivo `.env` del backend

## 2. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Antes de iniciar, reemplaza `JWT_SECRET` en `.env` por una clave aleatoria local. No compartas ni subas `.env`; el archivo está excluido por `.gitignore`.

Para MongoDB local, inicia `mongod` con `--replSet rs0` y ejecuta una vez `mongosh --eval "rs.initiate()"`. Actualiza también el `MONGO_URI` de cualquier `.env` existente para incluir `?replicaSet=rs0`.

### Usuarios de prueba

| Rol | Email | Contraseña |
|------|------|------------|
| administrador | admin@test.com | Admin123 |
| coordinador | coordinador@test.com | Coord123 |
| operador | operador@test.com | Oper123 |

### Endpoints principales

- POST `/api/auth/login` -> inicio de sesión
- GET `/api/perfil` -> requiere token JWT válido
- GET `/api/admin/dashboard` -> solo administradores
- GET `/api/coordinacion` -> administradores y coordinadores
- PATCH `/api/pedidos/:id/llegada` -> operador o administrador; registra hora real, puntualidad y espera anticipada
- POST `/api/descargas/iniciar` y POST `/api/descargas/finalizar` -> ciclo transaccional de descarga y reevaluación de cola
- GET `/api/kpis?desde=<ISO>&hasta=<ISO>` -> coordinador o administrador; período opcional de hasta 30 días por defecto
- PUT `/api/gateways/:id` -> los cambios de mantenimiento se registran en la bitácora inmutable
- GET/POST `/api/parametros` y PUT/DELETE `/api/parametros/:id` -> solo administradores

### Autenticación multifactor (MFA)

- POST `/api/auth/login` devuelve un JWT de acceso de 8 horas si el usuario no requiere MFA. Si MFA es obligatorio o ya está activado, devuelve un `tempToken` válido por 5 minutos y no un JWT de acceso.
- POST `/api/mfa/setup` y POST `/api/mfa/enable` -> requieren `Authorization: Bearer <tempToken>`; el primero devuelve el URI `otpauth://` para generar el QR y el segundo recibe `{ "code": "123456" }` para confirmar el enrolamiento.
- POST `/api/auth/mfa/verify-login` -> requiere el token temporal y `{ "code": "123456" }`; solo con un TOTP válido entrega el JWT definitivo de 8 horas.
- PATCH `/api/usuarios/:id/mfa-obligatorio` -> requiere JWT de administrador y `{ "mfaObligatorio": true|false }`. Al enviar `false`, también desactiva el autenticador y elimina su clave y códigos de recuperación; al volver a activarlo, el usuario debe enrolarse nuevamente.
- Los códigos TOTP aceptan una ventana de tolerancia de un intervalo (30 segundos). Las claves MFA, contraseñas y códigos de recuperación no se incluyen en consultas normales de usuarios.
- `MFA_ISSUER` configura el nombre mostrado por las aplicaciones de autenticación; su valor predeterminado es `Sistema Logística`.

Para activar la marcación automática de ausencias, crea `TOLERANCIA_LLEGADA_MINUTOS` con un valor entero igual o mayor a cero. Si el parámetro se inactiva, un nuevo POST con la misma clave lo reactiva y actualiza el valor. El backend revisa los pedidos cada minuto; no aplica una tolerancia predeterminada si el parámetro no está configurado.

### Pruebas del backend

```bash
cd backend
npm test
```

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre: `http://localhost:3000/login`

El frontend permite configurar MFA desde `/login/mfa` después del primer paso de autenticación y administrar el requisito por usuario en `/usuarios/gestion` (solo para administradores). La gestión disponible solicita el ID de MongoDB porque la API actual no ofrece un endpoint para listar usuarios. Para apuntar a otra dirección de API, configura `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:4000/api`).

Este repositorio usa actualmente el Pages Router de Next.js (`frontend/pages`); las pantallas nuevas siguen esa estructura.

## 4. Estructura del proyecto

```text
backend/
  config/db.js                 -> conexión a MongoDB
  controllers/authController.js -> lógica del login
  middleware/authMiddleware.js  -> validación JWT y roles
  models/Role.js               -> roles del sistema
  models/Usuario.js            -> usuarios del sistema
  routes/authRoutes.js         -> login público
  routes/protectedRoutes.js   -> rutas protegidas con JWT
  seed.js                     -> crea roles + usuarios prueba
  server.js                   -> punto de entrada del backend

frontend/
  components/LogoutButton.js  -> cerrar sesión
  components/MfaSetupModal.js -> enrolamiento QR y captura del código MFA
  components/UserForm.js      -> requisito administrativo de MFA por usuario
  lib/auth.js                 -> manejo del token en localStorage
  lib/api.js                  -> consumo de la API Express
  pages/_app.js               -> carga Bootstrap
  pages/index.js              -> redirección según sesión
  pages/login.js              -> formulario de inicio de sesión
  pages/login/mfa.js          -> verificación TOTP y enrolamiento MFA
  pages/usuarios/gestion.js   -> gobernanza del requisito MFA
  pages/admin.js              -> vista del administrador
  pages/coordinador.js        -> vista del coordinador
  pages/operador.js           -> vista del operador
```

## 5. Cómo entender cada apartado rápido

### Backend
- `server.js`: levanta la API
- `config/db.js`: conecta con MongoDB
- `models/`: define la base de datos
- `controllers/authController.js`: valida credenciales y genera JWT
- `middleware/authMiddleware.js`: comprueba el token y permisos
- `routes/`: define qué endpoints existen

### Frontend
- `pages/login.js`: formulario para iniciar sesión
- `lib/auth.js`: guarda, lee y elimina el token del navegador
- `pages/index.js`: manda al usuario a su página según el rol
- `pages/admin.js`, `pages/coordinador.js`, `pages/operador.js`: páginas protegidas

### useAuth Hook
Hook personalizado para proteger rutas y verificar sesión.
Uso: `const { rol, cargando } = useAuth('administrador');`

### Estilos
- `styles/login.module.css` -> Diseño responsivo del login
- `styles/rolePages.module.css` -> Páginas de rol con animaciones
- `styles/logoutButton.module.css` -> Botón de logout

## 6. Flujo de Git sugerido

```bash
git checkout development
git pull origin development
git checkout -b feature/tu-nombre
# trabajar en el proyecto
git add .
git commit -m "feat: autenticacion jwt y roles"
git push origin feature/tu-nombre
```

Nunca debemos hacer `push` directo a `main` ni `test` sin revisión.

### Frontend - Mejoras implementadas
- Diseño responsivo con Bootstrap + CSS modules
- Animaciones suaves en login y transiciones
- Credenciales de prueba visibles en formulario
- Spinner de carga durante login
- Hook useAuth reutilizable para proteger rutas
