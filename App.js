import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Camara from './src/Camara';
import Ubicacion from './src/Ubicacion';
import Brujula from './src/Brujula';
import { C } from './src/ui';
 
const MODULOS = [
    { id: 'camara', titulo: 'Cámara', descripcion: 'Toma una foto con la cámara trasera', Componente: Camara },
    { id: 'ubicacion', titulo: 'Ubicación', descripcion: 'Consulta tus coordenadas GPS', Componente: Ubicacion },
    { id: 'brujula', titulo: 'Brújula', descripcion: 'Orientación con el magnetómetro', Componente: Brujula },
];
 
export default function App() {
    const [activo, setActivo] = useState('camara');
    const modulo = MODULOS.find((m) => m.id === activo);
    const Componente = modulo.Componente;
 
    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />
            <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
                <View style={estilos.cabecera}>
                    <Text style={estilos.app}>Explorador móvil</Text>
                    <Text style={estilos.titulo}>{modulo.titulo}</Text>
                    <Text style={estilos.descripcion}>{modulo.descripcion}</Text>
                </View>
 
                {/* Solo se monta el modulo activo. Al salir de la brujula se
                    desmonta y su useEffect elimina la suscripcion al sensor.
                    La key reinicia el scroll al cambiar de modulo. */}
                <ScrollView key={activo} contentContainerStyle={estilos.contenido}>
                    <Componente />
                </ScrollView>
 
                <View style={estilos.pestanas} accessibilityRole="tablist">
                    {MODULOS.map((m) => {
                        const seleccionado = m.id === activo;
                        return (
                            <Pressable
                                key={m.id}
                                onPress={() => setActivo(m.id)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: seleccionado }}
                                style={[estilos.pestana, seleccionado && estilos.pestanaActiva]}
                            >
                                <View style={[estilos.barrita, seleccionado && estilos.barritaActiva]} />
                                <Text style={[estilos.pestanaTexto, seleccionado && estilos.pestanaTextoActivo]}>
                                    {m.titulo}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
 
const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: C.fondo },
 
    cabecera: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
    app: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: C.acento, textTransform: 'uppercase' },
    titulo: { fontSize: 28, fontWeight: '800', color: C.tinta, marginTop: 2 },
    descripcion: { fontSize: 14, color: C.suave, marginTop: 2 },
 
    contenido: { paddingHorizontal: 16, paddingBottom: 24 },
 
    pestanas: {
        flexDirection: 'row',
        backgroundColor: C.superficie,
        borderTopWidth: 1,
        borderTopColor: C.borde,
    },
    pestana: { flex: 1, alignItems: 'center', paddingTop: 0, paddingBottom: 12, gap: 8 },
    pestanaActiva: {},
    barrita: { height: 3, width: '60%', borderRadius: 2, backgroundColor: 'transparent' },
    barritaActiva: { backgroundColor: C.acento },
    pestanaTexto: { fontSize: 14, fontWeight: '600', color: C.suave },
    pestanaTextoActivo: { color: C.acento, fontWeight: '800' },
});