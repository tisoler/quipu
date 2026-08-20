import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { TipoArticulo } from '../types'
import DataTable, { Column } from '../components/DataTable'
import { Search, Download, Filter, AlertTriangle } from 'lucide-react'

interface StockActualItem {
  id: number
  idArticulo: number
  tipoArticulo: TipoArticulo
  idAlmacen: number
  cantidad: string | number
  idEmpresa: number
  nombre: string
  codigo: string
  stockMinimo: number
  almacen: {
    id: number
    nombre: string
  }
  tipoProducto?: string | null
  precio: number
  total: number
}

export default function StockActual() {
  const [filtros, setFiltros] = useState<{
    tipoArticulo: TipoArticulo | ''
    idAlmacenes: number[]
    search: string
  }>({
    tipoArticulo: TipoArticulo.PRODUCTO,
    idAlmacenes: [],
    search: '',
  })
  const [vistaDetallada, setVistaDetallada] = useState(false)

  const { data: stockItems = [], isLoading } = useQuery<StockActualItem[]>({
    queryKey: ['stock-actual', filtros],
    queryFn: async () => {
      const response = await api.get('/inventario/stock-actual', {
        params: {
          ...filtros,
          idAlmacenes: filtros.idAlmacenes.length > 0 ? filtros.idAlmacenes : undefined,
        },
      })
      return response.data
    },
  })

  const { data: almacenes = [] } = useQuery<any[]>({
    queryKey: ['inventario-almacenes'],
    queryFn: async () => {
      const response = await api.get('/inventario/almacenes')
      return response.data
    },
  })

  const handleFiltroChange = (key: string, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }

  const handleAlmacenToggle = (id: number) => {
    setFiltros((prev) => ({
      ...prev,
      idAlmacenes: prev.idAlmacenes.includes(id)
        ? prev.idAlmacenes.filter((a) => a !== id)
        : [...prev.idAlmacenes, id],
    }))
  }

  const columns = useMemo<Column<StockActualItem>[]>(() => {
    const cols: Column<StockActualItem>[] = [
      { header: 'Nombre', key: 'nombre', className: 'font-semibold' },
      { header: 'Código', key: 'codigo', className: 'font-mono' },
      { header: 'Tipo', key: 'tipoArticulo', type: 'tag', className: 'text-center', },
      { header: 'Almacén', key: 'almacen', render: (item: StockActualItem) => item.almacen?.nombre || '-' },
      {
        header: 'Stock',
        key: 'cantidad',
        render: (item: StockActualItem) => {
          const isLow = Number(item.cantidad) <= item.stockMinimo
          return (
            <div className={`flex items-center justify-end gap-1 ${isLow ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {item.cantidad.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {isLow && <AlertTriangle size={17} />}
            </div>
          )
        },
        className: 'text-right font-mono',
      },
      { header: 'Stock Mín.', key: 'stockMinimo', className: 'text-right' },
    ]

    if (vistaDetallada) {
      cols.push(
        { header: 'M/C', key: 'tipoProducto', className: 'text-center' },
        { header: 'Precio', key: 'precio', type: 'currency' },
        { header: 'Total', key: 'total', type: 'currency' }
      )
    }

    return cols
  }, [vistaDetallada])

  const exportToCSV = () => {
    if (stockItems.length === 0) return

    const headers = ['Código', 'Nombre', 'Tipo', 'Almacén', 'Stock', 'Stock Mínimo']
    if (vistaDetallada) {
      headers.push('Tipo Prod', 'Precio', 'Total')
    }

    const rows = stockItems.map((item) => {
      const row = [
        item.codigo,
        item.nombre,
        item.tipoArticulo,
        item.almacen?.nombre || 'N/A',
        item.cantidad,
        item.stockMinimo,
      ]
      if (vistaDetallada) {
        row.push(item.tipoProducto || '-', item.precio, item.total)
      }
      return row
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `stock_actual_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Stock Actual
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Consulta el stock disponible por producto y almacén en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setVistaDetallada(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!vistaDetallada ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Simple
            </button>
            <button
              onClick={() => setVistaDetallada(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${vistaDetallada ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Detallado
            </button>
          </div>
          <button
            onClick={exportToCSV}
            disabled={stockItems.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 flex-1 sm:flex-none"
          >
            <Download size={18} />
            <span className="hidden xs:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Búsqueda rápida</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Nombre o código del artículo..."
                value={filtros.search}
                onChange={(e) => handleFiltroChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Categoría</label>
            <div className="flex bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleFiltroChange('tipoArticulo', TipoArticulo.PRODUCTO)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${filtros.tipoArticulo === TipoArticulo.PRODUCTO ? 'bg-white dark:bg-gray-800 shadow-md text-blue-600 dark:text-blue-400 ring-1 ring-gray-200 dark:ring-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                Productos
              </button>
              <button
                onClick={() => handleFiltroChange('tipoArticulo', TipoArticulo.MATERIAL)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${filtros.tipoArticulo === TipoArticulo.MATERIAL ? 'bg-white dark:bg-gray-800 shadow-md text-blue-600 dark:text-blue-400 ring-1 ring-gray-200 dark:ring-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                Materiales
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">
              <Filter size={16} />
              Almacenes:
            </div>
            {almacenes.map((almacen) => (
              <button
                key={almacen.id}
                onClick={() => handleAlmacenToggle(almacen.id)}
                className={`px-4 py-1.5 text-sm rounded-full border transition-all duration-200 font-medium ${filtros.idAlmacenes.includes(almacen.id)
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
              >
                {almacen.nombre}
              </button>
            ))}
            {filtros.idAlmacenes.length > 0 && (
              <button
                onClick={() => handleFiltroChange('idAlmacenes', [])}
                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 hover:underline font-semibold ml-auto"
              >
                Limpiar selección
              </button>
            )}
          </div>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={stockItems}
        columns={columns}
        emptyMessage="No se encontraron artículos en stock con los filtros seleccionados."
      />
    </div>
  )
}
