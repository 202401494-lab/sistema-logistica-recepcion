# sistema-logistica-recepcion
Equipo 5 de proyecto integrador: sistema web completo para controlar el proceso logístico de recepción de proveedores en un centro de distribución. La solución debe gestionar el registro de pedidos, la programación de citas, la recepción física del proveedor, la clasificación automática de puntualidad


# Flujo de autenticación JWT + RBAC (Next.js + Express + MongoDB)

Este es un **proyecto de ejemplo funcional** para que copies los archivos
(o su lógica) dentro del monorepo real de tu equipo. Las rutas asumen que
tienes dos carpetas separadas: `backend/` y `frontend/`.

## 1. Requisitos previos
- Node.js instalado
- MongoDB corriendo localmente (`mongod` en tu máquina, puerto 27017 por defecto)

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edita .env si tu Mongo usa otro puerto o quieres otro JWT_SECRET
npm run seed     # crea los 3 roles y 3 usuarios de prueba
npm run dev      # o: npm start
```

Usuarios de prueba creados por el seed:

| Rol            | Email                 | Password  |
|----------------|-----------------------|-----------|
| administrador  | admin@test.com        | Admin123  |
| coordinador    | coordinador@test.com  | Coord123  |
| operador       | operador@test.com     | Oper123   |

El servidor queda escuchando en `http://localhost:4000`.

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:3000/login` e inicia sesión con cualquiera de los
usuarios de la tabla. Serás redirigido automáticamente a `/admin`,
`/coordinador` u `/operador` según el rol que traiga el token.

## 4. Estructura

```
backend/
  config/db.js          -> conexión a MongoDB
  models/Role.js         -> colección roles
  models/Usuario.js      -> colección usuarios (roles = array de ObjectId)
  controllers/authController.js -> lógica del login
  routes/authRoutes.js   -> POST /api/auth/login
  seed.js                -> crea roles + usuarios de prueba
  server.js               -> punto de entrada de Express

frontend/
  lib/auth.js             -> decodificar JWT, leer/borrar localStorage
  components/LogoutButton.js
  pages/login.js          -> formulario controlado
  pages/admin.js, coordinador.js, operador.js -> páginas protegidas por rol
  pages/index.js          -> redirige según sesión activa
```

## 5. Flujo de Git sugerido (según la guía de la actividad)

```bash
git checkout development
git pull origin development
git checkout -b feature-tu-nombre-login
# ... trabajas y haces commits ...
git add .
git commit -m "feat: login con JWT y RBAC"
git push origin feature-tu-nombre-login
# Luego abres un Pull Request en GitHub: base development <- compare feature-tu-nombre-login
```

Nunca hagas push directo a `main` ni a `test`; esas ramas están protegidas.
