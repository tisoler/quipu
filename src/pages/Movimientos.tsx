import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { TipoMovimiento, TipoArticulo, EstadoMovimiento } from '../types'
import MovimientoModal from '../components/MovimientoModal'
import DataTable, { Column } from '../components/DataTable'
import clsx from 'clsx'

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
  articulo?: { id: number; nombre: string }
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

interface MovimientosProps {
  fixedTipoArticulo?: TipoArticulo | ''
  fixedTipoMovimiento?: TipoMovimiento | ''
  title?: string
  addPermission?: string
}

export default function Movimientos({
  fixedTipoArticulo = '',
  fixedTipoMovimiento = '',
  title = 'Movimientos',
  addPermission = 'escritura:movimiento'
}: MovimientosProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [rangoDias, setRangoDias] = useState<RangoDias>('30')
  const [filtros, setFiltros] = useState({
    tipoArticulo: fixedTipoArticulo,
    tipoMovimiento: fixedTipoMovimiento,
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
    if (fixedTipoArticulo || filtros.tipoArticulo) params.tipoArticulo = fixedTipoArticulo || filtros.tipoArticulo
    if (fixedTipoMovimiento || filtros.tipoMovimiento) params.tipoMovimiento = fixedTipoMovimiento || filtros.tipoMovimiento
    if (filtros.estado) params.estado = filtros.estado
    if (filtros.idAlmacen) params.idAlmacen = filtros.idAlmacen
    if (filtros.search) params.search = filtros.search
    return params
  }, [page, fechaDesde, fechaHasta, filtros, fixedTipoArticulo, fixedTipoMovimiento])

  const { data, isLoading } = useQuery<{
    data: Movimiento[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>({
    queryKey: ['movimientos', fixedTipoArticulo || '', fixedTipoMovimiento || '', queryParams],
    queryFn: async () => {
      const response = await api.get('/movimientos', { params: queryParams })
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

  const { permisos = [] } = useAuth()
  const canAdd = permisos.includes(addPermission)

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

  const columns = useMemo<Column<Movimiento>[]>(() => [
    { header: 'Fecha', key: 'fecha', type: 'date', className: 'font-medium' },
    {
      header: 'Tipo',
      key: 'tipoMovimiento',
      render: (m: Movimiento) => (
        <span className={clsx(
          "px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tighter",
          m.tipoMovimiento === TipoMovimiento.VENTA
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        )}>
          {m.tipoMovimiento}
        </span>
      ),
      className: 'text-center',
    },
    { header: 'Artículo', key: 'articulo', render: (m: Movimiento) => m.articulo?.nombre || '-' },
    { header: 'Cantidad', key: 'cantidad', type: 'number', className: 'text-center' },
    { header: 'Precio', key: 'precio', type: 'currency' },
    { header: 'Total', key: 'total', type: 'currency' },
    { header: 'Almacén', key: 'almacen', render: (m: Movimiento) => m.almacen?.nombre || '-' },
    {
      header: 'Estado',
      key: 'estado',
      render: (m: Movimiento) => (
        <span className={clsx(
          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          m.estado === EstadoMovimiento.ACTIVO
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        )}>
          {m.estado}
        </span>
      ),
      className: 'text-center',
    },
  ], [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/40 p-4 mb-2 rounded-2xl md:bg-transparent md:p-0">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h1>
        {canAdd && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="group px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span className="bg-white/20 p-1 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </span>
            Agregar {fixedTipoMovimiento ? fixedTipoMovimiento.charAt(0).toUpperCase() + fixedTipoMovimiento.slice(1) : 'Movimiento'}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6 ring-1 ring-black/[0.03] dark:ring-white/[0.03]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Rango de días */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Rango rápido</label>
            <select
              value={rangoDias}
              onChange={(e) => handleRangoChange(e.target.value as RangoDias)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all cursor-pointer"
            >
              {RANGOS_DIAS.map((rango) => (
                <option key={rango.value} value={rango.value}>{rango.label}</option>
              ))}
            </select>
          </div>

          {!fixedTipoArticulo && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Categoría</label>
              <select
                value={filtros.tipoArticulo}
                onChange={(e) => handleFiltroChange('tipoArticulo', e.target.value || '')}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 text-sm font-medium"
              >
                <option value="">Todos</option>
                <option value={TipoArticulo.PRODUCTO}>Producto</option>
                <option value={TipoArticulo.MATERIAL}>Material</option>
              </select>
            </div>
          )}

          {!fixedTipoMovimiento && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Tipo Movimiento</label>
              <select
                value={filtros.tipoMovimiento}
                onChange={(e) => handleFiltroChange('tipoMovimiento', e.target.value || '')}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 text-sm font-medium"
              >
                <option value="">Todos</option>
                <option value={TipoMovimiento.VENTA}>Venta</option>
                <option value={TipoMovimiento.COMPRA}>Compra</option>
                <option value={TipoMovimiento.CONSUMO}>Consumo</option>
                <option value={TipoMovimiento.PRODUCCION}>Producción</option>
                <option value={TipoMovimiento.TRANSFERENCIA}>Transferencia</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Almacén</label>
            <select
              value={filtros.idAlmacen}
              onChange={(e) => handleFiltroChange('idAlmacen', e.target.value || '')}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 text-sm font-medium"
            >
              <option value="">Todos</option>
              {almacenes.map((almacen) => (
                <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 text-sm"
            />
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 text-sm"
            />
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Búsqueda rápida</label>
            <input
              type="text"
              placeholder="Descripción o artículo..."
              value={searchDebounce}
              onChange={(e) => setSearchDebounce(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={data?.data || []}
        columns={columns}
        pagination={data ? {
          currentPage: data.page,
          totalPages: data.totalPages,
          onPageChange: (p) => setPage(p),
          totalItems: data.total
        } : undefined}
        renderActions={(m: Movimiento) => (
          m.estado === EstadoMovimiento.ACTIVO && (
            <button
              onClick={() => handleDelete(m.id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
              title="Eliminar movimiento"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )
        )}
      />

      {isModalOpen && (
        <MovimientoModal
          onClose={() => setIsModalOpen(false)}
          fixedTipoArticulo={fixedTipoArticulo}
          fixedTipoMovimiento={fixedTipoMovimiento}
        />
      )}
    </div>
  )
}
