import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import api from '../lib/api'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import ClienteModal from '../components/ClienteModal'
import { Cliente } from '../types'

export default function Clientes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const queryClient = useQueryClient()

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => (await api.get('/clientes')).data,
  })

  const cerrarModal = () => {
    setIsModalOpen(false)
    setSelectedCliente(null)
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Clientes para facturación electrónica."
        actions={
          <button onClick={() => { setSelectedCliente(null); setIsModalOpen(true) }} className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            Agregar Cliente
          </button>
        }
      />

      <div className="mb-6">
        <DataTable
          isLoading={isLoading}
          data={clientes}
          emptyMessage="Todavía no hay clientes cargados."
          onRowClick={(c: Cliente) => { setSelectedCliente(c); setIsModalOpen(true) }}
          columns={[
            { header: 'Nombre / Razón Social', key: 'nombre', className: 'font-semibold' },
            { header: 'CUIT', key: 'cuit', render: (c: Cliente) => c.cuit || '-' },
            { header: 'Condición IVA', key: 'condicionIva', render: (c: Cliente) => c.condicionIva || '-' },
            { header: 'Domicilio', key: 'domicilio', render: (c: Cliente) => c.domicilio || '-' },
            { header: 'Teléfono', key: 'telefono', render: (c: Cliente) => c.telefono || '-' },
            { header: 'Email', key: 'email', render: (c: Cliente) => c.email || '-' },
          ]}
        />
      </div>

      {isModalOpen && (
        <ClienteModal
          cliente={selectedCliente}
          onClose={cerrarModal}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] })
            cerrarModal()
          }}
        />
      )}
    </div>
  )
}
