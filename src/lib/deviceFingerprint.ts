import { DeviceFingerprint } from '../types/ipqs';

/**
 * Computes a simple fast non-cryptographic hash (DJB2 variant) from a string
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Collects hardware, canvas, webgl, and environment properties to produce a reliable visitor fingerprint
 * and checks for bot/automation signals (like window.navigator.webdriver).
 */
export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  const nav = window.navigator as Navigator & {
    deviceMemory?: number;
    webdriver?: boolean;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  };

  // 1. Canvas Fingerprint
  let canvasHash = 'canvas_unsupported';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('IP IdentificAitor 🛡️', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('IP IdentificAitor 🛡️', 4, 17);
      const dataUrl = canvas.toDataURL();
      canvasHash = hashString(dataUrl);
    }
  } catch (e) {
    console.error('Canvas fingerprinting error:', e);
  }

  // 2. WebGL Fingerprint (GPU vendor & renderer)
  let webglVendor = 'Unknown';
  let webglRenderer = 'Unknown';
  try {
    const glCanvas = document.createElement('canvas');
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (gl && 'getExtension' in gl) {
      const dbgRenderInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (dbgRenderInfo) {
        webglVendor = (gl as WebGLRenderingContext).getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
        webglRenderer = (gl as WebGLRenderingContext).getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
      }
    }
  } catch (e) {
    console.error('WebGL detection error:', e);
  }

  // 3. Automation / Headless checks
  const riskFlags: string[] = [];
  let riskScore = 5; // Baseline safe

  const isWebdriver = Boolean(nav.webdriver);
  if (isWebdriver) {
    riskFlags.push('Navigator.webdriver flag detectado (Automatización / Selenium / Puppeteer)');
    riskScore += 45;
  }

  // Headless Chrome indicators
  const hasChromeProp = Boolean((window as unknown as { chrome?: unknown }).chrome);
  const isHeadless = /HeadlessChrome/.test(nav.userAgent) || (!hasChromeProp && /Chrome/.test(nav.userAgent) && !/Edge/.test(nav.userAgent));
  if (isHeadless) {
    riskFlags.push('Navegador en modo Headless detectado');
    riskScore += 40;
  }

  // Missing plugins or unusual language
  if (!nav.languages || nav.languages.length === 0) {
    riskFlags.push('Cabeceras de lenguaje vacías o ausentes');
    riskScore += 15;
  }

  if (window.screen.width === 0 || window.screen.height === 0) {
    riskFlags.push('Dimensiones de pantalla anómalas (0x0)');
    riskScore += 30;
  }

  // Build visitor ID seed
  const rawSeed = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'unknown',
    nav.deviceMemory || 'unknown',
    canvasHash,
    webglRenderer,
  ].join('###');

  const visitorId = `fp_${hashString(rawSeed)}`;

  return {
    visitorId,
    timestamp: Date.now(),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
    },
    browser: {
      userAgent: nav.userAgent,
      language: nav.language,
      languages: nav.languages || [nav.language],
      cookiesEnabled: nav.cookieEnabled,
      platform: nav.platform || 'Unknown',
      vendor: nav.vendor || 'Unknown',
      hardwareConcurrency: nav.hardwareConcurrency || 4,
      deviceMemory: nav.deviceMemory,
    },
    graphics: {
      webglVendor,
      webglRenderer,
      canvasHash,
    },
    timing: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      timezoneOffset: new Date().getTimezoneOffset(),
    },
    automation: {
      webdriver: isWebdriver,
      hasAutomationHeadless: isHeadless,
      riskScore: Math.min(riskScore, 100),
      verdict: Math.min(riskScore, 100) < 30 ? 'allow' : Math.min(riskScore, 100) < 75 ? 'review' : 'block',
      riskFlags,
    },
  };
}
