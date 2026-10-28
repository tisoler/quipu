# DESIGN.md — Lineamientos de diseño de la UI

Guía para mantener la coherencia visual de Quipu. App de gestión tradicional
(stock, ventas, compras, almacenes): **sobria, moderna, desktop first pero responsive**.

## Principios

1. **Sobriedad ante todo**: fondos neutros, bordes sutiles, sombras mínimas. El color
   fuerte (azul) se reserva para acciones primarias y estados activos.
2. **Desktop first**: las vistas se diseñan para pantallas anchas (sidebar fija, tablas)
   y luego se adaptan hacia abajo (`sm:`, `md:`, `lg:`, `xl:`). En mobile las tablas
   pasan a tarjetas (ver `DataTable`) y la sidebar a menú hamburguesa.
3. **Consistencia**: usar los componentes y clases compartidos antes que estilos ad-hoc.

## Tema claro/oscuro

- Estrategia de Tailwind: `darkMode: 'class'` (la clase `dark` va en `<html>`).
- **Por defecto sigue la preferencia del navegador** (`prefers-color-scheme`).
  Si el usuario elige un tema manualmente, se persiste en `localStorage` (`quipu-theme`).
- `src/contexts/ThemeContext.tsx` administra la preferencia y aplica la clase.
- `index.html` incluye un script inline que aplica el tema antes del primer pintado
  (evita el "flash" de tema incorrecto). No eliminarlo.
- `components/ThemeToggle.tsx` es el control visible (Login + Layout).
- **Regla**: todo color de fondo, borde o texto debe llevar su variante `dark:`.

## Paleta

| Uso | Color |
|---|---|
| Primario / acciones | `blue-600` (hover `blue-700`), texto acento `blue-600` / `dark:blue-400` |
| Fondo de página | `gray-50` / `dark:gray-900` |
| Superficies (tarjetas, sidebar) | `white` / `dark:gray-800` |
| Bordes | `gray-200` / `dark:gray-700` |
| Texto principal | `gray-900` / `dark:white` |
| Texto secundario | `gray-500` / `dark:gray-400` |
| Éxito / error / advertencia | `green-*`, `red-*`, `amber-*` (fondos al 100 + texto al 700/800) |

## Clases de componente compartidas (index.css, `@layer components`)

- `.btn-primary` — acción principal (guardar, agregar, confirmar).
- `.btn-secondary` — acción neutra (cancelar, volver).
- `.card` — contenedor de contenido (tarjeta con borde y sombra sutil).
- `.form-label` / `.form-input` — etiquetas y campos estándar de formularios.

Preferir estas clases a repetir utilidades sueltas. Los botones de acción llevan
icono `lucide-react` de 16px (`<Plus size={16} strokeWidth={2} />`).

## Componentes clave

- **`PageHeader`**: encabezado estándar de página (título `text-2xl font-bold
  tracking-tight`, descripción `text-sm` gris, acciones a la derecha). Usarlo en
  todas las vistas en lugar de `<h1>` ad-hoc.
- **`DataTable`**: tabla en desktop, tarjetas en mobile, paginación incluida.
- **`Modal`**: shell compartido de modales (header con X, cuerpo scrolleable, footer);
  los formularios van en grilla `grid-cols-1 md:grid-cols-2`.
- **`ThemeToggle`**: selector de tema.

### Vistas transaccionales (puesto de venta)

- `/puesto` (POS): prioriza velocidad de operación — buscador grande con autofocus,
  resultados con stock y precio, carrito con +/-, montos en `font-mono tabular-nums`.
  Usa estados de pantalla completa (abrir caja / caja cerrada) centrados con `.card`.
- `/cajas` y `/caja-central`: administración de cajas y arqueo; mismo lenguaje visual
  que el resto (PageHeader + DataTable + Modal).
- **`Layout`**: sidebar fija en `xl+`, header mobile sticky con menú desplegable.

## Tipografía

Stack del sistema con preferencia por Inter (ver `index.css`). Tamaños de referencia:

- Título de página: `text-2xl font-bold tracking-tight`
- Título de sección/tarjeta: `text-lg font-semibold`
- Texto base: `text-sm`
- Etiquetas de tabla y metadatos: `text-xs uppercase tracking-widest`

## Detalles de interacción

- Focus visible: `focus:ring-2 focus:ring-blue-500/20` (o ring completo en botones primarios).
- Inputs: `rounded-lg`, borde `gray-300`/`dark:gray-600`, icono a la izquierda cuando aplica.
- Transición de tema de 150ms aplicada globalmente; respetar `prefers-reduced-motion`.
- Estados deshabilitados: `disabled:opacity-60 disabled:cursor-not-allowed`.
- Iconografía: `lucide-react`, `strokeWidth` 1.6–2.

## Accesibilidad

- `aria-label` en botones de solo icono (menú, tema, salir).
- `color-scheme` se ajusta según el tema para controles nativos (scrollbars, selects).
- Contraste: texto secundario nunca más claro que `gray-400` (light) / `gray-500` (dark).
