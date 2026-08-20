import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import DataTable from '../components/DataTable'

interface Almacen {
  id: number
  nombre: string
  ubicacion?: string
}

export default function Almacenes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null)
  const queryClient = useQueryClient()

  const { data: almacenes = [], isLoading } = useQuery<Almacen[]>({
    queryKey: ['almacenes'],
    queryFn: async () => {
      const response = await api.get('/almacenes')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Almacen>) => {
      const response = await api.post('/almacenes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almacenes'] })
      setIsModalOpen(false)
      setSelectedAlmacen(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Almacen> }) => {
      const response = await api.patch(`/almacenes/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almacenes'] })
      setIsModalOpen(false)
      setSelectedAlmacen(null)
    },
  })

  const handleEdit = (almacen: Almacen) => {
    setSelectedAlmacen(almacen)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setSelectedAlmacen(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      nombre: formData.get('nombre') as string,
      ubicacion: formData.get('ubicacion') as string,
    }

    if (selectedAlmacen) {
      updateMutation.mutate({ id: selectedAlmacen.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Almacenes</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Almacén
        </button>
      </div>

      <div className="mb-6">
        <DataTable
          isLoading={isLoading}
          data={almacenes}
          onRowClick={handleEdit}
          columns={[
            { header: 'Nombre', key: 'nombre', className: 'font-semibold' },
            { header: 'Ubicación', key: 'ubicacion' },
          ]}
        />
      </div>

      {isModalOpen && (
        <AlmacenModal
          almacen={selectedAlmacen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedAlmacen(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

function AlmacenModal({
  almacen,
  onClose,
  onSubmit,
  isLoading,
}: {
  almacen: Almacen | null
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {almacen ? 'Editar Almacén' : 'Nuevo Almacén'}
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
                defaultValue={almacen?.nombre || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                name="ubicacion"
                defaultValue={almacen?.ubicacion || ''}
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
