import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import api from '../lib/api'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'

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
      <PageHeader
        title="Almacenes"
        description="Depósitos donde se guarda el stock."
        actions={
          <button onClick={handleNew} className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            Agregar Almacén
          </button>
        }
      />

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
    <Modal
      title={almacen ? 'Editar Almacén' : 'Nuevo Almacén'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" form="almacen-form" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="almacen-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            name="nombre"
            required
            autoFocus
            defaultValue={almacen?.nombre || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Ubicación</label>
          <input
            type="text"
            name="ubicacion"
            defaultValue={almacen?.ubicacion || ''}
            className="form-input"
          />
        </div>
      </form>
    </Modal>
  )
}
