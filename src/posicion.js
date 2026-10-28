import * as Location from 'expo-location';

// Si el GPS no responde en este tiempo, se avisa en lugar de dejar
// el indicador de carga girando para siempre (pasa mucho en interiores).
const TIEMPO_LIMITE_MS = 15000;

/**
 * Pide permiso de ubicacion en primer plano y, si se concede,
 * obtiene la posicion actual. Nunca lanza excepcion: siempre
 * devuelve un objeto con `tipo` para que la pantalla decida que mostrar.
 *
 *   { tipo: 'listo', coords: { latitud, longitud, precision }, momento }
 *   { tipo: 'denegado', puedePreguntar }
 *   { tipo: 'error', mensaje }
 */
export async function obtenerPosicion() {
    let permiso;
    try {
        permiso = await Location.requestForegroundPermissionsAsync();
    } catch {
        return { tipo: 'error', mensaje: 'No se pudo solicitar el permiso de ubicación.' };
    }

    if (permiso.status !== 'granted') {
        return { tipo: 'denegado', puedePreguntar: permiso.canAskAgain };
    }

    // Permiso concedido no significa GPS encendido.
    const serviciosActivos = await Location.hasServicesEnabledAsync().catch(() => true);
    if (!serviciosActivos) {
        return {
            tipo: 'error',
            mensaje: 'La ubicación del teléfono está apagada. Actívala en los ajustes rápidos e intenta de nuevo.',
        };
    }

    let temporizador;
    try {
        const limite = new Promise((_, rechazar) => {
            temporizador = setTimeout(() => rechazar(new Error('tiempo')), TIEMPO_LIMITE_MS);
        });

        const pos = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            limite,
        ]);

        return {
            tipo: 'listo',
            coords: {
                latitud: pos.coords.latitude,
                longitud: pos.coords.longitude,
                precision: pos.coords.accuracy, // metros; puede ser null
            },
            momento: pos.timestamp,
        };
    } catch (e) {
        return {
            tipo: 'error',
            mensaje:
                e?.message === 'tiempo'
                    ? 'No llegó señal a tiempo. Acércate a una ventana o sal al aire libre e intenta de nuevo.'
                    : 'No se pudo obtener la ubicación. Intenta de nuevo.',
        };
    } finally {
        clearTimeout(temporizador);
    }
}

// 6 decimales ≈ 0.1 m: mas que suficiente para mostrar.
// "ocultar" deja solo 2 decimales (≈ 1 km) para capturas de pantalla.
export function formatearCoordenada(valor, ocultar = false) {
    if (typeof valor !== 'number') return '—';
    return ocultar ? `${valor.toFixed(2)}••••` : valor.toFixed(6);
}
