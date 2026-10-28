import { TipoPago, ETIQUETAS_TIPO_PAGO } from '../types'

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Desglose de totales por medio de pago, con fila combinada de tarjetas. */
export default function DesglosePagos({ totales }: { totales: Record<string, number> }) {
  const entradas = Object.entries(totales).filter(([, monto]) => Number(monto) > 0)
  if (entradas.length === 0) return null

  const totalTarjetas =
    Number(totales[TipoPago.TARJETA_CREDITO] || 0) + Number(totales[TipoPago.TARJETA_DEBITO] || 0)

  return (
    <div className="space-y-1.5 text-sm">
      {entradas.map(([tipo, monto]) => (
        <div key={tipo} className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400">
            {ETIQUETAS_TIPO_PAGO[tipo as TipoPago] || tipo}
          </span>
          <span className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(Number(monto))}</span>
        </div>
      ))}
      {totalTarjetas > 0 && (
        <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-1.5 font-medium">
          <span className="text-gray-600 dark:text-gray-300">Tarjetas (crédito + débito)</span>
          <span className="font-mono tabular-nums text-gray-900 dark:text-white">{fmt(totalTarjetas)}</span>
        </div>
      )}
    </div>
  )
}
