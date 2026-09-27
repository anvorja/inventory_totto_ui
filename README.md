# Contador de Inventario Totto — UI

React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + TanStack (Router, Query, Virtual).
Mobile-first, adaptada a tablet (md ≥ 768px), con tema claro/oscuro.

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:5173 (y en la red local, para probar en el celular)
pnpm build        # typecheck + build
pnpm lint && pnpm format
```

El API debe estar corriendo en `http://localhost:8000` (ver `../contador-inventario-totto-api`);
Vite hace proxy de `/api`. En producción define `VITE_API_URL` (ver `.env.example`).

> La cámara en vivo requiere **HTTPS** (o `localhost`). Probando desde el celular por IP de la
> red local (http) la app cae automáticamente a "Foto" y al teclado.

## Cuentas de desarrollo

> ⚠ Solo durante el desarrollo: el repositorio es público y estas cuentas acceden a la app
> desplegada con datos reales. Desactívalas antes de la operación real.

App: https://inventory-totto-ui.netlify.app

| Usuario | Contraseña | Rol | Notas |
|---|---|---|---|
| `admin` | `xnfg-e3gz-m5j` | Administrador | Temporal: pide cambiarla en el primer ingreso |
| `pruebas.admin` | `Totto-brbn-6c5e` | Administrador | Fija, para pruebas |
| `pruebas.asesor` | `Totto-tk5f-pxgz` | Asesor (FQ95) | Fija, para pruebas |

Cuándo se pide cambiar la contraseña y cómo se gestionan las cuentas: ver
[README del API](https://github.com/anvorja/inventory_totto_api#cuentas-de-desarrollo).

## Arquitectura (Context + Custom Hooks)

```
src/
├── contexts/     # Solo createContext() + tipos (el "contrato")
│   ├── AuthContext.ts  ThemeContext.ts  StoreContext.ts  CountSessionContext.ts
├── providers/    # Estado y lógica de cada contexto
│   ├── AuthProvider.tsx  ThemeProvider.tsx  StoreProvider.tsx  CountSessionProvider.tsx  AppProviders.tsx
├── hooks/        # Interfaz limpia para los componentes
│   ├── useAuth  useTheme  useStore  useCountSession   ← consumen contextos
│   ├── useSessions  useSnapshots  useComparison ...   ← datos del servidor (TanStack Query)
│   └── useBarcodeScanner  useMediaQuery  useDebouncedValue
├── lib/          # api/ (cliente, tipos, endpoints), formato, lector de códigos, feedback
├── components/   # ui/ (shadcn) · layout/ · count/ · compare/ · home/ · data/ · common/
├── pages/        # HomePage · CountPage · ComparisonPage · DataPage
└── router.tsx    # Rutas (TanStack Router, carga diferida por página)
```

Sesión: `AuthGate` muestra el login, o el cambio obligatorio de contraseña temporal,
antes de montar la app, conservando la URL. La cookie es httpOnly: el frontend nunca ve
el token. Los permisos por rol están en `src/lib/permissions.ts` (`useAuth().can(...)`)
y solo ocultan acciones; quien decide es el backend.

Rutas: `/usuarios` (admin) · `/` inicio · `/conteos/:id` contar · `/conteos/:id/diferencias?estado=missing|surplus|unexpected|ok|all` · `/datos` existencias.

Todos los datos de inventario viven en el backend. En el dispositivo solo se guardan
preferencias: tema y tienda elegida. Quién cuenta sale del usuario con sesión iniciada.

## Despliegue (Netlify + API en Render)

`netlify.toml` define el build (`pnpm build && node scripts/netlify-redirects.mjs`), que
genera `dist/_redirects` con dos reglas:

```
/api/*  https://<api>.onrender.com/api/:splat  200   # proxy al API
/*      /index.html                            200   # rutas de la SPA (/conteos/3, …)
```

El proxy hace que el navegador vea el API en el mismo dominio de la app: la cookie de
sesión (httpOnly, `SameSite=Lax`) funciona en todos los navegadores, incluido Safari/iOS,
que bloquea cookies entre `netlify.app` y `onrender.com`.

Variables en Netlify (Site configuration → Environment variables):

| Variable | Valor |
|---|---|
| `API_ORIGIN` | `https://inventory-totto-api.onrender.com` (obligatoria; el build falla sin ella) |

No definas `VITE_API_URL`: la app usa `/api/v1` en su propio dominio. En el API, pon
`CORS_ORIGINS=["https://inventory-totto-ui.netlify.app"]` y `COOKIE_SECURE=true`.
