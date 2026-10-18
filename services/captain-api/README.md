# Voz de la capitana

Servicio Node sin dependencias, desplegado en Vercel como `itse-cloud-city-voice`.
Producción: https://itse-cloud-city-voice-upgradedigitalsas-cryptos-projects.vercel.app/api/captain

Variables de producción (configurar en Vercel, nunca en Git):
- `ELEVENLABS_API_KEY`: secreto sensible.
- `ELEVENLABS_VOICE_ID`: voz elegida.

GET genera exclusivamente el texto versionado de `lib/lines.mjs`. Devuelve audio base64 y tiempos por frase. No acepta texto o voz del visitante. Caché CDN 24 horas y caché local por instancia; reinicios o expiración pueden volver a consumir créditos. No es almacenamiento permanente ni una cuota global. CORS permite el sitio de GitHub Pages; no sustituye autenticación. Use los límites de gasto de la clave en ElevenLabs.

La ciudad usa la locución y los subtítulos, con voz del navegador como respaldo ante fallos. La reproducción requiere interacción inicial del visitante. Mantener `lib/lines.mjs` y `js/captain-lines.js` sincronizados (test incluido). Actualizar variables requiere un nuevo deployment. El proyecto Vercel se desplegó desde archivos, no está conectado automáticamente al repositorio.

Documentación: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
