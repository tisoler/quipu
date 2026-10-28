import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Receipt, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import { abrirPdfVenta } from '../lib/comprobante'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import FacturarVentaModal from '../components/FacturarVentaModal'
import BotonWhatsappVenta from '../components/BotonWhatsappVenta'
import { useAuth } from '../contexts/AuthContext'
import { VentaListado, ETIQUETAS_TIPO_PAGO, TipoPago } from '../types'

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const detalle = (v: VentaListado) => v.comprobante?.snapshot?.detalle

export default function Ventas() {
  const { permisos } = useAuth()
  const queryClient = useQueryClient()
  const [ventaFacturar, setVentaFacturar] = useState<VentaListado | null>(null)
  const [generando, setGenerando] = useState<string | null>(null)

  const puedeFacturar = permisos.includes('escritura:facturacion')

  const { data, isLoading } = useQuery<{ data: VentaListado[]; total: number; page: number; totalPages: number }>({
    queryKey: ['ventas'],
    queryFn: async () => (await api.get('/facturacion/ventas', { params: { page: 1, limit: 100 } })).data,
  })

  const abrirPdf = async (id: number, copia: string) => {
    setGenerando(`${id}-${copia}`)
    try {
      await abrirPdfVenta(id, copia as 'original' | 'duplicado' | 'triplicado')
    } catch (e: any) {
      alert(e?.message || 'No se pudo generar el PDF')
    } finally {
      setGenerando(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Ventas del punto de venta y su estado de facturación."
      />

      <DataTable
        isLoading={isLoading}
        data={data?.data ?? []}
        emptyMessage="Todavía no hay ventas."
        columns={[
          {
            header: 'Fecha',
            key: 'fecha',
            render: (v: VentaListado) =>
              new Date(v.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          },
          { header: 'Cliente', key: 'cliente', render: (v: VentaListado) => v.cliente?.nombre || 'Consumidor Final' },
          {
            header: 'Medio de pago',
            key: 'tipoPago',
            render: (v: VentaListado) => (v.tipoPago ? ETIQUETAS_TIPO_PAGO[v.tipoPago as TipoPago] : '-'),
          },
          {
            header: 'Subtotal',
            key: 'subtotal',
            className: 'text-right font-mono tabular-nums',
            render: (v: VentaListado) => fmt(detalle(v)?.netoGravado ?? Number(v.total)),
          },
          {
            header: 'IVA',
            key: 'iva',
            className: 'text-right font-mono tabular-nums',
            render: (v: VentaListado) => (detalle(v) ? fmt(detalle(v)!.impIVA) : '-'),
          },
          {
            header: 'Total c/IVA',
            key: 'totalIva',
            className: 'text-right font-mono tabular-nums',
            render: (v: VentaListado) => (detalle(v) ? fmt(detalle(v)!.impTotal) : '-'),
          },
          {
            header: 'Estado fiscal',
            key: 'comprobante',
            render: (v: VentaListado) => <EstadoFiscal v={v} />,
          },
        ]}
        renderActions={(v: VentaListado) => {
          if (v.comprobante?.estado === 'aprobado') {
            return (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); abrirPdf(v.id, 'original') }}
                  disabled={generando === `${v.id}-original`}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 inline-flex items-center gap-1"
                >
                  {generando === `${v.id}-original` ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                  Ver
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); abrirPdf(v.id, 'duplicado') }}
                  disabled={generando === `${v.id}-duplicado`}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Duplicado
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); abrirPdf(v.id, 'triplicado') }}
                  disabled={generando === `${v.id}-triplicado`}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Triplicado
                </button>
                <BotonWhatsappVenta ventaId={v.id} />
              </div>
            )
          }
          if (!v.comprobante && puedeFacturar) {
            return (
              <button
                onClick={(e) => { e.stopPropagation(); setVentaFacturar(v) }}
                className="px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 inline-flex items-center gap-1"
              >
                <Receipt size={12} />
                Facturar
              </button>
            )
          }
          return null
        }}
      />

      {ventaFacturar && (
        <FacturarVentaModal
          ventaId={ventaFacturar.id}
          ventaTotal={ventaFacturar.total}
          onClose={() => setVentaFacturar(null)}
          onSuccess={() => {
            setVentaFacturar(null)
            queryClient.invalidateQueries({ queryKey: ['ventas'] })
          }}
        />
      )}
    </div>
  )
}

function EstadoFiscal({ v }: { v: VentaListado }) {
  if (!v.comprobante) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        <AlertTriangle size={12} /> Sin facturar
      </span>
    )
  }
  if (v.comprobante.estado === 'aprobado') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle2 size={12} /> CAE {v.comprobante.cae}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
      <XCircle size={12} /> Rechazado
    </span>
  )
}
