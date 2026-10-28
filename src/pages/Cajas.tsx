import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import api from '../lib/api'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import DesglosePagos from '../components/DesglosePagos'
import { CajaPuesto, EstadoCaja, VentaCaja, ETIQUETAS_TIPO_PAGO, TipoPago } from '../types'

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Cajas() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState('')
  const [detalleId, setDetalleId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cajas', page, estado],
    queryFn: async () => {
      const response = await api.get('/puestos', { params: { page, limit: 20, estado: estado || undefined } })
      return response.data
    },
  })

  const cajas: CajaPuesto[] = data?.data ?? []

  return (
    <div>
      <PageHeader
        title="Cajas"
        description="Historial de cajas de los puestos de venta y sus arqueos."
        actions={
          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1) }}
            className="form-input w-auto"
          >
            <option value="">Todas</option>
            <option value={EstadoCaja.ABIERTA}>Abiertas</option>
            <option value={EstadoCaja.CERRADA}>Cerradas</option>
          </select>
        }
      />

      <div className="mb-6">
        <DataTable
          isLoading={isLoading}
          data={cajas}
          onRowClick={(c: CajaPuesto) => setDetalleId(c.id)}
          columns={[
            {
              header: 'Apertura',
              key: 'fechaApertura',
              render: (c: CajaPuesto) => new Date(c.fechaApertura).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
            },
            { header: 'Vendedor', key: 'nombreUsuario' },
            { header: 'Almacén', key: 'almacen', render: (c: CajaPuesto) => c.almacen?.nombre || '-' },
            {
              header: 'Estado',
              key: 'estado',
              render: (c: CajaPuesto) => (
                <span className={clsx(
                  'px-2.5 py-1 rounded-full text-[11px] font-semibold',
                  c.estado === EstadoCaja.ABIERTA
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                )}>
                  {c.estado}
                </span>
              ),
              className: 'text-center',
            },
            { header: 'Vendido', key: 'totalVendido', type: 'currency' },
            { header: 'Declarado', key: 'montoDeclarado', type: 'currency', render: (c: CajaPuesto) => c.montoDeclarado != null ? fmt(Number(c.montoDeclarado)) : '-' },
            {
              header: 'Faltante',
              key: 'faltante',
              render: (c: CajaPuesto) => Number(c.faltante ?? 0) > 0
                ? <span className="text-red-600 dark:text-red-400 font-mono tabular-nums">{fmt(Number(c.faltante))}</span>
                : '-',
              className: 'text-right',
            },
            { header: 'Transferido', key: 'montoTransferido', type: 'currency', render: (c: CajaPuesto) => c.montoTransferido != null ? fmt(Number(c.montoTransferido)) : '-' },
          ]}
          pagination={{
            currentPage: data?.page ?? 1,
            totalPages: data?.totalPages ?? 1,
            totalItems: data?.total,
            onPageChange: setPage,
          }}
        />
      </div>

      {detalleId && (
        <DetalleCaja
          id={detalleId}
          onClose={() => setDetalleId(null)}
          onReabierta={() => {
            setDetalleId(null)
            queryClient.invalidateQueries({ queryKey: ['cajas'] })
          }}
        />
      )}
    </div>
  )
}

function DetalleCaja({ id, onClose, onReabierta }: {
  id: number
  onClose: () => void
  onReabierta: () => void
}) {
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['caja-detalle', id],
    queryFn: async () => (await api.get(`/puestos/${id}`)).data,
  })

  const reabrirMutation = useMutation({
    mutationFn: async () => (await api.patch(`/puestos/${id}/reabrir`)).data,
    onSuccess: onReabierta,
    onError: (err) => setError((err as any)?.response?.data?.message || 'Error al reabrir la caja'),
  })

  const caja: CajaPuesto | undefined = data?.caja
  const ventas: VentaCaja[] = data?.ventas ?? []

  const handleReabrir = () => {
    if (!window.confirm('¿Rehabilitar esta caja cerrada? Se revertirá la transferencia a la caja central.')) return
    reabrirMutation.mutate()
  }

  return (
    <Modal
      title={`Caja #${id}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cerrar</button>
          {caja?.estado === EstadoCaja.CERRADA && (
            <button type="button" onClick={handleReabrir} disabled={reabrirMutation.isPending} className="btn-primary">
              {reabrirMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} strokeWidth={2} />}
              Rehabilitar caja
            </button>
          )}
        </>
      }
    >
      {isLoading || !caja ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <Dato label="Vendedor" valor={caja.nombreUsuario || '-'} />
            <Dato label="Almacén" valor={caja.almacen?.nombre || '-'} />
            <Dato label="Estado" valor={caja.estado} />
            <Dato label="Apertura" valor={new Date(caja.fechaApertura).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} />
            <Dato label="Cierre" valor={caja.fechaCierre ? new Date(caja.fechaCierre).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '-'} />
            <Dato label="Total vendido" valor={fmt(Number(caja.totalVendido))} />
            {caja.estado === EstadoCaja.CERRADA && (
              <>
                <Dato label="Declarado" valor={fmt(Number(caja.montoDeclarado ?? 0))} />
                <Dato label="Faltante" valor={fmt(Number(caja.faltante ?? 0))} />
                <Dato label="Sobrante" valor={fmt(Number(caja.sobrante ?? 0))} />
                <Dato label="Transferido" valor={fmt(Number(caja.montoTransferido ?? 0))} />
              </>
            )}
          </dl>

          {caja.estado === EstadoCaja.CERRADA && caja.totalesPorPago && Object.keys(caja.totalesPorPago).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Totales por medio de pago</h3>
              <DesglosePagos totales={caja.totalesPorPago} />
            </div>
          )}

          {caja.observaciones && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{caja.observaciones}"</p>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Ventas ({ventas.length})</h3>
            {ventas.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin ventas registradas.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-64 overflow-y-auto">
                {ventas.map(v => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{v.producto?.nombre || `Producto #${v.idProducto}`}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · x {Math.abs(Number(v.cantidad))}
                        {v.tipoPago && ` · ${ETIQUETAS_TIPO_PAGO[v.tipoPago as TipoPago] || v.tipoPago}`}
                      </p>
                    </div>
                    <span className="text-sm font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(Math.abs(Number(v.total)))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </Modal>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 dark:text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 dark:text-gray-100">{valor}</dd>
    </div>
  )
}
