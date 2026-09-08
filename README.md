# Message in a Bottle

App móvil (Android e iPhone) para lanzar **mensajes de texto** entre teléfonos cercanos usando **Bluetooth Low Energy GATT**. No hay servidor ni internet: el intercambio es phone a phone.

## Cómo viaja un mensaje

Hay dos modos, elegibles al escribir:

| Modo | Qué hace quien lo recibe |
| --- | --- |
| **Directo** | Lo guarda en su bandeja. **No** lo retransmite a nadie más. Solo el móvil de origen sigue emitiéndolo. |
| **Message in a bottle** | Lo incorpora a su *pool* de broadcast y lo transmite a otros móviles que se cruce. |

Cada mensaje tiene:

- `messageId` — UUID del mensaje (se genera al crearlo)
- `originDeviceId` — UUID del móvil de origen
- tema (deporte, política, filosofía, lifestyle, ciencia, arte, humor, noticias, otros)
- caducidad opcional: al vencer, deja de enviarse y de reenviarse

## Antibucles y anonimato

- Un mensaje ya conocido (mismo `messageId`) se ignora.
- Cada instalación genera un UUID de móvil. Se puede **regenerar** en Ajustes para cortar el rastro.
- Lista de bloqueo de UUIDs (móvil o mensaje): no se abre GATT con un origen bloqueado y no se acepta ese contenido.
- Tope de saltos (`maxHops`, 32) por si una botella circula demasiado.

## Radio GATT y cola

Cada teléfono es **periférico y central** a la vez:

1. Anuncia el servicio GATT `MIAB`.
2. Escanea otros `MIAB` cercanos.
3. Si hay muchos UUID al alcance, las conexiones se **serializan**: una sesión GATT cada vez, con un **intervalo configurable en segundos** (Ajustes, por defecto 8 s) y un enfriamiento tras cada sync.

Protocolo (servicio `6d696162-74c1-4e00-8000-6d6961626f74`):

- `IDENTITY` (read) — UUID del móvil
- `RX` (write) — frames del central
- `TX` (notify) — frames del periférico

Sesión: `hello` (catálogo de IDs) → `offer` (mensajes que te faltan + catálogo del otro) → `push` (los que le faltan al otro) → `done`.

## Pantallas

- **Recibidos** — bandeja de lo que llegó
- **Botella** — pool que este móvil transmite (propios + botellas ajenas)
- **Escribir** — crear mensaje, modo botella/directo, caducidad
- **Ajustes** — radio, intervalo, aceptar botellas, regenerar UUID, lista de bloqueo, cola cercana

En un mensaje ajeno puedes dejar de reenviarlo o eliminarlo. En uno propio puedes sacarlo del pool o convertirlo en directo.

## Requisitos

- Dos **móviles físicos** con Bluetooth. El emulador no sirve para GATT dual.
- **No funciona en Expo Go.** Hay que generar un development build nativo.
- Android 12+ (permisos `SCAN` / `CONNECT` / `ADVERTISE`) o iOS 15+
- iOS se compila en macOS. Desde Windows puedes preparar el proyecto y construir Android.

En Windows, CMake/Ninja falla si las rutas superan 260 caracteres. El plugin `plugins/withWindowsCmake.js` limita el ABI a `arm64-v8a`. Lo más fiable es activar rutas largas **como administrador**:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
git config --global core.longpaths true
```

Después: `npx expo run:android`.

JDK 17 y Android SDK ya son los que usa Expo 57:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:ANDROID_HOME = "C:\Users\Antonio\Android\Sdk"
```

## Arranque

```powershell
cd C:\DEV.Personal\message-in-a-bottle
npm install
npx expo prebuild
npx expo run:android
```

En un Mac, `npx expo run:ios` para el iPhone.

Instala el mismo build en **dos teléfonos**, activa Bluetooth y la radio en Ajustes, escribe una botella en uno y acércalos. El otro debería verlo en Recibidos y, si era botella, retransmitirlo.

## Límites prácticos de BLE

- Texto hasta 280 caracteres. Sin imágenes, a propósito.
- iOS solo anuncia nombre (`MIAB`) y el UUID de servicio; el contenido viaja por GATT, no por el advertisement.
- En segundo plano la radio es *best-effort* (iOS `bluetooth-central` / `bluetooth-peripheral`; Android foreground service). Si el usuario mata la app, el sistema no la relanza.
- Un sync intercambia como máximo 16 mensajes nuevos para no saturar ATT.
