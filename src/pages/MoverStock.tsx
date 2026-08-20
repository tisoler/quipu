import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TipoArticulo } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface Producto {
  id: number
  nombre: string
}

interface Material {
  id: number
  nombre: string
}

interface Almacen {
  id: number
  nombre: string
}

export default function MoverStock() {
  const { permisos } = useAuth()
  const hasPermission = permisos.includes('escritura:movimiento')
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    tipoArticulo: '' as TipoArticulo | '',
    idArticulo: '',
    idAlmacenOrigen: '',
    idAlmacenDestino: '',
    cantidad: '',
  })

  // Queries for selectors
  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => (await api.get('/productos')).data,
  })

  const { data: materiales = [] } = useQuery<Material[]>({
    queryKey: ['materiales'],
    queryFn: async () => (await api.get('/materiales')).data,
  })

  const { data: almacenes = [] } = useQuery<Almacen[]>({
    queryKey: ['almacenes'],
    queryFn: async () => (await api.get('/almacenes')).data,
  })

  // Queries for Stock
  const { data: stockOrigen } = useQuery({
    queryKey: ['stock', formData.tipoArticulo, formData.idArticulo, formData.idAlmacenOrigen],
    queryFn: async () => {
      if (!formData.tipoArticulo || !formData.idArticulo || !formData.idAlmacenOrigen) return null
      const params = {
        idArticulo: formData.idArticulo,
        tipoArticulo: formData.tipoArticulo,
        idAlmacen: formData.idAlmacenOrigen
      }

      const res = await api.get('/inventario', { params })
      // Assuming response format { data: [...] } and we take the first item's quantity
      return res.data.data?.[0]?.cantidad || 0
    },
    enabled: !!formData.tipoArticulo && !!formData.idArticulo && !!formData.idAlmacenOrigen,
  })

  const { data: stockDestino } = useQuery({
    queryKey: ['stock', formData.tipoArticulo, formData.idArticulo, formData.idAlmacenDestino],
    queryFn: async () => {
      if (!formData.tipoArticulo || !formData.idArticulo || !formData.idAlmacenDestino) return null
      const params = {
        idArticulo: formData.idArticulo,
        tipoArticulo: formData.tipoArticulo,
        idAlmacen: formData.idAlmacenDestino
      }
      const res = await api.get('/inventario', { params })
      return res.data.data?.[0]?.cantidad || 0
    },
    enabled: !!formData.tipoArticulo && !!formData.idArticulo && !!formData.idAlmacenDestino,
  })

  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/movimientos/transferencia', data)
    },
    onSuccess: () => {
      setFormData(prev => ({ ...prev, cantidad: '' }))
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
    },
    onError: (error: any) => {
      console.error(error.response?.data?.message || 'Error al realizar la transferencia')
    }
  })

  const articulosDisponibles = useMemo(() => {
    return formData.tipoArticulo === TipoArticulo.PRODUCTO ? productos : formData.tipoArticulo === TipoArticulo.MATERIAL ? materiales : []
  }, [formData.tipoArticulo, productos, materiales])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.idAlmacenOrigen === formData.idAlmacenDestino) {
      console.error('El almacén de origen y destino deben ser diferentes')
      return
    }
    const cantidad = parseFloat(formData.cantidad)
    if (stockOrigen < cantidad) {
      console.error('No hay suficiente stock en el almacén de origen')
      return
    }
    transferMutation.mutate({
      ...formData,
      idArticulo: parseInt(formData.idArticulo),
      idAlmacenOrigen: parseInt(formData.idAlmacenOrigen),
      idAlmacenDestino: parseInt(formData.idAlmacenDestino),
      cantidad
    })
  }

  if (!hasPermission) {
    return <div className="p-8 text-center text-red-600">No tienes permisos para acceder a esta página.</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Mover entre Almacenes</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo Artículo *
              </label>
              <select
                required
                value={formData.tipoArticulo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipoArticulo: e.target.value as TipoArticulo, idArticulo: '' }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, idArticulo: e.target.value }))}
                disabled={!formData.tipoArticulo}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Seleccione...</option>
                {articulosDisponibles.map(item => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Almacén Origen *
              </label>
              <select
                required
                value={formData.idAlmacenOrigen}
                onChange={(e) => setFormData(prev => ({ ...prev, idAlmacenOrigen: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccione...</option>
                {almacenes.map(almacen => (
                  <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>
                ))}
              </select>
              {formData.idAlmacenOrigen && formData.idArticulo && (
                <p className="mt-1 text-sm text-gray-500">
                  Stock actual: {stockOrigen !== undefined ? stockOrigen : '...'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Almacén Destino *
              </label>
              <select
                required
                value={formData.idAlmacenDestino}
                onChange={(e) => setFormData(prev => ({ ...prev, idAlmacenDestino: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccione...</option>
                {almacenes.map(almacen => (
                  <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>
                ))}
              </select>
              {formData.idAlmacenDestino && formData.idArticulo && (
                <p className="mt-1 text-sm text-gray-500">
                  Stock actual: {stockDestino !== undefined ? stockDestino : '...'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cantidad a Mover *
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.cantidad}
              onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={transferMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {transferMutation.isPending ? 'Procesando...' : 'Realizar Transferencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
