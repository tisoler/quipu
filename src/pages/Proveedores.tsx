import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import api from '../lib/api'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { Proveedor } from '../types'

export default function Proveedores() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data: proveedores = [], isLoading } = useQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: async () => (await api.get('/proveedores')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Proveedor>) => (await api.post('/proveedores', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      cerrarModal()
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Error al guardar el proveedor'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Proveedor> }) =>
      (await api.patch(`/proveedores/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      cerrarModal()
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Error al guardar el proveedor'),
  })

  const cerrarModal = () => {
    setIsModalOpen(false)
    setSelectedProveedor(null)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const data = {
      nombre: (formData.get('nombre') as string).trim(),
      telefono: (formData.get('telefono') as string).trim() || null,
      email: (formData.get('email') as string).trim() || null,
      notas: (formData.get('notas') as string).trim() || null,
    }

    if (selectedProveedor) {
      updateMutation.mutate({ id: selectedProveedor.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description="Proveedores de productos y materiales."
        actions={
          <button onClick={() => { setSelectedProveedor(null); setIsModalOpen(true) }} className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            Agregar Proveedor
          </button>
        }
      />

      <div className="mb-6">
        <DataTable
          isLoading={isLoading}
          data={proveedores}
          emptyMessage="Todavía no hay proveedores cargados."
          onRowClick={(p: Proveedor) => { setSelectedProveedor(p); setIsModalOpen(true) }}
          columns={[
            { header: 'Nombre', key: 'nombre', className: 'font-semibold' },
            { header: 'Teléfono', key: 'telefono', render: (p: Proveedor) => p.telefono || '-' },
            { header: 'Email', key: 'email', render: (p: Proveedor) => p.email || '-' },
            { header: 'Notas', key: 'notas', wrap: true, render: (p: Proveedor) => p.notas || '-' },
          ]}
        />
      </div>

      {isModalOpen && (
        <Modal
          title={selectedProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          onClose={cerrarModal}
          footer={
            <>
              <button type="button" onClick={cerrarModal} className="btn-secondary">Cancelar</button>
              <button
                type="submit"
                form="proveedor-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          <form id="proveedor-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                name="nombre"
                required
                autoFocus
                defaultValue={selectedProveedor?.nombre || ''}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                name="telefono"
                defaultValue={selectedProveedor?.telefono || ''}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={selectedProveedor?.email || ''}
                className="form-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Notas</label>
              <textarea
                name="notas"
                defaultValue={selectedProveedor?.notas || ''}
                rows={2}
                className="form-input"
              />
            </div>
            {error && (
              <p className="md:col-span-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </form>
        </Modal>
      )}
    </div>
  )
}
