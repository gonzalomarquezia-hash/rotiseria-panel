# Panel de Rotisería - Vercel Deployment

Panel de gestión de pedidos con notificaciones push para rotiserías.

## Estructura del Proyecto

```
vercel-panel/
├── api/
│   └── send-push.js      # API para enviar notificaciones push
├── public/
│   ├── index.html        # Panel principal (PWA)
│   ├── sw.js             # Service Worker
│   └── manifest.json     # Manifest para PWA
├── package.json
├── vercel.json
└── README.md
```

## Deploy a Vercel

### Paso 1: Subir a GitHub

1. Crear nuevo repositorio en GitHub (ej: `rotiseria-panel`)
2. Subir estos archivos:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/rotiseria-panel.git
git push -u origin main
```

### Paso 2: Deploy en Vercel

1. Ir a https://vercel.com
2. Login con GitHub
3. Click en "Add New Project"
4. Importar el repositorio `rotiseria-panel`
5. Framework Preset: **Other**
6. Click en **Deploy**

La URL quedará algo como: `https://rotiseria-panel.vercel.app`

### Paso 3: Configurar n8n

En el workflow de n8n, actualizar el nodo "Enviar Push":
- **Método**: POST
- **URL**: `https://TU-PROYECTO.vercel.app/api/send-push`
- **Body**: (igual que antes)

```json
{
  "subscription": {{ $json.subscription }},
  "payload": {{ $json.payload }}
}
```

### Paso 4: Configurar Supabase (CORS)

En Supabase Dashboard:
1. Ir a **Authentication → URL Configuration**
2. Agregar a "Redirect URLs": `https://TU-PROYECTO.vercel.app`

## VAPID Keys

Las claves VAPID ya están configuradas en:
- `api/send-push.js` (backend)
- `public/index.html` (frontend - en el service worker registration)

Si querés regenerarlas:
```bash
npx web-push generate-vapid-keys
```

## Funcionalidades

✅ Panel de pedidos en tiempo real (Supabase Realtime)
✅ Notificaciones push Web
✅ Funciona con la app cerrada
✅ HTTPS gratuito
✅ PWA (instalable en celular)
✅ Responsive (adaptado a móviles)

## URLs Importantes

| Servicio | URL |
|----------|-----|
| Panel | `https://TU-PROYECTO.vercel.app` |
| API Push | `https://TU-PROYECTO.vercel.app/api/send-push` |

## Testing

1. Abrir el panel en el navegador
2. Aceptar permisos de notificación
3. Verificar que aparezca "Notificaciones: ✅" en el header
4. Enviar un pedido desde WhatsApp
5. Verificar que llegue la notificación push

## Soporte

Si hay problemas:
1. Revisar logs en Vercel Dashboard
2. Verificar consola del navegador (F12)
3. Confirmar suscripción en tabla `suscripciones_push` de Supabase
