import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Modal from './Modal'
import Skeleton from './Skeleton'
import { ETIQUETAS_TIPO_PAGO, TipoPago } from '../types'

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface ItemVenta {
  id: number
  cantidad: number
  precio: number
  alicuotaIva?: number | null
  precioConIva?: boolean | null
  estado: string
  producto?: { nombre: string; codigo?: string | null } | null
}

// Desglose informativo (el fiscal oficial lo calcula el servidor al emitir)
function linea(m: ItemVenta) {
  const cant = Math.abs(Number(m.cantidad))
  const precio = Number(m.precio)
  const alic = Number(m.alicuotaIva ?? 21)
  const base = cant * precio
  const neto = m.precioConIva && alic > 0 ? base / (1 + alic / 100) : base
  const total = m.precioConIva && alic > 0 ? base : base * (1 + alic / 100)
  return { cant, precio, alic, neto, iva: total - neto, total }
}

export default function DetalleVentaModal({ ventaId, onClose }: {
  ventaId: number
  onClose: () => void
}) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['venta', ventaId],
    queryFn: async () => (await api.get(`/facturacion/ventas/${ventaId}`)).data,
  })

  const venta = data?.venta
  const comprobante = data?.comprobante
  const movimientos: ItemVenta[] = (venta?.movimientos || []).filter((m: ItemVenta) => m.estado === 'activo')
  const anulados = (venta?.movimientos || []).length - movimientos.length
  const lineas = movimientos.map(linea)
  const neto = lineas.reduce((a, l) => a + l.neto, 0)
  const iva = lineas.reduce((a, l) => a + l.iva, 0)
  const total = lineas.reduce((a, l) => a + l.total, 0)
  const fiscal = comprobante?.snapshot?.detalle

  return (
    <Modal title={`Venta #${ventaId}`} onClose={onClose} size="2xl">
      {isLoading || !venta ? (
        <div className="space-y-2" aria-label="Cargando detalle">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide">Fecha</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {new Date(venta.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide">Cliente</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{venta.cliente?.nombre || 'Consumidor Final'}</dd>
            </div>
            <div>
              <dt className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide">Medio de pago</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {venta.tipoPago ? ETIQUETAS_TIPO_PAGO[venta.tipoPago as TipoPago] : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide">Estado fiscal</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {!comprobante && 'Sin facturar'}
                {comprobante?.estado === 'aprobado' && `CAE ${comprobante.cae}`}
                {comprobante?.estado === 'rechazado' && 'Rechazado'}
                {comprobante && comprobante.estado !== 'aprobado' && comprobante.estado !== 'rechazado' && comprobante.estado}
              </dd>
            </div>
          </dl>

          {movimientos.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin ítems activos.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[300px] overflow-y-auto">
              {movimientos.map((m: ItemVenta, i: number) => {
                const l = lineas[i]
                return (
                  <li key={m.id} className="py-2 flex items-start gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                        {m.producto?.nombre || `Producto #${m.id}`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                        {l.cant} × {fmt(l.precio)} · IVA {l.alic}%
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-mono tabular-nums text-gray-400 dark:text-gray-500">{fmt(l.neto)}</p>
                      <p className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(l.total)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {anulados > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">+{anulados} ítem(s) anulado(s) no incluidos.</p>
          )}

          <dl className="text-sm space-y-1 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Subtotal (neto)</dt>
              <dd className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(neto)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">IVA</dt>
              <dd className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(iva)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Total c/IVA</dt>
              <dd className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Total registrado</dt>
              <dd className="font-mono tabular-nums font-semibold text-gray-900 dark:text-white">{fmt(Number(venta.total))}</dd>
            </div>
            {fiscal && (
              <div className="flex justify-between gap-4 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                <dt className="text-gray-500 dark:text-gray-400">Total facturado</dt>
                <dd className="font-mono tabular-nums font-semibold text-gray-900 dark:text-white">{fmt(fiscal.impTotal)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Modal>
  )
}
