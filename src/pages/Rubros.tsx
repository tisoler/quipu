import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import api from '../lib/api'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'

interface Rubro {
    id: number
    nombre: string
    descripcion?: string
}

export default function Rubros() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRubro, setSelectedRubro] = useState<Rubro | null>(null)
    const queryClient = useQueryClient()

    const { data: rubros = [], isLoading } = useQuery<Rubro[]>({
        queryKey: ['rubros'],
        queryFn: async () => {
            const response = await api.get('/rubros')
            return response.data
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: Partial<Rubro>) => {
            const response = await api.post('/rubros', data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubros'] })
            setIsModalOpen(false)
            setSelectedRubro(null)
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Rubro> }) => {
            const response = await api.patch(`/rubros/${id}`, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubros'] })
            setIsModalOpen(false)
            setSelectedRubro(null)
        },
    })

    const handleEdit = (rubro: Rubro) => {
        setSelectedRubro(rubro)
        setIsModalOpen(true)
    }

    const handleNew = () => {
        setSelectedRubro(null)
        setIsModalOpen(true)
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = {
            nombre: formData.get('nombre') as string,
            descripcion: formData.get('descripcion') as string,
        }

        if (selectedRubro) {
            updateMutation.mutate({ id: selectedRubro.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    return (
        <div>
            <PageHeader
                title="Rubros"
                description="Categorías para organizar productos y materiales."
                actions={
                    <button onClick={handleNew} className="btn-primary">
                        <Plus size={16} strokeWidth={2} />
                        Agregar Rubro
                    </button>
                }
            />

            <div className="mb-6">
                <DataTable
                    isLoading={isLoading}
                    data={rubros}
                    onRowClick={handleEdit}
                    columns={[
                        { header: 'Nombre', key: 'nombre', className: 'font-semibold' },
                        { header: 'Descripción', key: 'descripcion', wrap: true },
                    ]}
                />
            </div>

            {isModalOpen && (
                <RubroModal
                    rubro={selectedRubro}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedRubro(null)
                    }}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            )}
        </div>
    )
}

function RubroModal({
    rubro,
    onClose,
    onSubmit,
    isLoading,
}: {
    rubro: Rubro | null
    onClose: () => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    isLoading: boolean
}) {
    return (
        <Modal
            title={rubro ? 'Editar Rubro' : 'Nuevo Rubro'}
            onClose={onClose}
            size="md"
            footer={
                <>
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" form="rubro-form" disabled={isLoading} className="btn-primary">
                        {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                </>
            }
        >
            <form id="rubro-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="form-label">Nombre *</label>
                    <input
                        type="text"
                        name="nombre"
                        required
                        autoFocus
                        defaultValue={rubro?.nombre || ''}
                        className="form-input"
                    />
                </div>
                <div>
                    <label className="form-label">Descripción</label>
                    <input
                        type="text"
                        name="descripcion"
                        defaultValue={rubro?.descripcion || ''}
                        className="form-input"
                    />
                </div>
            </form>
        </Modal>
    )
}
