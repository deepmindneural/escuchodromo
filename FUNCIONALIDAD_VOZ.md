# 🎤 FUNCIONALIDAD DE VOZ - 100% GRATIS

## ✅ ¿QUÉ SE IMPLEMENTÓ?

Chat completamente funcional con **reconocimiento y síntesis de voz** usando **Web Speech API** del navegador.

### Tecnología:
- ✅ **100% GRATIS** - Sin API keys, sin costos
- ✅ **Sin servidores** - Todo funciona en el navegador
- ✅ **Web Speech API** - Estándar de W3C
- ✅ **Integración con Gemini** - IA responde por voz

---

## 🎯 CÓMO FUNCIONA

### Flujo completo:
```
1. Usuario hace clic en botón de micrófono 🎤
2. Web Speech Recognition transcribe en tiempo real
3. Transcripción aparece en el campo de texto
4. Usuario envía mensaje (o se envía automáticamente)
5. Gemini procesa y responde
6. Web Speech Synthesis lee la respuesta en voz alta 🔊
```

---

## 🖥️ COMPATIBILIDAD DE NAVEGADORES

### ✅ Reconocimiento de voz (STT):
- ✅ Chrome/Edge (100%)
- ✅ Safari iOS/macOS (100%)
- ⚠️ Firefox (limitado)
- ❌ Internet Explorer

### ✅ Síntesis de voz (TTS):
- ✅ Chrome/Edge (100%)
- ✅ Safari iOS/macOS (100%)
- ✅ Firefox (100%)
- ❌ Internet Explorer

**Recomendado:** Chrome o Edge para mejor experiencia.

---

## 🎨 CARACTERÍSTICAS IMPLEMENTADAS

### 1. **Reconocimiento de voz (Speech-to-Text)**
- 🎤 Transcripción en tiempo real
- 🇪🇸 Idioma español configurado
- ⏸️ Pausar/reanudar grabación
- 📝 Visualización de transcripción en progreso
- ⚠️ Manejo de errores (sin voz, permiso denegado, etc.)

### 2. **Síntesis de voz (Text-to-Speech)**
- 🔊 Lectura automática de respuestas de IA
- 🇪🇸 Voz en español
- 🎛️ Velocidad, tono y volumen configurables
- 🎭 Selección de voces disponibles
- ⏹️ Detener reproducción en cualquier momento

### 3. **Indicadores visuales**
- 🔴 Botón rojo pulsante cuando está grabando
- 💜 Botón morado cuando la IA está hablando
- 📊 Cuadro de transcripción en tiempo real
- 💬 Toast notifications para feedback

---

## 🚀 CÓMO USAR LA VOZ

### Paso 1: Ir al chat
```
npm run dev
http://localhost:3000/chat
```

### Paso 2: Dar permiso al micrófono
Al hacer clic en el botón de micrófono, el navegador pedirá permiso para acceder al micrófono. **Acepta el permiso.**

### Paso 3: Hablar
1. Haz clic en el botón del micrófono (🎤)
2. El botón se volverá rojo y pulsante
3. Habla claramente en español
4. Verás la transcripción en tiempo real abajo del botón
5. Haz clic de nuevo para detener la grabación
6. La transcripción aparecerá en el campo de texto

### Paso 4: Enviar y escuchar
1. Haz clic en "Enviar" (✈️)
2. Gemini procesará tu mensaje
3. La respuesta se mostrará en el chat
4. **La IA leerá la respuesta en voz alta automáticamente** 🔊

---

## 📂 ARCHIVOS MODIFICADOS

### 1. **`src/lib/hooks/useVoz.ts`** (NUEVO)
Hook personalizado para manejar reconocimiento y síntesis de voz.

**Funciones principales:**
```typescript
const {
  estaGrabando,        // Estado de grabación
  transcripcion,       // Texto transcrito en tiempo real
  estaHablando,        // IA está hablando
  soportaReconocimiento, // Navegador soporta STT
  soportaSintesis,     // Navegador soporta TTS
  iniciarGrabacion,    // Iniciar grabación
  detenerGrabacion,    // Detener grabación
  hablar,              // Leer texto en voz alta
  detenerHabla,        // Detener lectura
} = useVoz({ ... });
```

