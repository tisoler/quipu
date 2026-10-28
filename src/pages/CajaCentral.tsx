import { useQuery } from '@tanstack/react-query'
import { Banknote } from 'lucide-react'
import api from '../lib/api'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import { MovimientoCajaCentral } from '../types'

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CajaCentral() {
  const { data, isLoading } = useQuery({
    queryKey: ['caja-central'],
    queryFn: async () => (await api.get('/caja-central')).data,
  })

  const saldo: number = data?.saldo ?? 0
  const movimientos: MovimientoCajaCentral[] = data?.movimientos ?? []

  return (
    <div>
      <PageHeader
        title="Caja central"
        description="Dinero ingresado desde los cierres de cajas de los puestos."
      />

      <div className="card p-6 mb-6 flex items-center gap-4 max-w-md">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
          <Banknote size={24} strokeWidth={1.6} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Saldo actual</p>
          {isLoading ? (
            <div className="h-7 w-32 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono tabular-nums">{fmt(saldo)}</p>
          )}
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={movimientos}
        emptyMessage="Todavía no hay ingresos en la caja central."
        columns={[
          {
            header: 'Fecha',
            key: 'fecha',
            render: (m: MovimientoCajaCentral) => new Date(m.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
          },
          { header: 'Concepto', key: 'descripcion', wrap: true },
          { header: 'Caja', key: 'idCajaPuesto', render: (m: MovimientoCajaCentral) => m.idCajaPuesto ? `#${m.idCajaPuesto}` : '-' },
          { header: 'Usuario', key: 'nombreUsuario' },
          { header: 'Monto', key: 'monto', type: 'currency' },
        ]}
      />
    </div>
  )
}
