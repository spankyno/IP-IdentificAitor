# IP IdentificAitor 🛡️ (LayerCall Powered)

**IP IdentificAitor** es una plataforma moderna de inteligencia de amenazas, reputación de direcciones IP, validación de correo electrónico, verificación de números telefónicos y detección de huellas de dispositivo impulsada por la API de **[LayerCall](https://www.layercall.com/)**.

Ofrece un diseño premium y minimalista en modo oscuro, puntuaciones de riesgo unificadas de 0 a 100, veredictos claros automatizados (**ALLOW**, **REVIEW**, **BLOCK**), latencia en milisegundos, gestión de cuotas de uso diarias y arquitectura modular preparada para **Clerk**.

---

## 🚀 Capacidades

1. **Inteligencia IP** — VPN, proxy, Tor, datacenter, geolocalización, ASN/ISP
2. **Validación de correo** — sintaxis, MX, desechable, rol, honeypot
3. **Verificación telefónica** — VoIP, spam, carrier, tipo de línea
4. **Dominio** — antigüedad, SPF/DMARC, registrador
5. **Fingerprint de dispositivo** — canvas, WebGL, headless/webdriver
6. **Cuotas** — Anónimo 10/día · Registrado 50/día · Admin ∞

---

## 🔑 Variables de entorno

```bash
LAYERCALL_API_KEY="tl_live_tu_clave_aqui"
```

Si no se define, opera en **Modo Sandbox** con respuestas simuladas.

---

## 📦 Desarrollo local

```bash
npm install --legacy-peer-deps
npm run dev
```

Abre `http://localhost:3000`. El servidor Express + Vite transforma `/src/*.tsx` y expone `/api/*`.

---

## ☁️ Despliegue en Cloudflare Pages (producción)

### Causa del error MIME / página en blanco

Cloudflare Pages es **estático**: no ejecuta `server.ts` ni sirve TypeScript.
Si despliegas el código fuente, el navegador pide `/src/main.tsx` y recibe
`Content-Type: application/octet-stream` → la página no carga.

**Solución:** construir con Vite y publicar solo la carpeta `dist/`.

### Configuración en Cloudflare Dashboard

1. **Workers & Pages** → tu proyecto → **Settings** → **Builds and deployments**
2. Ajusta exactamente:

| Campo | Valor |
|-------|--------|
| Framework preset | *(ninguno / None — no uses VitePress)* |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(vacío)* |
| Node version | **20** (o 18) |

> El archivo `.npmrc` con `legacy-peer-deps=true` evita el error `ERESOLVE` en el `npm install` de Cloudflare.

3. **Environment variables** (Production):
   - `LAYERCALL_API_KEY` = tu clave de [layercall.com](https://www.layercall.com/)

4. **Save** y **Retry deployment** (o push a Git).

### Verificación tras el deploy

En DevTools → Network, el HTML debe cargar scripts tipo:

```
/assets/index-XXXXXXXX.js
```

**NO** debe aparecer `/src/main.tsx`.

### API en Cloudflare

Las rutas `/api/*` se ejecutan con **Pages Functions** (`/functions/api/*`):
- `/api/check-ip`
- `/api/check-email`
- `/api/check-phone`
- `/api/check-domain`
- `/api/config-status`
- `/api/detect-ip`

Sin `LAYERCALL_API_KEY` responden en modo sandbox.

### Deploy manual con Wrangler (opcional)

```bash
npm run build
npx wrangler pages deploy dist --project-name=ip-identificaitor
```

---

## 📄 Licencia

MIT. Potenciado por la API de [LayerCall](https://www.layercall.com/).
