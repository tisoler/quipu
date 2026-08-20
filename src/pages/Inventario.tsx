import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../lib/api'
import { TipoArticulo } from '../types'
import MovimientoModal from '../components/MovimientoModal'
import { useQueryClient } from '@tanstack/react-query'
import Skeleton from '../components/Skeleton'
import { useAuth } from '../contexts/AuthContext'

type RangoTiempo = '1' | '3' | '7' | '21' | '30' | '180' | '365' | '1825' | 'all'

const RANGOS_TIEMPO: { value: RangoTiempo; label: string }[] = [
  { value: '1', label: '1 día' },
  { value: '3', label: '3 días' },
  { value: '7', label: '1 semana' },
  { value: '21', label: '3 semanas' },
  { value: '30', label: '1 mes' },
  { value: '180', label: '6 meses' },
  { value: '365', label: '1 año' },
  { value: '1825', label: '5 años' },
  { value: 'all', label: 'Desde el principio' },
]

type AgruparPor = 'articulo' | 'almacen'

interface DatosGrafico {
  fecha: string
  idArticulo: number
  tipoArticulo: TipoArticulo
  idAlmacen: number | null
  stock: number
  label: string
  stockMinimo: number | null
}

export default function Inventario() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filtros, setFiltros] = useState({
    tipoArticulo: '' as TipoArticulo | '',
    agruparPor: 'articulo' as AgruparPor,
    idArticulos: [] as number[],
    idAlmacenes: [] as number[],
    rangoTiempo: '30' as RangoTiempo,
    fechaDesde: '',
    fechaHasta: '',
  })
  const { permisos } = useAuth()

  // Calcular fechas según rango
  const fechaDesde = useMemo(() => {
    if (filtros.fechaDesde) return filtros.fechaDesde
    if (filtros.rangoTiempo === 'all') return undefined
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - parseInt(filtros.rangoTiempo))
    return fecha.toISOString().split('T')[0]
  }, [filtros.rangoTiempo, filtros.fechaDesde])

  const fechaHasta = useMemo(() => {
    if (filtros.fechaHasta) return filtros.fechaHasta
    if (filtros.rangoTiempo === 'all') return undefined
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 1)
    return fecha.toISOString().split('T')[0]
  }, [filtros.rangoTiempo, filtros.fechaHasta])

  const queryParams = useMemo(() => {
    const params: any = {}
    if (filtros.tipoArticulo) params.tipoArticulo = filtros.tipoArticulo
    params.agruparPor = filtros.agruparPor
    if (filtros.idArticulos.length > 0) params.idArticulos = filtros.idArticulos
    if (filtros.idAlmacenes.length > 0) params.idAlmacenes = filtros.idAlmacenes
    if (fechaDesde) params.fechaDesde = fechaDesde
    if (fechaHasta) params.fechaHasta = fechaHasta
    return params
  }, [filtros, fechaDesde, fechaHasta])

  const { data: datosGrafico = [], isLoading } = useQuery<DatosGrafico[]>({
    queryKey: ['inventario-grafico', queryParams],
    queryFn: async () => {
      const response = await api.get('/inventario/grafico', { params: queryParams })
      return response.data
    },
  })

  const { data: articulos = [] } = useQuery<any[]>({
    queryKey: ['inventario-articulos', filtros.tipoArticulo],
    queryFn: async () => {
      const response = await api.get('/inventario/articulos', {
        params: filtros.tipoArticulo ? { tipoArticulo: filtros.tipoArticulo } : {},
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

  // Helper para sanitizar keys del gráfico (reemplazar espacios y caracteres especiales)
  const sanitizeKey = (label: string) => label.replace(/[^a-zA-Z0-9]/g, '_')

  // Formatear datos para el gráfico
  const datosFormateados = useMemo(() => {
    const grupos = new Map<string, { fecha: string; timestamp: number;[key: string]: any }>()

    datosGrafico.forEach((dato) => {
      // Normalizar fecha (ignorar hora)
      const fechaObj = new Date(dato.fecha)
      const fechaStr = fechaObj.toISOString().split('T')[0] // YYYY-MM-DD

      if (!grupos.has(fechaStr)) {
        grupos.set(fechaStr, {
          fecha: fechaObj.toLocaleDateString(),
          timestamp: fechaObj.getTime()
        })
      }
      const grupo = grupos.get(fechaStr)!
      const safeLabel = sanitizeKey(dato.label)

      grupo[`stock_${safeLabel}`] = dato.stock
      if (dato.stockMinimo !== null) {
        grupo[`minimo_${safeLabel}`] = dato.stockMinimo
      }
    })

    // Convertir a array y ordenar por fecha
    return Array.from(grupos.values()).sort((a, b) => a.timestamp - b.timestamp)
  }, [datosGrafico])

  // Generar colores para las líneas
  const colores = useMemo(() => {
    const labels = [...new Set(datosGrafico.map((d) => d.label))]
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f97316', // orange
    ]
    return labels.map((label, i) => ({
      label,
      safeLabel: sanitizeKey(label),
      color: colors[i % colors.length],
    }))
  }, [datosGrafico])

  const handleFiltroChange = (key: string, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }

  const handleArticuloToggle = (id: number) => {
    setFiltros((prev) => ({
      ...prev,
      idArticulos: prev.idArticulos.includes(id)
        ? prev.idArticulos.filter((a) => a !== id)
        : [...prev.idArticulos, id],
    }))
  }

  const handleAlmacenToggle = (id: number) => {
    setFiltros((prev) => ({
      ...prev,
      idAlmacenes: prev.idAlmacenes.includes(id)
        ? prev.idAlmacenes.filter((a) => a !== id)
        : [...prev.idAlmacenes, id],
    }))
  }

  const tieneEscrituraMovimiento = permisos.includes('escritura:movimiento')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventario</h1>
        {tieneEscrituraMovimiento && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Agregar Movimiento
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Agrupar Por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agrupar Por
            </label>
            <select
              value={filtros.agruparPor}
              onChange={(e) => handleFiltroChange('agruparPor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="articulo">Artículo</option>
              <option value="almacen">Almacén</option>
            </select>
          </div>

          {/* Rango de Tiempo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rango de Tiempo
            </label>
            <select
              value={filtros.rangoTiempo}
              onChange={(e) => handleFiltroChange('rangoTiempo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {RANGOS_TIEMPO.map((rango) => (
                <option key={rango.value} value={rango.value}>
                  {rango.label}
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
        </div>

        {/* Selección múltiple de artículos o almacenes */}
        {filtros.agruparPor === 'articulo' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Artículos
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-md p-2">
              {articulos.map((articulo) => (
                <label key={`${articulo.tipoArticulo}-${articulo.id}`} className="flex items-center space-x-2 p-1">
                  <input
                    type="checkbox"
                    checked={filtros.idArticulos.includes(articulo.id)}
                    onChange={() => handleArticuloToggle(articulo.id)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {articulo.nombre} ({articulo.tipoArticulo})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {filtros.agruparPor === 'almacen' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Almacenes
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-md p-2">
              {almacenes.map((almacen) => (
                <label key={almacen.id} className="flex items-center space-x-2 p-1">
                  <input
                    type="checkbox"
                    checked={filtros.idAlmacenes.includes(almacen.id)}
                    onChange={() => handleAlmacenToggle(almacen.id)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{almacen.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Evolución del Stock</h2>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : datosFormateados.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={datosFormateados}>
              <CartesianGrid strokeDasharray="2 2" strokeWidth={0.5} />
              <XAxis fontSize={12} dataKey="fecha" />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend fontSize={10} />
              {colores.map((item) => (
                <Line
                  key={`stock_${item.safeLabel}`}
                  type="monotone"
                  dataKey={`stock_${item.safeLabel}`}
                  stroke={item.color}
                  strokeWidth={2}
                  name={item.label}
                  dot={false}
                  connectNulls
                />
              ))}
              {colores.map((item) => {
                const articulo = articulos.find((a) => a.nombre === item.label)
                if (articulo && articulo.stockMinimo) {
                  return (
                    <Line
                      key={`minimo_${item.safeLabel}`}
                      type="monotone"
                      dataKey={`minimo_${item.safeLabel}`}
                      stroke={item.color}
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      legendType='none'
                      dot={false}
                      connectNulls
                    />
                  )
                }
                return null
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay datos para mostrar con los filtros seleccionados
          </div>
        )}
      </div>

      {isModalOpen && (
        <MovimientoModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventario-grafico'] })
          }}
        />
      )}
    </div>
  )
}
