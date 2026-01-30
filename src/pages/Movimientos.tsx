import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TipoMovimiento, TipoArticulo, EstadoMovimiento } from '../types'
import MovimientoModal from '../components/MovimientoModal'

interface Movimiento {
  id: number
  fecha: string
  idArticulo: number
  cantidad: number
  precio: number
  total: number
  tipoMovimiento: TipoMovimiento
  tipoArticulo: TipoArticulo
  idAlmacen: number
  almacen?: { id: number; nombre: string }
  usuario?: { id: number; nombreUsuario: string }
  estado: EstadoMovimiento
  descripcion?: string
}

interface Producto {
  id: number
  nombre: string
  precio: number
}

interface Material {
  id: number
  nombre: string
  precio: number
}

interface Almacen {
  id: number
  nombre: string
}

type RangoDias = '1' | '3' | '7' | '30' | '90' | '365' | 'all'

const RANGOS_DIAS: { value: RangoDias; label: string }[] = [
  { value: '1', label: '1 día' },
  { value: '3', label: '3 días' },
  { value: '7', label: '1 semana' },
  { value: '30', label: '1 mes' },
  { value: '90', label: '3 meses' },
  { value: '365', label: '1 año' },
  { value: 'all', label: 'Todos' },
]

export default function Movimientos() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [rangoDias, setRangoDias] = useState<RangoDias>('30')
  const [filtros, setFiltros] = useState({
    tipoArticulo: '' as TipoArticulo | '',
    tipoMovimiento: '' as TipoMovimiento | '',
    estado: '' as EstadoMovimiento | '',
    idAlmacen: '',
    search: '',
    fechaDesde: '',
    fechaHasta: '',
  })
  const [searchDebounce, setSearchDebounce] = useState('')
  const queryClient = useQueryClient()

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros((prev) => ({ ...prev, search: searchDebounce }))
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchDebounce])

  // Calcular fechas según rango
  const fechaDesde = useMemo(() => {
    if (filtros.fechaDesde) return filtros.fechaDesde
    if (rangoDias === 'all') return undefined
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - parseInt(rangoDias))
    return fecha.toISOString().split('T')[0]
  }, [rangoDias, filtros.fechaDesde])

  const fechaHasta = useMemo(() => {
    if (filtros.fechaHasta) return filtros.fechaHasta
    if (rangoDias === 'all') return undefined
    return new Date().toISOString().split('T')[0]
  }, [rangoDias, filtros.fechaHasta])

  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit: 10,
    }
    if (fechaDesde) params.fechaDesde = fechaDesde
    if (fechaHasta) params.fechaHasta = fechaHasta
    if (filtros.tipoArticulo) params.tipoArticulo = filtros.tipoArticulo
    if (filtros.tipoMovimiento) params.tipoMovimiento = filtros.tipoMovimiento
    if (filtros.estado) params.estado = filtros.estado
    if (filtros.idAlmacen) params.idAlmacen = filtros.idAlmacen
    if (filtros.search) params.search = filtros.search
    return params
  }, [page, fechaDesde, fechaHasta, filtros])

  const { data, isLoading } = useQuery<{
    data: Movimiento[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>({
    queryKey: ['movimientos', queryParams],
    queryFn: async () => {
      const response = await api.get('/movimientos', { params: queryParams })
      return response.data
    },
  })

  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await api.get('/productos')
      return response.data
    },
  })

  const { data: materiales = [] } = useQuery<Material[]>({
    queryKey: ['materiales'],
    queryFn: async () => {
      const response = await api.get('/materiales')
      return response.data
    },
  })

  const { data: almacenes = [] } = useQuery<Almacen[]>({
    queryKey: ['almacenes'],
    queryFn: async () => {
      const response = await api.get('/almacenes')
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/movimientos/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })

  const handleRangoChange = (rango: RangoDias) => {
    setRangoDias(rango)
    setFiltros((prev) => ({ ...prev, fechaDesde: '', fechaHasta: '' }))
    setPage(1)
  }

  const handleFiltroChange = (key: string, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este movimiento?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Movimientos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Movimiento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rango de días */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rango
            </label>
            <select
              value={rangoDias}
              onChange={(e) => handleRangoChange(e.target.value as RangoDias)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {RANGOS_DIAS.map((rango) => (
                <option key={rango.value} value={rango.value}>
                  {rango.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo Artículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo Artículo
            </label>
            <select
              value={filtros.tipoArticulo}
              onChange={(e) => handleFiltroChange('tipoArticulo', e.target.value || '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value={TipoArticulo.PRODUCTO}>Producto</option>
              <option value={TipoArticulo.MATERIAL}>Material</option>
            </select>
          </div>

          {/* Tipo Movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo Movimiento
            </label>
            <select
              value={filtros.tipoMovimiento}
              onChange={(e) => handleFiltroChange('tipoMovimiento', e.target.value || '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value={TipoMovimiento.VENTA}>Venta</option>
              <option value={TipoMovimiento.COMPRA}>Compra</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value || '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value={EstadoMovimiento.ACTIVO}>Activo</option>
              <option value={EstadoMovimiento.ELIMINADO}>Eliminado</option>
            </select>
          </div>

          {/* Almacén */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Almacén
            </label>
            <select
              value={filtros.idAlmacen}
              onChange={(e) => handleFiltroChange('idAlmacen', e.target.value || '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              {almacenes.map((almacen) => (
                <option key={almacen.id} value={almacen.id}>
                  {almacen.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas personalizadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Búsqueda
            </label>
            <input
              type="text"
              placeholder="Descripción o artículo..."
              value={searchDebounce}
              onChange={(e) => setSearchDebounce(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Artículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Almacén
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.data.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(movimiento.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movimiento.tipoMovimiento === TipoMovimiento.VENTA
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {movimiento.tipoMovimiento}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {movimiento.tipoArticulo === 'producto' ? productos?.find(p => p.id === movimiento.idArticulo)?.nombre : materiales?.find(m => m.id === movimiento.idArticulo)?.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {movimiento.cantidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${movimiento.precio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${movimiento.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {movimiento.almacen?.nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movimiento.estado === EstadoMovimiento.ACTIVO
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {movimiento.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {movimiento.estado === EstadoMovimiento.ACTIVO && (
                      <button
                        onClick={() => handleDelete(movimiento.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-medium">{(page - 1) * 10 + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(page * 10, data.total)}</span> de{' '}
                  <span className="font-medium">{data.total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === num
                          ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <MovimientoModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['movimientos'] })
          }}
        />
      )}
    </div>
  )
};
