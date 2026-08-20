import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { EstadoProducto } from '../types'
import DataTable from '../components/DataTable'

interface Producto {
  id: number
  nombre: string
  codigo?: string
  descripcion?: string
  presentacion?: string
  estado: EstadoProducto
  stockMinimo: number
  precio: number
  tipoProducto?: 'A' | 'B' | 'C' | null
  rubros?: Rubro[]
}

interface Rubro {
  id: number
  nombre: string
}

export default function Productos() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const queryClient = useQueryClient()

  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await api.get('/productos')
      return response.data
    },
  })

  const { data: rubros = [] } = useQuery<Rubro[]>({
    queryKey: ['rubros'],
    queryFn: async () => {
      const response = await api.get('/rubros')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Producto>) => {
      const response = await api.post('/productos', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setIsModalOpen(false)
      setSelectedProducto(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Producto> }) => {
      const response = await api.patch(`/productos/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setIsModalOpen(false)
      setSelectedProducto(null)
    },
  })

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: EstadoProducto }) => {
      const response = await api.patch(`/productos/${id}/estado`, { estado })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setSelectedProducto(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Obtener rubroIds de los checkboxes seleccionados
    const rubroIds = rubros
      .filter(r => formData.get(`rubro_${r.id}`) === 'on')
      .map(r => r.id)

    const data = {
      nombre: formData.get('nombre') as string,
      codigo: formData.get('codigo') as string,
      descripcion: formData.get('descripcion') as string,
      presentacion: formData.get('presentacion') as string,
      estado: (formData.get('estado') as EstadoProducto) || EstadoProducto.ACTIVO,
      stockMinimo: Number(formData.get('stockMinimo')),
      precio: Number(formData.get('precio')),
      tipoProducto: (formData.get('tipoProducto') as 'A' | 'B' | 'C' | '') || null,
      rubroIds,
    }

    if (selectedProducto) {
      updateMutation.mutate({ id: selectedProducto.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEstadoChange = (id: number, currentEstado: EstadoProducto) => {
    const newEstado = currentEstado === EstadoProducto.ACTIVO
      ? EstadoProducto.NO_ACTIVO
      : EstadoProducto.ACTIVO
    updateEstadoMutation.mutate({ id, estado: newEstado })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productos</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Producto
        </button>
      </div>

      <div className="mb-6">
        <DataTable
          isLoading={isLoading}
          data={productos}
          onRowClick={handleEdit}
          columns={[
            { header: 'Nombre', key: 'nombre', className: 'font-semibold' },
            { header: 'Código', key: 'codigo', className: 'font-mono' },
            { header: 'Descripción', key: 'descripcion', wrap: true },
            { header: 'Presentación', key: 'presentacion' },
            {
              header: 'Estado',
              key: 'estado',
              render: (p: Producto) => (
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.estado === EstadoProducto.ACTIVO
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                >
                  {p.estado}
                </span>
              ),
              className: 'text-center',
            },
            { header: 'Stock Mín.', key: 'stockMinimo', type: 'number' },
            { header: 'Precio', key: 'precio', type: 'currency' },
            { header: 'Tipo', key: 'tipoProducto' },
            {
              header: 'Rubros',
              key: 'rubros',
              render: (p: Producto) => (
                <div className="flex flex-wrap gap-1">
                  {p.rubros && p.rubros.length > 0 ? (
                    p.rubros.map((r: Rubro) => (
                      <span key={r.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                        {r.nombre}
                      </span>
                    ))
                  ) : '-'}
                </div>
              )
            },
          ]}
          renderActions={(p: Producto) => (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEstadoChange(p.id, p.estado)
              }}
              className={`px-3 py-1 rounded text-xs font-medium ${p.estado === EstadoProducto.ACTIVO
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                }`}
            >
              {p.estado === EstadoProducto.ACTIVO ? 'Desactivar' : 'Activar'}
            </button>
          )}
        />
      </div>

      {isModalOpen && (
        <ProductoModal
          producto={selectedProducto}
          rubrosDisponibles={rubros}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProducto(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

function ProductoModal({
  producto,
  rubrosDisponibles,
  onClose,
  onSubmit,
  isLoading,
}: {
  producto: Producto | null
  rubrosDisponibles: Rubro[]
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}) {
  const currentRubrosIds = useMemo(() => producto?.rubros?.map(r => r.id) || [], [producto])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {producto ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                required
                defaultValue={producto?.nombre || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código
              </label>
              <input
                type="text"
                name="codigo"
                defaultValue={producto?.codigo || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                defaultValue={producto?.descripcion || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Presentación
              </label>
              <input
                type="text"
                name="presentacion"
                defaultValue={producto?.presentacion || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                name="estado"
                defaultValue={producto?.estado || EstadoProducto.ACTIVO}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={EstadoProducto.ACTIVO}>Activo</option>
                <option value={EstadoProducto.NO_ACTIVO}>No Activo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                name="stockMinimo"
                min="0"
                defaultValue={producto?.stockMinimo || 0}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio
              </label>
              <input
                type="number"
                name="precio"
                min="0"
                step="0.01"
                defaultValue={producto?.precio || 0}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo (ABC)
              </label>
              <select
                name="tipoProducto"
                defaultValue={producto?.tipoProducto || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Ninguno</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rubros
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-300 dark:border-gray-700 rounded-md">
                {rubrosDisponibles.map(rubro => (
                  <label key={rubro.id} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      name={`rubro_${rubro.id}`}
                      defaultChecked={currentRubrosIds.includes(rubro.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{rubro.nombre}</span>
                  </label>
                ))}
              </div>
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
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
