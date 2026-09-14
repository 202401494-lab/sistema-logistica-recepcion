import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { obtenerToken, decodeJWT, tokenExpirado } from '../lib/auth';

/**
 * Hook para proteger rutas y verificar sesión
 * @param {string} rolRequerido - El rol que necesita para acceder (ej: 'administrador')
 * @returns {object} { rol, cargando, redirigiendo }
 */

/* Estados */
export function useAuth(rolRequerido = null) {
    const router = useRouter();
    const [rol, setRol] = useState(null);
    const [cargando, setCargando] = useState(true);

    /* Efecto para verificar la sesión y el rol del usuario */
    useEffect(() => {
        const token = obtenerToken();
        const payload = token ? decodeJWT(token) : null;

        /* Verifica si el token es válido y no ha expirado */
        if (!token || !payload || tokenExpirado(payload)) {
            router.replace('/login'); /* Redirige al login si no hay token o es inválido */
            return;
        }

        /* Verifica si el rol del usuario coincide con el rol requerido */
        if (rolRequerido && payload.rol !== rolRequerido) {
            router.replace('/acceso-denegado'); /* Redirige a una página de acceso denegado si el rol no coincide */
            return;
        }

        /* Si todo es válido, establece el rol y termina la carga */
        setRol(payload.rol);
        setCargando(false);
    }, [rolRequerido, router]);

    /* Retorna el rol del usuario y el estado de carga */
    return { rol, cargando };
}