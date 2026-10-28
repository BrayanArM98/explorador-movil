import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

/* ==================================================================
   PIEZAS COMPARTIDAS POR LOS TRES MODULOS
   ================================================================== */

export const C = {
    fondo: '#EEF2F1',
    superficie: '#FFFFFF',
    tinta: '#132A2E',
    suave: '#5B6F72',
    borde: '#D3DDDB',
    acento: '#0E7C6B',
    alerta: '#B3412F',
    alertaFondo: '#FBECE9',
    pendiente: '#9A6A0E',
    pendienteFondo: '#FBF3E2',
    infoFondo: '#E6F2EF',
};

export function Tarjeta({ titulo, derecha, children }) {
    return (
        <View style={estilos.tarjeta}>
            {(titulo || derecha) && (
                <View style={estilos.tarjetaCabecera}>
                    {titulo ? <Text style={estilos.tarjetaTitulo}>{titulo}</Text> : <View />}
                    {derecha}
                </View>
            )}
            {children}
        </View>
    );
}

export function Boton({ texto, onPress, cargando = false, deshabilitado = false, variante = 'primario' }) {
    const inactivo = cargando || deshabilitado;
    const secundario = variante === 'secundario';

    return (
        <Pressable
            onPress={onPress}
            disabled={inactivo}
            accessibilityRole="button"
            accessibilityState={{ disabled: inactivo, busy: cargando }}
            style={({ pressed }) => [
                estilos.boton,
                secundario ? estilos.botonSecundario : estilos.botonPrimario,
                inactivo && estilos.botonInactivo,
                pressed && !inactivo && estilos.botonPresionado,
            ]}
        >
            {cargando ? (
                <ActivityIndicator color={secundario ? C.acento : '#FFFFFF'} />
            ) : (
                <Text style={[estilos.botonTexto, secundario && estilos.botonTextoSecundario]}>
                    {texto}
                </Text>
            )}
        </Pressable>
    );
}

const INSIGNIAS = {
    pendiente: { texto: 'Permiso pendiente', color: C.pendiente, fondo: C.pendienteFondo },
    concedido: { texto: 'Permiso concedido', color: C.acento, fondo: C.infoFondo },
    denegado: { texto: 'Permiso denegado', color: C.alerta, fondo: C.alertaFondo },
    revisando: { texto: 'Revisando…', color: C.suave, fondo: C.fondo },
};

export function Insignia({ estado }) {
    const i = INSIGNIAS[estado] ?? INSIGNIAS.revisando;
    return (
        <View style={[estilos.insignia, { backgroundColor: i.fondo }]}>
            <View style={[estilos.punto, { backgroundColor: i.color }]} />
            <Text style={[estilos.insigniaTexto, { color: i.color }]}>{i.texto}</Text>
        </View>
    );
}

export function Aviso({ tipo = 'info', titulo, children }) {
    const colores = {
        info: { color: C.acento, fondo: C.infoFondo },
        error: { color: C.alerta, fondo: C.alertaFondo },
        pendiente: { color: C.pendiente, fondo: C.pendienteFondo },
    }[tipo];

    return (
        <View style={[estilos.aviso, { backgroundColor: colores.fondo, borderLeftColor: colores.color }]}>
            {titulo && <Text style={[estilos.avisoTitulo, { color: colores.color }]}>{titulo}</Text>}
            {children && <Text style={estilos.avisoTexto}>{children}</Text>}
        </View>
    );
}

export function Dato({ etiqueta, valor }) {
    return (
        <View style={estilos.dato}>
            <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
            <Text style={estilos.datoValor} selectable>
                {valor}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: C.superficie,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.borde,
        padding: 16,
        gap: 12,
    },
    tarjetaCabecera: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    tarjetaTitulo: { fontSize: 17, fontWeight: '700', color: C.tinta, flexShrink: 1 },

    boton: {
        borderRadius: 10,
        paddingVertical: 13,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    botonPrimario: { backgroundColor: C.acento },
    botonSecundario: { backgroundColor: C.superficie, borderWidth: 1, borderColor: C.acento },
    botonInactivo: { opacity: 0.5 },
    botonPresionado: { opacity: 0.8 },
    botonTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    botonTextoSecundario: { color: C.acento },

    insignia: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    punto: { width: 7, height: 7, borderRadius: 4 },
    insigniaTexto: { fontSize: 12, fontWeight: '700' },

    aviso: { borderLeftWidth: 4, borderRadius: 8, padding: 12, gap: 4 },
    avisoTitulo: { fontSize: 14, fontWeight: '700' },
    avisoTexto: { fontSize: 13, lineHeight: 19, color: C.tinta },

    dato: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: C.fondo,
    },
    datoEtiqueta: { fontSize: 13, color: C.suave },
    datoValor: { fontSize: 15, fontWeight: '600', color: C.tinta, fontVariant: ['tabular-nums'] },
});
