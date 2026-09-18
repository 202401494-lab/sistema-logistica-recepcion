// Funciones auxiliares para manejar el JWT en el cliente (frontend)

// Decodifica el payload del JWT (NO lo verifica, solo lo lee).
// Un JWT no está "encriptado", está codificado en Base64Url + firmado.
export function decodeJWT(token) {
  try {
    // Un JWT tiene tres partes separadas por puntos; la segunda contiene el payload.
    const payloadBase64 = token.split('.')[1];
    // Base64Url usa caracteres distintos a Base64; se normaliza antes de decodificarlo.
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch (error) {
    // Un token incompleto o alterado se considera inválido para el frontend.
    return null;
  }
}

export function guardarSesion(token) {
  // localStorage mantiene la sesión disponible después de recargar la página.
  localStorage.setItem('token', token);
}

export function obtenerToken() {
  if (typeof window === 'undefined') return null; // seguridad en SSR
  return localStorage.getItem('token');
}

export function cerrarSesion() {
  // Elimina la única credencial que el frontend utiliza para identificar la sesión.
  localStorage.removeItem('token');
}

export function tokenExpirado(payload) {
  // El campo exp del JWT usa segundos Unix; Date.now() se convierte a la misma unidad.
  if (!payload || !payload.exp) return true;
  const ahoraEnSegundos = Math.floor(Date.now() / 1000);
  return payload.exp < ahoraEnSegundos;
}
