import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import DataTable from '../components/DataTable'

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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rubros</h1>
                <button
                    onClick={handleNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Agregar Rubro
                </button>
            </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    {rubro ? 'Editar Rubro' : 'Nuevo Rubro'}
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
                                defaultValue={rubro?.nombre || ''}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                defaultValue={rubro?.descripcion || ''}
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
