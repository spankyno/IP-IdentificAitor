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

---

## 🔐 Clerk (registro e inicio de sesión)

### 1. Crear aplicación en Clerk

1. Entra en [dashboard.clerk.com](https://dashboard.clerk.com)
2. **Create application** → nombre p. ej. `IP IdentificAitor`
3. Activa **Email** (y Google si quieres)
4. En **API Keys** copia:
   - **Publishable key** → `pk_test_…` o `pk_live_…`
   - **Secret key** → `sk_test_…` o `sk_live_…` (solo servidor)

### 2. Dominios permitidos

En Clerk → **Configure** → **Domains** / **Allowed origins**:

- Local: `http://localhost:3000`
- Producción: `https://ip-identificaitor.pages.dev`

### 3. Variables de entorno

| Variable | Dónde | Descripción |
|----------|--------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend (build) | Clave pública `pk_…`. **Obligatoria** para mostrar Entrar / Registrarse |
| `CLERK_SECRET_KEY` | Solo servidor / Functions | Clave secreta `sk_…`. Opcional por ahora (cuotas en cliente) |
| `LAYERCALL_API_KEY` | Functions | API LayerCall |

#### Local (archivo `.env` en la raíz)

```bash
cp .env.example .env
# Edita:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
# CLERK_SECRET_KEY=sk_test_xxxxxxxx   # opcional
```

Reinicia `npm run dev` tras cambiar `.env`.

#### Cloudflare Pages

1. **Settings** → **Environment variables**
2. Añade (Production y Preview si aplica):

| Name | Value | Encrypt |
|------|--------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_…` o `pk_live_…` | No hace falta (es pública) |
| `CLERK_SECRET_KEY` | `sk_test_…` o `sk_live_…` | **Sí** (secret) |
| `LAYERCALL_API_KEY` | tu clave LayerCall | **Sí** |

3. **Importante:** las variables `VITE_*` se inyectan en el **build**. Tras guardarlas, lanza un **nuevo deploy** (Retry deployment).

### 4. Roles y cuotas

| Estado | Rol | Consultas / día |
|--------|-----|-----------------|
| Sin sesión | `anonymous` | 10 |
| Registrado / logueado | `registered` | 50 |
| `publicMetadata.role = "admin"` en Clerk | `admin` | Ilimitadas |

Para hacer admin a un usuario: Clerk Dashboard → Users → usuario → **Public metadata**:

```json
{ "role": "admin" }
```

### 5. Sin Clerk

Si no defines `VITE_CLERK_PUBLISHABLE_KEY`, la app sigue en modo demo con el selector de rol simulado en el header.
