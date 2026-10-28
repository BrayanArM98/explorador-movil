import { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Aviso, Boton, C, Dato, Insignia, Tarjeta } from './ui';
import { formatearCoordenada, obtenerPosicion } from './posicion';

/* ==================================================================
   MODULO B — UBICACION
   ================================================================== */

export default function Ubicacion() {
    const [permiso, setPermiso] = useState('revisando'); // revisando | pendiente | concedido | denegado
    const [puedePreguntar, setPuedePreguntar] = useState(true);

    const [estado, setEstado] = useState('inicial'); // inicial | cargando | listo | denegado | error
    const [coords, setCoords] = useState(null);
    const [momento, setMomento] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [ocultar, setOcultar] = useState(false);

    // Consulta el permiso SIN pedirlo, solo para mostrar el estado.
    async function revisarPermiso() {
        try {
            const p = await Location.getForegroundPermissionsAsync();
            setPermiso(p.granted ? 'concedido' : p.status === 'denied' ? 'denegado' : 'pendiente');
            setPuedePreguntar(p.canAskAgain);
        } catch {
            setPermiso('pendiente');
        }
    }

    useEffect(() => {
        revisarPermiso();
        // Al volver de Ajustes, el permiso pudo cambiar.
        const sub = AppState.addEventListener('change', (s) => {
            if (s === 'active') revisarPermiso();
        });
        return () => sub.remove();
    }, []);

    async function obtenerUbicacion() {
        setEstado('cargando');
        setMensaje(null);

        const r = await obtenerPosicion();
        await revisarPermiso();

        if (r.tipo === 'listo') {
            setCoords(r.coords);
            setMomento(r.momento);
            setEstado('listo');
        } else if (r.tipo === 'denegado') {
            setPuedePreguntar(r.puedePreguntar);
            setEstado('denegado');
        } else {
            setMensaje(r.mensaje);
            setEstado('error');
        }
    }

    const cargando = estado === 'cargando';

    return (
        <View style={estilos.columna}>
            <Tarjeta titulo="Ubicación actual" derecha={<Insignia estado={permiso} />}>
                <Text style={estilos.suave}>
                    Se usa el GPS del teléfono solo cuando presionas el botón. La ubicación no se envía ni se guarda.
                </Text>

                <Boton
                    texto={coords ? 'Actualizar ubicación' : 'Obtener mi ubicación'}
                    onPress={obtenerUbicacion}
                    cargando={cargando}
                />

                {cargando && <Text style={estilos.suave}>Buscando señal… puede tardar unos segundos.</Text>}

                {estado === 'denegado' && (
                    <>
                        <Aviso tipo="error" titulo="Permiso de ubicación denegado">
                            Sin este permiso no se pueden leer coordenadas. El resto de la app sigue funcionando.
                        </Aviso>
                        {!puedePreguntar && (
                            <Boton texto="Abrir ajustes" variante="secundario" onPress={() => Linking.openSettings()} />
                        )}
                    </>
                )}

                {estado === 'error' && <Aviso tipo="error" titulo="No se pudo obtener la ubicación">{mensaje}</Aviso>}
            </Tarjeta>

            {coords && (
                <Tarjeta
                    titulo="Coordenadas"
                    derecha={
                        <Pressable
                            onPress={() => setOcultar((v) => !v)}
                            accessibilityRole="switch"
                            accessibilityState={{ checked: ocultar }}
                            hitSlop={8}
                        >
                            <Text style={estilos.enlace}>{ocultar ? 'Mostrar dígitos' : 'Ocultar dígitos'}</Text>
                        </Pressable>
                    }
                >
                    <Dato etiqueta="Latitud" valor={formatearCoordenada(coords.latitud, ocultar)} />
                    <Dato etiqueta="Longitud" valor={formatearCoordenada(coords.longitud, ocultar)} />
                    <Dato
                        etiqueta="Precisión reportada"
                        valor={coords.precision != null ? `± ${Math.round(coords.precision)} m` : 'No reportada'}
                    />
                    {momento && (
                        <Dato
                            etiqueta="Leída a las"
                            valor={new Date(momento).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}
                        />
                    )}

                    <Text style={estilos.nota}>
                        La precisión es el radio que el sistema estima alrededor del punto, no un error garantizado.
                        En interiores suele ser mayor porque el GPS recibe menos satélites.
                    </Text>
                </Tarjeta>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    columna: { gap: 14 },
    suave: { fontSize: 13, color: C.suave, lineHeight: 19 },
    nota: { fontSize: 12, color: C.suave, lineHeight: 17, marginTop: 4 },
    enlace: { fontSize: 13, fontWeight: '700', color: C.acento },
});
