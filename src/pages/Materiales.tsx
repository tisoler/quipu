import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { EstadoMaterial } from '../types'
import DataTable from '../components/DataTable'

interface Material {
  id: number
  nombre: string
  codigo?: string
  descripcion?: string
  presentacion?: string
  estado: EstadoMaterial
  stockMinimo: number
  precio: number
}

export default function Materiales() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const queryClient = useQueryClient()

  const { data: materiales = [], isLoading } = useQuery<Material[]>({
    queryKey: ['materiales'],
    queryFn: async () => {
      const response = await api.get('/materiales')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Material>) => {
      const response = await api.post('/materiales', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      setIsModalOpen(false)
      setSelectedMaterial(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Material> }) => {
      const response = await api.patch(`/materiales/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      setIsModalOpen(false)
      setSelectedMaterial(null)
    },
  })

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: EstadoMaterial }) => {
      const response = await api.patch(`/materiales/${id}/estado`, { estado })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
    },
  })

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setSelectedMaterial(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      nombre: formData.get('nombre') as string,
      codigo: formData.get('codigo') as string,
      descripcion: formData.get('descripcion') as string,
      presentacion: formData.get('presentacion') as string,
      estado: (formData.get('estado') as EstadoMaterial) || EstadoMaterial.ACTIVO,
      stockMinimo: Number(formData.get('stockMinimo')),
      precio: Number(formData.get('precio')),
    }

    if (selectedMaterial) {
      updateMutation.mutate({ id: selectedMaterial.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEstadoChange = (id: number, currentEstado: EstadoMaterial) => {
    const newEstado = currentEstado === EstadoMaterial.ACTIVO
      ? EstadoMaterial.NO_ACTIVO
      : EstadoMaterial.ACTIVO
    updateEstadoMutation.mutate({ id, estado: newEstado })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Materiales</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Material
        </button>
      </div>

      <div className="mb-6">
        <DataTable
          isLoading={isLoading}
          data={materiales}
          onRowClick={handleEdit}
          columns={[
            { header: 'Nombre', key: 'nombre', className: 'font-semibold' },
            { header: 'Código', key: 'codigo', className: 'font-mono' },
            { header: 'Descripción', key: 'descripcion', wrap: true },
            { header: 'Presentación', key: 'presentacion' },
            {
              header: 'Estado',
              key: 'estado',
              render: (m: Material) => (
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.estado === EstadoMaterial.ACTIVO
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                >
                  {m.estado}
                </span>
              ),
              className: 'text-center',
            },
            { header: 'Stock Mín.', key: 'stockMinimo', type: 'number' },
            { header: 'Precio', key: 'precio', type: 'currency' },
          ]}
          renderActions={(m: Material) => (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEstadoChange(m.id, m.estado)
              }}
              className={`px-3 py-1 rounded text-xs font-medium ${m.estado === EstadoMaterial.ACTIVO
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                }`}
            >
              {m.estado === EstadoMaterial.ACTIVO ? 'Desactivar' : 'Activar'}
            </button>
          )}
        />
      </div>

      {isModalOpen && (
        <MaterialModal
          material={selectedMaterial}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedMaterial(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

function MaterialModal({
  material,
  onClose,
  onSubmit,
  isLoading,
}: {
  material: Material | null
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {material ? 'Editar Material' : 'Nuevo Material'}
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
                defaultValue={material?.nombre || ''}
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
                defaultValue={material?.codigo || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                defaultValue={material?.descripcion || ''}
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
                defaultValue={material?.presentacion || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                name="estado"
                defaultValue={material?.estado || EstadoMaterial.ACTIVO}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={EstadoMaterial.ACTIVO}>Activo</option>
                <option value={EstadoMaterial.NO_ACTIVO}>No Activo</option>
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
                defaultValue={material?.stockMinimo || 0}
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
                defaultValue={material?.precio || 0}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
