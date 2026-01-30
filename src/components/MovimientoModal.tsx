import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TipoMovimiento, TipoArticulo } from '../types'

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

interface MovimientoModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function MovimientoModal({ onClose, onSuccess }: MovimientoModalProps) {
  const [formData, setFormData] = useState({
    tipoArticulo: '' as TipoArticulo | '',
    idArticulo: '',
    tipoMovimiento: '' as TipoMovimiento | '',
    cantidad: '',
    precio: '',
    idAlmacen: '',
    descripcion: '',
  })

  const queryClient = useQueryClient()

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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/movimientos', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['inventario-grafico'] })
      onSuccess?.()
      onClose()
    },
  })

  const articulosDisponibles = useMemo(() => {
    if (formData.tipoArticulo === TipoArticulo.PRODUCTO) {
      return productos
    } else if (formData.tipoArticulo === TipoArticulo.MATERIAL) {
      return materiales
    }
    return []
  }, [formData.tipoArticulo, productos, materiales])

  const articuloSeleccionado = useMemo(() => {
    if (!formData.idArticulo) return null
    return articulosDisponibles.find((a) => a.id === parseInt(formData.idArticulo))
  }, [formData.idArticulo, articulosDisponibles])

  const total = useMemo(() => {
    const cantidad = parseFloat(formData.cantidad) || 0
    const precio = parseFloat(formData.precio) || 0
    return cantidad * precio
  }, [formData.cantidad, formData.precio])

  useEffect(() => {
    if (articuloSeleccionado) {
      setFormData((prev) => ({ ...prev, precio: articuloSeleccionado.precio.toString() }))
    }
  }, [articuloSeleccionado])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      idArticulo: parseInt(formData.idArticulo),
      cantidad: parseFloat(formData.cantidad),
      precio: parseFloat(formData.precio),
      total,
      idAlmacen: parseInt(formData.idAlmacen),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Nuevo Movimiento</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo Artículo *
              </label>
              <select
                required
                value={formData.tipoArticulo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipoArticulo: e.target.value as TipoArticulo,
                    idArticulo: '',
                    precio: '',
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccione...</option>
                <option value={TipoArticulo.PRODUCTO}>Producto</option>
                <option value={TipoArticulo.MATERIAL}>Material</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Artículo *
              </label>
              <select
                required
                value={formData.idArticulo}
                onChange={(e) => setFormData((prev) => ({ ...prev, idArticulo: e.target.value }))}
                disabled={!formData.tipoArticulo}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Seleccione...</option>
                {articulosDisponibles.map((articulo) => (
                  <option key={articulo.id} value={articulo.id}>
                    {articulo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo Movimiento *
              </label>
              <select
                required
                value={formData.tipoMovimiento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tipoMovimiento: e.target.value as TipoMovimiento }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccione...</option>
                <option value={TipoMovimiento.VENTA}>Venta</option>
                <option value={TipoMovimiento.COMPRA}>Compra</option>
                <option value={TipoMovimiento.CONSUMO}>Consumo</option>
                <option value={TipoMovimiento.PRODUCCION}>Producción</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Almacén *
              </label>
              <select
                required
                value={formData.idAlmacen}
                onChange={(e) => setFormData((prev) => ({ ...prev, idAlmacen: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccione...</option>
                {almacenes.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.cantidad}
                onChange={(e) => setFormData((prev) => ({ ...prev, cantidad: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData((prev) => ({ ...prev, precio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total
              </label>
              <input
                type="number"
                value={total.toFixed(2)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
