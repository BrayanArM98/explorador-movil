# Explorador móvil

Aplicación de React Native con Expo que usa tres capacidades del teléfono: **cámara**, **ubicación GPS** y **magnetómetro** (brújula). Cada módulo pide sus permisos, muestra estados de carga y error, y sigue funcionando aunque el usuario niegue un permiso o el sensor no exista.

**Autor:** Brayan Arturo Rocha Meneses · Desarrollo de Aplicaciones Móviles · FIAD-UABC

## Requisitos

- Node.js (versión LTS)
- Expo Go en un teléfono **físico** Android o iOS
- Teléfono y computadora en la misma red Wi-Fi (o usar túnel)

Los emuladores no sirven bien para esta app: suelen no tener cámara real, magnetómetro ni GPS.

## Instalación

```bash
git clone <URL-del-repositorio>
cd explorador-movil
npm install
```

Si se crea desde cero:

```bash
npx create-expo-app@latest explorador-movil --template blank
cd explorador-movil
npx expo install expo-camera expo-location expo-sensors react-native-safe-area-context
```

## Ejecución

```bash
npx expo start
```

Escanear el código QR con Expo Go. Si la red local bloquea la conexión:

```bash
npx expo start --tunnel
```

## Estructura

```
App.js              Navegación entre los tres módulos (pestañas inferiores)
src/ui.jsx          Componentes compartidos: tarjeta, botón, insignia de permiso, aviso
src/posicion.js     Pedir permiso y obtener la ubicación, con tiempo límite
src/Camara.jsx      Módulo A: vista previa, captura y registro de exploración
src/Ubicacion.jsx   Módulo B: coordenadas, precisión y estados
src/Brujula.jsx     Módulo C: magnetómetro, rumbo aproximado y limpieza
```

## Funcionalidad

### Cámara
- Pide permiso con `useCameraPermissions()`. Muestra el estado: pendiente, concedido o denegado.
- Si se niega, explica para qué se usa y permite volver a solicitarlo. Si el sistema ya no muestra el aviso, ofrece abrir los ajustes.
- El botón **Tomar foto** se desactiva hasta que la cámara avisa que está lista (`onCameraReady`) y mientras hay una captura en curso.
- La foto se muestra con `Image`. No se guarda en la galería.

### Ubicación
- Pide permiso en primer plano solo al presionar **Obtener mi ubicación**.
- Muestra latitud y longitud con 6 decimales y la precisión reportada en metros.
- Distingue permiso denegado, GPS apagado, falta de señal (tiempo límite de 15 s) y otros errores.
- Botón **Ocultar dígitos** para tomar capturas sin exponer la ubicación exacta.

### Brújula
- Revisa `Magnetometer.isAvailableAsync()`. Si no hay sensor muestra **Sensor no disponible** sin cerrar la app.
- Lee X, Y, Z cada 250 ms y calcula el ángulo con `atan2(y, x)` y un rumbo aproximado con punto cardinal.
- La suscripción se crea dentro de `useEffect` y se elimina en su función de limpieza. La pantalla muestra un contador de **suscripciones activas** para comprobar que no se acumulan.
- Avisa si la intensidad del campo sale del rango terrestre normal (posible interferencia).

### Desafío opcional: registro de exploración
Después de tomar una foto aparece una tarjeta con la fecha y hora de la captura. Las coordenadas se agregan solo si el usuario presiona **Agregar ubicación al registro**. El registro no se guarda ni se comparte.

## Pruebas realizadas

- [ ] Aceptar y rechazar el permiso de cámara; comprobar ambos estados.
- [ ] Tomar una foto y confirmar que se visualiza.
- [ ] Solicitar ubicación con señal; verificar coordenadas y precisión.
- [ ] Denegar ubicación y comprobar que la app sigue funcionando.
- [ ] Rotar el teléfono horizontalmente y observar los cambios del magnetómetro.
- [ ] Salir y volver al módulo de brújula; el contador de suscripciones activas se mantiene en 1.

## Limitaciones conocidas

- **La brújula no es un rumbo geográfico calibrado.** No corrige la declinación magnética (el norte magnético no coincide con el geográfico; en Baja California la diferencia ronda los 10°), ni la inclinación del teléfono: el cálculo con X/Y supone el teléfono horizontal.
- **Interferencia magnética.** Imanes, bocinas, estructuras metálicas, cargadores o fundas con imán alteran la lectura. Si el campo sale del rango de 25 a 65 µT la app lo advierte.
- **Ejes según plataforma.** El rumbo se calibró con la convención de ejes de Android. En iOS los valores del magnetómetro pueden venir sin calibrar y el punto cardinal puede no coincidir.
- **Precisión del GPS.** En interiores la señal es débil: la precisión empeora o la lectura tarda. La precisión reportada es un estimado del sistema, no un error garantizado.
- **Permisos en Expo Go.** Los textos de los avisos de permiso son los de Expo Go, no personalizados. Para textos propios hace falta una compilación de desarrollo.
- **La foto no se persiste.** Al tomar otra foto o cerrar la app se pierde.

## Privacidad

La ubicación se lee solo cuando el usuario lo pide, se muestra en pantalla y no se envía ni se almacena.
