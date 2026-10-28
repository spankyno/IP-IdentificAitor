# IP IdentificAitor 🛡️ (LayerCall Powered)

**IP IdentificAitor** es una plataforma moderna de inteligencia de amenazas, reputación de direcciones IP, validación de correo electrónico, verificación de números telefónicos y detección de huellas de dispositivo impulsada por la API de **[LayerCall](https://www.layercall.com/)**.

Ofrece un diseño premium y minimalista en modo oscuro, puntuaciones de riesgo unificadas de 0 a 100, veredictos claros automatizados (**ALLOW**, **REVIEW**, **BLOCK**), latencia en milisegundos, gestión de cuotas de uso diarias y arquitectura modular preparada para **Clerk**.

---

## 🚀 Capacidades y Endpoints de LayerCall

1. **Inteligencia IP (`https://www.layercall.com/v1/score/ip`)**
   - **Veredicto:** `allow` (Permitir), `review` (Revisar), `block` (Bloquear).
   - **Risk Score:** Puntuación normalizada de 0 a 100.
   - **Señales:** Detección de `is_vpn`, `is_proxy`, `is_tor`, `is_datacenter`, `recent_abuse`, `is_hijacked_netblock`, `is_crawler`.
   - **Geolocalización & Red:** País, región, ciudad, ASN, ISP y zona horaria.
   - **Latencia:** Métrica en tiempo real `processing_time_sec`.

2. **Validación de Correo (`https://www.layercall.com/v1/verify/email`)**
   - **Señales:** `syntax_valid`, `mx_found`, `is_disposable`, `is_role_account`, `is_free_provider`, `is_catch_all`.
   - **Infraestructura:** Host MX, nombre del proveedor y antigüedad estimada del dominio.

3. **Verificación Telefónica (`https://www.layercall.com/v1/lookup/phone`)**
   - **Señales:** `is_voip`, `is_disposable`, `is_premium_rate`, `recent_abuse`, `is_spammer`.
   - **Metadatos:** Operador móvil (*carrier*), tipo de línea (`mobile`, `voip`, `fixed_line`), formato nacional e internacional.

4. **Fingerprint & Detección de Dispositivo**
   - Huella de Canvas 2D, renderizador GPU WebGL, cores lógicos de CPU y resolución.
   - Detección de automatizaciones (`navigator.webdriver`, Selenium, Puppeteer) y navegadores en modo *Headless*.

5. **Límites de Uso & Arquitectura para Clerk**
   - **Usuario Anónimo:** 10 consultas / día.
   - **Usuario Registrado:** 50 consultas / día.
   - **Administrador:** Ilimitadas.

---

## 🔑 Variables de Entorno

```bash
# Clave API de LayerCall (https://www.layercall.com)
LAYERCALL_API_KEY="tl_live_tu_clave_aqui"
```

> **Nota:** Si no se define `LAYERCALL_API_KEY`, IP IdentificAitor opera automáticamente en **Modo Sandbox**, emulando las respuestas oficiales de LayerCall con total fidelidad para pruebas locales y demostraciones.

---

## 📦 Instalación y Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/ip-identificaitor.git
cd ip-identificaitor

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:3000`.

---

## ☁️ Despliegue en Cloudflare Pages

1. Sube tu código a **GitHub**.
2. En Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Selecciona el repositorio.
4. En **Environment variables**, añade:
   - `LAYERCALL_API_KEY`: Tu clave obtenida en [layercall.com](https://www.layercall.com/).
5. Despliega la aplicación.

---

## 📄 Licencia

MIT. Potenciado por la API de [LayerCall](https://www.layercall.com/).
