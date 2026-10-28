import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { Aviso, C, Dato, Tarjeta } from './ui';

/* ==================================================================
   MODULO C — BRUJULA
   ================================================================== */

// Contador a nivel de modulo: sobrevive a que el componente se monte
// y desmonte. Sirve para comprobar en pantalla que al salir y volver
// no se acumulan suscripciones (siempre debe valer 1 con la brujula abierta).
let suscripcionesActivas = 0;

const PUNTOS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export default function Brujula() {
    const [disponible, setDisponible] = useState(null); // null = revisando
    const [lectura, setLectura] = useState(null); // { x, y, z }
    const [activas, setActivas] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelado = false;
        let sub = null;

        async function iniciar() {
            try {
                const ok = await Magnetometer.isAvailableAsync();
                // Si el usuario salio del modulo mientras se consultaba, no se suscribe.
                if (cancelado) return;

                setDisponible(ok);
                if (!ok) return;

                Magnetometer.setUpdateInterval(250);
                sub = Magnetometer.addListener(({ x, y, z }) => setLectura({ x, y, z }));

                suscripcionesActivas += 1;
                setActivas(suscripcionesActivas);
            } catch {
                if (!cancelado) {
                    setDisponible(false);
                    setError('El sensor respondió con un error.');
                }
            }
        }

        iniciar();

        // LIMPIEZA: corre al salir del modulo.
        return () => {
            cancelado = true;
            if (sub) {
                sub.remove();
                suscripcionesActivas -= 1;
            }
        };
    }, []);

    /* ---------------- Revisando ---------------- */
    if (disponible === null) {
        return (
            <Tarjeta titulo="Brújula">
                <View style={estilos.centro}>
                    <ActivityIndicator color={C.acento} />
                    <Text style={estilos.suave}>Buscando magnetómetro…</Text>
                </View>
            </Tarjeta>
        );
    }

    /* ---------------- Sin sensor: aviso, no se cierra la app ---------------- */
    if (disponible === false) {
        return (
            <Tarjeta titulo="Brújula">
                <Aviso tipo="error" titulo="Sensor no disponible">
                    {error ??
                        'Este dispositivo no reporta magnetómetro. Pasa en emuladores y en algunos teléfonos económicos. La cámara y la ubicación siguen funcionando.'}
                </Aviso>
            </Tarjeta>
        );
    }

    /* ---------------- Calculos ---------------- */
    const x = lectura?.x ?? 0;
    const y = lectura?.y ?? 0;
    const z = lectura?.z ?? 0;

    // Formula de la practica: angulo del campo medido desde el eje X
    // (el lado derecho del telefono), de 0 a 360.
    const angulo = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    // Una brujula mide desde la parte de ARRIBA del telefono, no desde el
    // lado derecho: por eso se restan 90°. Supone el telefono horizontal.
    const rumbo = (angulo - 90 + 360) % 360;
    const punto = PUNTOS[Math.round(rumbo / 45) % 8];

    // Intensidad total del campo. La Tierra da entre 25 y 65 µT.
    const magnitud = Math.sqrt(x * x + y * y + z * z);
    const interferencia = lectura !== null && (magnitud < 20 || magnitud > 80);

    return (
        <View style={estilos.columna}>
            <Tarjeta titulo="Brújula">
                <View style={estilos.esfera}>
                    {/* La esfera gira al reves del rumbo para que la N apunte al norte. */}
                    <View style={[estilos.disco, { transform: [{ rotate: `${-rumbo}deg` }] }]}>
                        <Text style={[estilos.marca, estilos.marcaN]}>N</Text>
                        <Text style={[estilos.marca, estilos.marcaE]}>E</Text>
                        <Text style={[estilos.marca, estilos.marcaS]}>S</Text>
                        <Text style={[estilos.marca, estilos.marcaO]}>O</Text>
                        <View style={estilos.agujaNorte} />
                        <View style={estilos.agujaSur} />
                    </View>
                    {/* Linea fija: la direccion a la que apunta el telefono */}
                    <View style={estilos.indice} />
                </View>

                <View style={estilos.lecturaGrande}>
                    <Text style={estilos.grados}>{Math.round(rumbo)}°</Text>
                    <Text style={estilos.punto}>{punto}</Text>
                </View>
                <Text style={estilos.suaveCentro}>Dirección aproximada · mantén el teléfono horizontal</Text>
            </Tarjeta>

            {interferencia && (
                <Aviso tipo="pendiente" titulo="Posible interferencia">
                    El campo mide {magnitud.toFixed(0)} µT, fuera del rango normal de la Tierra (25–65 µT). Aléjate de
                    imanes, bocinas, metal o fundas con imán.
                </Aviso>
            )}

            <Tarjeta titulo="Lectura del magnetómetro">
                <Dato etiqueta="X" valor={`${x.toFixed(1)} µT`} />
                <Dato etiqueta="Y" valor={`${y.toFixed(1)} µT`} />
                <Dato etiqueta="Z" valor={`${z.toFixed(1)} µT`} />
                <Dato etiqueta="Intensidad total" valor={`${magnitud.toFixed(1)} µT`} />
                <Dato etiqueta="Ángulo atan2(y, x)" valor={`${angulo.toFixed(1)}°`} />
                <Dato etiqueta="Actualización" valor="cada 250 ms" />
                <Dato etiqueta="Suscripciones activas" valor={String(activas)} />

                <Text style={estilos.nota}>
                    No es un rumbo geográfico calibrado: no corrige la declinación magnética (en Baja California el
                    norte magnético está unos 10° al este del geográfico), ni la inclinación del teléfono, ni la
                    interferencia de objetos cercanos.
                </Text>
            </Tarjeta>
        </View>
    );
}

const TAM = 220;

const estilos = StyleSheet.create({
    columna: { gap: 14 },
    centro: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    suave: { fontSize: 13, color: C.suave, textAlign: 'center' },
    suaveCentro: { fontSize: 12, color: C.suave, textAlign: 'center' },
    nota: { fontSize: 12, color: C.suave, lineHeight: 17, marginTop: 4 },

    esfera: {
        alignSelf: 'center',
        width: TAM,
        height: TAM,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    disco: {
        width: TAM,
        height: TAM,
        borderRadius: TAM / 2,
        borderWidth: 2,
        borderColor: C.borde,
        backgroundColor: C.fondo,
        alignItems: 'center',
        justifyContent: 'center',
    },
    marca: { position: 'absolute', fontSize: 18, fontWeight: '800', color: C.suave },
    marcaN: { top: 10, color: C.alerta },
    marcaS: { bottom: 10 },
    marcaE: { right: 14 },
    marcaO: { left: 14 },
    agujaNorte: {
        position: 'absolute',
        top: TAM / 2 - 78,
        width: 6,
        height: 78,
        borderRadius: 3,
        backgroundColor: C.alerta,
    },
    agujaSur: {
        position: 'absolute',
        top: TAM / 2,
        width: 6,
        height: 78,
        borderRadius: 3,
        backgroundColor: C.tinta,
    },
    indice: {
        position: 'absolute',
        top: -6,
        width: 4,
        height: 18,
        borderRadius: 2,
        backgroundColor: C.acento,
    },

    lecturaGrande: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 10 },
    grados: { fontSize: 44, fontWeight: '800', color: C.tinta, fontVariant: ['tabular-nums'] },
    punto: { fontSize: 24, fontWeight: '700', color: C.acento },
});
