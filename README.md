# sistema-logistica-recepcion
Equipo 5 de proyecto integrador: sistema web completo para controlar el proceso logístico de recepción de proveedores en un centro de distribución. La solución debe gestionar el registro de pedidos, la programación de citas, la recepción física del proveedor, la clasificación automática de puntualidad.

# Proyecto base: autenticación JWT + RBAC

Este repositorio ya tiene la base funcional de autenticación con Express + MongoDB + Next.js. La idea es que te sirva como punto de partida para la parte de login y control de acceso del sistema logístico.

## 1. Requisitos previos
- Node.js instalado
- MongoDB corriendo localmente en el puerto 27017
- Tener creada la base de datos que se usa en el archivo `.env` del backend

## 2. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

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

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre: `http://localhost:3000/login`

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
  lib/auth.js                 -> manejo del token en localStorage
  pages/_app.js               -> carga Bootstrap
  pages/index.js              -> redirección según sesión
  pages/login.js              -> formulario de inicio de sesión
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

## 6. Importante

> Si todo funciona, puedes continuar desarrollando la parte de recepción, proveedores, llegadas, envíos y demás módulos del proyecto. Este punto de autenticación sirve como base segura para la siguiente etapa.

## 7. Flujo de Git sugerido

```bash
git checkout development
git pull origin development
git checkout -b feature/tu-nombre
# trabajar en el proyecto
git add .
git commit -m "feat: autenticacion jwt y roles"
git push origin feature/tu-nombre
```

Nunca hagas `push` directo a `main` ni `test` sin revisión.

### Frontend - Mejoras implementadas
- Diseño responsivo con Bootstrap + CSS modules
- Animaciones suaves en login y transiciones
- Credenciales de prueba visibles en formulario
- Spinner de carga durante login
- Hook useAuth reutilizable para proteger rutas