### 2. **`src/app/chat/page.tsx`** (MODIFICADO)
Integración del hook de voz en la página de chat.

**Cambios:**
- Importa `useVoz` hook
- Inicializa con callbacks
- Actualiza `toggleGrabacionVoz()` para usar funciones reales
- Agrega indicador visual de transcripción
- Lee respuestas de IA automáticamente cuando `modoVoz` está activado

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Cambiar velocidad de lectura:
```typescript
hablar(texto, {
  velocidad: 1.2,  // 0.1 a 10 (default: 1.0)
  tono: 1.0,       // 0 a 2 (default: 1.0)
  volumen: 1.0,    // 0 a 1 (default: 1.0)
});
```

### Seleccionar voz específica:
```typescript
const voces = obtenerVoces();
console.log(voces); // Ver voces disponibles

hablar(texto, {
  vozPreferida: 'Google Español' // Nombre de la voz
});
```

### Cambiar idioma de reconocimiento:
```typescript
const { ... } = useVoz({
  idiomaReconocimiento: 'en-US', // Inglés
  // idiomaReconocimiento: 'es-ES', // Español (default)
});
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Tu navegador no soporta reconocimiento de voz"
**Solución:** Usa Chrome, Edge o Safari. Firefox tiene soporte limitado.

### Error: "Permiso de micrófono denegado"
**Solución:**
1. Ve a configuración del navegador
2. Busca "Permisos de sitio" o "Site Settings"
3. Encuentra "Micrófono"
4. Permite acceso a `localhost:3000`

### Error: "No se detectó voz"
**Solución:**
- Verifica que tu micrófono esté funcionando
- Habla más fuerte
- Acércate al micrófono
- Verifica que el micrófono correcto esté seleccionado en el sistema

### La IA no lee en voz alta
**Solución:**
- Asegúrate de que el volumen del sistema esté alto
- Verifica que no haya auriculares desconectados
- El modo voz se activa automáticamente cuando usas el botón del micrófono

### Voz robótica o de mala calidad
**Esto es normal.** Web Speech API usa las voces del sistema operativo, que pueden sonar robóticas. Si quieres voces más naturales, necesitarías usar Google Cloud Text-to-Speech (con costo después del tier gratuito).

---

## 📊 COMPARACIÓN: WEB SPEECH API vs GOOGLE CLOUD

| Característica | Web Speech API | Google Cloud Speech |
|----------------|----------------|---------------------|
| **Costo** | 100% GRATIS | Gratis hasta 60 min/mes |
| **Calidad de voz** | Robótica | Muy natural (WaveNet) |
| **Latencia** | Instantánea | ~500ms - 1s |
| **Idiomas** | Depende del OS | 100+ idiomas |
| **Configuración** | Ninguna | Requiere API key |
| **Límites** | Ilimitado | 60 min STT, 1M chars TTS/mes gratis |

**Recomendación:** Web Speech API es perfecta para MVP y desarrollo. Si necesitas voces ultra-naturales para producción, considera Google Cloud.

---

## 🎉 ESTADO ACTUAL

✅ **FUNCIONAL AL 100%**

### Lo que funciona:
- ✅ Reconocimiento de voz en español
- ✅ Transcripción en tiempo real
- ✅ Síntesis de voz en español
- ✅ Integración con Gemini IA
- ✅ Indicadores visuales
- ✅ Manejo de errores
- ✅ Compatible con Chrome, Edge, Safari

### Próximas mejoras (opcional):
- [ ] Botón para activar/desactivar lectura automática
- [ ] Selector de voces en UI
- [ ] Control de velocidad de lectura en UI
- [ ] Soporte para múltiples idiomas
- [ ] Detección automática de idioma

---

## 🔗 RECURSOS

**Web Speech API:**
- Documentación: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Speech Recognition: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- Speech Synthesis: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

**Can I Use:**
- https://caniuse.com/speech-recognition
- https://caniuse.com/speech-synthesis

---

**Fecha:** 15 de Octubre, 2025
**Estado:** ✅ Completamente funcional
**Costo:** 💰 $0.00 forever
