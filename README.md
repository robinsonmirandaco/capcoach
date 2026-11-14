# Cap Coach

Chatbot de texto y voz de la campaña Save Your Cap a Seat / Guárdale un puesto a tu tapa (A Cleaner Planet + Plastic Fisherman).

- `app/page.tsx`: la interfaz (chat, botones rápidos, micrófono, botón Escuchar, contador).
- `app/api/chat/route.ts`: llama a la API de Anthropic (`claude-haiku-5-5`, 300 tokens) y devuelve la respuesta en streaming.
- `config/cap-coach-system-prompt.txt`: las instrucciones de Cap Coach. Para cambiar lo que sabe o cómo responde, edita este archivo y vuelve a desplegar.
- `next.config.ts`: encabezado `Content-Security-Policy: frame-ancestors` (qué sitios pueden insertarlo en un iframe).

## Probar en local

```bash
cp .env.example .env.local   # y pega tu ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | Llave de la API. Solo vive en el servidor. |
| `FRAME_ANCESTORS` | No | Sitios que pueden insertar el iframe, separados por espacios. Por defecto: plasticfisherman.com y acleanerplanet.org (con y sin `www`). Se lee al compilar: después de cambiarla hay que volver a desplegar. |

## Insertar en otro sitio

```html
<iframe src="https://TU-PROYECTO.vercel.app" allow="microphone; autoplay" width="100%" height="640" style="border:0"></iframe>
```

## Límites

- 20 mensajes del usuario por sesión (cliente y servidor) y 300 caracteres por mensaje (el servidor recorta).
- El límite por sesión se basa en el historial que envía el navegador: recargar la página empieza una sesión nueva. Para un tope de gasto firme, pon un límite de gasto mensual en la consola de Anthropic.
