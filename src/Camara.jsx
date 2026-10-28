import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Aviso, Boton, C, Dato, Insignia, Tarjeta } from './ui';
import { formatearCoordenada, obtenerPosicion } from './posicion';

/* ==================================================================
   MODULO A — CAMARA
   ================================================================== */

export default function Camara() {
    const cameraRef = useRef(null);
    const [permission, requestPermission, getPermission] = useCameraPermissions();

    const [lista, setLista] = useState(false); // la camara ya puede capturar
    const [tomando, setTomando] = useState(false);
    const [fotoUri, setFotoUri] = useState(null);
    const [capturadaEn, setCapturadaEn] = useState(null);
    const [error, setError] = useState(null);

    // Desafio opcional: registro de exploracion
    const [ubicacion, setUbicacion] = useState(null);
    const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
    const [errorUbicacion, setErrorUbicacion] = useState(null);

    // Si el usuario va a Ajustes y vuelve, el permiso pudo cambiar.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (estado) => {
            if (estado === 'active') getPermission?.();
        });
        return () => sub.remove();
    }, [getPermission]);

    async function tomarFoto() {
        // No se captura si la camara no esta lista o ya hay una captura en curso.
        if (!lista || tomando || !cameraRef.current) return;

        setTomando(true);
        setError(null);
        try {
            const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            if (foto?.uri) {
                setFotoUri(foto.uri);
                setCapturadaEn(new Date());
                setUbicacion(null);
                setErrorUbicacion(null);
            }
        } catch {
            setError('No se pudo tomar la foto. Intenta de nuevo.');
        } finally {
            setTomando(false);
        }
    }

    function volverACamara() {
        setFotoUri(null);
        setLista(false); // la camara se vuelve a montar y avisara cuando este lista
    }

    async function agregarUbicacion() {
        setBuscandoUbicacion(true);
        setErrorUbicacion(null);
        const r = await obtenerPosicion();
        if (r.tipo === 'listo') setUbicacion(r.coords);
        else if (r.tipo === 'denegado') setErrorUbicacion('Sin permiso de ubicación: el registro queda sin coordenadas.');
        else setErrorUbicacion(r.mensaje);
        setBuscandoUbicacion(false);
    }

    /* ---------------- 1. Todavia no se sabe el permiso ---------------- */
    if (permission === null) {
        return (
            <Tarjeta titulo="Cámara" derecha={<Insignia estado="revisando" />}>
                <View style={estilos.centro}>
                    <ActivityIndicator color={C.acento} />
                    <Text style={estilos.suave}>Consultando el permiso de cámara…</Text>
                </View>
            </Tarjeta>
        );
    }

    /* ---------------- 2. Sin permiso: nunca una pantalla vacia ---------------- */
    if (!permission.granted) {
        const pendiente = permission.status === 'undetermined';
        return (
            <Tarjeta titulo="Cámara" derecha={<Insignia estado={pendiente ? 'pendiente' : 'denegado'} />}>
                <Aviso
                    tipo={pendiente ? 'pendiente' : 'error'}
                    titulo={pendiente ? 'Necesitamos acceso a la cámara' : 'Acceso a la cámara denegado'}
                >
                    Se usa solo para mostrar la vista previa y tomar la foto. La imagen no se guarda en tu
                    galería ni se envía a ningún lado.
                </Aviso>

                {permission.canAskAgain ? (
                    <Boton
                        texto={pendiente ? 'Permitir cámara' : 'Volver a solicitar permiso'}
                        onPress={requestPermission}
                    />
                ) : (
                    <>
                        <Text style={estilos.suave}>
                            El sistema ya no muestra el aviso de permiso. Actívalo manualmente en los ajustes de la
                            app.
                        </Text>
                        <Boton texto="Abrir ajustes" onPress={() => Linking.openSettings()} />
                    </>
                )}
            </Tarjeta>
        );
    }

    /* ---------------- 3. Foto tomada ---------------- */
    if (fotoUri !== null) {
        return (
            <View style={estilos.columna}>
                <Tarjeta titulo="Foto capturada" derecha={<Insignia estado="concedido" />}>
                    <Image source={{ uri: fotoUri }} style={estilos.foto} resizeMode="cover" />
                    <Boton texto="Tomar otra foto" variante="secundario" onPress={volverACamara} />
                </Tarjeta>

                <Tarjeta titulo="Registro de exploración">
                    <Dato
                        etiqueta="Fecha"
                        valor={capturadaEn.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    />
                    <Dato
                        etiqueta="Hora"
                        valor={capturadaEn.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    />

                    {ubicacion ? (
                        <>
                            <Dato etiqueta="Latitud" valor={formatearCoordenada(ubicacion.latitud)} />
                            <Dato etiqueta="Longitud" valor={formatearCoordenada(ubicacion.longitud)} />
                            <Dato
                                etiqueta="Precisión"
                                valor={ubicacion.precision != null ? `± ${Math.round(ubicacion.precision)} m` : 'No reportada'}
                            />
                        </>
                    ) : (
                        <Boton
                            texto="Agregar ubicación al registro"
                            variante="secundario"
                            onPress={agregarUbicacion}
                            cargando={buscandoUbicacion}
                        />
                    )}

                    {errorUbicacion && <Aviso tipo="error">{errorUbicacion}</Aviso>}

                    <Text style={estilos.nota}>
                        La ubicación solo se agrega si tú lo pides. No se guarda ni se comparte: desaparece al tomar
                        otra foto o cerrar la app.
                    </Text>
                </Tarjeta>
            </View>
        );
    }

    /* ---------------- 4. Vista previa ---------------- */
    return (
        <Tarjeta titulo="Cámara" derecha={<Insignia estado="concedido" />}>
            <View style={estilos.visor}>
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    onCameraReady={() => setLista(true)}
                    onMountError={() => setError('No se pudo iniciar la cámara. Cierra otras apps que la usen.')}
                />
                {!lista && (
                    <View style={estilos.visorCargando}>
                        <ActivityIndicator color="#FFFFFF" />
                        <Text style={estilos.visorTexto}>Preparando cámara…</Text>
                    </View>
                )}
            </View>

            {error && <Aviso tipo="error">{error}</Aviso>}

            <Boton
                texto={lista ? 'Tomar foto' : 'Esperando cámara…'}
                onPress={tomarFoto}
                cargando={tomando}
                deshabilitado={!lista}
            />
        </Tarjeta>
    );
}

const estilos = StyleSheet.create({
    columna: { gap: 14 },
    centro: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    suave: { fontSize: 13, color: C.suave, textAlign: 'center' },
    nota: { fontSize: 12, color: C.suave, lineHeight: 17 },

    visor: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    visorCargando: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    visorTexto: { color: '#FFFFFF', fontSize: 13 },

    foto: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 12,
        backgroundColor: C.borde,
    },
});
