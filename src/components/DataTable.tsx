import { ReactNode } from 'react'
import TableSkeleton from './TableSkeleton'
import clsx from 'clsx'

export interface Column<T> {
  header: string
  key: keyof T | string
  type?: 'text' | 'tag' | 'currency' | 'number' | 'date' | 'boolean'
  className?: string
  render?: (item: T) => ReactNode
  mobileOnly?: boolean
  hideOnMobile?: boolean
  wrap?: boolean
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (item: T) => void
  renderActions?: (item: T) => ReactNode
  emptyMessage?: string
  pagination?: PaginationProps
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  data,
  isLoading,
  onRowClick,
  renderActions,
  emptyMessage = 'No se encontraron registros.',
  pagination,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TableSkeleton columns={columns.length + (renderActions ? 1 : 0)} rows={5} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4 text-gray-400">
          {/* Icon placeholders can go here if needed, like Search off */}
          <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMessage}</p>
      </div>
    )
  }

  const renderCellValue = (item: T, column: Column<T>): ReactNode => {
    if (column.render) return column.render(item)

    const value = item[column.key as keyof T]

    switch (column.type) {
      case 'currency':
        return typeof value === 'number' || typeof value === 'string'
          ? `$ ${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : (value as unknown as ReactNode)
      case 'boolean':
        return (
          <span className={clsx(
            "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight",
            value ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {value ? 'Sí' : 'No'}
          </span>
        )
      case 'tag':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-[11px] font-bold border border-blue-100 dark:border-blue-800">
            {String(value)}
          </span>
        )
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (value as unknown as ReactNode)
      case 'date':
        return value ? new Date(value as any).toLocaleDateString('es-AR') : '-'
      default:
        return (value as unknown as ReactNode) || '-'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full ring-1 ring-black/[0.05] dark:ring-white/[0.05] overflow-hidden">
      {/* Vista Desktop: Tabla */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
          <thead className="bg-gray-50/50 dark:bg-gray-900/40 backdrop-blur-sm sticky top-0 z-10">
            <tr>
              {columns.filter(c => !c.mobileOnly).map((column, idx) => (
                <th
                  key={idx}
                  className={clsx(
                    "px-6 py-4 text-center text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
              {renderActions && (
                <th className="px-6 py-4 text-center text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={clsx(
                  "transition-all duration-200",
                  onRowClick ? "hover:bg-blue-50/30 dark:hover:bg-blue-400/5 cursor-pointer active:scale-[0.998]" : "hover:bg-gray-50/50 dark:hover:bg-white/5"
                )}
              >
                {columns.filter(c => !c.mobileOnly).map((column, idx) => (
                  <td
                    key={idx}
                    className={clsx(
                      "px-4 py-4 text-sm text-gray-600 dark:text-gray-300",
                      !column.wrap && "whitespace-nowrap",
                      (column.type === 'currency' || column.type === 'number') ? 'text-right font-mono' : '',
                      column.className
                    )}
                  >
                    {renderCellValue(item, column)}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex justify-center gap-2">
                      {renderActions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile: Lista de Cards */}
      <div className="md:hidden flex-1 divide-y divide-gray-100 dark:divide-gray-700/50 overflow-y-auto">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => onRowClick?.(item)}
            className="px-6 py-5 space-y-4 bg-white dark:bg-transparent active:bg-gray-50/80 dark:active:bg-gray-700/30 transition-all duration-200"
          >
            <div className="grid grid-cols-1 gap-3">
              {columns.filter(c => !c.hideOnMobile).map((column, idx) => {
                const isHeader = idx === 0;
                return (
                  <div key={idx} className={clsx("flex justify-between items-start gap-4")}>
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-100 uppercase tracking-widest min-w-[100px] pt-1 leading-none shrink-0">
                      {column.header}
                    </span>
                    <div className={clsx(
                      "text-sm break-words flex-1 text-right",
                      isHeader ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-100",
                      (column.type === 'currency' || column.type === 'number') ? 'font-mono' : '',
                    )}>
                      {renderCellValue(item, column)}
                    </div>
                  </div>
                )
              })}
            </div>
            {renderActions && (
              <div
                className="pt-4 mt-2 border-t border-gray-100/80 dark:border-gray-700/50 flex flex-wrap gap-3 justify-between items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-100 uppercase tracking-widest min-w-[100px] pt-1 leading-none shrink-0">
                  Acciones
                </span>
                {renderActions(item)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-gray-50/50 dark:bg-gray-900/20 px-6 py-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              {pagination.totalItems ? (
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Total: <span className="text-blue-600 dark:text-blue-400">{pagination.totalItems}</span> registros
                </p>
              ) : (
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Página {pagination.currentPage} / {pagination.totalPages}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold bg-white dark:bg-gray-800 disabled:opacity-30 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = pagination.currentPage - 2 + i;
                if (pagination.currentPage <= 2) pageNum = i + 1;
                if (pagination.currentPage >= pagination.totalPages - 1) pageNum = pagination.totalPages - 4 + i;

                if (pageNum < 1 || pageNum > pagination.totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={clsx(
                      "w-9 h-9 rounded-lg text-xs font-bold transition-all duration-200",
                      pagination.currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold bg-white dark:bg-gray-800 disabled:opacity-30 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          </div>
          {/* Compact Mobile Pagination */}
          <div className="flex sm:hidden w-full items-center justify-between">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Pág. {pagination.currentPage} / {pagination.totalPages}</span>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
