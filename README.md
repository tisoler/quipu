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

2. Configurar variables de entorno:
```bash
# Crear archivo .env en la raíz del proyecto (quipu/)
# Copia .env.example a .env y ajusta los valores
cp .env.example .env

# Edita .env y configura:
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

**Nota**: Vite solo lee variables que empiezan con `VITE_`. El archivo `.env` se carga automáticamente en desarrollo.

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
