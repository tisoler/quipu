import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import api from '../lib/api'
import { EstadoMaterial } from '../types'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'

interface ProveedorRef {
  id: number
  nombre: string
}

interface Material {
  id: number
  nombre: string
  codigo?: string
  descripcion?: string
  presentacion?: string
  estado: EstadoMaterial
  stockMinimo: number
  precio: number
  idProveedor?: number | null
  proveedor?: ProveedorRef | null
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

  const { data: proveedores = [] } = useQuery<ProveedorRef[]>({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const response = await api.get('/proveedores')
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
      idProveedor: Number(formData.get('idProveedor')) || null,
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
      <PageHeader
        title="Materiales"
        description="Insumos y materias primas utilizados en la producción."
        actions={
          <button onClick={handleNew} className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            Agregar Material
          </button>
        }
      />

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
          proveedoresDisponibles={proveedores}
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
  proveedoresDisponibles,
  onClose,
  onSubmit,
  isLoading,
}: {
  material: Material | null
  proveedoresDisponibles: ProveedorRef[]
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}) {
  return (
    <Modal
      title={material ? 'Editar Material' : 'Nuevo Material'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" form="material-form" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="material-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            name="nombre"
            required
            autoFocus
            defaultValue={material?.nombre || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Código</label>
          <input
            type="text"
            name="codigo"
            defaultValue={material?.codigo || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Presentación</label>
          <input
            type="text"
            name="presentacion"
            defaultValue={material?.presentacion || ''}
            className="form-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Descripción</label>
          <textarea
            name="descripcion"
            defaultValue={material?.descripcion || ''}
            className="form-input"
            rows={3}
          />
        </div>
        <div>
          <label className="form-label">Estado</label>
          <select
            name="estado"
            defaultValue={material?.estado || EstadoMaterial.ACTIVO}
            className="form-input"
          >
            <option value={EstadoMaterial.ACTIVO}>Activo</option>
            <option value={EstadoMaterial.NO_ACTIVO}>No Activo</option>
          </select>
        </div>
        <div>
          <label className="form-label">Proveedor</label>
          <select
            name="idProveedor"
            defaultValue={material?.idProveedor ?? ''}
            className="form-input"
          >
            <option value="">Sin proveedor</option>
            {proveedoresDisponibles.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Stock Mínimo</label>
            <input
              type="number"
              name="stockMinimo"
              min="0"
              defaultValue={material?.stockMinimo || 0}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Precio</label>
            <input
              type="number"
              name="precio"
              min="0"
              step="0.01"
              defaultValue={material?.precio || 0}
              className="form-input"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
