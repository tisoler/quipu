# Quipu Frontend

Aplicación frontend para Quipu, construida con React, Vite, TypeScript y Tailwind CSS.

## Requisitos

- Node.js 18+
- pnpm

## Instalación

1. Instalar dependencias:
```bash
pnpm install
```

2. Configurar variables de entorno (opcional):
```bash
# Crear .env.local si necesitas cambiar la URL de la API
VITE_API_URL=http://localhost:3000/api
```

3. Iniciar el servidor de desarrollo:
```bash
pnpm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Características

- **Responsive**: Diseño adaptativo para laptop, tablet y móvil
- **Dark Mode**: Soporte automático basado en preferencias del navegador
- **Autenticación**: Login con JWT y refresh tokens
- **Gestión de Estado**: TanStack Query para datos del servidor
- **Navegación**: React Router con lazy loading
- **Estilos**: Tailwind CSS con tema personalizado

## Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── contexts/      # Contextos de React (Auth)
├── lib/           # Utilidades y configuración
├── pages/         # Páginas de la aplicación
└── types/         # Tipos TypeScript
```

## Páginas

- `/login` - Inicio de sesión
- `/` - Dashboard
- `/productos` - Gestión de productos
- `/materiales` - Gestión de materiales
- `/almacenes` - Gestión de almacenes

## Build

Para crear una build de producción:
```bash
pnpm run build
```

Los archivos se generarán en la carpeta `dist/`
