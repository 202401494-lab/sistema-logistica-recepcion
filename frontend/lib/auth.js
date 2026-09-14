// Funciones auxiliares para manejar el JWT en el cliente (frontend)

// Decodifica el payload del JWT (NO lo verifica, solo lo lee).
// Un JWT no está "encriptado", está codificado en Base64Url + firmado.
export function decodeJWT(token) {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
}

export function guardarSesion(token) {
  localStorage.setItem('token', token);
}

export function obtenerToken() {
  if (typeof window === 'undefined') return null; // seguridad en SSR
  return localStorage.getItem('token');
}

export function cerrarSesion() {
  localStorage.removeItem('token');
}

export function tokenExpirado(payload) {
  if (!payload || !payload.exp) return true;
  const ahoraEnSegundos = Math.floor(Date.now() / 1000);
  return payload.exp < ahoraEnSegundos;
}
