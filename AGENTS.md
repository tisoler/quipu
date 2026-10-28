# AGENTS.md — Frontend (React + Vite)

SPA de Quipu. React 18 + TypeScript + Vite 5 + TailwindCSS 3. Gestor de paquetes: **pnpm**.

Antes de tocar estilos, leer [DESIGN.md](./DESIGN.md): lineamientos visuales (paleta, tema claro/oscuro, componentes compartidos).

## Comandos

```bash
pnpm install
pnpm dev        # Vite en http://localhost:5173 (proxy /api → http://localhost:3035)
pnpm build      # tsc && vite build → dist/
pnpm preview    # sirve el build
pnpm lint       # eslint estricto (--max-warnings 0)
```

## Estructura

```
src/
├── pages/              # Una página por ruta (Dashboard, Productos, Materiales,
│                       # Almacenes, Rubros, Movimientos, Inventario, StockActual, MoverStock, Login)
├── components/         # Compartidos: Layout, DataTable, Autocomplete, MovimientoModal,
│                       # PageHeader, ThemeToggle, Loading, Skeleton, TableSkeleton, Logo
├── contexts/
│   ├── AuthContext.tsx    # Estado de sesión (Firebase user + perfil/permisos)
│   └── ThemeContext.tsx   # Tema light/dark (default: preferencia del navegador)
├── lib/
│   ├── firebase.ts     # Init de Firebase (config vía import.meta.env)
│   └── api.ts          # Instancia axios; baseURL = VITE_API_URL; interceptor agrega
│                       # el Firebase ID token como Bearer en cada request
├── types.ts            # Enums de dominio (TipoMovimiento, TipoArticulo, estados...)
├── App.tsx             # Rutas + PrivateRoute
└── main.tsx
```

## Reglas clave

- **Rutas protegidas**: todo vive bajo `<PrivateRoute><Layout/></PrivateRoute>`; si no hay `firebaseUser` se redirige a `/login`. La página `Movimientos` se reutiliza con props (`fixedTipoArticulo`, `fixedTipoMovimiento`, `addPermission`) para las vistas de compra/venta/producción — al crear un flujo nuevo de movimiento, preferir reutilizarla igual.
- **Permisos**: los strings de permiso (p. ej. `escritura:compra-producto`) deben coincidir exactamente con los del backend; se chequean contra los permisos del usuario en `AuthContext`.
- **Datos**: servidor HTTP centralizado en `lib/api.ts` (nunca crear otra instancia de axios); estado server con `@tanstack/react-query`.
- **UI**: Tailwind (config en `tailwind.config.js`), iconos de `lucide-react`, gráficos con `recharts`. Textos de la interfaz en español. `public/.htaccess` maneja el rewrite SPA en Apache (producción).
- **Tema claro/oscuro**: `darkMode: 'class'`; por defecto sigue al navegador. `ThemeContext` aplica la clase `dark` al `<html>` y persiste la elección en `localStorage` (`quipu-theme`); el script inline en `index.html` evita el flash de tema. Todo color nuevo debe llevar su variante `dark:`.
- **Diseño**: usar `PageHeader` para encabezados de página y las clases `.btn-primary` / `.btn-secondary` / `.card` de `index.css` en vez de estilos ad-hoc (ver [DESIGN.md](./DESIGN.md)).
- **Env**: las variables `VITE_*` se resuelven en build time (`import.meta.env`); en Docker se pasan como build args. Para desarrollo local alcanza con `pnpm dev` + el proxy a la API.
