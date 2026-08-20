import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TipoMovimiento, TipoArticulo } from '../types'
import Autocomplete from './Autocomplete'

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
  fixedTipoArticulo?: TipoArticulo | ''
  fixedTipoMovimiento?: TipoMovimiento | ''
}

export default function MovimientoModal({
  onClose,
  onSuccess,
  fixedTipoArticulo = '',
  fixedTipoMovimiento = '',
}: MovimientoModalProps) {
  const [formData, setFormData] = useState({
    tipoArticulo: fixedTipoArticulo || '' as TipoArticulo | '',
    idArticulo: '',
    tipoMovimiento: fixedTipoMovimiento || '' as TipoMovimiento | '',
    cantidad: '',
    precio: '',
    idAlmacen: '',
    descripcion: '',
  })

  const queryClient = useQueryClient()

  const titulo = `Ingresar ${fixedTipoMovimiento ?? 'movimiento'}`

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
    return articulosDisponibles.find((a: any) => a.id === parseInt(formData.idArticulo))
  }, [formData.idArticulo, articulosDisponibles])

  const total = useMemo(() => {
    const cantidad = parseFloat(formData.cantidad) || 0
    const precio = parseFloat(formData.precio) || 0
    return cantidad * precio
  }, [formData.cantidad, formData.precio])

  useEffect(() => {
    if (articuloSeleccionado) {
      setFormData((prev: any) => ({ ...prev, precio: articuloSeleccionado.precio.toString() }))
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

  const articuloOptions = useMemo(() =>
    articulosDisponibles.map((a: any) => ({ id: a.id, label: a.nombre })),
    [articulosDisponibles]
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{titulo}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!fixedTipoArticulo && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo Artículo *
                </label>
                <select
                  required
                  value={formData.tipoArticulo}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      tipoArticulo: e.target.value as TipoArticulo,
                      idArticulo: '',
                      precio: '',
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">Seleccione...</option>
                  <option value={TipoArticulo.PRODUCTO}>Producto</option>
                  <option value={TipoArticulo.MATERIAL}>Material</option>
                </select>
              </div>
            )}

            <Autocomplete
              label={fixedTipoArticulo ? fixedTipoArticulo.charAt(0).toUpperCase() + fixedTipoArticulo.slice(1) : "Artículo"}
              required
              options={articuloOptions}
              value={formData.idArticulo}
              onChange={(val) => setFormData((prev: any) => ({ ...prev, idArticulo: val.toString() }))}
              disabled={!formData.tipoArticulo}
              placeholder={formData.tipoArticulo ? `Buscar ${fixedTipoArticulo ?? 'artículo'}...` : "Primero seleccione tipo"}
            />

            {!fixedTipoMovimiento && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo Movimiento *
                </label>
                <select
                  required
                  value={formData.tipoMovimiento}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, tipoMovimiento: e.target.value as TipoMovimiento }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">Seleccione...</option>
                  <option value={TipoMovimiento.VENTA}>Venta</option>
                  <option value={TipoMovimiento.COMPRA}>Compra</option>
                  <option value={TipoMovimiento.CONSUMO}>Consumo</option>
                  <option value={TipoMovimiento.PRODUCCION}>Producción</option>
                  <option value={TipoMovimiento.TRANSFERENCIA}>Transferencia</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Almacén *
              </label>
              <select
                required
                value={formData.idAlmacen}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, idAlmacen: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="">Seleccione...</option>
                {almacenes.map((almacen: any) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.cantidad}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, cantidad: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Precio *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, precio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Total
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white font-mono font-bold">
                $ {total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                rows={3}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
