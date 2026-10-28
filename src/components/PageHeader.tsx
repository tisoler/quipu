import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  /** Acciones de la página (botones), alineadas a la derecha en desktop */
  actions?: ReactNode
}

/**
 * Encabezado estándar de página: título + descripción opcional + acciones.
 * Desktop first (acciones a la derecha); en mobile se apilan.
 */
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
