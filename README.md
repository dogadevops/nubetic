# Nubetic - Landing Page

Sitio web de Nubetic (nubetic.com) - Soluciones de almacenamiento en la nube basadas en Nextcloud.

## 🚀 Proyecto

Este proyecto es una landing page construida con **Astro v6** usando **Node.js adapter** para renderizado del lado del servidor (SSR). Permite gestión dinámica de precios mediante el factor TRWQ.

## 🛠️ Stack

- **Framework**: Astro v6.1.4
- **Adapter**: @astrojs/node (modo standalone)
- **Styling**: Tailwind CSS
- **Deployment**: Docker / Node.js

## 📋 Requisitos

- Node.js >= 22.12.0
- Docker (para contenedor)

## 🧞 Comandos

| Comando | Acción |
|---------|--------|
| `npm install` | Instala dependencias |
| `npm run dev` | Inicia servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build de producción en `./dist/` |
| `npm run preview` | Previsualiza el build localmente |

## ☁️ Vercel Deployment

### Requisitos previos

1. Cuenta en **Vercel**
2. Instalar **Upstash Redis** (gratuito) desde Vercel Marketplace

### Paso 1: Instalar Upstash Redis

1. Ir a [Vercel Marketplace](https://vercel.com/marketplace)
2. Buscar **Upstash Redis**
3. Click en **Add Integration** → seleccionar tu proyecto
4. Following the prompts to create la base de datos
5. Copiar los valores de:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### Paso 2: Configurar Environment Variables

En **Vercel Dashboard → Settings → Environment Variables**, agregar:

| Variable | Valor | Entorno |
|----------|------|---------|
| `KV_REST_API_URL` | (URL de Upstash) | Production |
| `KV_REST_API_TOKEN` | (Token de Upstash) | Production |
| `TRWQ_API_KEY` | TuclaveSegura123! | Production |
| `VERCEL` | `1` | Production |

### Paso 3: Deploy

```bash
git add .
git commit -m "fix: add vercel kv support"
git push
```

El deployment automático detectará Vercel y usará KV.

### Cómo funciona

- **Local (desarrollo)**: guarda en `src/data/trwq-config.json`
- **Vercel (producción)**: guarda en Upstash Redis (cifrado)

## 🐳 Docker

### Desarrollo

```bash
docker-compose up --build
```

### Estructura del contenedor

- **Puerto**: 4321
- **Volumen**: `./src/data:/app/src/data` (persistencia de configuración TRWQ)
- **Variables de entorno**: `NODE_ENV=production`, `TRWQ_API_KEY`

## 🔐 Seguridad

### API Key

El endpoint `/api/trwq` está protegido con autenticación Bearer Token.

- **Header requerido**: `Authorization: Bearer {API_KEY}`
- **Clave actual**: Configurada en `.env` (cambiar para producción)

### Límites de validación

| Variable | Mínimo | Máximo |
|----------|--------|--------|
| VBC (Costo Base) | 0.01 | 1000 |
| VB (Valor de Venta) | 0.01 | 1000 |
| TRWQ (Factor) | 0.01 | 10 |

## 📊 Pricing

### Planes configurados

- **Cuenta Personal**: 250GB - 8TB (valores fijos)
- **Grupo de Trabajo**: 250GB - 50TB (valores fijos)
- **Empresarial**: 1TB - 24TB (valores dinámicos × TRWQ)
- **Empresarial+**: 36TB - 504TB (valores dinámicos × TRWQ)

## 🗂️ Estructura

```
nubetic/
├── src/
│   ├── pages/
│   │   ├── enterprise-settings.astro  # Panel de admin
│   │   ├── api/trwq.ts                 # API de configuración
│   │   └── servicios/                  # Páginas de servicios
│   ├── components/
│   │   └── ProductCard.astro          # Card de precios dinámicos
│   ├── data/
│   │   └── trwq-config.json           # Configuración persistida
│   └── layouts/
├── Dockerfile
├── docker-compose.yml
├── astro.config.mjs
└── package.json
```

## 📖 Roadmap

### Fase 1: Testing ✅
- [x] Configuración Docker creada
- [ ] Probar Docker localmente
- [ ] Verificar todas las páginas funcionan

### Fase 2: Preparación Producción
- [ ] Cambiar API Key por defecto
- [ ] Configurar proveedor de hosting
- [ ] Configurar DNS para www.nubetic.com
- [ ] Configurar SSL/HTTPS

### Fase 3: Deployment

#### Opciones recomendadas (Contenedores)
| Proveedor | Pros |
|-----------|------|
| Railway | Configuración fácil, SSL automático |
| Render | Tier gratuito disponible |
| DigitalOcean App Platform | Escalable, control total |

#### Opciones alternativas (Node.js tradicional)
| Proveedor |
|-----------|
| Vercel (con Astro adapter) |
| Netlify (con Astro adapter) |
| Heroku |

#### Auto-hosteado (VPS)
- Usar imagen Docker en un VPS (DigitalOcean Droplet, Hetzner, etc.)
- Nginx como reverse proxy con SSL (Let's Encrypt)

## 🔧 Configuración

### Variables de entorno

Crear archivo `.env` basado en `.env.example`:

```bash
TRWQ_API_KEY=tu-clave-secreta-aqui
```

### Actualizar precios

1. Ir a `/enterprise-settings`
2. Ingresar password: `NubeticAdmin2024!`
3. Modificar VBC y VB
4. El factor TRWQ se calcula automáticamente
5. Los precios en las páginas de servicios se actualizan dinámicamente

## 📝 Notas técnicas

- **Modo SSR**: `output: 'server'` en astro.config.mjs
- **i18n**: `prefixDefaultLocale: false` para URLs limpias (/servicios sin /es/)
- **Persistencia**: Los cambios en TRWQ se guardan en `src/data/trwq-config.json`
- **Docker**: Build multi-stage (builder → runner) para imagen optimizada
- **Vercel**: Upstash Redis para persistencia segura en producción

## ⚠️ Notas de seguridad para producción

1. **Cambiar API Key** antes de desplegar a producción
2. **Usar HTTPS** obligatoriamente
3. **No commitear .env** al repositorio
4. **Considerar** cambiar URL del panel admin a una ruta más discreta (ej: /admin-secret)

---

*Documentación actualizada: Abril 2026*